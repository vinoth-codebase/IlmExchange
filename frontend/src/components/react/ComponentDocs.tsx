import React, { useEffect, useRef, useState } from 'react';
import { ListingStatus } from '../../api';
import '../lit/ilm-listing-card';
import '../lit/ilm-search-bar';
import '../lit/ilm-favorites-drawer';
import '../lit/ilm-image-carousel';

type FrameworkTab = 'REACT' | 'ANGULAR' | 'VUE';

export const ComponentDocs: React.FC<{ onReturnStorefront: () => void }> = ({
  onReturnStorefront,
}) => {
  const [title, setTitle] = useState('Dell 27 USB-C Monitor');
  const [price, setPrice] = useState(140);
  const [priceType, setPriceType] = useState<'FIXED' | 'VB'>('VB');
  const [category] = useState('Electronics & Monitors');
  const [condition, setCondition] = useState('Excellent');
  const [pickupLocation, setPickupLocation] = useState('Ehrenbergstrasse, Zusebau');
  const [status, setStatus] = useState<ListingStatus>('RESERVED');
  const [favorited, setFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<FrameworkTab>('REACT');
  const [eventLog, setEventLog] = useState<string[]>([
    '[Telemetry Ready] Shadow DOM encapsulated Lit 3 Custom Elements initialized.',
  ]);

  const previewCardRef = useRef<HTMLElement | null>(null);
  const previewSearchRef = useRef<HTMLElement | null>(null);
  const previewCarouselRef = useRef<HTMLElement | null>(null);

  const previewSvg1 = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#E2E8F0"/><rect x="180" y="130" width="440" height="270" rx="12" fill="#003a63" stroke="#0F172A" stroke-width="10"/><text x="400" y="275" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="24" font-weight="700" fill="#FFFFFF">${title.replace(/[<>&"']/g, '')}</text><rect x="370" y="400" width="60" height="60" fill="#475569"/><rect x="290" y="460" width="220" height="16" rx="6" fill="#1E293B"/></svg>`
  )}`;
  const previewSvg2 = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#0F172A"/><rect x="120" y="120" width="560" height="360" rx="12" fill="#1E293B" stroke="#0D9488" stroke-width="6"/><text x="400" y="290" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="24" font-weight="700" fill="#14B8A6">SLIDE 2 // PORTS &amp; USB-C HUB</text></svg>`
  )}`;

  useEffect(() => {
    const node = previewCardRef.current as any;
    if (!node) return;
    node.listingId = 99;
    node.title = title;
    node.price = price;
    node.priceType = priceType;
    node.category = category;
    node.condition = condition;
    node.pickupLocation = pickupLocation;
    node.imageUrl = previewSvg1;
    node.status = status;
    node.favorited = favorited;
  }, [title, price, priceType, category, condition, pickupLocation, status, favorited, previewSvg1]);

  useEffect(() => {
    const carouselNode = previewCarouselRef.current as any;
    if (!carouselNode) return;
    carouselNode.images = [previewSvg1, previewSvg2];
    carouselNode.caption = title;
  }, [previewSvg1, previewSvg2, title]);

  useEffect(() => {
    const cardNode = previewCardRef.current;
    const searchNode = previewSearchRef.current;
    const carouselNode = previewCarouselRef.current;

    const handleCardEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setFavorited(Boolean(detail?.favorited));
      setEventLog((prev) => [
        `[${new Date().toLocaleTimeString()}] CustomEvent("ilm-favorite-toggle") -> ${JSON.stringify(
          {
            listingId: detail?.listingId,
            status: detail?.status,
            favorited: detail?.favorited,
          }
        )}`,
        ...prev.slice(0, 7),
      ]);
    };

    const handleSearchEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setEventLog((prev) => [
        `[${new Date().toLocaleTimeString()}] CustomEvent("ilm-search") -> ${JSON.stringify(
          detail
        )}`,
        ...prev.slice(0, 7),
      ]);
    };

    const handleSlideEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setEventLog((prev) => [
        `[${new Date().toLocaleTimeString()}] CustomEvent("ilm-slide-change") -> slide ${
          detail.index + 1
        } of ${detail.total}`,
        ...prev.slice(0, 7),
      ]);
    };

    cardNode?.addEventListener('ilm-favorite-toggle', handleCardEvent);
    searchNode?.addEventListener('ilm-search', handleSearchEvent);
    carouselNode?.addEventListener('ilm-slide-change', handleSlideEvent);
    return () => {
      cardNode?.removeEventListener('ilm-favorite-toggle', handleCardEvent);
      searchNode?.removeEventListener('ilm-search', handleSearchEvent);
      carouselNode?.removeEventListener('ilm-slide-change', handleSlideEvent);
    };
  }, []);

  const codeSnippets: Record<FrameworkTab, string> = {
    REACT: `// React 18 Host Integration (<ilm-listing-card> + <ilm-image-carousel>)
import React, { useEffect, useRef } from 'react';
import '@ilmexchange/components/lit/ilm-listing-card';
import '@ilmexchange/components/lit/ilm-image-carousel';

