import { LitElement, html, css } from 'lit';

export interface SearchEventDetail {
  query: string;
  category: string;
  campus: string;
}

export class IlmSearchBar extends LitElement {
  static properties = {
    query: { type: String },
    category: { type: String },
    campus: { type: String },
    placeholder: { type: String },
  };

  declare query: string;
  declare category: string;
  declare campus: string;
  declare placeholder: string;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .search-shell {
      display: flex;
      align-items: center;
      background-color: #ffffff;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.28);
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }

    .select-group {
      display: flex;
      align-items: center;
      border-right: 1px solid #e2e8f0;
      background-color: #f8fafc;
    }

    select {
      appearance: none;
      border: none;
      background: transparent;
      padding: 9px 12px;
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 600;
      color: #003a63;
      cursor: pointer;
      outline: none;
    }

    .campus-select {
      border-left: 1px solid #e2e8f0;
      color: #334155;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
    }

    input {
      flex: 1;
      min-width: 140px;
      border: none;
      padding: 9px 12px;
      font-family: inherit;
      font-size: 13px;
      color: #0f172a;
      outline: none;
    }

    input::placeholder {
      color: #94a3b8;
    }

    .submit-btn {
      background-color: #0d9488;
      color: #ffffff;
      border: none;
      padding: 9px 16px;
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.15s ease;
    }

    .submit-btn:hover {
      background-color: #0f766e;
    }

    @media (max-width: 720px) {
      .search-shell {
        flex-wrap: wrap;
      }
      .select-group {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
      }
      select {
        flex: 1;
      }
    }
  `;

  constructor() {
    super();
    this.query = '';
    this.category = 'ALL';
    this.campus = 'ALL';
    this.placeholder = 'Search textbooks, monitors, bikes, dorm gear...';
  }

  private emitSearch() {
    const detail: SearchEventDetail = {
      query: this.query,
      category: this.category,
      campus: this.campus,
    };
    this.dispatchEvent(
      new CustomEvent<SearchEventDetail>('ilm-search', {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.query = target.value;
    this.emitSearch();
  }

  private handleCategoryChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.category = target.value;
    this.emitSearch();
  }

  private handleCampusChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.campus = target.value;
    this.emitSearch();
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.emitSearch();
  }

  render() {
    return html`
      <form class="search-shell" @submit=${this.handleSubmit}>
        <div class="select-group">
          <select
            aria-label="Category filter"
            .value=${this.category}
            @change=${this.handleCategoryChange}
          >
            <option value="ALL">All Categories</option>
            <option value="Bikes & Mobility">Bikes & Mobility</option>
            <option value="Dorm & Furniture">Dorm & Furniture</option>
            <option value="Kitchen & Appliances">Kitchen & Appliances</option>
            <option value="Electronics & Monitors">Electronics & Monitors</option>
            <option value="Study & Textbooks">Study & Textbooks</option>
          </select>
          <select
            class="campus-select"
            aria-label="Campus pickup selector"
            .value=${this.campus}
            @change=${this.handleCampusChange}
          >
            <option value="ALL">Campus: All</option>
            <option value="Haus A">Haus A</option>
            <option value="Haus B">Haus B</option>
            <option value="Haus D">Haus D</option>
            <option value="Haus K">Haus K</option>
            <option value="Haus M">Haus M</option>
            <option value="Haus N">Haus N</option>
            <option value="Zusebau">Zusebau</option>
            <option value="Helmholtzbau">Helmholtzbau</option>
          </select>
        </div>
        <input
          type="text"
          aria-label="Search marketplace items"
          .value=${this.query}
          placeholder=${this.placeholder}
          @input=${this.handleInput}
        />
        <button type="submit" class="submit-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>Filter</span>
        </button>
      </form>
    `;
  }
}

if (!customElements.get('ilm-search-bar')) {
  customElements.define('ilm-search-bar', IlmSearchBar);
}
