// src/pages/AdminNotifications.tsx - With MDRRMO Command Center and Incident Tracking
import React, { useState, useEffect, useRef } from 'react';
import { desktopOutline } from 'ionicons/icons';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
} from '@ionic/react';

const AdminNotifications: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Notifications</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItem>
            <IonIcon icon={desktopOutline} slot="start" />
            <IonLabel>MDRRMO Command Center</IonLabel>
          </IonItem>
          <IonItem>
            <IonIcon icon={desktopOutline} slot="start" />
            <IonLabel>Incident Tracking</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default AdminNotifications;