export function CampusCardHost() {
  const cardRef = useRef<HTMLElement | null>(null);

  return (
    <ilm-listing-card
      ref={cardRef}
      listing-id="99"
      title="${title}"
      price="${price}"
      price-type="${priceType}"
      status="${status}"
      condition="${condition}"
      pickup-location="${pickupLocation}"
    />
  );
}`,
    ANGULAR: `// Angular Standalone Component Integration (CUSTOM_ELEMENTS_SCHEMA)
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@ilmexchange/components/lit/ilm-listing-card';
import '@ilmexchange/components/lit/ilm-image-carousel';

@Component({
  selector: 'app-campus-listing',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <ilm-listing-card
      [listingId]="99"
      [title]="'${title}'"
      [price]="${price}"
      [priceType]="'${priceType}'"
      [status]="'${status}'"
      [pickupLocation]="'${pickupLocation}'"
      (ilm-favorite-toggle)="onFavoriteToggle($event)"
    ></ilm-listing-card>
  \`
})
export class CampusListingComponent {
  onFavoriteToggle(event: CustomEvent) {
    console.log('Dispatched from Lit Shadow DOM:', event.detail);
  }
}`,
    VUE: `<!-- Vue 3 SFC Integration (compilerOptions.isCustomElement: tag => tag.startsWith('ilm-')) -->
<script setup lang="ts">
import '@ilmexchange/components/lit/ilm-listing-card';
import '@ilmexchange/components/lit/ilm-image-carousel';

function handleFavoriteToggle(event: CustomEvent) {
  console.log('Received CustomEvent payload:', event.detail);
}
</script>

<template>
  <ilm-listing-card
    :listing-id="99"
    title="${title}"
    :price="${price}"
    price-type="${priceType}"
    status="${status}"
    pickup-location="${pickupLocation}"
    @ilm-favorite-toggle="handleFavoriteToggle"
  />
</template>`,
  };

  return (
    <section aria-label="Lit Web Component Developer Portal">
      <div className="section-header-bar">
        <div className="section-title-wrap">
          <h1 className="section-title">Developer API &amp; Lit Web Component Docs</h1>
          <span className="section-telemetry">
            LIT 3.x // SHADOW DOM ENCAPSULATION // 4 CUSTOM ELEMENTS
          </span>
        </div>
        <button
          type="button"
          className="category-chip"
          onClick={onReturnStorefront}
        >
          Back to Storefront
        </button>
      </div>

      <div className="docs-grid">
        <div className="panel-card">
          <h2 style={{ marginTop: 0, fontSize: '15px' }}>
            Interactive Prop Controls (&lt;ilm-listing-card&gt;)
          </h2>
          <div className="form-field">
            <label htmlFor="doc-title">Listing Title</label>
            <input
              id="doc-title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-row-2col">
            <div className="form-field">
              <label htmlFor="doc-price">Price (EUR)</label>
              <input
                id="doc-price"
                type="number"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="doc-status">Lifecycle Status</label>
              <select
                id="doc-status"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ListingStatus)}
              >
                <option value="AVAILABLE">AVAILABLE (Ready to Buy)</option>
                <option value="RESERVED">RESERVED (Amber Badge)</option>
                <option value="SOLD">SOLD (Slate Badge)</option>
              </select>
            </div>
          </div>
          <div className="form-row-2col">
            <div className="form-field">
              <label htmlFor="doc-price-type">Price Type</label>
              <select
                id="doc-price-type"
                className="form-select"
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as 'FIXED' | 'VB')}
              >
                <option value="VB">VB (Negotiable)</option>
                <option value="FIXED">FIXED</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="doc-condition">Condition Badge</label>
              <input
                id="doc-condition"
                className="form-input"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="doc-pickup">TU Ilmenau Pickup Location</label>
            <input
              id="doc-pickup"
              className="form-input"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '14px', maxWidth: '280px' }}>
            {React.createElement('ilm-listing-card', {
              ref: previewCardRef,
              'listing-id': 99,
              title,
              price,
              'price-type': priceType,
              category,
              condition,
              status,
              'pickup-location': pickupLocation,
              'image-url': previewSvg1,
            })}
          </div>
        </div>

        <div>
          <div className="panel-card">
            <h2 style={{ marginTop: 0, fontSize: '15px' }}>
              Isolated Multi-Image Carousel (&lt;ilm-image-carousel&gt;) &amp; Search (&lt;ilm-search-bar&gt;)
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: '14px',
                alignItems: 'start',
                marginBottom: '12px',
              }}
            >
              {React.createElement('ilm-image-carousel', {
                ref: previewCarouselRef,
              })}
              <div>
                <div
                  style={{
                    backgroundColor: '#003a63',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '10px',
                  }}
                >
                  {React.createElement('ilm-search-bar', {
                    ref: previewSearchRef,
                  })}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '10px 12px',
                  }}
                >
                  <strong style={{ color: '#003a63' }}>CustomEvent Stream:</strong>
                  {eventLog.map((entry, idx) => (
                    <div key={idx} style={{ marginTop: '4px', color: '#334155' }}>
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="panel-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '15px' }}>
                Cross-Framework Integration Snippets
              </h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['REACT', 'ANGULAR', 'VUE'] as FrameworkTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`category-chip ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <pre className="code-block">
              <code>{codeSnippets[activeTab]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
