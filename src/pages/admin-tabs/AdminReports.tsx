import React from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar 
} from '@ionic/react';

const AdminReports: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Reports</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Add your reports content here */}
      </IonContent>
    </IonPage>
  );
};

export default AdminReports;