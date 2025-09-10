import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const AdminSettings: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Add your admin settings content here */}
      </IonContent>
    </IonPage>
  );
};

export default AdminSettings;