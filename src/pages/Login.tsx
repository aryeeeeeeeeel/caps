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
  IonTitle
} from '@ionic/react';
import { personCircleOutline, mailOutline, lockClosedOutline, logInOutline, arrowBackOutline, peopleOutline } from 'ionicons/icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const emailInputRef = useRef<HTMLIonInputElement>(null);
  const passwordInputRef = useRef<HTMLIonInputElement>(null);

  // Focus on email input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.setFocus();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertMessage('Please enter both email and password');
      setShowAlert(true);
      return;
    }

    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setShowToast(true);

      // Clear focus from inputs before navigation to prevent aria-hidden issues
      if (emailInputRef.current) {
        try {
          const el = await emailInputRef.current.getInputElement();
          el.blur();
        } catch (err) {
          console.warn('Could not blur email input:', err);
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
      setAlertMessage(error.message || 'Login failed. Please check your credentials and try again.');
      setShowAlert(true);
    } finally {
      setIsLoggingIn(false);
    }
  }; // Removed the dependency array that was causing the error

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }, [handleLogin]);

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
                  }}>Email Address</label>
                </div>
                <IonInput
                  ref={emailInputRef}
                  fill="outline"
                  type="email"
                  placeholder="your.email@nbsc.edu.ph"
                  value={email}
                  onIonChange={e => setEmail(e.detail.value!)}
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
                  onIonChange={e => setPassword(e.detail.value!)}
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
      </IonContent>
    </IonPage>
  );
};

export default Login;