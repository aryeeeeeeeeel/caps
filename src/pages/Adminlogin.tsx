// src/pages/AdminLogin.tsx - UPDATED WITH TOAST MESSAGES
import {
  IonButton,
  IonContent,
  IonPage,
  IonInput,
  useIonRouter,
  IonInputPasswordToggle,
  IonAlert,
  IonToast,
  IonModal,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonCard,
  IonCardContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonText
} from '@ionic/react';
import { shield, lockClosedOutline, mailOutline, keyOutline, checkmarkCircleOutline, arrowBackOutline, desktopOutline } from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onClose}
      header="Admin Notification"
      message={message}
      buttons={['OK']}
    />
  );
};

const AdminLogin: React.FC = () => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const navigation = useIonRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'primary' | 'success' | 'warning' | 'danger'>('primary');
  const passwordInputRef = useRef<HTMLIonInputElement>(null);
  const otpInputRef = useRef<HTMLIonInputElement>(null);

  useEffect(() => {
    // Device detection logic
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };

    checkDevice();
  }, []);

  // Show mobile restriction message if accessed from mobile
  if (isMobileDevice) {
    return (
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
  }

  // Show toast with custom message and color
  const showCustomToast = (message: string, color: 'primary' | 'success' | 'warning' | 'danger' = 'primary') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  // Password validation - similar to your user login
  const validateCredentials = async (email: string, password: string): Promise<boolean> => {
    if (!email || !password) {
      setAlertMessage('Please enter both email and password');
      setShowAlert(true);
      return false;
    }

    // First attempt to login with password to validate credentials
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setAlertMessage('Invalid email or password. Please check your credentials.');
          setShowAlert(true);
          return false;
        } else if (error.message.includes('Email not confirmed')) {
          setAlertMessage('Please verify your email address before logging in.');
          setShowAlert(true);
          return false;
        } else {
          setAlertMessage(error.message || 'Login failed. Please try again.');
          setShowAlert(true);
          return false;
        }
      }

      // If login successful, sign out immediately since we only needed to validate
      // We'll use OTP for the actual login
      await supabase.auth.signOut();
      return true;

    } catch (error: any) {
      setAlertMessage(error.message || 'Login failed. Please check your credentials and try again.');
      setShowAlert(true);
      return false;
    }
  };

  const sendOtp = async () => {
    if (!email) {
      setAlertMessage('Please enter your administrative email');
      setShowAlert(true);
      return false;
    }

    // Validate password before sending OTP
    const isValid = await validateCredentials(email, password);
    if (!isValid) {
      return false;
    }

    setIsSendingOtp(true);
    try {
      // FIX: Use signInWithOtp with proper options
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/it35-lab2/admin-dashboard`,
          shouldCreateUser: false
        }
      });

      if (error) throw error;

      setShowOtpModal(true);
      showCustomToast('Verification code sent to your email!', 'success');
      return true;
    } catch (error: any) {
      console.error('OTP Send Error:', error);
      setAlertMessage(error.message || 'Failed to send verification code. Please try again.');
      setShowAlert(true);
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyAndLogin = async () => {
    // FIX: Better OTP validation
    if (!otp || otp.trim().length < 6) {
      setAlertMessage('Please enter a valid 6-digit verification code');
      setShowAlert(true);
      return;
    }

    setIsVerifying(true);
    try {
      // FIX: Use the correct verification method
      // First try with email type
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: 'email'
      });

      if (verifyError) {
        // If email type fails, try magiclink type
        const { data: magicLinkData, error: magicLinkError } = await supabase.auth.verifyOtp({
          email,
          token: otp.trim(),
          type: 'magiclink'
        });

        if (magicLinkError) {
          // If both fail, throw the original error
          throw verifyError;
        }
      }

      // User is now authenticated, check their role
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication failed. Please try again.');
      }

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
        throw new Error('Access denied: Administrative privileges required.');
      }

      // SUCCESSFUL LOGIN TOAST
      showCustomToast('Login successful! Redirecting to dashboard...', 'success');
      
      // FIX: Use proper navigation
      setTimeout(() => {
        navigation.push('/it35-lab2/admin-dashboard', 'forward', 'replace');
      }, 1500);

      setShowOtpModal(false);
    } catch (error: any) {
      console.error('Verification Error:', error);
      
      // FIX: Better error messages
      let errorMessage = 'Verification failed. Please try again.';
      if (error.message.includes('token has expired')) {
        errorMessage = 'Verification code has expired. Please request a new one.';
        showCustomToast('Verification code expired. Please request a new one.', 'warning');
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Invalid verification code. Please check and try again.';
        showCustomToast('Invalid verification code. Please try again.', 'danger');
      } else {
        errorMessage = error.message || 'Verification failed. Please try again.';
        showCustomToast('Verification failed. Please try again.', 'danger');
      }
      
      setAlertMessage(errorMessage);
      setShowAlert(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogin = async () => {
    await sendOtp();
  };

  // FIX: Improved OTP input handling
  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(numericValue);
  };

  // Handle Enter key in email field
  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      passwordInputRef.current?.setFocus();
    }
  };

  // Handle Enter key in password field
  const handlePasswordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Handle Enter key in OTP field
  const handleOtpKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyAndLogin();
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
              {/* Background Pattern */}
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
              {/* Wrap form elements in a form tag for better Enter key handling */}
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
                    placeholder="admin@ldrrmo.manolo-fortich.gov.ph"
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
                }}>For security, a verification code will be sent to your registered email</p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* OTP Verification Modal */}
        <IonModal
          isOpen={showOtpModal}
          onDidDismiss={() => {
            setShowOtpModal(false);
            setOtp(''); // Reset OTP when modal closes
            showCustomToast('Verification cancelled', 'warning');
          }}
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
              {/* Modal Header */}
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
                {/* Wrap OTP form for Enter key handling */}
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
                      // FIX: Use the improved OTP change handler
                      onIonInput={e => handleOtpChange(e.detail.value!)}
                      onKeyPress={handleOtpKeyPress}
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
                    disabled={isVerifying || otp.length < 6}
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

                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtp(''); // Reset OTP
                    showCustomToast('Verification cancelled', 'warning');
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

        <AlertBox
          message={alertMessage}
          isOpen={showAlert}
          onClose={() => setShowAlert(false)}
        />

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