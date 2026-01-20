# Bale E-Commerce Shop

A modern, fully-functional e-commerce website built with Next.js 14, TypeScript, and Tailwind CSS for selling the Bale physical trading card game. Features PhonePe payment gateway integration and shopping cart functionality.

## Features

- 🛒 **Complete Shopping Flow**: Product browsing, cart management, checkout
- 💳 **PhonePe Payment Integration**: Secure payment processing with UPI, cards, wallets
- 📱 **Responsive Design**: Mobile-first design that works on all devices
- 🎨 **Modern UI**: Clean, professional design with Tailwind CSS
- ⚡ **Fast Performance**: Built on Next.js 14 with App Router
- 🔒 **Form Validation**: Zod-powered validation for all forms
- 💾 **Persistent Cart**: Cart state saved in localStorage via Zustand

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (with persistence)
- **Form Validation**: React Hook Form + Zod
- **Payment Gateway**: PhonePe
- **Email Service**: Resend (configured, ready to use)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PhonePe merchant account (for payment processing)
- Resend API key (for email notifications)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CHIBOLAR/BaleEcom.git
cd BaleEcom
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# PhonePe Payment Gateway
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1
PHONEPE_BASE_URL=https://api-preprod.phonepe.com/apis/pg-sandbox

# For production, use:
# PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

## Project Structure

```
bale-out-shop/
├── app/
│   ├── about/              # About page
│   ├── api/
│   │   └── payment/        # PhonePe payment API routes
│   │       ├── route.ts    # Payment initiation
│   │       └── callback/   # Payment callback handler
│   ├── cart/               # Shopping cart page
│   ├── checkout/           # Checkout page
│   ├── contact/            # Contact page
│   ├── product/            # Product detail page
│   ├── success/            # Order confirmation page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles
├── components/
│   ├── CartButton.tsx      # Cart icon with item count
│   ├── Footer.tsx          # Site footer
│   ├── Header.tsx          # Site header/navigation
│   └── ProductCard.tsx     # Product display card
├── lib/
│   ├── product.ts          # Product data and types
│   ├── shipping.ts         # Shipping calculations
│   └── store.ts            # Zustand cart store
└── public/
    └── products/           # Product images (add your photos here)
```

## Configuration

### Product Configuration

Edit `lib/product.ts` to update:
- Product name, price, description
- Stock quantity
- Product details (players, playtime, age)
- Components list

### Shipping Configuration

Edit `lib/shipping.ts` to update:
- Shipping rate: `SHIPPING_RATE` (default: ₹50)
- Free shipping threshold: `FREE_SHIPPING_THRESHOLD` (default: ₹1000)

### Styling

- Theme colors: `tailwind.config.ts`
- Global styles: `app/globals.css`
- Custom components: `.btn-primary`, `.btn-secondary`, `.card`

## Adding Product Images

Place your product images in the `public/products/` directory:
- `box-front.jpg` - Front of the game box
- `box-back.jpg` - Back of the game box
- `cards-spread.jpg` - Cards laid out
- `gameplay.jpg` - People playing the game

Images should be high-quality (recommended: 1200x1200px minimum).

## Deployment to Vercel

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `CHIBOLAR/BaleEcom`
4. Vercel will auto-detect Next.js settings

### Step 2: Configure Environment Variables

In Vercel project settings, add these environment variables:

```
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1
PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_SITE_URL=https://playablegames.in
```

**Important**: For production, update `PHONEPE_BASE_URL` to the live API and unlock production credentials in your PhonePe dashboard.

### Step 3: Deploy

Click "Deploy" - Vercel will build and deploy your site in ~2 minutes.

### Step 4: Add Custom Domain

1. In Vercel project → Settings → Domains
2. Add domain: `playablegames.in`
3. Update DNS records at your domain provider:
   - Type: `A`
   - Name: `shop`
   - Value: `76.76.21.21`
   - OR Type: `CNAME`
   - Name: `shop`
   - Value: `cname.vercel-dns.com`

## PhonePe Payment Flow

1. User fills checkout form
2. `/api/payment` creates PhonePe payment request
3. User redirected to PhonePe payment page
4. User completes payment via UPI/card/wallet
5. PhonePe redirects to `/api/payment/callback`
6. Callback verifies payment signature
7. User redirected to `/success` page
8. Order email sent (implement in callback route)

### Testing PhonePe Integration

Use PhonePe's sandbox mode for testing:
- Test cards, UPI IDs available in PhonePe documentation
- Switch to production URL when ready to go live

## Next Steps

### Before Launch:

- [ ] Add actual product photos to `public/products/`
- [ ] Update product price if different from ₹499
- [ ] Test full checkout flow in PhonePe sandbox
- [ ] Set up Resend email templates
- [ ] Create privacy policy and terms pages
- [ ] Switch PhonePe to production mode
- [ ] Test on mobile devices

### Optional Enhancements:

- [ ] Add database for order management (Vercel Postgres)
- [ ] Implement email API route for confirmations
- [ ] Add order tracking page
- [ ] Create admin panel for order management
- [ ] Add more products/variants
- [ ] Implement inventory management
- [ ] Add customer reviews/testimonials
- [ ] SEO optimization (meta tags, sitemap)
- [ ] Analytics integration (Google Analytics)
- [ ] Add social media sharing

## Support

For questions or issues:
- Email: support@playablegames.in
- Repository: [https://github.com/CHIBOLAR/BaleEcom](https://github.com/CHIBOLAR/BaleEcom)

## License

All rights reserved. Bale is a trademark of [Your Company Name].

---

**Built with ❤️ for the Bale community**
