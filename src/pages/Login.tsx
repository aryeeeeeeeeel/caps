import { 
  IonButton,
  IonContent, 
  IonPage,
  IonInput,
  useIonRouter,
  IonInputPasswordToggle,
  IonAvatar,
  IonAlert,
  IonToast,
  IonModal,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import Icon1 from '../../img/Icon1.jpg';
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onClose}
      header="Notification"
      message={message}
      buttons={['OK']}
    />
  );
};

const Login: React.FC = () => {
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
      setAlertMessage('Please enter your email');
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
      setAlertMessage(error.message || 'Failed to send OTP');
      setShowAlert(true);
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyAndLogin = async () => {
    if (!otp || !password) {
      setAlertMessage('Please enter both OTP and password');
      setShowAlert(true);
      return;
    }

    setIsVerifying(true);
    try {
      // Verify OTP first
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });
      if (otpError) throw otpError;

      // Then login with password
      const { error: loginError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (loginError) throw loginError;

      setShowToast(true);
      setTimeout(() => {
        navigation.push('/TRA-Manolo-Fortich/app', 'forward', 'replace');
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
      <IonContent className='ion-padding'>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '25%'
        }}>
          <IonAvatar style={{
            width: '150px',
            height: '150px',
            marginBottom: '20px'
          }}>
            <img src={Icon1} alt="User Avatar" />
          </IonAvatar>
          
          <h1>USER LOGIN</h1>
          
          <IonInput
            label="Email"
            labelPlacement="floating"
            fill="outline"
            type="email"
            placeholder="Enter Email"
            value={email}
            onIonChange={e => setEmail(e.detail.value!)}
            style={{ marginBottom: '10px' }}
          />
          
          <IonInput
            fill="outline"
            type="password"
            placeholder="Password"
            value={password}
            onIonChange={e => setPassword(e.detail.value!)}
          >
            <IonInputPasswordToggle slot="end" />
          </IonInput>
        </div>

        <IonButton 
          onClick={handleLogin} 
          expand="full" 
          shape="round"
          disabled={isSendingOtp}
        >
          {isSendingOtp ? 'Sending OTP...' : 'Login'}
        </IonButton>

        <IonButton 
          routerLink="/TRA-Manolo-Fortich/register" 
          expand="full" 
          fill="clear" 
          shape="round"
        >
          Don't have an account? Register here
        </IonButton>

        {/* OTP Verification Modal */}
        <IonModal isOpen={showOtpModal} onDidDismiss={() => setShowOtpModal(false)}>
          <IonContent className="ion-padding">
            <IonGrid>
              <IonRow className="ion-justify-content-center">
                <IonCol size="12" sizeMd="8" sizeLg="6">
                  <div style={{ textAlign: 'center', marginTop: '50%' }}>
                    <IonLabel>
                      <h2>Two-Factor Verification</h2>
                      <p>We've sent a 6-digit code to {email}</p>
                    </IonLabel>
                    
                    <IonInput
                      fill="outline"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxlength={6}
                      placeholder="Enter OTP"
                      value={otp}
                      onIonChange={e => setOtp(e.detail.value!)}
                      style={{ margin: '20px 0' }}
                    />
                    
                    <IonButton 
                      expand="block" 
                      onClick={verifyAndLogin}
                      disabled={isVerifying}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify & Login'}
                    </IonButton>
                    
                    <IonButton 
                      expand="block" 
                      fill="clear" 
                      onClick={() => setShowOtpModal(false)}
                    >
                      Cancel
                    </IonButton>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
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
          message="OTP sent successfully! Please check your email."
          duration={3000}
          position="top"
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;