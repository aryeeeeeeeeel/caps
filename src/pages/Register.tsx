import { 
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
      IonToolbar 
  } from '@ionic/react';
  
  const Register: React.FC = () => {
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
      <IonInput type="password" label="Password" value="">
      <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
      </IonInput>
      </IonItem>
      <IonItem>
      <IonInput type="password" label="Confirm Password" value="">
      <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
      </IonInput>
      </IonItem>
    </IonList>
    </div>
        </IonContent>
      </IonPage>
    );
  };
  
  export default Register;