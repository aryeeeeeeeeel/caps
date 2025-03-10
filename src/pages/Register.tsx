import { useState } from 'react';
import { 
  IonButton,
  IonButtons,
  IonContent, 
  IonHeader, 
  IonInput, 
  IonInputPasswordToggle, 
  IonItem, 
  IonList, 
  IonMenuButton, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  useIonRouter,
  IonAlert
} from '@ionic/react';

const Register: React.FC = () => {
  const navigation = useIonRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const doRegister = () => {
    if (password !== confirmPassword) {
      setErrorOpen(true); // Show error alert
    } else {
      setIsOpen(true); // Show success alert
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot='start'>
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingTop:'10%' }}>
          <IonList>
            <IonItem>
              <IonInput label="Email" type="email" placeholder="email@domain.com"></IonInput>
            </IonItem>

            <IonItem>
              <IonInput 
                type="password" label="Password" value={password} 
                onIonInput={(e) => setPassword(e.detail.value!)}
              >
                <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
              </IonInput>
            </IonItem>

            <IonItem>
              <IonInput 
                type="password" label="Confirm Password" value={confirmPassword} 
                onIonInput={(e) => setConfirmPassword(e.detail.value!)}
              >
                <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
              </IonInput>
            </IonItem>
          </IonList>
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <IonButton onClick={doRegister} fill="solid">
            Register
          </IonButton>
        </div>

        <IonAlert
          isOpen={isOpen}
          header="Registration Successful"
          subHeader="Welcome!"
          message="You have successfully registered."
          buttons={[
            {
              text: "OK",
              handler: () => navigation.push('/it35-lab', 'forward', 'replace')
            }
          ]}
          onDidDismiss={() => setIsOpen(false)}
        />
        <IonAlert
          isOpen={errorOpen}
          header="Error"
          subHeader="Password Mismatch"
          message="Your Confirm Password does not match the Password."
          buttons={['OK']}
          onDidDismiss={() => setErrorOpen(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;
