// src/pages/Login.tsx
import { 
  IonButton,
  IonContent, 
  IonPage,
  IonInput,
  useIonRouter,
  IonInputPasswordToggle,
  IonAvatar,
  IonAlert,
  IonToast
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
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertMessage('Please enter both email and password');
      setShowAlert(true);
      return;
    }

    setIsLoggingIn(true);
    try {
      // Direct login without OTP
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setShowToast(true);
      setTimeout(() => {
        navigation.push('/it35-lab2/app', 'forward', 'replace'); // user dashboard
      }, 800);
    } catch (error: any) {
      setAlertMessage(error.message || 'Login failed. Please try again.');
      setShowAlert(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
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
          disabled={isLoggingIn}
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </IonButton>

        <IonButton 
          routerLink="/register" 
          expand="full" 
          fill="clear" 
          shape="round"
        >
          Don't have an account? Register here
        </IonButton>

        <AlertBox 
          message={alertMessage} 
          isOpen={showAlert} 
          onClose={() => setShowAlert(false)} 
        />
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Login successful!"
          duration={3000}
          position="top"
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
