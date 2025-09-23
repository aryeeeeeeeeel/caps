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
  IonModal,
  IonCheckbox,
  IonLabel,
  IonText,
  IonItem,
  IonList,
  IonAvatar,
  IonPopover
} from '@ionic/react';
import {
  personCircleOutline,
  mailOutline,
  lockClosedOutline,
  logInOutline,
  arrowBackOutline,
  peopleOutline,
  phonePortraitOutline,
  eyeOffOutline,
  eyeOutline,
  chevronDownOutline,
  timeOutline,
  closeOutline
} from 'ionicons/icons';
import { useState, useRef, useEffect } from 'react';
import {
  supabase,
  saveUserCredentials,
  getSavedCredentials,
  isRememberMeEnabled,
  hasSavedCredentials,
  clearUserCredentials
} from '../utils/supabaseClient';

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

interface SavedAccount {
  identifier: string;
  password: string;
  lastLogin: string;
}

const Login: React.FC = () => {
  const navigation = useIonRouter();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);
  const loginIdentifierInputRef = useRef<HTMLIonInputElement>(null);
  const passwordInputRef = useRef<HTMLIonInputElement>(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [savedAccount, setSavedAccount] = useState<SavedAccount | null>(null);
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    const loadSavedCredentials = () => {
      try {
        const credentials = getSavedCredentials();
        const rememberEnabled = isRememberMeEnabled();

        setRememberMe(rememberEnabled);

        if (credentials) {
          setSavedAccount({
            identifier: credentials.identifier,
            password: credentials.password,
            lastLogin: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn('Error loading saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  // Handle identifier input focus
  const handleIdentifierFocus = () => {
    setIsIdentifierFocused(true);
    if (savedAccount) {
      setShowSavedAccounts(true);
    }
  };

  const handleIdentifierBlur = () => {
    // Delay hiding to allow for clicking on saved account
    setTimeout(() => {
      setIsIdentifierFocused(false);
      setShowSavedAccounts(false);
    }, 200);
  };

  // Global Enter key handler
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showSavedAccounts) {
        const activeElement = document.activeElement;
        const isFocusedOnInput = activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'ION-INPUT' ||
          activeElement?.closest('ion-input');

        if (!isFocusedOnInput) {
          handleLogin();
        }
      }
    };

    window.addEventListener('keypress', handleGlobalKeyPress);

    return () => {
      window.removeEventListener('keypress', handleGlobalKeyPress);
    };
  }, [loginIdentifier, password, showSavedAccounts]);

  // Focus on login identifier input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loginIdentifierInputRef.current && !savedAccount) {
        loginIdentifierInputRef.current.setFocus();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [savedAccount]);

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
        const { data, error } = await supabase
          .from('users')
          .select('user_email')
          .eq('username', loginIdentifier)
          .single();

        if (error || !data) {
          throw new Error('Invalid username. Please check your credentials.');
        }
        userEmail = data.user_email;
      }

      // Save credentials if remember me is checked
      if (rememberMe) {
        saveUserCredentials(loginIdentifier, password, true);
      } else {
        // Clear saved credentials if remember me is unchecked
        clearUserCredentials();
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (error) {
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

      // Login successful
      setShowToast(true);

      // Clear focus from inputs
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

      // Redirect after a short delay
      setTimeout(() => {
        navigation.push('/it35-lab2/app', 'forward', 'replace');
      }, 800);

    } catch (error: any) {
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    setAlertMessage('Password reset feature is coming soon. Please contact support if you need assistance.');
    setShowAlert(true);
  };

  const handleUseSavedAccount = () => {
    if (savedAccount) {
      setLoginIdentifier(savedAccount.identifier);
      setPassword(savedAccount.password);
      setShowSavedAccounts(false);
      setIsIdentifierFocused(false);

      // Auto-focus on password field for quick login
      setTimeout(() => {
        passwordInputRef.current?.setFocus();
      }, 100);
    }
  };

  const handleClearSavedAccount = () => {
    clearUserCredentials();
    setSavedAccount(null);
    setLoginIdentifier('');
    setPassword('');
    setRememberMe(false);
    setShowSavedAccounts(false);
    setAlertMessage('Saved account has been cleared.');
    setShowAlert(true);
  };

  const handleNewAccountLogin = () => {
    setLoginIdentifier('');
    setPassword('');
    setShowSavedAccounts(false);
    setIsIdentifierFocused(false);

    setTimeout(() => {
      loginIdentifierInputRef.current?.setFocus();
    }, 100);
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
              {/* Saved Accounts Dropdown (like Facebook) */}
              {savedAccount && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '32px',
                  right: '32px',
                  zIndex: 1000,
                  display: showSavedAccounts && isIdentifierFocused ? 'block' : 'none'
                }}>
                  <IonCard style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    margin: 0
                  }}>
                    <IonCardContent style={{ padding: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                      }}>
                        <IonText style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
                          Saved Account
                        </IonText>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => setShowSavedAccounts(false)}
                          style={{ '--padding-start': '4px', '--padding-end': '4px', height: '24px' } as any}
                        >
                          <IonIcon icon={closeOutline} style={{ fontSize: '16px' }} />
                        </IonButton>
                      </div>

                      <IonItem
                        button
                        detail={false}
                        onClick={handleUseSavedAccount}
                        style={{
                          '--background': 'transparent',
                          '--border-radius': '8px',
                          '--padding-start': '12px',
                          '--padding-end': '12px',
                          marginBottom: '8px'
                        } as any}
                      >
                        <IonAvatar slot="start" style={{ width: '36px', height: '36px' }}>
                          <IonIcon icon={personCircleOutline} style={{ fontSize: '36px', color: '#667eea' }} />
                        </IonAvatar>
                        <IonLabel>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#2d3748' }}>
                            {savedAccount.identifier}
                          </h3>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                            Click to auto-fill
                          </p>
                        </IonLabel>
                      </IonItem>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <IonButton
                          expand="block"
                          size="small"
                          onClick={handleClearSavedAccount}
                          fill="outline"
                          style={{
                            '--border-radius': '6px',
                            '--color': '#ef4444',
                            '--border-color': '#ef4444',
                            fontSize: '12px',
                            height: '32px'
                          } as any}
                        >
                          Clear Saved
                        </IonButton>
                        <IonButton
                          expand="block"
                          size="small"
                          onClick={handleNewAccountLogin}
                          fill="outline"
                          style={{
                            '--border-radius': '6px',
                            '--color': '#667eea',
                            '--border-color': '#667eea',
                            fontSize: '12px',
                            height: '32px'
                          } as any}
                        >
                          Different Account
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </div>
              )}

              {/* Login Form */}
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
                  onFocus={handleIdentifierFocus}
                  onBlur={handleIdentifierBlur}
                  style={{
                    '--border-radius': '12px',
                    '--border-color': isIdentifierFocused ? '#667eea' : '#e2e8f0',
                    '--padding-start': '16px',
                    '--padding-end': '16px',
                    fontSize: '16px'
                  } as any}
                />
                {savedAccount && loginIdentifier === savedAccount.identifier && (
                  <IonText color="success" style={{ fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                    <IonIcon icon={timeOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                    Using saved account
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

                {/* Fixed Password Input with Toggle */}
                <IonInput
                  ref={passwordInputRef}
                  fill="outline"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onIonChange={e => setPassword((e.detail.value ?? ""))}
                  onKeyPress={handleKeyPress}
                  style={{
                    '--border-radius': '12px',
                    '--border-color': '#e2e8f0',
                    '--padding-start': '16px',
                    '--padding-end': '2px',
                    fontSize: '16px'
                  } as any}
                >
                  {/* Add the password toggle button inside IonInput */}
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
                      {rememberMe ? 'Save login details for quick access' : 'Do not save login details'}
                    </IonText>
                  </div>
                </div>
              </div>

              {/* Login Button */}
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

              {/* Create Account Button */}
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