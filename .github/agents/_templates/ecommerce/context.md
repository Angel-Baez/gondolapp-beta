# E-commerce Template Context

> Project template for online stores, marketplaces, and retail platforms.
> This template is ideal for B2C shops, multi-vendor marketplaces, and digital product stores.

## Template Overview

**Type**: E-commerce
**Example Projects**: Online stores, marketplaces, subscription boxes, digital downloads
**Key Characteristics**: Product catalog, cart/checkout, payments, SEO-critical, high conversion focus

## Target Users

**Primary**: Shoppers (B2C)
- Mobile-first browsing
- Quick checkout expectations
- Trust indicators important
- Social proof driven

**Secondary**: Store administrators
- Product management
- Order fulfillment
- Inventory tracking
- Analytics

**Tertiary**: Vendors (for marketplaces)
- Product listing
- Order management
- Payouts

## Technology Stack Specifics

### Required Technologies

| Technology | Purpose | Configuration |
|------------|---------|---------------|
| **Stripe/PayPal** | Payment processing | Multiple methods |
| **PostgreSQL** | Relational data | Products, orders, users |
| **Redis** | Cart sessions, inventory locks | High-speed access |
| **Algolia/Meilisearch** | Product search | Full-text, faceted |
| **Cloudinary/S3** | Product images | Optimized delivery |

### Recommended Additions

| Technology | Purpose | When to Add |
|------------|---------|-------------|
| **Shopify Storefront API** | Headless commerce | Need Shopify backend |
| **Saleor/Medusa** | Open-source e-commerce | Full control needed |
| **Klaviyo** | Email marketing | Abandoned cart, campaigns |
| **Yotpo/Judge.me** | Reviews | Social proof |
| **ShipStation** | Shipping | Order fulfillment |

## Data Architecture

### Core Schema

```typescript
// Product
interface Product {
  id: string;
  slug: string;                    // SEO-friendly URL
  name: string;
  description: string;
  descriptionHtml: string;         // Rich content
  categoryId: string;
  brandId?: string;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  seo: SEOMetadata;
  status: 'draft' | 'active' | 'archived';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;                    // e.g., "Large / Blue"
  price: number;                   // In cents
  compareAtPrice?: number;         // Original price for sales
  costPrice?: number;              // For margin calculation
  inventory: number;
  weight?: number;
  dimensions?: Dimensions;
  options: Record<string, string>; // { size: 'Large', color: 'Blue' }
  image?: string;
  barcode?: string;
}

// Order
interface Order {
  id: string;
  orderNumber: string;             // Human-readable
  customerId?: string;             // Null for guest checkout
  email: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  shippingAddress: Address;
  billingAddress: Address;
  paymentIntent?: string;          // Stripe reference
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

// Cart (Session-based)
interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount?: Discount;
  expiresAt: Date;
  customerId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Search & Filtering

```typescript
// Algolia/Meilisearch index structure
interface ProductSearchRecord {
  objectID: string;                // Product ID
  name: string;
  description: string;
  category: string;
  categories: string[];            // Hierarchy for faceting
  brand: string;
  tags: string[];
  price: number;
  compareAtPrice?: number;
  onSale: boolean;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  image: string;
  createdAt: number;               // Timestamp for sorting
}

// Faceted search configuration
const searchFacets = [
  'categories',
  'brand',
  'price',
  'tags',
  'onSale',
  'inStock',
  'rating'
];
```

## UI/UX Requirements

### Conversion-Focused Design

| Aspect | Requirement | Reason |
|--------|-------------|--------|
| Mobile First | 70%+ mobile traffic | Primary shopping device |
| Fast LCP | < 2.0s | Conversion correlation |
| Image Quality | High-res, zoom | Purchase confidence |
| Trust Badges | Above fold | Reduce anxiety |
| Social Proof | Reviews visible | Increase trust |

### Standard Pages

```
/ (Home)
├── /products                      # Product listing (PLP)
│   ├── /products/[category]       # Category listing
│   └── /products/search           # Search results
├── /product/[slug]                # Product detail (PDP)
├── /cart                          # Shopping cart
├── /checkout                      # Checkout flow
│   ├── /checkout/information      # Contact/shipping
│   ├── /checkout/shipping         # Shipping method
│   └── /checkout/payment          # Payment
├── /order/[id]                    # Order confirmation
├── /account                       # Customer account
│   ├── /account/orders            # Order history
│   ├── /account/addresses         # Saved addresses
│   └── /account/settings          # Preferences
└── /pages/[slug]                  # CMS pages (about, contact, etc.)
```

### Product Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Breadcrumb: Home > Category > Product]                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────┐  ┌────────────────────────────────────┐│
│  │                        │  │  Brand Name                         ││
│  │    Product Gallery     │  │  Product Title                      ││
│  │                        │  │  ⭐⭐⭐⭐⭐ (42 reviews)             ││
│  │    [Main Image]        │  │                                     ││
│  │                        │  │  $99.00  $129.00                    ││
│  │    [Thumbnails]        │  │  ───────────────────────────────── ││
│  │                        │  │  Size: [S] [M] [L] [XL]             ││
│  └────────────────────────┘  │  Color: [●] [●] [●]                 ││
│                              │  ───────────────────────────────── ││
│                              │  [Qty: 1]  [Add to Cart]            ││
│                              │                                     ││
│                              │  ✓ Free shipping over $50           ││
│                              │  ✓ 30-day returns                   ││
│                              │  ✓ Secure checkout                  ││
│                              └────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  [Description] [Details] [Reviews] [Shipping]                   ││
│  │  ─────────────────────────────────────────────────────────────  ││
│  │  Product description content...                                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  You May Also Like                                               ││
│  │  [Product] [Product] [Product] [Product]                        ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Color System

```typescript
const colors = {
  // Brand (customize per store)
  primary: 'emerald-600',
  primaryHover: 'emerald-700',
  
  // Commerce-specific
  sale: 'red-600',
  new: 'blue-600',
  soldOut: 'gray-400',
  
  // Trust/CTA
  cta: 'emerald-600',            // Buy buttons
  ctaHover: 'emerald-700',
  
  // Feedback
  success: 'green-600',
  error: 'red-600',
  warning: 'amber-600',
  
  // Rating
  star: 'yellow-400',
  starEmpty: 'gray-300'
};
```

## SEO Requirements

### Meta & Structured Data

```typescript
// Product page SEO
interface ProductSEO {
  title: string;                   // "{Product} - {Store}"
  description: string;             // 150-160 chars
  canonical: string;
  openGraph: {
    type: 'product';
    images: string[];
    price: { amount: string; currency: string };
    availability: 'in stock' | 'out of stock';
  };
  jsonLd: ProductJsonLd;           // Schema.org Product
}

