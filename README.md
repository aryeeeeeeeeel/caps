# iAMUMA ta - Geo-Intelligent Incident Reporting System

A comprehensive geo-intelligent incident reporting and management system built with Ionic React and Supabase for the Local Disaster Risk Reduction and Management Office (LDRRMO) of Manolo Fortich, Bukidnon.

> **Latest Update**: Added device fingerprinting for trusted device authentication, user appeals system, enhanced photo metadata extraction, and comprehensive account status management.

## 🎯 Overview

iAMUMA ta is a cross-platform progressive web application that enables community members to report public safety incidents (road damage, fallen trees, utility issues, etc.) by submitting photographs with embedded GPS data. The system utilizes Geographic Information System (GIS) technology and Global Positioning System (GPS) data, including metadata from images (EXIF data), to automatically map and monitor incident locations.

## ✨ Key Features

### 🚨 Incident Reporting
- **Photo-Based Reporting**: Capture or upload photos with automatic GPS coordinate extraction
- **EXIF Data Extraction**: Automatically extracts GPS coordinates, date/time, and detects barangay location from photo metadata
- **Smart Location Detection**: Automatic barangay detection based on GPS coordinates using polygon mapping
- **Multiple Categories**: Road incidents, utility issues, natural disasters, infrastructure problems, public safety, environmental issues
- **Priority Levels**: Low, Medium, High, Critical priority classification
- **Duplicate Detection**: Prevents submission of duplicate incident reports

### 📍 Interactive Mapping & Navigation
- **Real-time Map View**: Interactive Leaflet.js map showing all incident reports
- **Route Calculation**: Automatic route calculation for incident response using OSRM
- **ETA Estimation**: Calculated estimated time of arrival for response teams
- **Marker Clustering**: Efficient display of multiple incidents on map
- **Location Services**: GPS coordinate capture with device location services

### 👥 User Management & Security
- **Account Status System**: Active, Inactive, Suspended, and Banned account statuses
- **Warning System**: 1-hour restriction after receiving a warning
- **Suspension System**: 1-week suspension with automatic reactivation
- **Device Fingerprinting**: Trusted device authentication - skip OTP on trusted devices
- **Two-Factor Authentication**: OTP-based verification for new devices
- **Activity Logging**: Comprehensive activity tracking for all user actions

### 📝 Appeals & Feedback
- **User Appeals**: Appeal system for banned, suspended, or warned accounts
- **Appeal Types**: Radio button selection for account ban, suspension, or warning appeals
- **Automated Messages**: Default appeal messages with user information
- **Feedback System**: Rate response time, communication, and resolution satisfaction
- **Feedback Analytics**: Track and analyze user feedback for service improvement

### 🔔 Notifications & Communication
- **Real-time Notifications**: Instant notifications for incident status updates
- **Admin Notifications**: Comprehensive notification system for admins (reports, feedback, appeals)
- **Automated Alerts**: Status change notifications, ETA reminders, resolution confirmations
- **Notification Badges**: Unread notification count display
- **Multi-channel Updates**: Notifications from multiple sources (incident reports, feedback, appeals)

### 🛡️ Admin Features
- **Admin Dashboard**: Comprehensive dashboard with real-time incident monitoring
- **User Management**: View, suspend, warn, or ban user accounts
- **Incident Management**: Update incident status, add admin responses, mark as resolved
- **Route Planning**: Calculate and display optimal routes to incident locations
- **Analytics Dashboard**: Statistics, charts, and insights on incidents and user activity
- **System Logs**: Detailed logging of all admin activities
- **Trusted Device Management**: Device fingerprinting for admin logins

### 📊 Analytics & Reporting
- **Incident Analytics**: Track incidents by category, priority, status, and barangay
- **User Statistics**: Active users, report submissions, account status distribution
- **Response Metrics**: Average response time, resolution rates, ETA accuracy
- **Feedback Analysis**: Overall ratings, satisfaction scores, recommendation rates
- **Time-based Reports**: Daily, weekly, monthly incident trends

### 🔐 Security & Privacy
- **Role-Based Access Control**: Separate user and admin interfaces
- **Device Trust Management**: Trusted device recognition for faster authentication
- **Session Management**: Secure session handling with automatic expiration
- **Data Privacy**: User data protection with proper access controls
- **Activity Auditing**: Complete audit trail of all system activities

## 🛠️ Tech Stack

### Frontend
- **Framework**: Ionic React with TypeScript
- **Build Tool**: Vite
- **UI Components**: Ionic Components
- **Maps**: Leaflet.js with OpenStreetMap
- **Routing**: React Router with Ionic Router
- **State Management**: React Hooks (useState, useEffect, useRef, useMemo, useCallback)

### Backend & Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OTP
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for images
- **Routing API**: OpenStreetMap Routing Machine (OSRM)
- **Image Processing**: ExifReader for metadata extraction

