import React from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar 
} from '@ionic/react';

const AdminAnalytics: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Add your analytics content here */}
      </IonContent>
    </IonPage>
  );
};

export default AdminAnalytics;