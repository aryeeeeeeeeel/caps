import React from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonItem,
  IonLabel
} from '@ionic/react';


const AdminUsers: React.FC = () => {
  const [users, setUsers] = React.useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', warnings: 0 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', warnings: 1 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'suspended', warnings: 3 }
  ]);

  const issueWarning = (id: number) => {
    setUsers(users.map(user => 
      user.id === id 
        ? { 
            ...user, 
            warnings: user.warnings + 1,
            status: user.warnings + 1 >= 3 ? 'suspended' : user.status
          } 
        : user
    ));
  };

  const suspendUser = (id: number) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, status: 'suspended' } : user
    ));
  };

  const reinstateUser = (id: number) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, status: 'active', warnings: 0 } : user
    ));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Users</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{padding: '16px'}}>
          {users.map(user => (
            <IonCard key={user.id} style={{marginBottom: '16px', padding: '16px'}}>
              <h3>{user.name}</h3>
              <p>Email: {user.email}</p>
              <p>Status: {user.status} ({user.warnings} warnings)</p>
              <div style={{marginTop: '16px', display: 'flex', gap: '8px'}}>
                <IonButton 
                  onClick={() => issueWarning(user.id)}
                  disabled={user.status === 'suspended'}
                >
                  Issue Warning
                </IonButton>
                <IonButton 
                  onClick={() => suspendUser(user.id)}
                  disabled={user.status === 'suspended'}
                >
                  Suspend
                </IonButton>
                <IonButton 
                  onClick={() => reinstateUser(user.id)}
                  disabled={user.status !== 'suspended'}
                >
                  Reinstate
                </IonButton>
              </div>
             </IonCard>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminUsers;