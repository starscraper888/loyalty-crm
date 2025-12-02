# WhatsApp-first Loyalty CRM

A Next.js (App Router) based Loyalty CRM with Supabase backend.

## Features
- **Tenant Isolation**: RLS policies ensure data privacy.
- **Staff PIN**: Secure PIN verification for staff actions.
- **OTP Redemption**: Secure redemption flow.
- **Rate Limiting**: Middleware-based rate limiting.
- **Immutable Audit Logs**: Database triggers prevent tampering.
- **i18n**: Support for English, Malay, and Chinese.
- **k-anonymity Analytics**: Privacy-preserving data logging.
- **Cost Calculator**: Estimate WhatsApp costs per country/category.
- **Bulk Import**: Import members via CSV with validation.
- **Security**: Anomaly detection and audit logging.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `env.example` to `.env.local` and fill in your Supabase credentials.
   ```bash
   cp env.example .env.local
   ```
   See [WhatsApp Setup Guide](docs/whatsapp-setup.md) for details on obtaining tokens.

3. **Database Setup**
   - Go to your Supabase project SQL Editor.
   - Copy the contents of `supabase/migrations/20240522000000_init.sql`.
   - Run the SQL to create tables and policies.

4. **Run Locally**
   ```bash
   npm run dev
   ```

## Architecture
- `app/[lang]`: Localized pages.
- `lib/supabase`: Supabase client setup.
- `lib/auth`: Auth helpers (OTP, PIN).
- `middleware.ts`: Rate limiting and i18n routing.
