import { LitElement, html, css } from 'lit';

export interface SlideChangeDetail {
  index: number;
  total: number;
  currentImage: string;
}

export class IlmImageCarousel extends LitElement {
  static properties = {
    images: { type: Array },
    activeIndex: { type: Number, attribute: 'active-index' },
    caption: { type: String },
  };

  declare images: string[];
  declare activeIndex: number;
  declare caption: string;

  private touchStartX: number | null = null;

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .carousel-root {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .stage {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      background-color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      user-select: none;
    }

    .stage img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .counter-pill {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(0, 58, 99, 0.9);
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 1px solid rgba(226, 232, 240, 0.85);
      background-color: rgba(255, 255, 255, 0.94);
      color: #003a63;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .nav-btn:hover {
      background-color: #0d9488;
      border-color: #0d9488;
      color: #ffffff;
    }

    .nav-prev {
      left: 10px;
    }

    .nav-next {
      right: 10px;
    }

    .thumbs-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background-color: #ffffff;
      border-top: 1px solid #e2e8f0;
      gap: 8px;
    }

    .dots {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot-btn {
      width: 24px;
      height: 6px;
      border-radius: 3px;
      border: none;
      background-color: #cbd5e1;
      cursor: pointer;
      padding: 0;
      transition: background-color 0.15s ease, width 0.15s ease;
    }

    .dot-btn.active {
      background-color: #0d9488;
      width: 34px;
    }

    .telemetry-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #64748b;
    }
  `;

  constructor() {
    super();
    this.images = [];
    this.activeIndex = 0;
    this.caption = 'Multi-Image Gallery';
  }

  private get normalizedImages(): string[] {
    if (Array.isArray(this.images) && this.images.length > 0) {
      return this.images.slice(0, 5);
    }
    return [];
  }

  private goToSlide(nextIndex: number) {
    const list = this.normalizedImages;
    if (list.length === 0) return;
    const bounded = (nextIndex + list.length) % list.length;
    this.activeIndex = bounded;
    const detail: SlideChangeDetail = {
      index: bounded,
      total: list.length,
      currentImage: list[bounded],
    };
    this.dispatchEvent(
      new CustomEvent<SlideChangeDetail>('ilm-slide-change', {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  private handlePrev(e: Event) {
    e.stopPropagation();
    this.goToSlide(this.activeIndex - 1);
  }

  private handleNext(e: Event) {
    e.stopPropagation();
    this.goToSlide(this.activeIndex + 1);
  }

  private handleTouchStart(e: TouchEvent) {
    if (e.touches && e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    if (this.touchStartX === null || !e.changedTouches || e.changedTouches.length === 0) {
      return;
    }
    const deltaX = e.changedTouches[0].clientX - this.touchStartX;
    this.touchStartX = null;
    if (Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        this.goToSlide(this.activeIndex + 1);
      } else {
        this.goToSlide(this.activeIndex - 1);
      }
    }
  }

  render() {
    const list = this.normalizedImages;
    const safeIndex = list.length > 0 ? Math.min(this.activeIndex, list.length - 1) : 0;
    const activeSrc = list[safeIndex] || '';

    return html`
      <div class="carousel-root">
        <div
          class="stage"
          @touchstart=${this.handleTouchStart}
          @touchend=${this.handleTouchEnd}
        >
          ${activeSrc
            ? html`<img src=${activeSrc} alt="${this.caption} slide ${safeIndex + 1}" />`
            : null}
          <span class="counter-pill">
            ${list.length > 0 ? `${safeIndex + 1} / ${list.length}` : '0 / 0'}
          </span>
          ${list.length > 1
            ? html`
                <button
                  type="button"
                  class="nav-btn nav-prev"
                  aria-label="Previous image"
                  @click=${this.handlePrev}
                >
                  &lt;
                </button>
                <button
                  type="button"
                  class="nav-btn nav-next"
                  aria-label="Next image"
                  @click=${this.handleNext}
                >
                  &gt;
                </button>
              `
            : null}
        </div>
        <div class="thumbs-bar">
          <div class="dots" role="tablist" aria-label="Slide selector">
            ${list.map(
              (_src, idx) => html`
                <button
                  type="button"
                  class="dot-btn ${idx === safeIndex ? 'active' : ''}"
                  aria-label="Go to slide ${idx + 1}"
                  @click=${() => this.goToSlide(idx)}
                ></button>
              `
            )}
          </div>
          <span class="telemetry-label">SLIDE ${safeIndex + 1} OF ${Math.max(list.length, 1)}</span>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('ilm-image-carousel')) {
  customElements.define('ilm-image-carousel', IlmImageCarousel);
}
