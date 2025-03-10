import { 
    IonButtons,
      IonCard,
      IonCardContent,
      IonCardHeader,
      IonCardSubtitle,
      IonCardTitle,
      IonContent, 
      IonHeader, 
      IonImg, 
      IonMenuButton, 
      IonPage, 
      IonTitle, 
      IonToolbar 
  } from '@ionic/react';
  
  const About: React.FC = () => {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot='start'>
              <IonMenuButton></IonMenuButton>
            </IonButtons>
            <IonTitle>About</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className='ion-padding'>
        <IonCard className="profile-card">
        <img className="profile-img" alt="Clifford's profile picture" src='/cliford_profile.jpg' />
      <IonCardHeader>
        <IonCardTitle>Profile</IonCardTitle>
        <IonCardSubtitle>Clifford John B. Lutrago</IonCardSubtitle>
      </IonCardHeader>

      <IonCardContent>You can't undo past but you can do a better future</IonCardContent>
    </IonCard>
        </IonContent>
      </IonPage>
    );
  };
  
  export default About;