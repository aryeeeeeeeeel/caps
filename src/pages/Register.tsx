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

  const doRegister = () => {
    setIsOpen(true); 
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
              <IonInput type="password" label="Password">
                <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
              </IonInput>
            </IonItem>

            <IonItem>
              <IonInput type="password" label="Confirm Password">
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
      </IonContent>
    </IonPage>
  );
};

export default Register;
