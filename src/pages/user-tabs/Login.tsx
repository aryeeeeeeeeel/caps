// src/pages/Login.tsx - FIXED SKELETON LOADING & OTP MODAL
import {
  IonButton,
  IonContent,
  IonPage,
  IonInput,
  useIonRouter,
  IonToast,
  IonIcon,
  IonCard,
  IonCardContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonModal,
  IonCheckbox,
  IonLabel,
  IonText,
  IonPopover,
  IonBadge,
  IonSpinner,
  IonSkeletonText,
  IonRadio,
  IonRadioGroup,
  IonTextarea,
  IonButtons,
  IonList,
  IonItem,
} from '@ionic/react';
import {
  personCircleOutline,
  mailOutline,
  lockClosedOutline,
  logInOutline,
  arrowBackOutline,
  peopleOutline,
  eyeOffOutline,
  eyeOutline,
  timeOutline,
  trashOutline,
  addOutline,
  shieldOutline,
  refreshOutline,
  checkmarkCircleOutline,
  closeOutline
} from 'ionicons/icons';
import { useState, useRef, useEffect } from 'react';
import {
  supabase,
  isRememberMeEnabled
} from '../../utils/supabaseClient';
import { logUserLogin } from '../../utils/activityLogger';

// Removed AlertBox - using toast messages instead

interface SavedAccount {
  identifier: string;
  password: string;
  lastLogin: string;
  displayName?: string;
}

const getSavedAccounts = (): SavedAccount[] => {
  try {
    const savedAccounts = localStorage.getItem('savedAccounts');
    const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
    return accounts.sort((a: SavedAccount, b: SavedAccount) =>
      new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
    );
  } catch (error) {
    console.warn('Error loading saved accounts:', error);
    return [];
  }
};

const saveAccount = (identifier: string, password: string) => {
  try {
    const existingAccounts = getSavedAccounts();
    const accountIndex = existingAccounts.findIndex(acc => acc.identifier === identifier);

    const newAccount: SavedAccount = {
      identifier,
      password,
      lastLogin: new Date().toISOString(),
      displayName: identifier.includes('@') ? identifier.split('@')[0] : identifier
    };

    if (accountIndex >= 0) {
      existingAccounts[accountIndex] = newAccount;
    } else {
      existingAccounts.push(newAccount);
    }

    const limitedAccounts = existingAccounts
      .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
      .slice(0, 5);

    localStorage.setItem('savedAccounts', JSON.stringify(limitedAccounts));
  } catch (error) {
    console.warn('Error saving account:', error);
  }
};

const removeAccount = (identifier: string) => {
  try {
    const existingAccounts = getSavedAccounts();
    const filteredAccounts = existingAccounts.filter(acc => acc.identifier !== identifier);
    localStorage.setItem('savedAccounts', JSON.stringify(filteredAccounts));
  } catch (error) {
    console.warn('Error removing account:', error);
  }
};

const clearAllAccounts = () => {
  try {
    localStorage.removeItem('savedAccounts');
    localStorage.removeItem('rememberMe');
  } catch (error) {
    console.warn('Error clearing all accounts:', error);
  }
};

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
};

