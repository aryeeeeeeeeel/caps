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
  user_email: string; 
  is_automated?: boolean;
}

// Generate mock notifications for fallback
export const generateMockNotifications = (): Notification[] => {
  return [
    {
      id: '1',
      title: 'System Initialization Complete',
      message: 'Your system has been successfully initialized and is ready for use.',
      type: 'success',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      user_email: 'ldrrmo@manolofortich.gov.ph'
    },
    {
      id: '2',
      title: 'New Data Available',
      message: 'Recent updates have been processed and new data is available for analysis.',
      type: 'info',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      user_email: 'ldrrmo@manolofortich.gov.ph'
    },
    {
      id: '3',
      title: 'Scheduled Maintenance',
      message: 'System maintenance is scheduled for tonight between 2:00 AM - 3:00 AM.',
      type: 'update',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      user_email: 'ldrrmo@manolofortich.gov.ph'
    },
    {
      id: '4',
      title: 'Security Alert',
      message: 'Unusual login attempt detected. Please review your account security.',
      type: 'warning',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      user_email: 'ldrrmo@manolofortich.gov.ph'
    },
    {
      id: '5',
      title: 'Data Sync Error',
      message: 'There was an error syncing your recent data changes. Please try again.',
      type: 'error',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      user_email: 'ldrrmo@manolofortich.gov.ph'
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