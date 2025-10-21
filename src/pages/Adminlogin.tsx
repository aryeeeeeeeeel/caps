// src/pages/AdminLogin.tsx - FIXED OTP VERIFICATION & REMOVED REDUNDANT ALERTS
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
  IonIcon
} from '@ionic/react';
import { shield, lockClosedOutline, mailOutline, keyOutline, checkmarkCircleOutline, arrowBackOutline, desktopOutline } from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

const AdminLogin: React.FC = () => {
  const [isMobileDevice, setIsMobileDevice] = useState<boolean | null>(null);
  const navigation = useIonRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'primary' | 'success' | 'warning' | 'danger'>('primary');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const passwordInputRef = useRef<HTMLIonInputElement>(null);
  const otpInputRef = useRef<HTMLIonInputElement>(null);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };
    setTimeout(checkDevice, 800);
  }, []);

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
            onClick={() => navigation.push('/it35-lab2')}
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

  const validateCredentials = async (email: string, password: string): Promise<boolean> => {
    if (!email || !password) {
      showCustomToast('Please enter both email and password', 'warning');
      return false;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          showCustomToast('Invalid email or password. Please check your credentials.', 'danger');
          return false;
        } else if (error.message.includes('Email not confirmed')) {
          showCustomToast('Please verify your email address before logging in.', 'warning');
          return false;
        } else {
          showCustomToast(error.message || 'Login failed. Please try again.', 'danger');
          return false;
        }
      }

      await supabase.auth.signOut();
      return true;

    } catch (error: any) {
      showCustomToast(error.message || 'Login failed. Please check your credentials and try again.', 'danger');
      return false;
    }
  };

  const sendOtp = async () => {
    if (!email) {
      showCustomToast('Please enter your administrative email', 'warning');
      return false;
    }

    if (!password) {
      showCustomToast('Please enter your password', 'warning');
      return false;
    }

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

      setShowOtpModal(true);
      showCustomToast('Verification code sent to your email! Valid for 60 seconds.', 'success');
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
    if (!otp || otp.trim().length !== 6) {
      showCustomToast('Please enter a valid 6-digit verification code', 'warning');
      return;
    }

    setIsVerifying(true);
    try {
      // Verify OTP token
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: 'email'
      });

      if (verifyError) {
        // Handle specific error cases
        if (verifyError.message.includes('expired') || verifyError.message.includes('Token has expired')) {
          showCustomToast('Verification code expired. Please request a new one.', 'warning');
          setShowOtpModal(false);
          setOtp('');
          return;
        } else if (verifyError.message.includes('invalid') || verifyError.message.includes('Invalid')) {
          showCustomToast('Invalid verification code. Please try again.', 'danger');
          setOtp('');
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

      // Check admin role
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_uuid', user.id)
        .maybeSingle();

      if (dbError) {
        console.error('Database error:', dbError);
        await supabase.auth.signOut();
        throw new Error('Database configuration error. Please contact administrator.');
      }

      if (!userData || !userData.role || userData.role !== 'admin') {
        await supabase.auth.signOut();
        showCustomToast('Access denied: Administrative privileges required.', 'danger');
        setShowOtpModal(false);
        return;
      }

      showCustomToast('Login successful! Redirecting to dashboard...', 'success');
      
      // Set success flag BEFORE closing modal to prevent cancelled toast
      setVerificationSuccess(true);
      
      // Small delay to ensure state is set before modal closes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setShowOtpModal(false);

      setTimeout(() => {
        navigation.push('/it35-lab2/admin-dashboard', 'forward', 'replace');
      }, 1500);

    } catch (error: any) {
      console.error('Verification Error:', error);
      
      let errorMessage = 'Verification failed. Please try again.';
      let toastColor: 'danger' | 'warning' = 'danger';

      if (error.message?.includes('token has expired') || error.message?.includes('expired')) {
        errorMessage = 'Code expired after 60 seconds. Please request a new one.';
        toastColor = 'warning';
        setShowOtpModal(false);
        setOtp('');
      } else if (error.message?.includes('invalid') || error.message?.includes('Invalid')) {
        errorMessage = 'Invalid verification code. Please check and try again.';
        setOtp('');
      } else if (error.message?.includes('403') || error.message?.includes('Access denied')) {
        errorMessage = 'Access denied. Please contact administrator.';
        setShowOtpModal(false);
      } else {
        errorMessage = error.message || 'Verification failed. Please try again.';
      }

      showCustomToast(errorMessage, toastColor);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (e: CustomEvent) => {
  const value = e.detail.value!;
  const numericValue = value.replace(/\D/g, '').slice(0, 6);
  setOtp(numericValue);
  
  // Auto-verify when 6 digits are entered
  if (numericValue.length === 6) {
    verifyAndLogin();
  }
};

  const handleLogin = async () => {
    await sendOtp();
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      passwordInputRef.current?.setFocus();
    }
  };

  const handlePasswordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
            routerLink="/it35-lab2"
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
                    fill="outline"
                    type="email"
                    placeholder="ldrrmo@manolofortich.gov.ph"
                    value={email}
                    onIonChange={e => setEmail(e.detail.value!)}
                    onKeyPress={handleEmailKeyPress}
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
                    fill="outline"
                    type="password"
                    placeholder="Enter your secure password"
                    value={password}
                    onIonChange={e => setPassword(e.detail.value!)}
                    onKeyPress={handlePasswordKeyPress}
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
            // Only show cancelled message if not successful
            if (!verificationSuccess) {
              showCustomToast('Verification cancelled', 'warning');
            }
            // Reset states
            setOtp('');
            setVerificationSuccess(false);
          }}
          backdropDismiss={true}
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
                  margin: '2px 0 6px 0'
                }}>{email}</p>
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.8)',
                  margin: 0,
                  fontStyle: 'italic'
                }}>Code expires in 60 seconds</p>
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
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxlength={6}
                      placeholder="000000"
                      value={otp}
                      onIonChange={handleOtpChange}
                      onKeyPress={(e: React.KeyboardEvent) => {
                        if (!/^\d$/.test(e.key) &&
                          e.key !== 'Backspace' &&
                          e.key !== 'Delete' &&
                          e.key !== 'Tab' &&
                          e.key !== 'Enter' &&
                          e.key !== 'ArrowLeft' &&
                          e.key !== 'ArrowRight' &&
                          e.key !== 'Home' &&
                          e.key !== 'End') {
                          e.preventDefault();
                        }
                        if (e.key === 'Enter' && otp.length === 6) {
                          verifyAndLogin();
                        }
                      }}
                      style={{
                        '--border-radius': '10px',
                        '--border-color': '#e2e8f0',
                        '--padding-start': '16px',
                        '--padding-end': '16px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textAlign: 'center',
                        letterSpacing: '3px'
                      } as any}
                    />
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
                    <IonIcon icon={shield} slot="start" />
                    {isVerifying ? 'Verifying...' : 'VERIFY & ACCESS'}
                  </IonButton>
                </form>

                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#718096',
                    margin: 0
                  }}>
                    Didn't receive the code?{' '}
                    <span
                      style={{
                        color: '#667eea',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onClick={() => {
                        setOtp('');
                        sendOtp();
                      }}
                    >
                      Resend
                    </span>
                  </p>
                </div>

                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => {
                    setShowOtpModal(false);
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