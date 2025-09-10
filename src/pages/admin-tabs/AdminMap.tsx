import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const AdminMap: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Map</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Add map component here */}
      </IonContent>
    </IonPage>
  );
};

export default AdminMap;