const Login: React.FC = () => {
  const navigation = useIonRouter();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'primary' | 'success' | 'warning' | 'danger'>('primary');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);
  const loginIdentifierInputRef = useRef<HTMLIonInputElement>(null);
  const passwordInputRef = useRef<HTMLIonInputElement>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const popoverRef = useRef<HTMLIonPopoverElement>(null);
  const avatarButtonRef = useRef<HTMLIonButtonElement>(null);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [otpPurpose, setOtpPurpose] = useState<'new_device' | 'forgot_password' | null>(null);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [prankReports, setPrankReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [appealMessage, setAppealMessage] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [bannedUserEmail, setBannedUserEmail] = useState<string>('');
  const [bannedUsername, setBannedUsername] = useState<string>('');
  const [isBannedAppealMode, setIsBannedAppealMode] = useState(false);
  const [detectedBannedIdentifier, setDetectedBannedIdentifier] = useState('');
  const [appealType, setAppealType] = useState<'banned' | 'suspended' | 'warned' | null>(null);

  // Helper function for showing toast messages
  const showCustomToast = (message: string, color: 'primary' | 'success' | 'warning' | 'danger' = 'primary') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  // Load saved accounts on component mount
  useEffect(() => {
    const loadSavedAccounts = () => {
      try {
        const accounts = getSavedAccounts();
        const rememberEnabled = isRememberMeEnabled();

        setRememberMe(rememberEnabled);
        setSavedAccounts(accounts);

        setLoginIdentifier('');
        setPassword('');

        // Simulate loading delay
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.warn('Error loading saved accounts:', error);
        setIsLoading(false);
      }
    };

    loadSavedAccounts();
  }, []);

  useEffect(() => {
    if (!isBannedAppealMode) return;
    const normalizedDetected = detectedBannedIdentifier.toLowerCase();
    if (!loginIdentifier.trim() || loginIdentifier.trim().toLowerCase() !== normalizedDetected) {
      setIsBannedAppealMode(false);
      setDetectedBannedIdentifier('');
    }
  }, [loginIdentifier, isBannedAppealMode, detectedBannedIdentifier]);

  // Auto-populate message when appeal type is selected (and no report is selected)
  useEffect(() => {
    if (appealType && bannedUserEmail && !selectedReportId && showAppealModal) {
      const username = bannedUsername || bannedUserEmail.split('@')[0] || 'User';
      const sanctionType = appealType === 'banned' ? 'banning' : appealType === 'suspended' ? 'suspension' : 'warning';
      const autoMessage = `I am writing to formally appeal the sanction(${sanctionType}) of my account (Username: ${username} / Email: ${bannedUserEmail}). I have reviewed the Terms and Conditions and would like to request a review of this decision. Please let me know what steps I need to take or what information you require from me. Thank you for your consideration.`;
      setAppealMessage(autoMessage);
    } else if (selectedReportId && !appealType) {
      // Clear message if report is selected but appeal type is not
      setAppealMessage('');
    }
  }, [appealType, bannedUserEmail, bannedUsername, selectedReportId, showAppealModal]);

  // Auto-populate message when prank report is selected (and no appeal type is selected)
  useEffect(() => {
    if (selectedReportId && bannedUserEmail && !appealType && showAppealModal) {
      const selectedReport = prankReports.find(r => r.id === selectedReportId);
      const username = bannedUsername || bannedUserEmail.split('@')[0] || 'User';
      const autoMessage = `I am writing to formally appeal the suspension of my account (Username: ${username} / Email: ${bannedUserEmail} and Report Title: ${selectedReport?.title || 'N/A'} and other information). I have reviewed the Terms and Conditions and would like to request a review of this decision. Please let me know what steps I need to take or what information you require from me. Thank you for your consideration.`;
      setAppealMessage(autoMessage);
    } else if (appealType && !selectedReportId) {
      // Clear message if appeal type is selected but report is not
      setAppealMessage('');
    }
  }, [selectedReportId, bannedUserEmail, bannedUsername, prankReports, appealType, showAppealModal]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // Global Enter key handler
useEffect(() => {
  const handleGlobalKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !showSavedAccounts && !showOTPModal) {
      const activeElement = document.activeElement;
      const isFocusedOnInput = activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'ION-INPUT' ||
        activeElement?.closest('ion-input');

      // Only trigger action if not focused on any input field
      if (!isFocusedOnInput) {
        e.preventDefault();
        if (isPasswordResetMode) {
          handlePasswordUpdate();
        } else {
          handleLogin();
        }
      }
    }
  };

  window.addEventListener('keypress', handleGlobalKeyPress);

  return () => {
    window.removeEventListener('keypress', handleGlobalKeyPress);
  };
}, [loginIdentifier, password, showSavedAccounts, showOTPModal, isPasswordResetMode]);

  // Focus on login identifier input when component mounts
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (loginIdentifierInputRef.current) {
          loginIdentifierInputRef.current.setFocus();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <IonCard style={{
        maxWidth: '440px',
        width: '100%',
        borderRadius: '20px',
        boxShadow: '0 20px 64px rgba(0,0,0,0.12)',
        border: '1px solid rgba(226,232,240,0.8)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header Skeleton */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px 32px 30px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <IonSkeletonText
              animated
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                margin: '0 auto 20px'
              }}
            />
            <IonSkeletonText
              animated
              style={{
                width: '60%',
                height: '28px',
                borderRadius: '4px',
                margin: '0 auto 8px'
              }}
            />
            <IonSkeletonText
              animated
              style={{
                width: '80%',
                height: '14px',
                borderRadius: '4px',
                margin: '0 auto'
              }}
            />
          </div>
        </div>

        <IonCardContent style={{ padding: '40px 32px', position: 'relative' }}>
          {/* Form Fields Skeleton */}
          <div style={{ marginBottom: '24px' }}>
            <IonSkeletonText
              animated
              style={{
                width: '40%',
                height: '14px',
                borderRadius: '4px',
                marginBottom: '12px'
              }}
            />
            <IonSkeletonText
              animated
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <IonSkeletonText
              animated
              style={{
                width: '30%',
                height: '14px',
                borderRadius: '4px',
                marginBottom: '12px'
              }}
            />
            <IonSkeletonText
              animated
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px'
              }}
            />
          </div>

          {/* Remember Me Skeleton */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <IonSkeletonText
                animated
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  marginRight: '12px'
                }}
              />
              <div style={{ flex: 1 }}>
                <IonSkeletonText
                  animated
                  style={{
                    width: '40%',
                    height: '14px',
                    borderRadius: '4px',
                    marginBottom: '4px'
                  }}
                />
                <IonSkeletonText
                  animated
                  style={{
                    width: '60%',
                    height: '12px',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Login Button Skeleton */}
          <IonSkeletonText
            animated
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}
          />

          {/* Divider Skeleton */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0',
          }}>
            <IonSkeletonText
              animated
              style={{
                flex: 1,
                height: '1px',
                borderRadius: '1px'
              }}
            />
            <IonSkeletonText
              animated
              style={{
                width: '100px',
                height: '14px',
                borderRadius: '4px',
                margin: '0 16px'
              }}
            />
            <IonSkeletonText
              animated
              style={{
                flex: 1,
                height: '1px',
                borderRadius: '1px'
              }}
            />
          </div>

          {/* Create Account Button Skeleton */}
          <IonSkeletonText
            animated
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}
          />

          {/* Info Box Skeleton */}
          <IonSkeletonText
            animated
            style={{
              width: '100%',
              height: '60px',
              borderRadius: '12px'
            }}
          />
        </IonCardContent>
      </IonCard>
    </div>
  );

  // Show skeleton while loading
  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{
            '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '--color': 'white'
          } as any}>
            <IonSkeletonText
              animated
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                marginLeft: '16px'
              }}
            />
            <IonSkeletonText
              animated
              style={{
                width: '120px',
                height: '20px',
                borderRadius: '4px',
                margin: '0 auto'
              }}
            />
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <SkeletonLoader />
        </IonContent>
      </IonPage>
    );
  }

  // Generate device fingerprint
  const generateDeviceFingerprint = async (): Promise<string> => {
    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        !!navigator.cookieEnabled,
        !!navigator.javaEnabled(),
        typeof navigator.pdfViewerEnabled !== 'undefined' ? navigator.pdfViewerEnabled : false
      ].join('|');

      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(components));
      const hashArray = Array.from(new Uint8Array(hash));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    } catch (error) {
      return btoa(navigator.userAgent + screen.width + screen.height).substring(0, 32);
    }
  };

  // Check if device is trusted
  const isDeviceTrusted = async (userId: string, fingerprint: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('device_fingerprints')
        .select('is_trusted')
        .eq('user_id', userId)
        .eq('device_fingerprint', fingerprint)
        .single();

      if (error) {
        console.warn('Device trust check error:', error);
        return false;
      }

      return data?.is_trusted || false;
    } catch (error) {
      console.warn('Error checking device trust:', error);
      return false;
    }
  };

  // Save device as trusted
  const saveTrustedDevice = async (userId: string, fingerprint: string, deviceName?: string) => {
    try {
      const { error } = await supabase
        .from('device_fingerprints')
        .upsert({
          user_id: userId,
          device_fingerprint: fingerprint,
          device_name: deviceName || 'Unknown Device',
          user_agent: navigator.userAgent,
          is_trusted: true,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,device_fingerprint'
        });

      if (error) {
        console.error('Error saving trusted device:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to save trusted device:', error);
      throw error;
    }
  };

  // Send OTP using Supabase's built-in OTP system
  const sendOTP = async (
    email: string,
    purpose: 'new_device' | 'forgot_password',
    fingerprint?: string
  ): Promise<boolean> => {
    setIsSendingOTP(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
          data: {
            purpose,
            ...(purpose === 'new_device' && fingerprint ? { device_fingerprint: fingerprint } : {})
          }
        }
      });

      if (error) {
        console.error('OTP send error:', error);
        showCustomToast('Failed to send verification code. Please try again.', 'danger');
        return false;
      }

      setIsOtpSent(true);
      setResendCooldown(60);
      return true;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      showCustomToast('Failed to send verification code. Please try again.', 'danger');
      return false;
    } finally {
      setIsSendingOTP(false);
    }
  };

  const verifyOTP = async (
    email: string,
    code: string,
    purpose: 'new_device' | 'forgot_password',
    fingerprint?: string
  ): Promise<{ userId: string; userEmail: string } | null> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email'
      });

      if (error) {
        console.error('OTP verification error:', error);
        showCustomToast('Invalid or expired verification code. Please try again.', 'danger');
        return null;
      }

      if (!data.user) {
        throw new Error('No user data returned after OTP verification.');
      }

      if (purpose === 'new_device' && fingerprint) {
        await saveTrustedDevice(data.user.id, fingerprint);
      }

      return { userId: data.user.id, userEmail: data.user.email ?? email };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      showCustomToast(error.message || 'OTP verification failed.', 'danger');
      return null;
    }
  };

  const resendOTP = async () => {
    if (resendCooldown > 0 || !otpEmail || !otpPurpose) return;
    await sendOTP(
      otpEmail,
      otpPurpose,
      otpPurpose === 'new_device' ? deviceFingerprint : undefined
    );
  };

  // --- Remove all early validation and toasts except handleLogin ---
  // Remove per-field key handlers, leave global Enter handler only
  // In handleLogin, perform these checks:
  const handleLogin = async () => {
  // Input validation
  const trimmedIdentifier = loginIdentifier.trim();
  const trimmedPassword = password.trim();

  if (!trimmedIdentifier) {
    showCustomToast('Please enter your email or username', 'warning');
    return;
  }
  
  if (!trimmedPassword) {
    showCustomToast('Please enter your password', 'warning');
    return;
  }

  setIsLoggingIn(true);
  
  try {
    let userProfile: { id: string; status: string; user_email?: string } | null = null;
    let loginEmail = trimmedIdentifier;
    
    // If it's not an email, look up the email from username
    if (!trimmedIdentifier.includes('@')) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_email, status, id')
        .eq('username', trimmedIdentifier)
        .single();
        
      if (userError || !userData) {
        showCustomToast('Username not found. Please check your credentials.', 'warning');
        setIsLoggingIn(false);
        return;
      }
      
      // Only block banned users, allow suspended, inactive and active users
      if (userData.status === 'banned') {
        const email = userData.user_email || loginEmail;
        setBannedUserEmail(email);
        setBannedUsername(trimmedIdentifier.includes('@') ? trimmedIdentifier.split('@')[0] : trimmedIdentifier);
        const { data: reports } = await supabase
          .from('incident_reports')
          .select('id, title, created_at, admin_response, appeal')
          .eq('reporter_email', email)
          .eq('priority', 'prank')
          .order('created_at', { ascending: false });
        setPrankReports(reports || []);
        setIsBannedAppealMode(true);
        setDetectedBannedIdentifier(trimmedIdentifier.toLowerCase());
        setAppealType(null);
        showCustomToast('Your account is banned. Tap Appeal to request a review.', 'warning');
        setIsLoggingIn(false);
        return;
      }
      
      userProfile = userData;
      loginEmail = userData.user_email || loginEmail;
    }

    const normalizedLoginEmail = loginEmail.toLowerCase();

    // Direct Supabase Auth login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedLoginEmail,
      password: trimmedPassword,
    });

    if (authError) {
      console.log('Auth error:', authError);
      
      if (authError.message.includes('Invalid login credentials')) {
        showCustomToast('Invalid email/username or password. Please try again.', 'danger');
      } else if (authError.message.includes('Email not confirmed')) {
        showCustomToast('Please check your email and confirm your account before logging in.', 'warning');
      } else {
        showCustomToast('Login failed. Please try again.', 'danger');
      }
      
      setIsLoggingIn(false);
      return;
    }

    if (!userProfile) {
      // Use user_email instead of auth_user_id to avoid RLS policy issues
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, status, user_email')
        .eq('user_email', normalizedLoginEmail)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching user profile:', profileError);
        showCustomToast('Unable to load your profile details. Please contact support.', 'danger');
        await supabase.auth.signOut();
        setIsLoggingIn(false);
        return;
      }

      // Only block banned users, allow suspended, inactive and active users
      if (profileData.status === 'banned') {
        setBannedUserEmail(normalizedLoginEmail);
        setBannedUsername(normalizedLoginEmail.split('@')[0]);
        const { data: reports } = await supabase
          .from('incident_reports')
          .select('id, title, created_at, admin_response, appeal')
          .eq('reporter_email', normalizedLoginEmail)
          .eq('priority', 'prank')
          .order('created_at', { ascending: false });
        setPrankReports(reports || []);
        setIsBannedAppealMode(true);
        setDetectedBannedIdentifier(normalizedLoginEmail);
        setAppealType(null);
        showCustomToast('Your account is banned. Tap Appeal to request a review.', 'warning');
        await supabase.auth.signOut();
        setIsLoggingIn(false);
        return;
      }

      userProfile = profileData;
    }

    // Generate device fingerprint
    const fingerprint = await generateDeviceFingerprint();
    setDeviceFingerprint(fingerprint);
    setCurrentUserId(authData.user.id);
    
    // Check if device is trusted
    const isTrusted = await isDeviceTrusted(authData.user.id, fingerprint);
    
    if (!isTrusted) {
      setOtpPurpose('new_device');
      setOtpEmail(normalizedLoginEmail);
      setShowOTPModal(true);
      setIsLoggingIn(false);
      setIsPasswordResetMode(false);
      setOtpCode('');
      await sendOTP(normalizedLoginEmail, 'new_device', fingerprint);
      return;
    }

    // Complete the login process
    await completeLogin(authData.user.id, normalizedLoginEmail, fingerprint);
    
  } catch (error: any) {
    console.error('Login error:', error);
    showCustomToast('Login failed. Please check your credentials and try again.', 'danger');
    setIsLoggingIn(false);
  }
};

  const completeLogin = async (userId: string, userEmail: string, fingerprint?: string) => {
  try {
    // Update device usage
    if (fingerprint) {
      await supabase
        .from('device_fingerprints')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('device_fingerprint', fingerprint);
    }

    // Update last_active_at in users table
    await supabase
      .from('users')
      .update({ 
        last_active_at: new Date().toISOString(),
        is_online: true
      })
      .eq('user_email', userEmail);

    // Save to remembered accounts if enabled
    if (rememberMe) {
      saveAccount(loginIdentifier, password);
      setSavedAccounts(getSavedAccounts());
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }

    showCustomToast('Welcome back! Redirecting to your dashboard...', 'success');

    // Fire-and-forget activity log
    logUserLogin(userEmail).catch(() => {});

    // Clear input focus
    const clearInputFocus = async () => {
      if (loginIdentifierInputRef.current) {
        try {
          const el = await loginIdentifierInputRef.current.getInputElement();
          el.blur();
        } catch (err) {
          console.warn('Could not blur login identifier input:', err);
        }
      }

      if (passwordInputRef.current) {
        try {
          const el = await passwordInputRef.current.getInputElement();
          el.blur();
        } catch (err) {
          console.warn('Could not blur password input:', err);
        }
      }
    };

    await clearInputFocus();

    // Navigate to app
    navigation.push('/iAMUMAta/app', 'forward', 'replace');

  } catch (error: any) {
    console.error('Login completion error:', error);
    showCustomToast('Login completion failed: ' + error.message, 'danger');
    setIsLoggingIn(false);
  }
};

  const handleOTPVerification = async () => {
    if (!otpCode || !otpPurpose) {
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const verified = await verifyOTP(
        otpEmail,
        otpCode,
        otpPurpose,
        otpPurpose === 'new_device' ? deviceFingerprint : undefined
      );

      if (verified) {
        setCurrentUserId(verified.userId);
        setOtpEmail(verified.userEmail);

        if (otpPurpose === 'forgot_password') {
          setShowOTPModal(false);
          setIsOtpSent(false);
          setOtpPurpose(null);
          setIsPasswordResetMode(true);
          setOtpCode('');
          setPassword('');
          showCustomToast('Please type your new password in the password field', 'warning');
          setTimeout(() => {
            passwordInputRef.current?.setFocus();
          }, 300);
        } else {
          setShowOTPModal(false);
          setIsOtpSent(false);
          setOtpPurpose(null);
          await completeLogin(verified.userId, verified.userEmail, deviceFingerprint);
        }
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      showCustomToast('Failed to verify code. Please try again.', 'danger');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleIdentifierKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedIdentifier = loginIdentifier.trim();
      
      if (!trimmedIdentifier) {
        showCustomToast('Please enter your email or username', 'warning');
        return;
      }
      
      // Move focus to password field
      setTimeout(() => {
        passwordInputRef.current?.setFocus();
      }, 50);
    }
  };
  
  const handlePasswordKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isPasswordResetMode) {
        handlePasswordUpdate();
      } else {
        handleLogin();
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = async () => {
    const identifier = loginIdentifier.trim();

    if (!identifier) {
      showCustomToast('Enter your email or username to reset password.', 'warning');
      return;
    }

    let targetEmail = '';
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    try {
      if (isEmail) {
        targetEmail = identifier;
      } else {
        // Lookup email by username in users table
        const { data, error } = await supabase
          .from('users')
          .select('user_email')
          .eq('username', identifier)
          .single();

        if (error || !data?.user_email) {
          showCustomToast('Username not found. Enter your email instead.', 'warning');
          return;
        }
        targetEmail = data.user_email;
      }

      setOtpPurpose('forgot_password');
      setOtpEmail(targetEmail.toLowerCase());
      setShowOTPModal(true);
      setIsPasswordResetMode(false);
      setOtpCode('');
      setIsOtpSent(false);
      const sent = await sendOTP(targetEmail.toLowerCase(), 'forgot_password');
      if (sent) {
        showCustomToast('Verification code sent. Please check your email.', 'success');
      }
    } catch (e: any) {
      showCustomToast(e.message || 'Failed to start password reset. Try again.', 'danger');
    }
  };

  const submitAppeal = async () => {
    console.log('=== SUBMIT APPEAL START ===');
    console.log('Appeal Type:', appealType);
    console.log('Selected Report ID:', selectedReportId);
    console.log('Banned User Email:', bannedUserEmail);
    console.log('Banned Username:', bannedUsername);
    console.log('Appeal Message Length:', appealMessage.trim().length);

    const trimmedMessage = appealMessage.trim();
    if (!trimmedMessage) {
      console.log('ERROR: No appeal message');
      showCustomToast('Please enter your appeal message to admin', 'warning');
      return;
    }

    if (!appealType && !selectedReportId) {
      console.log('ERROR: No appeal type or report selected');
      showCustomToast('Please select an appeal type or a report to appeal', 'warning');
      return;
    }

    if (!bannedUserEmail) {
      console.log('ERROR: No banned user email');
      showCustomToast('User email is required', 'warning');
      return;
    }

    setIsSubmittingAppeal(true);
    try {
      const username = bannedUsername || bannedUserEmail.split('@')[0] || 'User';
      console.log('Username:', username);

      // Case 1: Appeal Type selected (banned/suspended/warned) - store in users.user_appeal
      if (appealType && !selectedReportId) {
        console.log('=== CASE 1: Appeal Type Selected ===');
        
        // First, fetch the user to get their ID and verify they exist
        console.log('Fetching user with email:', bannedUserEmail);
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('id, user_email, username')
          .eq('user_email', bannedUserEmail.toLowerCase())
          .single();

        console.log('User fetch result:', userData);
        console.log('User fetch error:', fetchError);

        if (fetchError || !userData) {
          console.error('ERROR: User not found with email:', bannedUserEmail);
          throw new Error(`User not found. Please contact support.`);
        }

        const appealPayload = {
          user_email: bannedUserEmail,
          username: username,
          message: trimmedMessage,
          created_at: new Date().toISOString(),
          status: 'pending',
          admin_read: false,
          appeal_type: appealType
        };
        console.log('Appeal Payload:', JSON.stringify(appealPayload, null, 2));
        console.log('Updating users table with id:', userData.id);

        // Try updating by ID first (more reliable)
        const { data: updateData, error: userError } = await supabase
          .from('users')
          .update({ user_appeal: appealPayload })
          .eq('id', userData.id)
          .select();

        console.log('Update Response Data:', updateData);
        console.log('Update Response Error:', userError);

        if (userError) {
          console.error('ERROR updating users.user_appeal:', userError);
          console.error('Error code:', userError.code);
          console.error('Error message:', userError.message);
          console.error('Error details:', userError.details);
          console.error('Error hint:', userError.hint);
          throw userError;
        }

        if (!updateData || updateData.length === 0) {
          console.error('ERROR: No rows updated. Trying with email as fallback...');
          // Fallback: try with email
          const { data: updateData2, error: userError2 } = await supabase
            .from('users')
            .update({ user_appeal: appealPayload })
            .eq('user_email', bannedUserEmail.toLowerCase())
            .select();
          
          console.log('Fallback Update Response Data:', updateData2);
          console.log('Fallback Update Response Error:', userError2);
          
          if (userError2 || !updateData2 || updateData2.length === 0) {
            throw new Error(`Failed to update user appeal. Please contact support.`);
          }
        }

        console.log('SUCCESS: Appeal stored in users.user_appeal');

        // Verify the appeal was actually stored
        const { data: verifyData, error: verifyError } = await supabase
          .from('users')
          .select('user_appeal')
          .eq('id', userData.id)
          .single();
        
        console.log('Verification - Retrieved user_appeal:', verifyData?.user_appeal);
        if (verifyError) {
          console.warn('Warning: Could not verify appeal was stored:', verifyError);
        } else if (!verifyData?.user_appeal) {
          console.error('ERROR: Appeal was not found after update!');
          throw new Error('Appeal was not stored. Please try again.');
        } else {
          console.log('VERIFIED: Appeal is stored in database');
        }

        // Try to log to system_logs (may fail for unauthenticated users, but that's okay)
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          await supabase.from('system_logs').insert({
            admin_email: currentUser?.email || bannedUserEmail,
            activity_type: 'user_action',
            activity_description: 'User submitted account appeal',
            target_user_email: bannedUserEmail,
            details: { message: trimmedMessage, appeal_type: appealType }
          });
        } catch (logError) {
          // Silently fail - appeal is already stored in users.user_appeal
          console.warn('Could not log to system_logs (user may be unauthenticated):', logError);
        }

        showCustomToast('Appeal submitted successfully. Admin will review your request.', 'success');
        setShowAppealModal(false);
        setSelectedReportId('');
        setAppealMessage('');
        setBannedUserEmail('');
        setBannedUsername('');
        setAppealType(null);
        return;
      }

      // Case 2: Prank Report selected - store in incident_reports.admin_appeal
      if (selectedReportId && !appealType) {
        console.log('=== CASE 2: Prank Report Selected ===');
        
        // First, fetch the report to verify it exists
        console.log('Fetching report with id:', selectedReportId);
        const { data: reportData, error: fetchError } = await supabase
          .from('incident_reports')
          .select('id, title, reporter_email, priority')
          .eq('id', selectedReportId)
          .single();

        console.log('Report fetch result:', reportData);
        console.log('Report fetch error:', fetchError);

        if (fetchError || !reportData) {
          console.error('ERROR: Report not found with id:', selectedReportId);
          throw new Error(`Report not found. Please contact support.`);
        }

        // Verify it's a prank report
        if (reportData.priority !== 'prank') {
          console.warn('WARNING: Report is not a prank report. Priority:', reportData.priority);
        }

        const selectedReport = prankReports.find(r => r.id === selectedReportId);
        console.log('Selected Report from array:', selectedReport);

        const appealPayload = {
          report_id: selectedReportId,
          user_email: bannedUserEmail,
          username: username,
          message: trimmedMessage,
          created_at: new Date().toISOString(),
          status: 'pending',
          admin_read: false
        };
        console.log('Appeal Payload:', JSON.stringify(appealPayload, null, 2));
        console.log('Updating incident_reports table with id:', selectedReportId);

        const { data: updateData, error: reportError } = await supabase
          .from('incident_reports')
          .update({ admin_appeal: appealPayload })
          .eq('id', selectedReportId)
          .select();

        console.log('Update Response Data:', updateData);
        console.log('Update Response Error:', reportError);

        if (reportError) {
          console.error('ERROR updating incident_reports.admin_appeal:', reportError);
          console.error('Error code:', reportError.code);
          console.error('Error message:', reportError.message);
          console.error('Error details:', reportError.details);
          console.error('Error hint:', reportError.hint);
          throw reportError;
        }

        if (!updateData || updateData.length === 0) {
          console.error('ERROR: No rows updated. Report might not exist or RLS is blocking.');
          throw new Error(`Failed to update report appeal. Please contact support.`);
        }

        console.log('SUCCESS: Appeal stored in incident_reports.admin_appeal');

        // Verify the appeal was actually stored
        const { data: verifyData, error: verifyError } = await supabase
          .from('incident_reports')
          .select('admin_appeal')
          .eq('id', selectedReportId)
          .single();
        
        console.log('Verification - Retrieved admin_appeal:', verifyData?.admin_appeal);
        if (verifyError) {
          console.warn('Warning: Could not verify appeal was stored:', verifyError);
        } else if (!verifyData?.admin_appeal) {
          console.error('ERROR: Appeal was not found after update!');
          throw new Error('Appeal was not stored. Please try again.');
        } else {
          console.log('VERIFIED: Appeal is stored in database');
        }

        // Try to log to system_logs (may fail for unauthenticated users, but that's okay)
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          await supabase.from('system_logs').insert({
            admin_email: currentUser?.email || bannedUserEmail,
            activity_type: 'user_action',
            activity_description: 'User submitted report appeal',
            target_user_email: bannedUserEmail,
            target_report_id: selectedReportId,
            details: { message: trimmedMessage, report_title: selectedReport.title }
          });
        } catch (logError) {
          // Silently fail - appeal is already stored in incident_reports.admin_appeal
          console.warn('Could not log to system_logs (user may be unauthenticated):', logError);
        }

        showCustomToast('Appeal submitted successfully. Admin will review your request.', 'success');
        setShowAppealModal(false);
        setSelectedReportId('');
        setAppealMessage('');
        setBannedUserEmail('');
        setBannedUsername('');
        setAppealType(null);
        return;
      }

      // If both are selected, prioritize appeal type
      if (appealType && selectedReportId) {
        showCustomToast('Please select either an appeal type OR a report, not both', 'warning');
        setIsSubmittingAppeal(false);
        return;
      }

    } catch (error: any) {
      console.error('=== ERROR SUBMITTING APPEAL ===');
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      console.error('Error hint:', error?.hint);
      console.error('Error code:', error?.code);
      showCustomToast(
        error?.message || 'Failed to submit appeal. Please try again.', 
        'danger'
      );
    } finally {
      setIsSubmittingAppeal(false);
      console.log('=== SUBMIT APPEAL END ===');
    }
  };

  const handlePasswordUpdate = async () => {
    const newPassword = password.trim();

    if (!newPassword) {
      showCustomToast('Please type your new password.', 'warning');
      return;
    }

    if (newPassword.length < 8) {
      showCustomToast('Password must be at least 8 characters long.', 'warning');
      return;
    }

    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      showCustomToast('Password updated successfully.', 'success');
      setIsPasswordResetMode(false);
      setOtpPurpose(null);
      setOtpCode('');

      if (currentUserId && otpEmail) {
        await completeLogin(currentUserId, otpEmail);
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      showCustomToast(error.message || 'Failed to update password. Please try again.', 'danger');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (savedAccounts.length > 0) {
      setShowSavedAccounts(true);
    }
  };

  const handleUseSavedAccount = (account: SavedAccount) => {
    setLoginIdentifier(account.identifier);
    setPassword(account.password);
    setShowSavedAccounts(false);
    setIsBannedAppealMode(false);
    setDetectedBannedIdentifier('');

    setTimeout(() => {
      passwordInputRef.current?.setFocus();
    }, 100);
  };

  const handleRemoveAccount = (identifier: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeAccount(identifier);
    const updatedAccounts = getSavedAccounts();
    setSavedAccounts(updatedAccounts);

    if (updatedAccounts.length === 0) {
      setShowSavedAccounts(false);
    }

    showCustomToast(`Account "${identifier}" has been removed from saved accounts.`, 'success');
  };

  const handleClearAllAccounts = () => {
    clearAllAccounts();
    setSavedAccounts([]);
    setLoginIdentifier('');
    setPassword('');
    setRememberMe(false);
    setShowSavedAccounts(false);
    setIsBannedAppealMode(false);
    setDetectedBannedIdentifier('');
    showCustomToast('All saved accounts have been cleared.', 'success');
  };

  const handleNewAccountLogin = () => {
    setLoginIdentifier('');
    setPassword('');
    setShowSavedAccounts(false);
    setIsBannedAppealMode(false);
    setDetectedBannedIdentifier('');

    setTimeout(() => {
      loginIdentifierInputRef.current?.setFocus();
    }, 100);
  };

  const currentSavedAccount = savedAccounts.find(acc => acc.identifier === loginIdentifier);
  const showAccountCount = savedAccounts.length > 1;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{
          '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '--color': 'white'
        } as any}>
          <IonButton
            slot="start"
            fill="clear"
            routerLink="/iAMUMAta"
            style={{ color: 'white' }}
          >
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle style={{ fontWeight: 'bold' }}>Community Login</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{
        '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      } as any}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <IonCard style={{
            maxWidth: '440px',
            width: '100%',
            borderRadius: '20px',
            boxShadow: '0 20px 64px rgba(0,0,0,0.12)',
            border: '1px solid rgba(226,232,240,0.8)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Header Section */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '40px 32px 30px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
                pointerEvents: 'none'
              }}></div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  <IonIcon icon={peopleOutline} style={{
                    fontSize: '36px',
                    color: 'white'
                  }} />
                </div>

                <h1 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 8px 0',
                  letterSpacing: '0.5px'
                }}>
                  Welcome Back
                </h1>

                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.9)',
                  margin: 0
                }}>
                  Report incidents, keep your community safe
                </p>
              </div>
            </div>

            <IonCardContent style={{ padding: '40px 32px', position: 'relative' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isPasswordResetMode) {
                    handlePasswordUpdate();
                } else if (isBannedAppealMode) {
                  setShowAppealModal(true);
                  } else {
                    handleLogin();
                  }
                }}
              >
                {/* Login Form */}
                <div style={{ marginBottom: '24px', position: 'relative' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <IonIcon icon={mailOutline} style={{
                      fontSize: '18px',
                      color: '#4a5568',
                      marginRight: '8px'
                    }} />
                    <label style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2d3748'
                    }}>Email or Username</label>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <IonInput
                      ref={loginIdentifierInputRef}
                      fill="outline"
                      type="text"
                      placeholder="your.email@example.com or username"
                      value={loginIdentifier}
                      onIonChange={e => setLoginIdentifier((e.detail.value ?? ""))}
                      onKeyPress={handleIdentifierKeyPress}
                      onKeyDown={(e: any) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          passwordInputRef.current?.setFocus();
                        }
                      }}
                      style={{
                        '--border-radius': '12px',
                        '--border-color': '#e2e8f0',
                        '--padding-start': '16px',
                        '--padding-end': savedAccounts.length > 0 ? '50px' : '16px',
                        fontSize: '16px'
                      } as any}
                    />

                    {savedAccounts.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        zIndex: 10
                      }}>
                        {showAccountCount && (
                          <IonBadge
                            color="primary"
                            style={{
                              fontSize: '10px',
                              marginRight: '4px',
                              minWidth: '18px',
                              height: '18px'
                            }}
                          >
                            {savedAccounts.length}
                          </IonBadge>
                        )}
                        <IonButton
                          ref={avatarButtonRef}
                          fill="clear"
                          onClick={handleAvatarClick}
                          style={{
                            '--padding-start': '8px',
                            '--padding-end': '8px',
                            '--color': '#667eea',
                            height: '32px',
                            cursor: 'pointer'
                          } as any}
                        >
                          <IonIcon icon={personCircleOutline} style={{ fontSize: '20px' }} />
                        </IonButton>
                      </div>
                    )}
                  </div>

                  {/* Saved Accounts Popover */}
                  {savedAccounts.length > 0 && (
                    <IonPopover
                      ref={popoverRef}
                      isOpen={showSavedAccounts}
                      onDidDismiss={() => setShowSavedAccounts(false)}
                      dismissOnSelect={false}
                      showBackdrop={true}
                      trigger={undefined}
                      triggerAction="click"
                      reference="trigger"
                      alignment="start"
                      side="bottom"
                      event={showSavedAccounts ? {} : undefined}
                      style={{
                        '--width': '380px',
                        '--min-width': '380px',
                        '--max-width': '380px',
                        '--height': 'auto',
                        '--max-height': '400px',
                        '--offset-y': '8px'
                      } as any}
                    >
                      <IonContent style={{ '--padding-start': '0', '--padding-end': '0', '--padding-top': '0', '--padding-bottom': '0' }}>
                        <div style={{
                          padding: '12px',
                          minHeight: '200px',
                          maxHeight: '350px',
                          overflowY: 'auto'
                        }}>
                          <div style={{
                            padding: '0 4px 8px 4px',
                            borderBottom: '1px solid #e2e8f0',
                            marginBottom: '8px'
                          }}>
                            <IonText style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#4a5568',
                              display: 'block'
                            }}>
                              Saved Accounts ({savedAccounts.length})
                            </IonText>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            {savedAccounts.map((account, index) => (
                              <div
                                key={account.identifier}
                                onClick={() => handleUseSavedAccount(account)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  marginBottom: '8px',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  transition: 'all 0.2s ease',
                                  minHeight: '64px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f7fafc';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#ffffff';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor: '#667eea',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: '12px',
                                  flexShrink: 0
                                }}>
                                  <IonIcon icon={personCircleOutline} style={{
                                    fontSize: '20px',
                                    color: 'white'
                                  }} />
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#2d3748',
                                    marginBottom: '2px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {account.displayName || account.identifier}
                                  </div>
                                  <div style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    marginBottom: '2px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {account.identifier}
                                  </div>
                                  <div style={{
                                    fontSize: '11px',
                                    color: '#9ca3af'
                                  }}>
                                    Last used: {formatTimeAgo(account.lastLogin)}
                                  </div>
                                </div>

                                {index === 0 && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '45px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '600'
                                  }}>
                                    Recent
                                  </div>
                                )}

                                <button
                                  onClick={(e) => handleRemoveAccount(account.identifier, e)}
                                  style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '32px',
                                    height: '32px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#ef4444',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fef2f2';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <IonIcon icon={trashOutline} style={{ fontSize: '16px' }} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            borderTop: '1px solid #e2e8f0',
                            paddingTop: '12px'
                          }}>
                            <button
                              onClick={handleClearAllAccounts}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: '1px solid #ef4444',
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#ef4444';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#ef4444';
                              }}
                            >
                              <IonIcon icon={trashOutline} style={{ fontSize: '14px' }} />
                              Clear All
                            </button>
                            <button
                              onClick={handleNewAccountLogin}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: '1px solid #667eea',
                                backgroundColor: 'transparent',
                                color: '#667eea',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#667eea';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#667eea';
                              }}
                            >
                              <IonIcon icon={addOutline} style={{ fontSize: '14px' }} />
                              New Account
                            </button>
                          </div>
                        </div>
                      </IonContent>
                    </IonPopover>
                  )}

                  {currentSavedAccount && (
                    <IonText color="success" style={{ fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                      <IonIcon icon={timeOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                      Using saved account (Last used: {formatTimeAgo(currentSavedAccount.lastLogin)})
                    </IonText>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <IonIcon icon={lockClosedOutline} style={{
                        fontSize: '18px',
                        color: '#4a5568',
                        marginRight: '8px'
                      }} />
                      <label style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#2d3748'
                      }}>Password</label>
                    </div>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={handleForgotPassword}
                      style={{
                        '--color': '#667eea',
                        fontSize: '12px',
                        height: 'auto'
                      } as any}
                    >
                      Forgot Password?
                    </IonButton>
                  </div>

                  <IonInput
                    ref={passwordInputRef}
                    fill="outline"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onIonChange={e => setPassword((e.detail.value ?? ""))}
                    onKeyPress={handlePasswordKeyPress}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#e2e8f0',
                      '--padding-start': '16px',
                      '--padding-end': '2px',
                      fontSize: '16px'
                    } as any}
                  >
                    <IonButton
                      fill="clear"
                      slot="end"
                      aria-label="Show/hide password"
                      onClick={togglePasswordVisibility}
                      style={{
                        '--padding-start': '8px',
                        '--padding-end': '8px',
                        '--color': '#6b7280'
                      } as any}
                    >
                      <IonIcon
                        slot="icon-only"
                        icon={showPassword ? eyeOffOutline : eyeOutline}
                      />
                    </IonButton>
                  </IonInput>
                {isPasswordResetMode && (
                  <IonText color="warning" style={{ fontSize: '12px', marginTop: '6px', display: 'block' }}>
                    Please type your new password, then click Update Password.
                  </IonText>
                )}
                </div>

                {/* Remember Me Section */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    background: rememberMe ? '#f0f9ff' : 'transparent',
                    borderRadius: '8px',
                    border: rememberMe ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                    transition: 'all 0.3s ease'
                  }}>
                    <IonCheckbox
                      checked={rememberMe}
                      onIonChange={e => setRememberMe(e.detail.checked)}
                      style={{
                        '--checkbox-background-checked': '#667eea',
                        '--border-color-checked': '#667eea',
                        marginRight: '12px'
                      }}
                    />
                    <div>
                      <IonLabel style={{ fontSize: '14px', color: '#4a5568', fontWeight: '600' }}>
                        Remember Me
                      </IonLabel>
                      <IonText style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                        {rememberMe
                          ? `Save login details (${savedAccounts.length} account${savedAccounts.length !== 1 ? 's' : ''} saved)`
                          : 'Do not save login details'
                        }
                      </IonText>
                    </div>
                  </div>
                </div>

                <IonButton
                  type="submit"
                  expand="block"
                  size="large"
                  disabled={isLoggingIn}
                  style={{
                    '--border-radius': '12px',
                    '--padding-top': '16px',
                    '--padding-bottom': '16px',
                    fontWeight: '600',
                    fontSize: '16px',
                    height: '52px',
                    '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '--color': 'white',
                    marginBottom: '24px'
                  } as any}
                >
              <IonIcon
                icon={
                  isPasswordResetMode
                    ? checkmarkCircleOutline
                    : isBannedAppealMode
                      ? shieldOutline
                      : logInOutline
                }
                slot="start"
              />
              {isPasswordResetMode
                ? (isLoggingIn ? 'Updating...' : 'UPDATE PASSWORD')
                : isBannedAppealMode
                  ? (isLoggingIn ? 'Preparing...' : 'APPEAL BAN')
                  : (isLoggingIn ? 'Signing In...' : 'SIGN IN')}
                </IonButton>
              </form>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '24px 0',
                color: '#a0aec0',
                fontSize: '14px'
              }}>
                <div style={{
                  flex: 1,
                  height: '1px',
                  background: '#e2e8f0'
                }}></div>
                <span style={{ padding: '0 16px' }}>New to iAMUMA ta?</span>
                <div style={{
                  flex: 1,
                  height: '1px',
                  background: '#e2e8f0'
                }}></div>
              </div>

              {/* Create Account Button */}
              <IonButton
                routerLink="/iAMUMAta/register"
                expand="block"
                fill="outline"
                style={{
                  '--border-radius': '12px',
                  '--padding-top': '14px',
                  '--padding-bottom': '14px',
                  fontWeight: '600',
                  fontSize: '14px',
                  '--border-color': '#667eea',
                  '--color': '#667eea'
                } as any}
              >
                <IonIcon icon={personCircleOutline} slot="start" />
                CREATE ACCOUNT
              </IonButton>

              {/* Info Box */}
              <div style={{
                background: 'linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)',
                border: '1px solid #90cdf4',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                marginTop: '24px'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#2c5282',
                  margin: '0 0 4px 0',
                  fontWeight: '600'
                }}>Community Safety Initiative</p>
                <p style={{
                  fontSize: '11px',
                  color: '#3182ce',
                  margin: 0,
                  lineHeight: '1.4'
                }}>Help make Manolo Fortich safer by reporting incidents in your area</p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color={toastColor}
        />

        {/* OTP Verification Modal */}
