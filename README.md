# PriceWatch - Premium Amazon Price Tracker

PriceWatch is a sophisticated, skeuomorphic Progressive Web App (PWA) designed to provide users with a tactile and professional interface for tracking Amazon product prices. Built with a focus on visual excellence and mobile-native feel, PriceWatch offers real-time scraping, historical data visualization, and instant alerts via Email and SMS.

[aureliabutton]

## 🌟 Key Features

- **Skeuomorphic UI/UX**: A highly polished, tactile design language that mimics physical control panels for a premium user experience.
- **Advanced Price Tracking**: Monitor Amazon.com products for "Amazon sold", "3rd Party New", and "Used" price conditions.
- **Historical Data Visualization**: Interactive, physical-style charts powered by Recharts showing price trends over 1, 3, 6 months, or 1 year.
- **Smart Alerts**: Receive instant notifications via Email and SMS (with OTP verification) when products hit your target price.
- **PWA Ready**: Install PriceWatch on your mobile home screen for a native app experience with offline capabilities.
- **Affiliate Integration**: Built-in system for administrators to manage global affiliate tags, automatically appended to all outbound Amazon links.
- **Admin Portal**: Dedicated backend management for environment settings, user monitoring, and scraping schedules.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router 6
- **Charts**: Recharts
- **State Management**: Zustand & Immer
- **Backend**: Hono (Cloudflare Workers framework)
- **Persistence**: Cloudflare Durable Objects (via Core-Utils architecture)
- **Validation**: Zod & React Hook Form

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime installed.
- A Cloudflare account (for deployment).

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pricewatch
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   # Runs both the frontend and the Cloudflare Worker locally
   bun run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## 📖 Usage

### Adding a Price Watch
- Paste any valid Amazon.com product URL into the floating search bar on the homepage.
- The system will automatically scrape the product details and present the "New Price Alert" view.
- Set your desired price threshold and select your preferred notification methods (Email/SMS).

### Managing Alerts
- Access "Your Price Watches" from the navigation bar.
- Modify existing alerts to change price targets or notification settings.
- View detailed product metadata including UPC, SKU, and Last Scan time.

### Account Settings
- Verify your phone number via SMS OTP to enable text alerts.
- Toggle preferences for promotional emails and price alert types.

## 🏗️ Development

### Project Structure
- `src/`: Frontend React application.
- `worker/`: Hono API and Durable Object logic.
- `shared/`: Shared TypeScript types and mock data.
- `src/components/ui/`: Reusable Shadcn UI components.

### Backend Logic
The application uses a unique **Durable Object** pattern via `worker/core-utils.ts` that allows multiple entities (Users, Alerts, Settings) to share a high-performance stateful instance, ensuring data consistency and fast response times.

## 🌐 Deployment

Deploying PriceWatch to Cloudflare Workers is seamless. Ensure you have the Cloudflare CLI (`wrangler`) authenticated.

```bash
bun run deploy
```

[aureliabutton]

### Environment Configuration
Admin settings, including the Amazon Affiliate Tag and SMS gateway credentials, are managed through the secure Admin Portal or via `wrangler.jsonc` secrets.

## 📄 License

This project is built for mission-critical infrastructure at Aurelia. All rights reserved.