// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Simple encryption/decryption functions (basic obfuscation)
const encrypt = (text: string): string => {
  return btoa(unescape(encodeURIComponent(text)));
};

const decrypt = (encryptedText: string): string => {
  try {
    return decodeURIComponent(escape(atob(encryptedText)));
  } catch {
    return '';
  }
};

// Custom storage with remember me functionality
const createCustomStorage = () => {
  return {
    getItem: (key: string) => {
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      
      if (rememberMe) {
        return localStorage.getItem(key);
      } else {
        return sessionStorage.getItem(key);
      }
    },
    
    setItem: (key: string, value: string) => {
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      
      if (rememberMe) {
        localStorage.setItem(key, value);
        // Backup in sessionStorage for smooth transitions
        sessionStorage.setItem(key, value);
      } else {
        sessionStorage.setItem(key, value);
        // Remove from localStorage when not remembering
        localStorage.removeItem(key);
      }
    },
    
    removeItem: (key: string) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: createCustomStorage(),
    flowType: 'pkce',
  },
});

// Save user credentials securely
export const saveUserCredentials = (identifier: string, password: string, remember: boolean) => {
  if (remember) {
    const encryptedPassword = encrypt(password);
    localStorage.setItem('savedIdentifier', identifier);
    localStorage.setItem('savedPassword', encryptedPassword);
    localStorage.setItem('rememberMe', 'true');
    
    // Also save in sessionStorage for immediate access
    sessionStorage.setItem('savedIdentifier', identifier);
    sessionStorage.setItem('savedPassword', encryptedPassword);
  } else {
    clearUserCredentials();
    localStorage.setItem('rememberMe', 'false');
  }
};

// Get saved user credentials
export const getSavedCredentials = (): { identifier: string; password: string } | null => {
  try {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    
    const identifier = storage.getItem('savedIdentifier');
    const encryptedPassword = storage.getItem('savedPassword');
    
    if (identifier && encryptedPassword) {
      const password = decrypt(encryptedPassword);
      return { identifier, password };
    }
    return null;
  } catch (error) {
    console.warn('Error retrieving saved credentials:', error);
    return null;
  }
};

// Check if remember me is enabled
export const isRememberMeEnabled = (): boolean => {
  return localStorage.getItem('rememberMe') === 'true';
};

// Check if saved credentials exist
export const hasSavedCredentials = (): boolean => {
  return getSavedCredentials() !== null;
};

// Clear saved credentials
export const clearUserCredentials = () => {
  localStorage.removeItem('savedIdentifier');
  localStorage.removeItem('savedPassword');
  localStorage.removeItem('rememberMe');
  sessionStorage.removeItem('savedIdentifier');
  sessionStorage.removeItem('savedPassword');
};

// Clear all auth data
export const clearAuthData = () => {
  clearUserCredentials();
  localStorage.removeItem('supabase.auth.token');
  sessionStorage.removeItem('supabase.auth.token');
};