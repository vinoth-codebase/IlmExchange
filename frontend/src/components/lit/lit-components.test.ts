import { describe, it, expect, beforeEach, vi } from 'vitest';
import './ilm-listing-card';
import './ilm-search-bar';
import './ilm-favorites-drawer';
import './ilm-image-carousel';
import { IlmListingCard } from './ilm-listing-card';
import { IlmSearchBar } from './ilm-search-bar';
import { IlmFavoritesDrawer } from './ilm-favorites-drawer';
import { IlmImageCarousel } from './ilm-image-carousel';
import { FAVORITES_STORAGE_KEY } from '../../api';

describe('IlmExchange Lit Web Components Suite', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('renders <ilm-listing-card> Shadow DOM, status badges (RESERVED/SOLD), and dispatches ilm-favorite-toggle', async () => {
    const el = document.createElement('ilm-listing-card') as IlmListingCard;
    el.listingId = 1;
    el.title = '26-inch Mountain Bike';
    el.price = 115;
    el.priceType = 'VB';
    el.category = 'Bikes & Mobility';
    el.condition = 'Very Good';
    el.pickupLocation = 'Max-Planck-Ring, Haus D';
    el.status = 'RESERVED';
    document.body.appendChild(el);

    await el.updateComplete;

    const shadow = el.shadowRoot!;
    expect(shadow).toBeTruthy();
    expect(shadow.querySelector('.title')?.textContent).toBe('26-inch Mountain Bike');
    expect(shadow.querySelector('.price')?.textContent).toBe('EUR 115');
    expect(shadow.querySelector('.status-badge.reserved')?.textContent).toBe('RESERVED');

    el.status = 'SOLD';
    await el.updateComplete;
    expect(shadow.querySelector('.status-badge.sold')?.textContent).toBe('SOLD');

    const spy = vi.fn();
    el.addEventListener('ilm-favorite-toggle', spy);

    const favButton = shadow.querySelector('.favorite-btn') as HTMLButtonElement;
    favButton.click();

    await el.updateComplete;

    expect(spy).toHaveBeenCalledTimes(1);
    const customEvent = spy.mock.calls[0][0] as CustomEvent;
    expect(customEvent.detail).toMatchObject({
      listingId: 1,
      title: '26-inch Mountain Bike',
      price: 115,
      priceType: 'VB',
      pickupLocation: 'Max-Planck-Ring, Haus D',
      status: 'SOLD',
      favorited: true,
    });
  });

  it('renders <ilm-image-carousel> with 1-5 images and dispatches ilm-slide-change on navigation', async () => {
    const carousel = document.createElement('ilm-image-carousel') as IlmImageCarousel;
    carousel.images = ['slide-1.svg', 'slide-2.svg', 'slide-3.svg'];
    carousel.caption = 'Dell 27 USB-C Monitor';
    document.body.appendChild(carousel);

    await carousel.updateComplete;

    const shadow = carousel.shadowRoot!;
    expect(shadow.querySelector('.counter-pill')?.textContent?.trim()).toBe('1 / 3');

    const slideSpy = vi.fn();
    carousel.addEventListener('ilm-slide-change', slideSpy);

    const nextBtn = shadow.querySelector('.nav-next') as HTMLButtonElement;
    nextBtn.click();

    await carousel.updateComplete;

    expect(slideSpy).toHaveBeenCalledTimes(1);
    expect(slideSpy.mock.calls[0][0].detail).toEqual({
      index: 1,
      total: 3,
      currentImage: 'slide-2.svg',
    });
    expect(shadow.querySelector('.counter-pill')?.textContent?.trim()).toBe('2 / 3');
  });

  it('renders <ilm-search-bar> and dispatches ilm-search CustomEvent on input and filter changes', async () => {
    const el = document.createElement('ilm-search-bar') as IlmSearchBar;
    document.body.appendChild(el);

    await el.updateComplete;

    const spy = vi.fn();
    el.addEventListener('ilm-search', spy);

    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'Monitor';
    input.dispatchEvent(new Event('input'));

    await el.updateComplete;

    expect(spy).toHaveBeenCalledTimes(1);
    const searchEvent = spy.mock.calls[0][0] as CustomEvent;
    expect(searchEvent.detail).toEqual({
      query: 'Monitor',
      category: 'ALL',
      campus: 'ALL',
    });
  });

  it('renders <ilm-favorites-drawer> from localStorage and dispatches ilm-favorite-remove', async () => {
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify([
        {
          id: 3,
          seller_id: 1,
          title: 'Dell 27 USB-C Monitor',
          price: 140,
          price_type: 'VB',
          category: 'Electronics & Monitors',
          condition: 'Excellent',
          pickup_location: 'Ehrenbergstrasse, Zusebau',
          image_url: '',
          status: 'AVAILABLE',
          created_at: '2026-06-18T10:00:00Z',
        },
      ])
    );

    const drawer = document.createElement('ilm-favorites-drawer') as IlmFavoritesDrawer;
    drawer.open = true;
    document.body.appendChild(drawer);

    await drawer.updateComplete;

    const shadow = drawer.shadowRoot!;
    expect(shadow.querySelector('.fav-title')?.textContent).toBe('Dell 27 USB-C Monitor');
    expect(shadow.querySelector('.total-price')?.textContent).toBe('EUR 140');

    const removeSpy = vi.fn();
    drawer.addEventListener('ilm-favorite-remove', removeSpy);

    const removeBtn = shadow.querySelector('.remove-btn') as HTMLButtonElement;
    removeBtn.click();

    await drawer.updateComplete;
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]')).toHaveLength(0);
  });
});