// Structured data
const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.images.map(i => i.url),
  sku: variant.sku,
  offers: {
    '@type': 'Offer',
    price: variant.price / 100,
    priceCurrency: 'USD',
    availability: variant.inventory > 0 
      ? 'https://schema.org/InStock' 
      : 'https://schema.org/OutOfStock',
    seller: { '@type': 'Organization', name: 'Store Name' }
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: product.rating,
    reviewCount: product.reviewCount
  }
};
```

### URL Structure

```
/products                          # All products
/products?category=shoes           # Filtered listing
/products?category=shoes&size=10   # Multiple filters
/product/nike-air-max-90           # Product page (slug-based)
```

## Checkout Flow

### Cart Management

```typescript
// Server-side cart (Redis)
class CartService {
  private redis: Redis;
  private TTL = 7 * 24 * 60 * 60;  // 7 days
  
  async addItem(cartId: string, item: CartItem) {
    const cart = await this.getCart(cartId);
    
    // Check inventory
    const variant = await db.productVariants.findUnique({ where: { id: item.variantId } });
    if (variant.inventory < item.quantity) {
      throw new InsufficientInventoryError();
    }
    
    // Add or update item
    const existing = cart.items.find(i => i.variantId === item.variantId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.items.push(item);
    }
    
    await this.saveCart(cart);
    return cart;
  }
  
  async checkout(cartId: string, checkoutData: CheckoutData) {
    const cart = await this.getCart(cartId);
    
    // Lock inventory
    await this.lockInventory(cart.items);
    
    try {
      // Process payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: cart.total,
        currency: 'usd',
        metadata: { cartId }
      });
      
      // Create order
      const order = await db.orders.create({
        data: this.cartToOrder(cart, checkoutData, paymentIntent.id)
      });
      
      // Clear cart
      await this.deleteCart(cartId);
      
      return { order, paymentIntent };
    } catch (error) {
      await this.unlockInventory(cart.items);
      throw error;
    }
  }
}
```

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Lighthouse Performance | ≥ 90 | Mobile |
| LCP | < 2.0s | Product images critical |
| CLS | < 0.1 | Image dimensions required |
| FID | < 100ms | Interactions must be fast |
| Add to Cart | < 500ms | Key conversion moment |
| Checkout Load | < 2s | Abandon risk |

## Analytics Events

```typescript
// Standard e-commerce events
const ecommerceEvents = {
  // Discovery
  view_item_list: { items: Product[], list_name: string },
  view_item: { item: Product },
  select_item: { item: Product },
  
  // Cart
  add_to_cart: { item: Product, quantity: number },
  remove_from_cart: { item: Product, quantity: number },
  view_cart: { items: CartItem[], value: number },
  
  // Checkout
  begin_checkout: { items: CartItem[], value: number },
  add_shipping_info: { shipping_tier: string },
  add_payment_info: { payment_type: string },
  
  // Purchase
  purchase: { transaction_id: string, value: number, items: OrderItem[] }
};
```

## Quality Checklist

### Before Launch

- [ ] Product pages have all required SEO meta
- [ ] Structured data validates (Google Rich Results Test)
- [ ] Images optimized with next/image
- [ ] Cart persists across sessions
- [ ] Checkout flow handles errors gracefully
- [ ] Payment webhooks configured
- [ ] Order confirmation emails sending
- [ ] Inventory updates on purchase
- [ ] Mobile checkout tested thoroughly

### Performance

- [ ] LCP < 2.0s on mobile
- [ ] Images have width/height
- [ ] Lazy loading on below-fold content
- [ ] Font display swap configured
- [ ] Critical CSS inlined

### Security

- [ ] PCI compliance (via Stripe)
- [ ] No card data stored
- [ ] HTTPS enforced
- [ ] Fraud detection enabled
- [ ] Rate limiting on checkout

---

> **Note**: This template prioritizes conversion and SEO. All features should be evaluated against their impact on sales and search visibility.
