import { LitElement, html, css } from 'lit';
import { ListingStatus } from '../../api';

export interface FavoriteToggleDetail {
  listingId: number;
  title: string;
  price: number;
  priceType: 'FIXED' | 'VB';
  category: string;
  condition: string;
  pickupLocation: string;
  imageUrl: string;
  status: ListingStatus;
  favorited: boolean;
}

export interface CardSelectDetail {
  listingId: number;
}

export class IlmListingCard extends LitElement {
  static properties = {
    listingId: { type: Number, attribute: 'listing-id' },
    title: { type: String },
    price: { type: Number },
    priceType: { type: String, attribute: 'price-type' },
    category: { type: String },
    condition: { type: String },
    pickupLocation: { type: String, attribute: 'pickup-location' },
    imageUrl: { type: String, attribute: 'image-url' },
    status: { type: String, reflect: true },
    favorited: { type: Boolean, reflect: true },
  };

  declare listingId: number;
  declare title: string;
  declare price: number;
  declare priceType: 'FIXED' | 'VB';
  declare category: string;
  declare condition: string;
  declare pickupLocation: string;
  declare imageUrl: string;
  declare status: ListingStatus;
  declare favorited: boolean;

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.04);
      transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
      display: flex;
      flex-direction: column;
      height: 100%;
      cursor: pointer;
    }

    .card:hover {
      transform: translateY(-2px);
      border-color: #cbd5e1;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
    }

    .media-frame {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      background-color: #f1f5f9;
      overflow: hidden;
      border-bottom: 1px solid #f1f5f9;
    }

    .media-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: filter 0.2s ease;
    }

    .media-frame.is-sold img {
      filter: grayscale(55%) contrast(0.92);
    }

    .condition-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background-color: rgba(0, 58, 99, 0.9);
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 600;
      padding: 3px 7px;
      border-radius: 4px;
      letter-spacing: 0.02em;
      z-index: 2;
    }

    .status-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 1;
    }

    .status-overlay.reserved {
      background: linear-gradient(
        180deg,
        rgba(217, 119, 6, 0.08) 0%,
        rgba(217, 119, 6, 0.24) 100%
      );
    }

    .status-overlay.sold {
      background: linear-gradient(
        180deg,
        rgba(51, 65, 85, 0.22) 0%,
        rgba(15, 23, 42, 0.48) 100%
      );
    }

    .status-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
    }

    .status-badge.reserved {
      background-color: #d97706;
      color: #ffffff;
      border: 1px solid #fde68a;
    }

    .status-badge.sold {
      background-color: #334155;
      color: #f8fafc;
      border: 1px solid #94a3b8;
    }

    .favorite-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1px solid rgba(226, 232, 240, 0.9);
      background-color: rgba(255, 255, 255, 0.95);
      color: #64748b;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      padding: 0;
      z-index: 3;
    }

    .favorite-btn:hover {
      border-color: #0d9488;
      color: #0d9488;
      transform: scale(1.05);
    }

    .favorite-btn.active {
      background-color: #0d9488;
      border-color: #0d9488;
      color: #ffffff;
    }

    .body {
      padding: 10px 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .category-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
    }

    .status-inline-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
    }

    .status-inline-pill.reserved {
      background-color: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .status-inline-pill.sold {
      background-color: #e2e8f0;
      color: #334155;
      border: 1px solid #cbd5e1;
    }

    .title {
      margin: 0;
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .price-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-top: 2px;
    }

    .price {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14.5px;
      font-weight: 700;
      color: #003a63;
    }

    .price-type {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 4px;
      background-color: #f0fdfa;
      color: #0d9488;
      border: 1px solid #99f6e4;
    }

    .location-row {
      margin-top: auto;
      padding-top: 6px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
      color: #475569;
    }

    .location-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  constructor() {
    super();
    this.listingId = 0;
    this.title = 'Untitled Campus Item';
    this.price = 0;
    this.priceType = 'FIXED';
    this.category = 'Study & Textbooks';
    this.condition = 'Very Good';
    this.pickupLocation = 'Max-Planck-Ring, Haus D';
    this.imageUrl = '';
    this.status = 'AVAILABLE';
    this.favorited = false;
  }

  private handleCardClick() {
    this.dispatchEvent(
      new CustomEvent<CardSelectDetail>('ilm-card-select', {
        detail: { listingId: this.listingId },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleFavoriteClick(e: Event) {
    e.stopPropagation();
    this.favorited = !this.favorited;
    const detail: FavoriteToggleDetail = {
      listingId: this.listingId,
      title: this.title,
      price: this.price,
      priceType: this.priceType,
      category: this.category,
      condition: this.condition,
      pickupLocation: this.pickupLocation,
      imageUrl: this.imageUrl,
      status: this.status,
      favorited: this.favorited,
    };
    this.dispatchEvent(
      new CustomEvent<FavoriteToggleDetail>('ilm-favorite-toggle', {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const formattedPrice = `EUR ${Number(this.price).toFixed(0)}`;
    const normalizedStatus: ListingStatus =
      this.status === 'RESERVED' || this.status === 'SOLD' ? this.status : 'AVAILABLE';

    return html`
      <article class="card" part="card" @click=${this.handleCardClick}>
        <div class="media-frame ${normalizedStatus === 'SOLD' ? 'is-sold' : ''}">
          ${this.imageUrl
            ? html`<img src=${this.imageUrl} alt=${this.title} loading="lazy" />`
            : null}
          <span class="condition-badge">${this.condition}</span>

          ${normalizedStatus === 'RESERVED'
            ? html`
                <div class="status-overlay reserved">
                  <span class="status-badge reserved">RESERVED</span>
                </div>
              `
            : null}

          ${normalizedStatus === 'SOLD'
            ? html`
                <div class="status-overlay sold">
                  <span class="status-badge sold">SOLD</span>
                </div>
              `
            : null}

          <button
            type="button"
            class="favorite-btn ${this.favorited ? 'active' : ''}"
            aria-label=${this.favorited ? 'Remove from favorites' : 'Save to favorites'}
            @click=${this.handleFavoriteClick}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill=${this.favorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              ></path>
            </svg>
          </button>
        </div>
        <div class="body">
          <div class="category-row">
            <span>${this.category}</span>
            ${normalizedStatus !== 'AVAILABLE'
              ? html`<span
                  class="status-inline-pill ${normalizedStatus.toLowerCase()}"
                  >${normalizedStatus}</span
                >`
              : null}
          </div>
          <h3 class="title" title=${this.title}>${this.title}</h3>
          <div class="price-row">
            <span class="price">${formattedPrice}</span>
            <span class="price-type">${this.priceType}</span>
          </div>
          <div class="location-row" title=${this.pickupLocation}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0D9488"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span class="location-text">${this.pickupLocation}</span>
          </div>
        </div>
      </article>
    `;
  }
}

if (!customElements.get('ilm-listing-card')) {
  customElements.define('ilm-listing-card', IlmListingCard);
}