### Deployment
- **Platform**: Vercel
- **CI/CD**: Automated builds and deployments
- **Environment**: Production-ready configuration

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## 🚀 Getting Started

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/aryeeeeeeeeel/caps.git
cd caps
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env.local
```

4. **Configure Supabase credentials in `.env.local`**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Set up database schema**
   - Run the SQL queries from `src/pages/supabase.sql` in your Supabase SQL editor
   - Ensure all tables, constraints, and policies are created

6. **Run the development server**
```bash
npm run dev
```

## 🗄️ Database Setup

The system uses the following main tables:

- **users**: User profiles, account status, warnings, suspensions, appeals
- **incident_reports**: Incident reports with GPS coordinates, images, status
- **feedback**: User feedback on incident responses
- **notifications**: User and admin notifications
- **activity_logs**: User activity tracking
- **system_logs**: Admin system activity logs
- **device_fingerprints**: Trusted device management
- **incident_response_routes**: Calculated routes for incident response

See `ERD.md` or `ERD_TEXT.txt` for the complete Entity Relationship Diagram.

## 🚢 Deployment

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

## 📁 Project Structure

```
caps/
├── src/
│   ├── pages/
│   │   ├── user-tabs/          # User interface pages
│   │   │   ├── Dashboard.tsx   # User dashboard
│   │   │   ├── Login.tsx        # User login with device fingerprinting
│   │   │   ├── Register.tsx    # User registration
│   │   │   ├── Profile.tsx      # User profile management
│   │   │   ├── IncidentReport.tsx  # Incident submission
│   │   │   ├── History.tsx      # Report history
│   │   │   └── ...
│   │   ├── admin-tabs/         # Admin interface pages
│   │   │   ├── AdminLogin.tsx   # Admin login with device fingerprinting
│   │   │   ├── AdminDashboard.tsx  # Admin dashboard with map
│   │   │   ├── AdminNotifications.tsx  # Admin notifications
│   │   │   ├── AdminUsers.tsx   # User management
│   │   │   ├── AdminIncidents.tsx  # Incident management
│   │   │   └── ...
│   │   └── supabase.sql        # Database schema
│   ├── utils/                  # Utility functions
│   │   ├── supabaseClient.ts   # Supabase client configuration
│   │   └── activityLogger.ts   # Activity logging utilities
│   └── theme/                  # Styling and themes
├── migrations/                 # Database migration files
├── ERD.md                      # Entity Relationship Diagram (Mermaid)
├── ERD_TEXT.txt                # Entity Relationship Diagram (Text)
└── README.md                   # This file
```

## 🔑 Key Functionalities

### Device Fingerprinting
- **Trusted Devices**: Devices authenticated with OTP are saved as trusted
- **Skip OTP**: Trusted devices can log in without OTP verification
- **Device Management**: Track and manage trusted devices per user
- **Security**: Device fingerprints use SHA-256 hashing for security

### Account Status Management
- **Warning**: 1-hour restriction from submitting reports
- **Suspension**: 1-week suspension with automatic reactivation
- **Ban**: Permanent ban with appeal option
- **Auto-activation**: Suspended accounts automatically reactivate after 1 week

### Photo Metadata Extraction
- **GPS Coordinates**: Automatic extraction from EXIF data
- **Barangay Detection**: Automatic barangay detection from GPS coordinates
- **Date/Time**: Photo capture timestamp extraction
- **Device Location**: Fallback to device GPS if EXIF data unavailable

### Route Calculation
- **OSRM Integration**: Uses OpenStreetMap Routing Machine for route calculation
- **Distance Calculation**: Calculates route distance in kilometers
- **ETA Calculation**: Estimates time of arrival based on route
- **Route Visualization**: Displays route on map with polyline

## 📱 Mobile & PWA Support

- **Progressive Web App**: Installable on mobile devices
- **Offline Capabilities**: Basic offline support
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Native Features**: Camera, GPS, and device permissions

## 🔒 Security Features

- **Two-Factor Authentication**: OTP verification for new devices
- **Device Trust Management**: Secure device recognition
- **Role-Based Access**: Separate user and admin access levels
- **Session Management**: Secure session handling
- **Data Encryption**: Secure data transmission and storage

## 📝 Terms and Conditions

The system includes comprehensive Terms and Conditions covering:
- Account status and disciplinary actions
- Appeal process for account restrictions
- Device permissions (camera and location)
- Photo information extraction
- Feedback and activity logging
- User responsibilities and prohibited activities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Development Team

Developed by researchers from **Northern Bukidnon State College** for the **Local Disaster Risk Reduction and Management Office (LDRRMO) of Manolo Fortich**.

## 📞 Support

For questions or support, please contact:
- Project researchers through the College of Computer Studies, Northern Bukidnon State College
- LDRRMO Manolo Fortich

---

**Version**: 2.0  
**Last Updated**: 2024
