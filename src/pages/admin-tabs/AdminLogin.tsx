// src/pages/AdminLogin.tsx - FIXED ENTER KEY NAVIGATION & TOAST VALIDATION
import {
  IonButton,
  IonContent,
  IonPage,
  IonInput,
  useIonRouter,
  IonInputPasswordToggle,
  IonToast,
  IonModal,
  IonCard,
  IonCardContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonText,
  IonSkeletonText,
  IonIcon,
  IonSpinner
} from '@ionic/react';
import { shield, lockClosedOutline, mailOutline, keyOutline, checkmarkCircleOutline, arrowBackOutline, desktopOutline, refreshOutline, shieldOutline } from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { logAdminLogin } from '../../utils/activityLogger';

const AdminLogin: React.FC = () => {
  const [isMobileDevice, setIsMobileDevice] = useState<boolean | null>(null);
  const navigation = useIonRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'primary' | 'success' | 'warning' | 'danger'>('primary');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const passwordInputRef = useRef<HTMLIonInputElement>(null);
  const otpInputRef = useRef<HTMLIonInputElement>(null);
  const emailInputRef = useRef<HTMLIonInputElement>(null);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };
    setTimeout(checkDevice, 800);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showOtpModal) {
        const activeElement = document.activeElement as HTMLElement;
        
        if (activeElement?.id === 'email-input') {
          e.preventDefault();
          passwordInputRef.current?.setFocus();
        } else if (activeElement?.id === 'password-input') {
          e.preventDefault();
          handleLogin();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [email, password, showOtpModal]);

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
        maxWidth: '480px',
        width: '100%',
        borderRadius: '20px',
        boxShadow: '0 20px 64px rgba(0,0,0,0.15)',
        border: '1px solid rgba(226,232,240,0.8)',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
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

        <IonCardContent style={{ padding: '40px 32px' }}>
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

          <div style={{ marginBottom: '32px' }}>
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

          <IonSkeletonText
            animated
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}
          />

          <IonSkeletonText
            animated
            style={{
              width: '100%',
              height: '80px',
              borderRadius: '12px'
            }}
          />
        </IonCardContent>
      </IonCard>
    </div>
  );

  // Mobile Restriction Component
  const MobileRestrictionPage = () => (
    <IonPage>
      <IonContent className="ion-padding" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          maxWidth: '400px',
          padding: '40px 20px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          margin: '20px'
        }}>
          <IonIcon
            icon={desktopOutline}
            style={{
              fontSize: '64px',
              color: '#667eea',
              marginBottom: '20px'
            }}
          />
          <IonText>
            <h2 style={{
              color: '#2d3748',
              marginBottom: '16px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              Admin Portal Restricted
            </h2>
            <p style={{
              color: '#718096',
              lineHeight: '1.6',
              marginBottom: '30px',
              fontSize: '16px'
            }}>
              For security reasons, the admin portal is only accessible by an admin.
            </p>
          </IonText>
          <IonButton
            expand="block"
            onClick={() => navigation.push('/iAMUMAta')}
            style={{
              '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '--border-radius': '12px',
              marginTop: '20px'
            }}
          >
            <IonIcon icon={arrowBackOutline} slot="start" />
            Return to Home
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );

  if (isMobileDevice === null) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{
            '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
            '--color': 'white'
          } as any}>
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

  if (isMobileDevice) {
    return <MobileRestrictionPage />;
  }

  const showCustomToast = (message: string, color: 'primary' | 'success' | 'warning' | 'danger' = 'primary') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

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
          device_name: deviceName || 'Admin Device',
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

  const validateCredentials = async (email: string, password: string): Promise<boolean> => {
    setIsVerifying(true);
    
    // Validate specific email formats
    if (!(/^ldrrmo@manolofortich\.gov\.ph$/.test(email) || /^arielsumantin69@gmail\.com$/.test(email))) {
      showCustomToast('Only LDRRMO personnel can access admin.', 'warning');
      setIsVerifying(false);
      return false;
    }

    

    try {
      // Fetch user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_email, role')
        .eq('user_email', email)
        .maybeSingle();
      if (userError || !userData) {
        showCustomToast('Only an LDRRMO personnel can access admin.', 'danger');
        return false;
      }
      if (userData.role !== 'admin') {
        showCustomToast('Only an LDRRMO personnel can access admin.', 'danger');
        return false;
      }
      // Now validate password for admin
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showCustomToast('Credentials incorrect', 'danger');
        return false;
      }
      // Safely attempt signOut, but don't fail if it errors
      try {
        await supabase.auth.signOut(); // Don't persist session
      } catch (signOutError) {
        console.warn('SignOut error (non-critical):', signOutError);
      }
      return true;
    } catch (error: any) {
      showCustomToast('Login failed', 'danger');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const sendOtp = async () => {
    // No validation here - validation happens in handleLogin
    
    // Preserve current values
    const currentEmail = email;
    const currentPassword = password;

    const isValid = await validateCredentials(email, password);
    if (!isValid) {
      return false;
    }

    setIsSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });

      if (error) {
        throw error;
      }

      setOtpEmail(email);
      setShowOtpModal(true);
      showCustomToast('Verification code sent to your email! Valid for 60 seconds.', 'success');
      
      // Focus on OTP input when modal opens
      setTimeout(() => {
        otpInputRef.current?.setFocus();
      }, 300);
      
      return true;
    } catch (error: any) {
      console.error('OTP Send Error:', error);
      showCustomToast(error.message || 'Failed to send verification code. Please try again.', 'danger');
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyAndLogin = async () => {
  if (!otp) {
    return;
  }

  setIsVerifying(true);
  try {
    // Verify OTP token with proper validation
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: otpEmail || email,
      token: otp.trim(),
      type: 'email'
    });

    if (verifyError) {
      // Handle 403 Forbidden errors
      if (verifyError.status === 403 || verifyError.message?.includes('403') || verifyError.message?.includes('Forbidden')) {
        showCustomToast('Verification code is invalid or has expired. Please request a new one.', 'warning');
        setIsVerifying(false);
        setShowOtpModal(false);
        setOtp('');
        return;
      } else if (verifyError.message.includes('expired') || verifyError.message.includes('Token has expired')) {
        showCustomToast('Verification code expired. Please request a new one.', 'warning');
        setIsVerifying(false);
        setShowOtpModal(false);
        setOtp('');
        return;
      } else if (verifyError.message.includes('invalid') || verifyError.message.includes('Invalid')) {
        showCustomToast('Invalid verification code. Please try again.', 'danger');
        setIsVerifying(false);
        setOtp('');
        // Keep modal open so user can retry
        return;
      } else {
        throw verifyError;
      }
    }

    // Wait for auth state to update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Authentication failed. Please try again.');
    }

    // Use user_email instead of auth_user_id to avoid RLS policy issues
    const adminEmail = otpEmail || email;
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, role, user_email')
      .eq('user_email', adminEmail)
      .maybeSingle();

    if (dbError) {
      console.error('Database error:', dbError);
      // Safely attempt signOut, but don't fail if it errors
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.warn('SignOut error (non-critical):', signOutError);
      }
      throw new Error('Database configuration error. Please contact administrator.');
    }

    if (!userData || !userData.role || userData.role !== 'admin') {
      // Safely attempt signOut, but don't fail if it errors
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.warn('SignOut error (non-critical):', signOutError);
      }
      showCustomToast('Access denied: Administrative privileges required.', 'danger');
      setIsVerifying(false);
      setShowOtpModal(false);
      setOtp('');
      return;
    }

    // Save device as trusted after successful OTP verification
    if (user && deviceFingerprint && deviceFingerprint.length > 0) {
      try {
        await saveTrustedDevice(user.id, deviceFingerprint, 'Admin Device');
      } catch (error) {
        console.warn('Failed to save trusted device (non-critical):', error);
      }
    } else if (!deviceFingerprint || deviceFingerprint.length === 0) {
      // Generate fingerprint if not already set
      const fingerprint = await generateDeviceFingerprint();
      setDeviceFingerprint(fingerprint);
      if (user && fingerprint) {
        try {
          await saveTrustedDevice(user.id, fingerprint, 'Admin Device');
        } catch (error) {
          console.warn('Failed to save trusted device (non-critical):', error);
        }
      }
    }

    // Set success flag BEFORE closing modal to prevent cancelled toast
    setVerificationSuccess(true);
    
    // Log admin login activity
    await logAdminLogin(adminEmail);
    
    showCustomToast('Login successful! Redirecting to dashboard...', 'success');
    
    // Small delay to ensure state is set before modal closes
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setShowOtpModal(false);

    setTimeout(() => {
      navigation.push('/iAMUMAta/admin-dashboard', 'forward', 'replace');
    }, 1500);

  } catch (error: any) {
    console.error('Verification Error:', error);
    
    let errorMessage = 'Verification failed. Please try again.';
    let toastColor: 'danger' | 'warning' = 'danger';
    let shouldCloseModal = false;

    if (error.message?.includes('token has expired') || error.message?.includes('expired')) {
      errorMessage = 'Code expired after 60 seconds. Please request a new one.';
      toastColor = 'warning';
      shouldCloseModal = true;
    } else if (error.message?.includes('invalid') || error.message?.includes('Invalid')) {
      errorMessage = 'Invalid verification code. Please check and try again.';
      // Don't close modal, let user try again
    } else if (error.status === 403 || error.message?.includes('403') || error.message?.includes('Forbidden')) {
      errorMessage = 'Verification failed. The code may be invalid or expired. Please request a new one.';
      toastColor = 'warning';
      shouldCloseModal = true;
    } else if (error.message?.includes('Access denied')) {
      errorMessage = 'Access denied. Please contact administrator.';
      shouldCloseModal = true;
    } else if (error.message?.includes('Database configuration error')) {
      errorMessage = 'Database configuration error. Please contact administrator.';
      shouldCloseModal = true;
    } else if (error.message?.includes('Verify requires either a token or a token hash')) {
      errorMessage = 'Please enter a valid verification code.';
      // Don't close modal, let user try again
    } else {
      errorMessage = error.message || 'Verification failed. Please try again.';
    }

    showCustomToast(errorMessage, toastColor);
    
    if (shouldCloseModal) {
      setIsVerifying(false);
      setShowOtpModal(false);
      setOtp('');
    } else {
      setIsVerifying(false);
      // Keep modal open so user can retry
    }
  }
};

  const handleLogin = async () => {
    const currentEmail = email;
    const currentPassword = password;
    
    try {
      const isValid = await validateCredentials(currentEmail, currentPassword);
      if (!isValid) {
        return;
      }

      // After credentials are validated, sign in to get user ID
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword
      });

      if (signInError || !signInData.user) {
        // Sign out if sign in failed
        try {
          await supabase.auth.signOut();
        } catch {}
        return;
      }

      // Generate device fingerprint
      const fingerprint = await generateDeviceFingerprint();
      setDeviceFingerprint(fingerprint);
      
      // Check if device is trusted
      const isTrusted = await isDeviceTrusted(signInData.user.id, fingerprint);
      
      if (isTrusted) {
        // Device is trusted, proceed directly to dashboard without OTP
        // Update last_used_at for the device
        try {
          await supabase
            .from('device_fingerprints')
            .update({ last_used_at: new Date().toISOString() })
            .eq('user_id', signInData.user.id)
            .eq('device_fingerprint', fingerprint);
        } catch (error) {
          console.warn('Failed to update device last_used_at (non-critical):', error);
        }

        // Log admin login activity
        await logAdminLogin(currentEmail);
        
        showCustomToast('Login successful! Redirecting to dashboard...', 'success');
        
        setTimeout(() => {
          navigation.push('/iAMUMAta/admin-dashboard', 'forward', 'replace');
        }, 1000);
      } else {
        // Device not trusted, sign out and show OTP modal
        try {
          await supabase.auth.signOut();
        } catch {}
        
        setOtpEmail(currentEmail);
        await sendOtp();
      }
    } catch (error) {
      console.error('Login error:', error);
      showCustomToast('Login failed. Please try again.', 'danger');
    }
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordInputRef.current?.setFocus();
    }
  };

  const handlePasswordKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleLogin();
  }
};

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{
          '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
          '--color': 'white'
        } as any}>
          <IonButton
            slot="start"
            fill="clear"
            routerLink="/iAMUMAta"
            style={{ color: 'white' }}
            onClick={() => showCustomToast('Returning to home page...', 'primary')}
          >
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle style={{ fontWeight: 'bold' }}>Admin Portal</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{
        '--background': 'linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%)',
      } as any}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <IonCard style={{
            maxWidth: '480px',
            width: '100%',
            borderRadius: '20px',
            boxShadow: '0 20px 64px rgba(0,0,0,0.15)',
            border: '1px solid rgba(226,232,240,0.8)',
            overflow: 'hidden'
          }}>
            {/* Header Section */}
            <div style={{
              background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
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
                backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
                pointerEvents: 'none'
              }}></div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}>
                  <IonIcon icon={shield} style={{
                    fontSize: '36px',
                    color: '#e53e3e'
                  }} />
                </div>

                <h1 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 8px 0',
                  letterSpacing: '0.5px'
                }}>LDRRMO Portal</h1>

                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.8)',
                  margin: 0
                }}>Administrative Access Required</p>
              </div>
            </div>

            <IonCardContent style={{ padding: '40px 32px' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
              >
                <div style={{ marginBottom: '24px' }}>
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
                    }}>Administrative Email</label>
                  </div>
                  <IonInput
                    ref={emailInputRef}
                    id="email-input"
                    fill="outline"
                    type="email"
                    placeholder="ldrrmo@manolofortich.gov.ph"
                    value={email}
                    onIonInput={e => setEmail(e.detail.value!)}
                    onKeyDown={handleEmailKeyPress}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#e2e8f0',
                      '--padding-start': '16px',
                      '--padding-end': '16px',
                      fontSize: '16px'
                    } as any}
                  />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
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
                  <IonInput
                    ref={passwordInputRef}
                    id="password-input"
                    fill="outline"
                    type="password"
                    placeholder="Enter your secure password"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    onKeyDown={handlePasswordKeyPress}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#e2e8f0',
                      '--padding-start': '16px',
                      '--padding-end': '16px',
                      fontSize: '16px'
                    } as any}
                  >
                    <IonInputPasswordToggle slot="end" />
                  </IonInput>
                </div>

                <IonButton
                  type="submit"
                  expand="block"
                  size="large"
                  disabled={isSendingOtp}
                  style={{
                    '--border-radius': '12px',
                    '--padding-top': '16px',
                    '--padding-bottom': '16px',
                    fontWeight: '600',
                    fontSize: '16px',
                    height: '52px',
                    '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                    '--color': 'white',
                    marginBottom: '24px'
                  } as any}
                >
                  <IonIcon icon={shield} slot="start" />
                  {isSendingOtp ? 'Sending Verification...' : 'SECURE LOGIN'}
                </IonButton>
              </form>

              {/* Security Notice */}
              <div style={{
                background: 'linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%)',
                border: '1px solid #fbbf24',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <IonIcon icon={keyOutline} style={{
                  fontSize: '20px',
                  color: '#d69e2e',
                  marginBottom: '8px'
                }} />
                <p style={{
                  fontSize: '12px',
                  color: '#744210',
                  margin: '0 0 4px 0',
                  fontWeight: '600'
                }}>Two-Factor Authentication Required</p>
                <p style={{
                  fontSize: '11px',
                  color: '#975a16',
                  margin: 0,
                  lineHeight: '1.4'
                }}>A verification code will be sent to your email (valid for 60 seconds)</p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* OTP Verification Modal */}
        <IonModal
          isOpen={showOtpModal}
          onDidDismiss={() => {
            // Only show cancelled message if not successful and not verifying
            if (!verificationSuccess && !isVerifying) {
              showCustomToast('Verification cancelled', 'warning');
            }
            // Reset states only if not successful
            if (!verificationSuccess) {
              setOtp('');
            }
            setVerificationSuccess(false);
          }}
          backdropDismiss={!isVerifying}
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
                }}>Security Verification</h2>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.9)',
                  margin: 0
                }}>We've sent a 6-digit code to</p>
                <p style={{
                  fontSize: '13px',
                  color: 'white',
                  fontWeight: '600',
                  margin: '2px 0 0 0'
                }}>{email}</p>
              </div>

              <IonCardContent style={{ padding: '24px 20px' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    verifyAndLogin();
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
                      ref={otpInputRef}
                      fill="outline"
                      type="tel"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      placeholder="000000"
                      value={otp}
                      maxlength={6}
                      onIonChange={(e) => {
                        // Only allow numbers and limit to 6 characters
                        const value = e.detail.value || '';
                        const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
                        setOtp(numericValue);
                      }}
                      onKeyPress={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          verifyAndLogin();
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
                      onClick={() => {
                        setOtp('');
                        sendOtp();
                      }}
                      fill="clear"
                      disabled={isSendingOtp}
                      style={{
                        color: '#667eea',
                        fontSize: '14px'
                      }}
                    >
                      {isSendingOtp ? (
                        <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} />
                      ) : (
                        <IonIcon icon={refreshOutline} slot="start" />
                      )}
                      {isSendingOtp ? 'Sending...' : 'Resend Code'}
                    </IonButton>
                  </div>

                  <IonButton
                    type="submit"
                    expand="block"
                    size="large"
                    disabled={isVerifying || otp.length !== 6}
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
                    {isVerifying ? 'Verifying...' : 'VERIFY & ACCESS'}
                  </IonButton>
                </form>

                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => {
                    setShowOtpModal(false);
                    setIsVerifying(false);
                    setOtp('');
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

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminLogin;