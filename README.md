# Sommer's Sealcoating Proposal System

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen)

A complete, enterprise-grade proposal and CRM system built specifically for sealcoating businesses. Features AI-powered content generation, advanced discounts, scheduling, and more.

## 🎯 Overview

This system surpasses competitors like Proposify, PandaDoc, and HoneyBook by offering:

- **Industry-Specific Features** - Weather integration, material calculators, sealcoating pricing
- **AI-Powered** - Smart pricing, content generation, win prediction
- **Enterprise-Ready** - Multi-tenant, RBAC, API, GDPR compliance
- **Field-Optimized** - Works offline, mobile-first, crew scheduling

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Lines of Code** | 32,000+ |
| **Database Tables** | 85+ |
| **API Endpoints** | 80+ |
| **Source Files** | 60+ |
| **Monthly Cost** | ~$55 |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account
- Stripe account

### Installation

```bash
# Clone the repository
git clone https://github.com/kailf-hue/sommers-proposal-system.git
cd sommers-proposal-system

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Setup

Edit `.env.local` with your credentials:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

### Database Setup

```bash
# Push schema to Supabase
npm run db:push

# Generate TypeScript types
npm run db:generate
```

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite + TypeScript |
| **Styling** | Tailwind CSS + Radix UI |
| **State** | Zustand + React Query |
| **Auth** | Clerk (multi-tenant) |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Cloudflare R2 |
| **Hosting** | Cloudflare Pages |
| **Payments** | Stripe |
| **Email** | Resend |
| **SMS** | Twilio |
| **AI** | HuggingFace + Claude API |

### Project Structure

```
sommers-proposal-system/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # Base UI components
│   │   ├── layout/          # Layout components
│   │   ├── proposal/        # Proposal wizard
│   │   ├── discounts/       # Discount system
│   │   ├── pipeline/        # CRM pipeline
│   │   ├── scheduling/      # Job scheduling
│   │   └── ...
│   ├── pages/               # Page components
│   ├── lib/                 # Core libraries
│   │   ├── supabase.ts      # Database client
│   │   ├── utils.ts         # Utilities
│   │   ├── discounts/       # Discount system
│   │   ├── weather/         # Weather integration
│   │   └── ...
│   ├── stores/              # Zustand stores
│   ├── hooks/               # Custom hooks
│   ├── contexts/            # React contexts
│   └── styles/              # Global styles
├── supabase/
│   ├── schema.sql           # Database schema
│   ├── migrations/          # DB migrations
│   └── seed/                # Seed data
├── workers/                 # Cloudflare Workers
└── public/                  # Static assets
```

## ✨ Features

### All 28 Phases Complete

#### Core System (Phases 1-12)
- ✅ Multi-step proposal wizard
- ✅ 3-tier pricing (Economy/Standard/Premium)
- ✅ Cloudflare R2 image uploads
- ✅ AI assistant & content generation
- ✅ Analytics dashboard
- ✅ Multi-tier RBAC (5 roles)
- ✅ Content block library
- ✅ PWA & mobile optimization
- ✅ Custom branding
- ✅ Automated follow-ups
- ✅ Client portal
- ✅ UI polish

#### Advanced Features (Phases 13-20)
- ✅ Proposal templates & versioning
- ✅ Advanced PDF generation
- ✅ Electronic signatures
- ✅ CRM pipeline (Kanban)
- ✅ Scheduling & calendar
- ✅ 40+ integrations
- ✅ SMS & notifications
- ✅ Video proposals

#### Enterprise Features (Phases 21-28)
- ✅ Inventory management
- ✅ Advanced reporting
- ✅ Approval workflows
- ✅ Multi-language (i18n)
- ✅ White-label platform
- ✅ Public REST API
- ✅ Audit & GDPR compliance
- ✅ AI enhancements v2

### 5 Industry-Specific Enhancements
- ✅ Weather integration
- ✅ Material calculator
- ✅ Offline/PWA mode
- ✅ Before/after gallery
- ✅ Payment plans

### Advanced Discount System
- ✅ Promo codes with restrictions
- ✅ Automatic discount rules (9 types)
- ✅ Loyalty program (4 tiers)
- ✅ Volume discounts
- ✅ Seasonal campaigns
- ✅ Approval workflow
- ✅ Bulk code generator
- ✅ AI discount suggestions
- ✅ Customer discount history
- ✅ Analytics dashboard
- ✅ A/B testing
- ✅ Email templates
- ✅ PDF integration

## 💰 Pricing Formulas

Built-in industry-specific pricing:

| Service | Rate | Unit |
|---------|------|------|
| Sealcoating | $0.15-0.35 | sq ft |
| Crack Filling | $1.00-3.00 | LF |
| Line Striping | $4.00-7.00 | line |
| ADA Stalls | $25-40 | each |
| Pothole Repair | $2-12 | sq ft |

**Multipliers:**
- Surface Condition: Good 1.0x, Fair 1.15x, Poor 1.3x
- Tiers: Economy 0.85x, Standard 1.0x, Premium 1.35x

## 🔐 Authentication & Authorization

### Roles
| Role | Permissions |
|------|-------------|
| **Owner** | Full access, billing, delete org |
| **Admin** | Manage team, settings, all data |
| **Manager** | Approve discounts, view reports |
| **Sales** | Create/edit own proposals |
| **Viewer** | Read-only access |

## 📱 API

### REST Endpoints

```
GET    /api/v1/proposals
POST   /api/v1/proposals
GET    /api/v1/proposals/:id
PUT    /api/v1/proposals/:id
DELETE /api/v1/proposals/:id

GET    /api/v1/contacts
POST   /api/v1/contacts
...
```

### Authentication

```bash
curl -X GET "https://api.example.com/v1/proposals" \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

## 🚢 Deployment

### Cloudflare Pages

```bash
# Build
npm run build

# Deploy
npm run deploy
```

### Environment Variables

Set these in Cloudflare Pages dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### Custom Domain

1. Add domain in Cloudflare Pages
2. Configure DNS records
3. Enable SSL

## 🧪 Testing

```bash
# Run tests
npm run test

# With UI
npm run test:ui

# Coverage
npm run test:coverage
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/schema.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing](./CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🆘 Support

- Email: support@sommersealcoating.com
- Documentation: https://docs.sommersealcoating.com
- Issues: https://github.com/kailf-hue/sommers-proposal-system/issues

---

Built with ❤️ for Sommer's Sealcoating
