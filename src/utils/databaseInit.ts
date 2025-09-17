// src/utils/databaseInit.ts
import { supabase } from './supabaseClient';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'update';
  read: boolean;
  created_at: string;
  related_report_id?: string;
  action_url?: string;
}

// Generate mock notifications for fallback
export const generateMockNotifications = (): Notification[] => {
  return [
    {
      id: '1',
      title: 'Welcome to the Hazard Reporting System',
      message: 'Thank you for joining our community safety initiative. Start by exploring the map to see reported hazards in your area.',
      type: 'info',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    {
      id: '2',
      title: 'New Hazard Reported Nearby',
      message: 'A pothole has been reported on Main Street, 0.5 miles from your location. Please exercise caution when traveling in that area.',
      type: 'warning',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      action_url: '/hazard-map',
    },
    {
      id: '3',
      title: 'Your Report Has Been Verified',
      message: 'Your hazard report #HR-2024-001 has been verified by our team and is now visible to other users.',
      type: 'success',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      related_report_id: 'HR-2024-001',
    },
    {
      id: '4',
      title: 'System Maintenance Scheduled',
      message: 'The system will undergo maintenance on Sunday, 2:00 AM - 4:00 AM. Some features may be temporarily unavailable.',
      type: 'update',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    },
    {
      id: '5',
      title: 'Report Submission Failed',
      message: 'Your recent hazard report could not be submitted due to a network error. Please try again.',
      type: 'error',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    },
  ];
};

// Safe query wrapper with fallback
export const safeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackData: T
): Promise<T> => {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      console.warn('Database query failed, using fallback data:', error.message);
      return fallbackData;
    }
    
    return data || fallbackData;
  } catch (error) {
    console.warn('Database query exception, using fallback data:', error);
    return fallbackData;
  }
};

// Logger utility to replace console.log in production
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
};