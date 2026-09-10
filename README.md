# InnoVeg AI-Based WhatsApp Field Reporting System

A centralized digital field management and intelligence system connecting 60+ Field Officers across agricultural territories via WhatsApp, integrated with AI photo inspection, GPS route tracking, automated 7:00 PM management reports, and a real-time executive dashboard.

## 🚀 Features

- **Zero-App WhatsApp Reporting Flow:** Field officers report visits (Farmer, Dealer, Distributor, Field Visit, Field Program) directly through standard WhatsApp with bilingual prompts (Hindi / English).
- **Employee Master Recognition:** Automatically maps incoming messages to 60 field officers by mobile number, tracking daily targets, territories, and designations.
- **Smart GPS & Travel Route Tracking:** Computes estimated travel KM (Haversine formula) and detects repeat visits vs unique locations (<150m proximity cluster analysis).
- **AI Photo & Visit Quality Inspection:** Automated computer vision analysis for image clarity/blur, crop canopy, farmer/dealer presence, and InnoVeg branding.
- **Daily 7:00 PM Automatic Management Report:** Aggregates team metrics into a formatted WhatsApp broadcast text and CSV export.
- **Executive Web Management Dashboard:**
  - Real-time KPI cards
  - Interactive Leaflet GPS map with route polyline traces
  - Real-time field visit stream
  - 60 Officers Leaderboard
  - Built-in WhatsApp Bot Simulator for browser testing

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide Icons
- **Mapping:** Leaflet & React-Leaflet
- **APIs & Automation:** Webhook handler compatible with Meta WhatsApp Cloud API and n8n

## 🏁 Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Open http://localhost:3000
```
