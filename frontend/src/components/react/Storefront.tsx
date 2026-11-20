import React, { useEffect, useRef, useState } from 'react';
import { Listing, SALES_CATEGORIES, User } from '../../api';
import { FavoriteToggleDetail } from '../lit/ilm-listing-card';
import '../lit/ilm-listing-card';

interface ListingCardWrapperProps {
  listing: Listing;
  isFavorited: boolean;
  onToggleFavorite: (listing: Listing) => void;
  onSelectListing: (listing: Listing) => void;
}

const ListingCardWrapper: React.FC<ListingCardWrapperProps> = ({
  listing,
  isFavorited,
  onToggleFavorite,
  onSelectListing,
}) => {
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<FavoriteToggleDetail>;
      if (customEvent.detail) {
        onToggleFavorite(listing);
      }
    };

    const handleCardSelect = () => {
      onSelectListing(listing);
    };

    node.addEventListener('ilm-favorite-toggle', handleToggle);
    node.addEventListener('ilm-card-select', handleCardSelect);
    return () => {
      node.removeEventListener('ilm-favorite-toggle', handleToggle);
      node.removeEventListener('ilm-card-select', handleCardSelect);
    };
  }, [listing, onToggleFavorite, onSelectListing]);

  useEffect(() => {
    const node = cardRef.current as any;
    if (!node) return;
    node.listingId = listing.id;
    node.title = listing.title;
    node.price = listing.price;
    node.priceType = listing.price_type;
    node.category = listing.category;
    node.condition = listing.condition;
    node.pickupLocation = listing.pickup_location;
    node.imageUrl = listing.image_url;
    node.status = listing.status || 'AVAILABLE';
    node.favorited = isFavorited;
  }, [listing, isFavorited]);

  return React.createElement('ilm-listing-card', {
    ref: cardRef,
    'listing-id': listing.id,
    title: listing.title,
    price: listing.price,
    'price-type': listing.price_type,
    category: listing.category,
    condition: listing.condition,
    'pickup-location': listing.pickup_location,
    'image-url': listing.image_url,
    status: listing.status || 'AVAILABLE',
    favorited: isFavorited ? '' : undefined,
  });
};

interface StorefrontProps {
  listings: Listing[];
  favorites: Listing[];
  currentUser?: User | null;
  selectedCategory: string;
  loading: boolean;
  onSelectCategory: (category: string) => void;
  onToggleFavorite: (listing: Listing) => void;
  onSelectListing: (listing: Listing) => void;
}

export const Storefront: React.FC<StorefrontProps> = ({
  listings,
  favorites,
  currentUser = null,
  selectedCategory,
  loading,
  onSelectCategory,
  onToggleFavorite,
  onSelectListing,
}) => {
  const [carouselOffset, setCarouselOffset] = useState(0);

  const suggestedListings: Listing[] = React.useMemo(() => {
    if (!currentUser) return listings;
    return listings.filter(
      (item) =>
        item.seller_id !== currentUser.id &&
        (!item.seller_email ||
          item.seller_email.toLowerCase() !== currentUser.email.toLowerCase())
    );
  }, [listings, currentUser]);

  useEffect(() => {
    setCarouselOffset(0);
  }, [selectedCategory, suggestedListings.length]);

  const handlePrev = () => {
    if (suggestedListings.length === 0) return;
    setCarouselOffset(
      (prev) => (prev - 4 + suggestedListings.length) % suggestedListings.length
    );
  };

  const handleNext = () => {
    if (suggestedListings.length === 0) return;
    setCarouselOffset((prev) => (prev + 4) % suggestedListings.length);
  };

  const visibleListings: Listing[] = React.useMemo(() => {
    if (suggestedListings.length <= 8 && carouselOffset === 0) {
      return suggestedListings.slice(0, 8);
    }
    const rotated = [
      ...suggestedListings.slice(carouselOffset),
      ...suggestedListings.slice(0, carouselOffset),
    ];
    return rotated.slice(0, 8);
  }, [suggestedListings, carouselOffset]);

  const favoriteIds = new Set(favorites.map((item) => item.id));

  return (
    <section aria-label="Campus Marketplace Storefront">
      <div className="categories-strip" role="tablist" aria-label="Sales Categories">
        <button
          type="button"
          className={`category-chip ${selectedCategory === 'ALL' ? 'active' : ''}`}
          onClick={() => onSelectCategory('ALL')}
        >
          All Categories ({suggestedListings.length})
        </button>
        {SALES_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="section-header-bar">
        <div className="section-title-wrap">
          <h1 className="section-title">Suggested</h1>
        </div>

        <div className="carousel-controls">
          <button
            type="button"
            className="carousel-circle-btn"
            aria-label="Previous listings page"
            onClick={handlePrev}
          >
            &lt;
          </button>
          <button
            type="button"
            className="carousel-circle-btn"
            aria-label="Next listings page"
            onClick={handleNext}
          >
            &gt;
          </button>
        </div>
      </div>

      {loading ? (
        <div className="panel-card">Loading TU Ilmenau campus listings...</div>
      ) : visibleListings.length === 0 ? (
        <div className="panel-card">
          No listings match your current search or campus filter criteria.
        </div>
      ) : (
        <div className="listings-grid-2x4">
          {visibleListings.map((listing) => (
            <ListingCardWrapper
              key={listing.id}
              listing={listing}
              isFavorited={favoriteIds.has(listing.id)}
              onToggleFavorite={onToggleFavorite}
              onSelectListing={onSelectListing}
            />
          ))}
        </div>
      )}
    </section>
  );
};
