// src/pages/LandingPage.tsx
import { 
  IonPage, 
  IonContent, 
  IonButton, 
  IonHeader, 
  IonToolbar, 
  IonTitle 
} from "@ionic/react";

const LandingPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{ textAlign: "center", marginTop: "40%" }}>
        <h2>Please choose an option</h2>
        <IonButton expand="block" routerLink="/it35-lab2/user-login">
          Login as User
        </IonButton>
        <IonButton expand="block" routerLink="/it35-lab2/admin-login">
          Login as Admin
        </IonButton>
        <IonButton expand="block" fill="clear" routerLink="/register">
          Register
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default LandingPage;
