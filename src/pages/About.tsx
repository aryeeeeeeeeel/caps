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
        <img alt="Clifford's profile picture" src='https://scontent.fmnl14-1.fna.fbcdn.net/v/t39.30808-1/480516990_3025784607577266_4596026472426777348_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=103&ccb=1-7&_nc_sid=1d2534&_nc_eui2=AeHKkW9zrYpQ6m5taGZI0FEzPpgTOgK1BwQ-mBM6ArUHBHgIcIIt7iJC7egOLwulwg-iwwpnL8mF7UF_gLnqkqg7&_nc_ohc=5nDD3fmMDLEQ7kNvgH3fyHu&_nc_zt=24&_nc_ht=scontent.fmnl14-1.fna&_nc_gid=ARbPqRj9cyeLZG7n3BQuyfc&oh=00_AYFAKh9VfyQN-oQEjf1uzb8uNZhzq4WOG64KjoyD61LZbg&oe=67D4A51B' />
      <IonCardHeader>
        <IonCardTitle>Clifford John B. Lutrago</IonCardTitle>
        <IonCardSubtitle>cjfordmoko</IonCardSubtitle>
      </IonCardHeader>

      <IonCardContent>You can't undo past but you can do a better future</IonCardContent>
    </IonCard>
        </IonContent>
      </IonPage>
    );
  };
  
  export default About;