// src/pages/Login.tsx
import {
    IonButton,
    IonContent,
    IonPage,
    IonInput,
    useIonRouter,
    IonInputPasswordToggle,
    IonAlert,
    IonToast,
    IonIcon,
    IonCard,
    IonCardContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonModal
} from '@ionic/react';
import { personCircleOutline, mailOutline, lockClosedOutline, logInOutline, arrowBackOutline, peopleOutline, phonePortraitOutline } from 'ionicons/icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { IonCheckbox, IonLabel } from '@ionic/react';

const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onClose}
      header="Login Notification"
      message={message}
      buttons={['OK']}
    />
  );
};

const Login: React.FC = () => {
  const navigation = useIonRouter();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const loginIdentifierInputRef = useRef<HTMLIonInputElement>(null);
  const passwordInputRef = useRef<HTMLIonInputElement>(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  // Add global Enter key handler
useEffect(() => {
  const handleGlobalKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Check if we're NOT focused on any input field
      const activeElement = document.activeElement;
      const isFocusedOnInput = activeElement?.tagName === 'INPUT' || 
                              activeElement?.tagName === 'ION-INPUT' ||
                              activeElement?.closest('ion-input');
      
      // Only trigger login if we're NOT focused on an input field
      if (!isFocusedOnInput) {
        handleLogin();
      }
    }
  };

  window.addEventListener('keypress', handleGlobalKeyPress);
  
  return () => {
    window.removeEventListener('keypress', handleGlobalKeyPress);
  };
}, [loginIdentifier, password]);

  // Focus on login identifier input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loginIdentifierInputRef.current) {
        loginIdentifierInputRef.current.setFocus();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
  if (!loginIdentifier || !password) {
    setAlertMessage('Please enter both email/username and password');
    setShowAlert(true);
    return;
  }

  setIsLoggingIn(true);
  try {
    let userEmail = loginIdentifier;

    // Check if the loginIdentifier is an email or a username
    if (!loginIdentifier.includes('@')) {
      // Assume it's a username, query the users table to get the email
      const { data, error } = await supabase
        .from('users')
        .select('user_email')
        .eq('username', loginIdentifier)
        .single();

      if (error || !data) {
        // Show specific error for invalid username
        throw new Error('Invalid username. Please check your credentials.');
      }
      userEmail = data.user_email;
    }

    // Supabase handles session persistence by default.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    });

    if (error) {
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email/username or password. Please try again.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email address before logging in.');
      } else if (error.message.includes('A new device has been detected')) {
        setShow2FAModal(true);
        return;
      } else {
        throw new Error(error.message);
      }
    }

    setShowToast(true);

    // Clear focus from inputs before navigation to prevent aria-hidden issues
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

    setTimeout(() => {
      navigation.push('/it35-lab2/app', 'forward', 'replace');
    }, 800);
  } catch (error: any) {
    // Show the actual error message instead of generic one
    setAlertMessage(error.message || 'Login failed. Please check your credentials and try again.');
    setShowAlert(true);
  } finally {
    setIsLoggingIn(false);
  }
};

const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        if (e.currentTarget === loginIdentifierInputRef.current) {
            passwordInputRef.current?.setFocus();
        } else if (e.currentTarget === passwordInputRef.current) {
            handleLogin();
        }
    }
};

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
            routerLink="/it35-lab2"
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
            overflow: 'hidden'
          }}>
            {/* Header Section */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                }}>Welcome Back</h1>

                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.9)',
                  margin: 0
                }}>Report incidents, keep your community safe</p>
              </div>
            </div>

            <IonCardContent style={{ padding: '40px 32px' }}>
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
                  }}>Email or Username</label>
                </div>
                <IonInput
                  ref={loginIdentifierInputRef}
                  fill="outline"
                  type="text"
                  placeholder="your.email@example.com or username"
                  value={loginIdentifier}
                  onIonChange={e => setLoginIdentifier((e.detail.value ?? ""))}
                  onKeyPress={handleKeyPress}
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
                  placeholder="Enter your password"
                  value={password}
                  onIonChange={e => setPassword((e.detail.value ?? ""))}
                  onKeyPress={handleKeyPress}
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

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                <IonCheckbox
                  checked={rememberMe}
                  onIonChange={e => setRememberMe(e.detail.checked)}
                  style={{ '--checkbox-background-checked': '#667eea', '--border-color-checked': '#667eea', marginRight: '8px' }}
                />
                <IonLabel style={{ fontSize: '14px', color: '#4a5568' }}>Remember Me</IonLabel>
              </div>

              <IonButton
                onClick={handleLogin}
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
                <IonIcon icon={logInOutline} slot="start" />
                {isLoggingIn ? 'Signing In...' : 'SIGN IN'}
              </IonButton>

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

              <IonButton
                routerLink="/it35-lab2/register"
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
                }}>Help make Manolo Fortich safer by reporting hazards and incidents in your area</p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <AlertBox
          message={alertMessage}
          isOpen={showAlert}
          onClose={() => setShowAlert(false)}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Welcome back! Redirecting to your dashboard..."
          duration={3000}
          position="top"
          color="success"
        />

        {/* 2FA Modal Placeholder */}
        <IonModal isOpen={show2FAModal} onDidDismiss={() => setShow2FAModal(false)}>
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
                maxWidth: '450px',
                width: '100%',
                borderRadius: '20px',
                boxShadow: '0 20px 64px rgba(0,0,0,0.15)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '30px 24px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={phonePortraitOutline} style={{
                      fontSize: '28px',
                      color: 'white'
                    }} />
                  </div>
                  <h2 style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 8px 0'
                  }}>Two-Factor Authentication</h2>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.9)',
                    margin: 0
                  }}>Please enter the code sent to your registered device.</p>
                </div>

                <IonCardContent style={{ padding: '32px 24px' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <IonInput
                      fill="outline"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={twoFACode}
                      onIonChange={e => setTwoFACode(e.detail.value!)}
                      style={{
                        '--border-radius': '12px',
                        '--border-color': '#e2e8f0',
                        '--padding-start': '16px',
                        '--padding-end': '16px',
                        fontSize: '16px',
                        textAlign: 'center'
                      } as any}
                    />
                  </div>

                  <IonButton
                    onClick={() => {
                      // Placeholder for 2FA verification logic
                      setAlertMessage('2FA verification is not fully implemented in this demo.');
                      setShowAlert(true);
                      setShow2FAModal(false);
                    }}
                    expand="block"
                    size="large"
                    style={{
                      '--border-radius': '12px',
                      '--padding-top': '16px',
                      '--padding-bottom': '16px',
                      fontWeight: '600',
                      fontSize: '16px',
                      height: '52px',
                      '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '--color': 'white',
                      marginBottom: '12px'
                    } as any}
                  >
                    VERIFY CODE
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={() => setShow2FAModal(false)}
                    style={{
                      color: '#718096',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Login;