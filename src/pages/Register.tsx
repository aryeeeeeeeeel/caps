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
      useIonRouter
  } from '@ionic/react';
  
  const Register: React.FC = () => {
    const navigation = useIonRouter();

    const doRegister = ()=> {
      navigation.push('/it35-lab', 'forward','replace');
  }
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
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          
          <IonButton onClick={()=>doRegister()} fill="solid">
            Register
          </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  };
  
  export default Register;