<IonModal
  isOpen={showOTPModal}
  onDidDismiss={() => {
    if (!isVerifyingOTP) {
      setShowOTPModal(false);
      setOtpCode('');
      setIsOtpSent(false);
      setOtpPurpose(null);
      if (otpPurpose === 'forgot_password') {
        setIsPasswordResetMode(false);
      }
    }
  }}
  backdropDismiss={!isVerifyingOTP}
  style={{
    '--height': 'auto',
    '--width': '90%',
    '--max-width': '400px',
    '--border-radius': '20px'
  }}
>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    background: 'rgba(0,0,0,0.5)'
  }}>
    <IonCard style={{
      width: '100%',
      borderRadius: '20px',
      boxShadow: '0 20px 64px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      margin: '0'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #3182ce 0%, #2c5282 100%)',
        padding: '24px 20px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          margin: '0 auto 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <IonIcon icon={checkmarkCircleOutline} style={{
            fontSize: '24px',
            color: 'white'
          }} />
        </div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 6px 0'
        }}>{otpPurpose === 'forgot_password' ? 'Password Reset Verification' : 'Security Verification'}</h2>
        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.9)',
          margin: 0
        }}>
          {otpPurpose === 'forgot_password'
            ? 'Enter the verification code to reset your password.'
            : "We've sent a 6-digit code to"}
        </p>
        <p style={{
          fontSize: '13px',
          color: 'white',
          fontWeight: '600',
          margin: '2px 0 0 0'
        }}>{otpEmail}</p>
      </div>

      <IonCardContent style={{ padding: '24px 20px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleOTPVerification();
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#2d3748',
              display: 'block',
              marginBottom: '10px'
            }}>Verification Code</label>
            <IonInput
              fill="outline"
              type="tel"
              inputmode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={otpCode}
              maxlength={6} 
              onIonInput={(e) => { 
                // Only allow numbers and limit to 6 characters
                const value = e.detail.value || '';
                const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
                setOtpCode(numericValue);
              }}
              onKeyPress={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  handleOTPVerification();
                }
              }}
              style={{
                '--border-radius': '10px',
                '--border-color': '#e2e8f0',
                '--padding-start': '16px',
                '--padding-end': '16px',
                fontSize: '18px',
                fontWeight: '600',
                textAlign: 'center',
                letterSpacing: '8px' 
              } as any}
            />
          </div>

          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <IonButton
              onClick={resendOTP}
              fill="clear"
              disabled={resendCooldown > 0 || isSendingOTP}
              style={{
                color: '#667eea',
                fontSize: '14px'
              }}
            >
              {isSendingOTP ? (
                <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} />
              ) : (
                <IonIcon icon={refreshOutline} slot="start" />
              )}
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </IonButton>
          </div>

          <IonButton
            type="submit"
            expand="block"
            size="large"
            disabled={isVerifyingOTP || otpCode.length !== 6}
            style={{
              '--border-radius': '10px',
              '--padding-top': '14px',
              '--padding-bottom': '14px',
              fontWeight: '600',
              fontSize: '15px',
              height: '48px',
              '--background': 'linear-gradient(135deg, #3182ce 0%, #2c5282 100%)',
              '--color': 'white',
              marginBottom: '12px'
            } as any}
          >
            <IonIcon icon={shieldOutline} slot="start" />
            {isVerifyingOTP ? 'Verifying...' : 'VERIFY & ACCESS'}
          </IonButton>
        </form>

        <IonButton
          expand="block"
          fill="clear"
          onClick={() => {
            if (!isVerifyingOTP) {
              setShowOTPModal(false);
              setIsLoggingIn(false);
              setOtpCode('');
              setIsOtpSent(false);
              setOtpPurpose(null);
              if (otpPurpose === 'forgot_password') {
                setIsPasswordResetMode(false);
              }
            }
          }}
          style={{
            color: '#718096',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          Cancel
        </IonButton>
      </IonCardContent>
    </IonCard>
  </div>
</IonModal>

        {/* Appeal Modal for Banned Users */}
        <IonModal isOpen={showAppealModal} onDidDismiss={() => {
          setShowAppealModal(false);
          setSelectedReportId('');
          setAppealMessage('');
          setBannedUserEmail('');
          setBannedUsername('');
          setAppealType(null);
        }}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Appeal Account Ban</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => {
                  setShowAppealModal(false);
                  setSelectedReportId('');
                  setAppealMessage('');
                  setBannedUserEmail('');
                  setBannedUsername('');
                  setAppealType(null);
                }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonCard style={{ marginBottom: '16px' }}>
                <IonCardContent>
                  <IonLabel position="stacked" style={{ marginBottom: '12px', display: 'block' }}>Appeal Type</IonLabel>
                  <IonRadioGroup
                    value={appealType}
                    onIonChange={e => {
                      const newAppealType = e.detail.value as 'banned' | 'suspended' | 'warned';
                      setAppealType(newAppealType);
                      // Clear report selection when appeal type is selected
                      setSelectedReportId('');
                    }}
                  >
                    <IonItem>
                      <IonRadio slot="start" value="banned" />
                      <IonLabel>Appeal Account Banned</IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonRadio slot="start" value="suspended" />
                      <IonLabel>Appeal Account Suspended</IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonRadio slot="start" value="warned" />
                      <IonLabel>Appeal Account Warned</IonLabel>
                    </IonItem>
                  </IonRadioGroup>
                </IonCardContent>
              </IonCard>
              <IonCard>
                <IonCardContent>
                  <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Select Report to Appeal</h3>
                  {prankReports.length === 0 ? (
                    <p style={{ color: '#6b7280' }}>No prank reports found.</p>
                  ) : (
                    <IonList>
                      <IonRadioGroup value={selectedReportId} onIonChange={e => {
                        setSelectedReportId(e.detail.value);
                        // Clear appeal type selection when report is selected
                        setAppealType(null as any);
                      }}>
                        {prankReports.map((report) => (
                          <IonItem key={report.id}>
                            <IonRadio slot="start" value={report.id} />
                            <IonLabel>
                              <h3>{report.title}</h3>
                              <p>{new Date(report.created_at).toLocaleDateString()}</p>
                            </IonLabel>
                          </IonItem>
                        ))}
                      </IonRadioGroup>
                    </IonList>
                  )}
                </IonCardContent>
              </IonCard>

              {(appealType || selectedReportId) && (
                <IonCard style={{ marginTop: '16px' }}>
                  <IonCardContent>
                    <IonItem>
                      <IonLabel position="stacked">
                        Message to Admin <span style={{ color: '#ef4444' }}>*</span>
                      </IonLabel>
                      <IonTextarea
                        value={appealMessage}
                        onIonInput={e => setAppealMessage(e.detail.value!)}
                        rows={6}
                        placeholder="Enter your appeal message..."
                        required
                      />
                    </IonItem>
                  </IonCardContent>
                </IonCard>
              )}

              <IonButton
                expand="block"
                onClick={submitAppeal}
                disabled={!appealMessage.trim() || (!appealType && !selectedReportId) || isSubmittingAppeal}
                style={{ marginTop: '16px' }}
              >
                {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Login;