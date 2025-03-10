import { 
  IonButton,
    IonButtons,
      IonContent, 
      IonHeader, 
      IonMenuButton, 
      IonPage, 
      IonTitle, 
      IonToolbar,
      IonInput,
      IonIcon,
      IonItem, 
      useIonRouter,
      IonList,
      IonInputPasswordToggle,
      IonAvatar,
      IonAlert,
      IonToast
  } from '@ionic/react';
  import { eye, eyeOff } from 'ionicons/icons';
  import { useState } from 'react';

  const Login: React.FC = () => {
      const navigation = useIonRouter();
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [showAlert, setShowAlert] = useState(false);
      const [showToast, setShowToast] = useState(false);
  
      const doLogin = () => {
          if (email === "admin@gmail.com" && password === "password123") {
            setShowToast(true);
            setTimeout(() => {
              navigation.push('/it35-lab/app', 'forward', 'replace');
            }, 1500);
          } else {
              setShowAlert(true);
          }
      };

    const doRegister = ()=> {
      navigation.push('/it35-lab/register', 'forward','replace');
  }
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Login</IonTitle>
          </IonToolbar>
        </IonHeader>
    <IonContent className='ion-padding'>
    <div style= {{ display:'flex', alignItems:'center', justifyContent:'center', height:'50px',paddingTop:'10%'}}><IonAvatar>
        <img alt="Silhouette of a person's head" src="data:image/jpeg;base64,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" />
      </IonAvatar>
      </div>
      <br></br>
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center",paddingTop:'50px'}}>
        <IonList>
      <IonItem>
      <IonInput onIonChange={e => setEmail(e.detail.value!)}
            />
      </IonItem>
      <IonItem>
      <IonInput type={showPassword ? "text" : "password"} placeholder="Enter Password" value={password} onIonChange={e => setPassword(e.detail.value!)}
            />
      <IonButton fill="clear" onClick={() => setShowPassword(!showPassword)}>
                        <IonIcon icon={showPassword ? eyeOff : eye} />
                        </IonButton>
      </IonItem>
      </IonList>
    </div>
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <IonButton onClick={()=>doLogin()} fill="solid">
            Login
          </IonButton>
          <IonButton onClick={()=>doRegister()} fill="outline">
            Register
          </IonButton>

          <IonAlert
            isOpen={showAlert}
            onDidDismiss={() => setShowAlert(false)}
            header="Login Failed"
            message="Wrong email or password. Please try again."
            buttons={['OK']}
          />

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message="Login successful! Redirecting..."
            duration={1500} 
            color="success"
          />
          </div>
        </IonContent>
      </IonPage>
    );
  };
  
  export default Login;