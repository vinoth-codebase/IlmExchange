import { Request, Response, NextFunction, Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  db,
  UserRecord,
  AuthCodeRecord,
  AuthCodeType,
  toPublicUser,
} from './database';
import { sendAuthCodeEmail } from './mailer';

const JWT_SECRET = process.env.JWT_SECRET || 'ilmexchange-tu-ilmenau-jwt-secret-key-2026';
export const ADMIN_EMAIL = 'vinothofficial14@gmail.com';

export interface AuthTokenPayload {
  id: number;
  email: string;
  name: string;
  contact_number: string;
  role: 'ADMIN' | 'STUDENT';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function generateJwt(user: AuthTokenPayload): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      contact_number: user.contact_number,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token required.' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Administrator privileges required for this operation.' });
      return;
    }
    next();
  });
}

function createAndStoreAuthCode(email: string, type: AuthCodeType): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO auth_codes (email, code, type, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email, type) DO UPDATE SET
      code = excluded.code,
      expires_at = excluded.expires_at
  `).run(email, code, type, expiresAt);

  return code;
}

export const authRouter = Router();

// 1. POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const contactNumber =
      typeof (req.body?.contact_number ?? req.body?.contactNumber) === 'string'
        ? String(req.body.contact_number ?? req.body.contactNumber).trim()
        : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const confirmPassword =
      typeof (req.body?.confirm_password ?? req.body?.confirmPassword) === 'string'
        ? String(req.body.confirm_password ?? req.body.confirmPassword)
        : '';

    if (!name || !contactNumber || !email || !email.includes('@') || !password) {
      res.status(400).json({
        error: 'Name, Contact Number, valid Email, and Password are required.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Password and Confirm Password do not match.' });
      return;
    }

    const existing = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as UserRecord | undefined;

    const passwordHash = bcrypt.hashSync(password, 10);
    const assignedRole: 'ADMIN' | 'STUDENT' = email === ADMIN_EMAIL ? 'ADMIN' : 'STUDENT';

    if (existing) {
      db.prepare(`
        UPDATE users
        SET name = ?, contact_number = ?, password_hash = ?, is_verified = 0, role = ?
        WHERE id = ?
      `).run(name, contactNumber, passwordHash, assignedRole, existing.id);
    } else {
      db.prepare(`
        INSERT INTO users (email, password_hash, name, contact_number, is_verified, role)
        VALUES (?, ?, ?, ?, 0, ?)
      `).run(email, passwordHash, name, contactNumber, assignedRole);
    }

    const code = createAndStoreAuthCode(email, 'REGISTER');
    const dispatchResult = await sendAuthCodeEmail(email, code, 'REGISTER');

    res.status(201).json({
      success: true,
      email,
      deliveredViaSmtp: dispatchResult.deliveredViaSmtp,
      message: dispatchResult.previewMessage,
      demoCode: dispatchResult.deliveredViaSmtp ? undefined : code,
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.status(500).json({ error: 'Failed to register user account.' });
  }
});

// 2. POST /api/auth/verify-email
authRouter.post('/verify-email', (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';

    if (!email || !code) {
      res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
      return;
    }

    const codeRecord = db
      .prepare('SELECT * FROM auth_codes WHERE email = ? AND type = ?')
      .get(email, 'REGISTER') as AuthCodeRecord | undefined;

    if (!codeRecord || codeRecord.code !== code) {
      res.status(401).json({ error: 'Invalid 6-digit email verification code.' });
      return;
    }

    if (new Date(codeRecord.expires_at).getTime() < Date.now()) {
      db.prepare('DELETE FROM auth_codes WHERE email = ? AND type = ?').run(email, 'REGISTER');
      res.status(401).json({ error: 'Verification code has expired. Please register again.' });
      return;
    }

    db.prepare('DELETE FROM auth_codes WHERE email = ? AND type = ?').run(email, 'REGISTER');
    db.prepare('UPDATE users SET is_verified = 1 WHERE email = ?').run(email);

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as UserRecord | undefined;

    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const publicUser = toPublicUser(user);
    const token = generateJwt({
      id: publicUser.id,
      email: publicUser.email,
      name: publicUser.name,
      contact_number: publicUser.contact_number,
      role: publicUser.role,
    });

    res.json({
      token,
      user: publicUser,
    });
  } catch (error) {
    console.error('[Auth] Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email address.' });
  }
});

// 3. POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({ error: 'Email and Password are required.' });
      return;
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as UserRecord | undefined;

    if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
      return;
    }

    if (!user.is_verified) {
      res.status(403).json({
        error: 'Account email is not verified yet. Please enter your 6-digit verification code.',
        needsVerification: true,
        email: user.email,
      });
      return;
    }

    const publicUser = toPublicUser(user);
    const token = generateJwt({
      id: publicUser.id,
      email: publicUser.email,
      name: publicUser.name,
      contact_number: publicUser.contact_number,
      role: publicUser.role,
    });

    res.json({
      token,
      user: publicUser,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Unable to complete login.' });
  }
});

// 4. POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid registered email address.' });
      return;
    }

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as UserRecord | undefined;

    if (!user) {
      res.status(404).json({ error: 'No account found matching that email address.' });
      return;
    }

    const code = createAndStoreAuthCode(email, 'RESET');
    const dispatchResult = await sendAuthCodeEmail(email, code, 'RESET');

    res.json({
      success: true,
      email,
      deliveredViaSmtp: dispatchResult.deliveredViaSmtp,
      message: dispatchResult.previewMessage,
      demoCode: dispatchResult.deliveredViaSmtp ? undefined : code,
    });
  } catch (error) {
    console.error('[Auth] Forgot password error:', error);
    res.status(500).json({ error: 'Unable to generate password reset code.' });
  }
});

// 5. POST /api/auth/reset-password
authRouter.post('/reset-password', (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    const password =
      typeof (req.body?.password ?? req.body?.newPassword) === 'string'
        ? String(req.body.password ?? req.body.newPassword)
        : '';
    const confirmPassword =
      typeof (req.body?.confirm_password ?? req.body?.confirmPassword) === 'string'
        ? String(req.body.confirm_password ?? req.body.confirmPassword)
        : '';

    if (!email || !code || !password) {
      res.status(400).json({
        error: 'Email, 6-digit RESET code, and new password are required.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'New Password and Confirm Password do not match.' });
      return;
    }

    const codeRecord = db
      .prepare('SELECT * FROM auth_codes WHERE email = ? AND type = ?')
      .get(email, 'RESET') as AuthCodeRecord | undefined;

    if (!codeRecord || codeRecord.code !== code) {
      res.status(401).json({ error: 'Invalid 6-digit password reset code.' });
      return;
    }

    if (new Date(codeRecord.expires_at).getTime() < Date.now()) {
      db.prepare('DELETE FROM auth_codes WHERE email = ? AND type = ?').run(email, 'RESET');
      res.status(401).json({ error: 'Password reset code has expired.' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ?, is_verified = 1 WHERE email = ?').run(
      passwordHash,
      email
    );
    db.prepare('DELETE FROM auth_codes WHERE email = ? AND type = ?').run(email, 'RESET');

    res.json({
      success: true,
      message: 'Password updated. You may now sign in with your new password.',
    });
  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    res.status(500).json({ error: 'Unable to reset password.' });
  }
});
