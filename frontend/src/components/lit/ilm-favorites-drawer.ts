import { LitElement, html, css } from 'lit';
import { FAVORITES_STORAGE_KEY, Listing } from '../../api';

export class IlmFavoritesDrawer extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    items: { type: Array },
  };

  declare open: boolean;
  declare items: Listing[];

  static styles = css`
    :host {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.48);
      z-index: 80;
      display: flex;
      justify-content: flex-end;
    }

    .drawer {
      width: 100%;
      max-width: 390px;
      background-color: #ffffff;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: -8px 0 24px rgba(15, 23, 42, 0.14);
      border-left: 1px solid #e2e8f0;
    }

    .drawer-header {
      background-color: #003a63;
      color: #ffffff;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .drawer-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
      border-radius: 4px;
      padding: 4px 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      cursor: pointer;
    }

    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 16px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.5;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
    }

    .fav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background-color: #f8fafc;
    }

    .fav-meta {
      min-width: 0;
      flex: 1;
    }

    .fav-title {
      margin: 0 0 3px;
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .fav-sub {
      font-size: 11px;
      color: #64748b;
    }

    .fav-price {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      font-weight: 700;
      color: #003a63;
      margin-top: 3px;
    }

    .remove-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      border-radius: 4px;
      padding: 5px 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }

    .remove-btn:hover {
      border-color: #dc2626;
      color: #dc2626;
    }

    .drawer-footer {
      padding: 14px 20px;
      border-top: 1px solid #e2e8f0;
      background-color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12.5px;
    }

    .total-price {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #0d9488;
    }
  `;

  private storageSyncHandler = () => {
    this.loadFromStorage();
  };

  constructor() {
    super();
    this.open = false;
    this.items = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadFromStorage();
    window.addEventListener('ilm-favorites-updated', this.storageSyncHandler);
    window.addEventListener('storage', this.storageSyncHandler);
  }

  disconnectedCallback() {
    window.removeEventListener('ilm-favorites-updated', this.storageSyncHandler);
    window.removeEventListener('storage', this.storageSyncHandler);
    super.disconnectedCallback();
  }

  public loadFromStorage() {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      this.items = raw ? JSON.parse(raw) : [];
    } catch {
      this.items = [];
    }
  }

  private handleClose() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('ilm-drawer-close', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleRemove(id: number) {
    const next = this.items.filter((item) => item.id !== id);
    this.items = next;
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    this.dispatchEvent(
      new CustomEvent('ilm-favorite-remove', {
        detail: { id, favorites: next },
        bubbles: true,
        composed: true,
      })
    );
    window.dispatchEvent(
      new CustomEvent('ilm-favorites-updated', {
        detail: { favorites: next, count: next.length },
      })
    );
  }

  render() {
    if (!this.open) {
      return null;
    }

    const totalEur = this.items.reduce((acc, item) => acc + Number(item.price || 0), 0);

    return html`
      <div class="backdrop" @click=${this.handleClose}>
        <aside class="drawer" @click=${(e: Event) => e.stopPropagation()}>
          <div class="drawer-header">
            <h2 class="drawer-title">Saved Favorites (${this.items.length})</h2>
            <button type="button" class="close-btn" @click=${this.handleClose}>ESC</button>
          </div>
          <div class="drawer-content">
            ${this.items.length === 0
              ? html`
                  <div class="empty-state">
                    No saved listings yet. Click the heart icon on any campus listing card to bookmark items in browser storage.
                  </div>
                `
              : this.items.map(
                  (item) => html`
                    <div class="fav-item">
                      <div class="fav-meta">
                        <p class="fav-title">${item.title}</p>
                        <div class="fav-sub">${item.pickup_location}</div>
                        <div class="fav-price">EUR ${Number(item.price).toFixed(0)} ${item.price_type}</div>
                      </div>
                      <button
                        type="button"
                        class="remove-btn"
                        @click=${() => this.handleRemove(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  `
                )}
          </div>
          <div class="drawer-footer">
            <span>Total Bookmarked Value</span>
            <span class="total-price">EUR ${totalEur.toFixed(0)}</span>
          </div>
        </aside>
      </div>
    `;
  }
}

if (!customElements.get('ilm-favorites-drawer')) {
  customElements.define('ilm-favorites-drawer', IlmFavoritesDrawer);
}
