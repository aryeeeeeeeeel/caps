// src/pages/AdminLogin.tsx
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
  IonTitle
} from '@ionic/react';
import { shield, lockClosedOutline, mailOutline, keyOutline, checkmarkCircleOutline, arrowBackOutline } from 'ionicons/icons';
import { useState } from 'react';
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

  const sendOtp = async () => {
    if (!email) {
      setAlertMessage('Please enter your administrative email');
      setShowAlert(true);
      return false;
    }

    setIsSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: false
        }
      });

      if (error) throw error;
      
      setShowOtpModal(true);
      setShowToast(true);
      return true;
    } catch (error: any) {
      setAlertMessage(error.message || 'Failed to send verification code');
      setShowAlert(true);
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyAndLogin = async () => {
  if (!otp) {
    setAlertMessage('Please enter the verification code');
    setShowAlert(true);
    return;
  }

  setIsVerifying(true);
  try {
    // Verify OTP - this automatically signs the user in
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });
    if (otpError) throw otpError;

    // User is now authenticated, check their role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_uuid', user.id)
      .maybeSingle();
    
    if (userError) {
      console.error('Database error:', userError);
      await supabase.auth.signOut();
      throw new Error('Database configuration error. Please contact administrator.');
    }
    
    if (!userData || !userData.role || userData.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('Access denied: Administrative privileges required.');
    }

    setShowToast(true);
    setTimeout(() => {
      navigation.push('/it35-lab2/admin-dashboard', 'forward', 'replace');
    }, 500);
    
    setShowOtpModal(false);
  } catch (error: any) {
    setAlertMessage(error.message || 'Verification failed. Please try again.');
    setShowAlert(true);
  } finally {
    setIsVerifying(false);
  }
};

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertMessage('Please enter both email and password');
      setShowAlert(true);
      return;
    }
    await sendOtp();
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
                  fill="outline"
                  type="password"
                  placeholder="Enter your secure password"
                  value={password}
                  onIonChange={e => setPassword(e.detail.value!)}
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
        <IonModal isOpen={showOtpModal} onDidDismiss={() => setShowOtpModal(false)}>
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
                maxWidth: '400px',
                width: '100%',
                borderRadius: '20px',
                boxShadow: '0 20px 64px rgba(0,0,0,0.15)',
                overflow: 'hidden'
              }}>
                {/* Modal Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #3182ce 0%, #2c5282 100%)',
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
                    <IonIcon icon={checkmarkCircleOutline} style={{ 
                      fontSize: '28px',
                      color: 'white'
                    }} />
                  </div>
                  <h2 style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 8px 0'
                  }}>Security Verification</h2>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.9)',
                    margin: 0
                  }}>We've sent a 6-digit code to</p>
                  <p style={{
                    fontSize: '14px',
                    color: 'white',
                    fontWeight: '600',
                    margin: '4px 0 0 0'
                  }}>{email}</p>
                </div>

                <IonCardContent style={{ padding: '32px 24px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2d3748',
                      display: 'block',
                      marginBottom: '12px'
                    }}>Verification Code</label>
                    <IonInput
                      fill="outline"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxlength={6}
                      placeholder="000000"
                      value={otp}
                      onIonChange={e => setOtp(e.detail.value!)}
                      style={{
                        '--border-radius': '12px',
                        '--border-color': '#e2e8f0',
                        '--padding-start': '16px',
                        '--padding-end': '16px',
                        fontSize: '18px',
                        fontWeight: '600',
                        textAlign: 'center',
                        letterSpacing: '4px'
                      } as any}
                    />
                  </div>
                  
                  <IonButton 
                    expand="block"
                    size="large"
                    onClick={verifyAndLogin}
                    disabled={isVerifying}
                    style={{
                      '--border-radius': '12px',
                      '--padding-top': '16px',
                      '--padding-bottom': '16px',
                      fontWeight: '600',
                      fontSize: '16px',
                      height: '52px',
                      '--background': 'linear-gradient(135deg, #3182ce 0%, #2c5282 100%)',
                      '--color': 'white',
                      marginBottom: '16px'
                    } as any}
                  >
                    <IonIcon icon={shield} slot="start" />
                    {isVerifying ? 'Verifying...' : 'VERIFY & ACCESS'}
                  </IonButton>
                  
                  <IonButton 
                    expand="block"
                    fill="clear"
                    onClick={() => setShowOtpModal(false)}
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

        <AlertBox 
          message={alertMessage} 
          isOpen={showAlert} 
          onClose={() => setShowAlert(false)} 
        />
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Verification code sent to your administrative email!"
          duration={3000}
          position="top"
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminLogin;