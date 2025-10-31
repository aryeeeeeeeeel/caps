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
    flowType: 'pkce'
  }
});

// Add periodic session refresh with proper cleanup
// Check session every 60 seconds (less frequent to avoid issues)
const refreshInterval = setInterval(async () => {
  try {
    // Only refresh if user is on a protected page
    const currentPath = window.location.pathname;
    const isProtectedPage = currentPath.includes('/app');
    
    if (!isProtectedPage) {
      return;
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.debug('Session check failed:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.debug('No active session');
      return;
    }
    
    // Check if session is about to expire (within 5 minutes)
    const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now();
    const timeUntilExpiry = expiresAt - Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;
    
    if (timeUntilExpiry < fiveMinutesInMs) {
      console.debug('Session expiring soon, refreshing...');
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        // Only log, don't sign out - let the natural flow handle it
        console.debug('Session refresh failed:', refreshError.message);
      } else {
        console.debug('Session refreshed successfully');
      }
    }
  } catch (error) {
    console.debug('Session refresh error:', error);
  }
}, 60000); // Check every 60 seconds instead of 30

// Clean up interval when needed
window.addEventListener('beforeunload', () => {
  clearInterval(refreshInterval);
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

// Handle authentication errors consistently
export const handleAuthError = (error: any): boolean => {
    console.debug('Auth error details:', {
      message: error?.message,
      status: error?.status,
      timestamp: new Date().toISOString()
    });
    
    // Only auto-logout for serious auth errors
    const seriousErrors = [
      'refresh_token',
      'Invalid refresh token',
      'Invalid authentication'
    ];
    
    const isSeriousError = error?.message && seriousErrors.some(err => 
      error.message.includes(err)
    );
    
    if (isSeriousError || error?.status === 401) {
      console.warn('Serious authentication error detected, clearing session:', error?.message || 'unknown');
      supabase.auth.signOut();
      clearAuthData();
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Only redirect if not already on login page
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          setTimeout(() => {
            window.location.href = '/iAMUMAta/user-login';
          }, 100);
        }
      }
      
      return true; // Indicates session was cleared
    }
    
    // For other auth errors (like missing session), just return without logout
    return false;
  };

// Safe authentication check with error handling
export const safeAuthCheck = async () => {
  try {
    // Some browsers delay session hydration; try twice briefly before failing
    let { data: { user }, error } = await supabase.auth.getUser();
    if ((!user || (error && error.message?.includes('Auth session missing'))) ) {
      await new Promise(res => setTimeout(res, 250));
      const retry = await supabase.auth.getUser();
      user = retry.data.user;
      error = retry.error as any;
    }
    
    if (error) {
      // Check if it's a serious error that should trigger logout
      const seriousErrors = ['refresh_token', 'Invalid refresh token', 'Invalid authentication'];
      const isSeriousError = error.message && seriousErrors.some(err => 
        error.message.includes(err)
      );
      
      // Only handle serious errors with auto-logout
      if (isSeriousError || error.status === 401) {
        const wasCleared = handleAuthError(error);
        if (wasCleared) {
          return { user: null, error: 'Session expired' };
        }
      }
      
      // For other errors (like missing session), return without logging out
      return { user: null, error: error.message || 'Authentication error' };
    }
    
    return { user, error: null };
  } catch (error: any) {
    console.debug('Auth check failed:', error?.message);
    return { user: null, error: error?.message || 'Authentication check failed' };
  }
};