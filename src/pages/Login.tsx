// src/pages/Login.tsx
import {
  IonButton,
  IonContent,
  IonPage,
  IonInput,
  useIonRouter,
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
  IonPopover,
  IonBadge
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
  timeOutline,
  closeOutline,
  trashOutline,
  addOutline
} from 'ionicons/icons';
import { useState, useRef, useEffect } from 'react';
import {
  supabase,
  saveUserCredentials,
  getSavedCredentials,
  isRememberMeEnabled,
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
  displayName?: string; // For better display in the list
}

// Updated utility functions to handle multiple accounts
const getSavedAccounts = (): SavedAccount[] => {
  try {
    const savedAccounts = localStorage.getItem('savedAccounts');
    const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
    // Always sort by lastLogin descending to maintain consistent order
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
      // Update existing account
      existingAccounts[accountIndex] = newAccount;
    } else {
      // Add new account
      existingAccounts.push(newAccount);
    }

    // Keep only the last 5 accounts and sort by lastLogin
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

// Helper function to format time ago
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
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const popoverRef = useRef<HTMLIonPopoverElement>(null);
  const avatarButtonRef = useRef<HTMLIonButtonElement>(null);

  // Load saved accounts on component mount
  useEffect(() => {
    const loadSavedAccounts = () => {
      try {
        const accounts = getSavedAccounts();
        const rememberEnabled = isRememberMeEnabled();

        setRememberMe(rememberEnabled);
        setSavedAccounts(accounts);

        // For security purposes, always start with empty fields
        // Users must explicitly select a saved account if they want to use it
        setLoginIdentifier('');
        setPassword('');
      } catch (error) {
        console.warn('Error loading saved accounts:', error);
      }
    };

    loadSavedAccounts();
  }, []);

  // Handle avatar icon click to show saved accounts
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (savedAccounts.length > 0) {
      setShowSavedAccounts(true);
    }
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

      // Attempt login first - DO NOT save credentials until login is successful
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

      // Login successful! Now save credentials if remember me is checked
      if (rememberMe) {
        saveAccount(loginIdentifier, password);
        setSavedAccounts(getSavedAccounts());
        localStorage.setItem('rememberMe', 'true');
      } else {
        // Clear remember me preference but keep existing accounts
        localStorage.removeItem('rememberMe');
      }

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

  const handleUseSavedAccount = (account: SavedAccount) => {
    setLoginIdentifier(account.identifier);
    setPassword(account.password);
    setShowSavedAccounts(false);

    // Auto-focus on password field for quick login
    setTimeout(() => {
      passwordInputRef.current?.setFocus();
    }, 100);
  };

  const handleRemoveAccount = (identifier: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the account selection
    removeAccount(identifier);
    const updatedAccounts = getSavedAccounts();
    setSavedAccounts(updatedAccounts);
    
    if (updatedAccounts.length === 0) {
      setShowSavedAccounts(false);
    }

    setAlertMessage(`Account "${identifier}" has been removed from saved accounts.`);
    setShowAlert(true);
  };

  const handleClearAllAccounts = () => {
    clearAllAccounts();
    setSavedAccounts([]);
    setLoginIdentifier('');
    setPassword('');
    setRememberMe(false);
    setShowSavedAccounts(false);
    setAlertMessage('All saved accounts have been cleared.');
    setShowAlert(true);
  };

  const handleNewAccountLogin = () => {
    setLoginIdentifier('');
    setPassword('');
    setShowSavedAccounts(false);

    setTimeout(() => {
      loginIdentifierInputRef.current?.setFocus();
    }, 100);
  };

  // Check if current input matches a saved account
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
                    onKeyPress={handleKeyPress}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#e2e8f0',
                      '--padding-start': '16px',
                      '--padding-end': savedAccounts.length > 0 ? '50px' : '16px',
                      fontSize: '16px'
                    } as any}
                  />
                  
                  {/* Show saved accounts avatar icon when accounts exist */}
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

                {/* Password Input with Toggle */}
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
                      {rememberMe 
                        ? `Save login details (${savedAccounts.length} account${savedAccounts.length !== 1 ? 's' : ''} saved)`
                        : 'Do not save login details'
                      }
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

        {/* 2FA Modal */}
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