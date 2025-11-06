# iAMUMA ta - Incident Reporting System

A comprehensive incident reporting and management system built with Ionic React and Supabase.

> **Latest Update**: GiveFeedback: move feedback filter under title and right-align report selection radios.

## Features

- 🚨 **Incident Reporting**: Report incidents with photos, location, and detailed descriptions
- 📍 **Interactive Map**: View incidents on an interactive map with real-time updates
- 👥 **User Management**: Separate interfaces for users and administrators
- 📊 **Analytics Dashboard**: Comprehensive analytics and reporting for administrators
- 🔔 **Real-time Notifications**: Instant notifications for incident updates
- 📱 **Mobile-First Design**: Optimized for mobile devices with PWA capabilities

## Tech Stack

- **Frontend**: Ionic React, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Maps**: Leaflet.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/aryeeeeeeeeel/caps.git
cd it35-lab2
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`

5. Run the development server
```bash
npm run dev
```

## Deployment

This project is configured for deployment on Vercel.

### Environment Variables

Set these in your Vercel dashboard:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Build Command

```bash
npm run build
```

### Output Directory

```
dist
```

## Project Structure

```
src/
├── pages/
│   ├── user-tabs/          # User interface pages
│   ├── admin-tabs/         # Admin interface pages
│   └── supabase.sql        # Database schema
├── utils/                  # Utility functions
└── theme/                  # Styling and themes
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
