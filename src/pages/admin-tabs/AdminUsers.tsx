import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

const AdminUsers: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Users</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Add your users management content here */}
      </IonContent>
    </IonPage>
  );
};

export default AdminUsers;