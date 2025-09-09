// src/pages/Menu.tsx
import { 
  IonAlert,
  IonButton,
  IonButtons,
  IonContent, 
  IonHeader, 
  IonIcon, 
  IonItem, 
  IonMenu, 
  IonMenuButton, 
  IonMenuToggle, 
  IonPage, 
  IonRouterOutlet, 
  IonSplitPane, 
  IonTitle, 
  IonToast, 
  IonToolbar,
  IonAvatar,
  IonLabel,
  IonList,
  IonListHeader,
  IonBadge,
  useIonRouter
} from '@ionic/react';

import {
  homeOutline, 
  logOutOutline, 
  personCircle, 
  informationCircleOutline,
  statsChartOutline,
  addCircleOutline,
  listOutline,
  settingsOutline,
  helpCircleOutline,
  locationOutline
} from 'ionicons/icons';
import { Redirect, Route } from 'react-router';
import Home from './Home';
import About from './About';
import Details from './Details';
import { supabase } from '../utils/supabaseClient';
import { useState, useEffect } from 'react';

const Menu: React.FC = () => {
  const navigation = useIonRouter();
  const [showAlert, setShowAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_email', user.email)
          .single();
          
        if (!error && profile) {
          setUserProfile(profile);
        }
      }
    };

    fetchUser();
  }, []);

  const mainMenuItems = [
    {name: 'Dashboard', url: '/it35-lab2/app/home/dashboard', icon: homeOutline, description: 'Overview and stats'},
    {name: 'Report Incident', url: '/it35-lab2/app/home/report', icon: addCircleOutline, description: 'Report new hazard'},
    {name: 'My Reports', url: '/it35-lab2/app/home/reports', icon: listOutline, description: 'View submitted reports'},
    {name: 'Statistics', url: '/it35-lab2/app/home/stats', icon: statsChartOutline, description: 'Community insights'},
  ];

  const secondaryMenuItems = [
    {name: 'About iAMUMA ta', url: '/it35-lab2/app/about', icon: informationCircleOutline, description: 'Learn about the app'},
    {name: 'Profile', url: '/it35-lab2/app/profile', icon: personCircle, description: 'Account settings'},
    {name: 'Help & Support', url: '/it35-lab2/app/help', icon: helpCircleOutline, description: 'Get assistance'},
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setShowToast(true);
      setTimeout(() => {
        navigation.push('/it35-lab2', 'back', 'replace'); 
      }, 300); 
    } else {
      setErrorMessage(error.message);
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonSplitPane contentId="main">
        <IonMenu contentId="main">
          <IonHeader>
            <IonToolbar style={{
              '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '--color': 'white'
            } as any}>
              <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta</IonTitle>
            </IonToolbar>
          </IonHeader>
          
          <IonContent>
            {/* User Profile Section */}
            {user && (
              <div style={{
                background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                padding: '20px',
                margin: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  {userProfile?.avatar_url ? (
                    <IonAvatar style={{ width: '50px', height: '50px', marginRight: '12px' }}>
                      <img src={userProfile.avatar_url} alt="Profile" />
                    </IonAvatar>
                  ) : (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <IonIcon icon={personCircle} style={{ fontSize: '30px', color: 'white' }} />
                    </div>
                  )}
                  
                  <div>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#2d3748'
                    }}>
                      {userProfile ? `${userProfile.user_firstname} ${userProfile.user_lastname}` : 'Community Member'}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#718096'
                    }}>
                      Active Reporter
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <IonIcon icon={locationOutline} style={{
                    fontSize: '14px',
                    color: '#667eea',
                    marginRight: '6px'
                  }} />
                  <span style={{
                    fontSize: '12px',
                    color: '#4a5568',
                    fontWeight: '500'
                  }}>
                    Manolo Fortich, Bukidnon
                  </span>
                </div>
              </div>
            )}

            {/* Main Navigation */}
            <IonList>
              <IonListHeader style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#4a5568',
                marginTop: '8px'
              }}>
                MAIN MENU
              </IonListHeader>
              
              {mainMenuItems.map((item, index) => (
                <IonMenuToggle key={index} autoHide={false}>
                  <IonItem 
                    routerLink={item.url} 
                    routerDirection="forward"
                    style={{
                      '--padding-start': '20px',
                      '--inner-padding-end': '20px',
                      margin: '4px 8px',
                      borderRadius: '8px',
                      '--background': 'transparent'
                    } as any}
                    button
                    className="menu-item"
                  >
                    <IonIcon 
                      icon={item.icon} 
                      slot="start" 
                      style={{ color: '#667eea', fontSize: '20px' }}
                    />
                    <IonLabel>
                      <h3 style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#2d3748',
                        margin: '0 0 2px 0'
                      }}>
                        {item.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#718096',
                        margin: 0
                      }}>
                        {item.description}
                      </p>
                    </IonLabel>
                  </IonItem>
                </IonMenuToggle>
              ))}
            </IonList>

            {/* Secondary Navigation */}
            <IonList>
              <IonListHeader style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#4a5568',
                marginTop: '20px'
              }}>
                MORE OPTIONS
              </IonListHeader>
              
              {secondaryMenuItems.map((item, index) => (
                <IonMenuToggle key={index} autoHide={false}>
                  <IonItem 
                    routerLink={item.url} 
                    routerDirection="forward"
                    style={{
                      '--padding-start': '20px',
                      '--inner-padding-end': '20px',
                      margin: '4px 8px',
                      borderRadius: '8px',
                      '--background': 'transparent'
                    } as any}
                    button
                    className="menu-item"
                  >
                    <IonIcon 
                      icon={item.icon} 
                      slot="start" 
                      style={{ color: '#9CA3AF', fontSize: '20px' }}
                    />
                    <IonLabel>
                      <h3 style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#2d3748',
                        margin: '0 0 2px 0'
                      }}>
                        {item.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#718096',
                        margin: 0
                      }}>
                        {item.description}
                      </p>
                    </IonLabel>
                  </IonItem>
                </IonMenuToggle>
              ))}
            </IonList>

            {/* Logout Button */}
            <div style={{ padding: '20px 16px', marginTop: 'auto' }}>
              <IonButton 
                expand="block" 
                fill="outline"
                onClick={handleLogout}
                style={{
                  '--border-radius': '12px',
                  '--border-color': '#e53e3e',
                  '--color': '#e53e3e',
                  '--padding-top': '12px',
                  '--padding-bottom': '12px',
                  fontWeight: '600'
                } as any}
              >
                <IonIcon icon={logOutOutline} slot="start" />
                Sign Out
              </IonButton>
            </div>

            {/* App Info Footer */}
            <div style={{
              padding: '16px',
              textAlign: 'center',
              borderTop: '1px solid #e2e8f0',
              background: '#f7fafc'
            }}>
              <p style={{
                fontSize: '11px',
                color: '#9ca3af',
                margin: '0 0 4px 0'
              }}>
                iAMUMA ta v1.0
              </p>
              <p style={{
                fontSize: '10px',
                color: '#6b7280',
                margin: 0
              }}>
                Northern Bukidnon State College
              </p>
            </div>
          </IonContent>
        </IonMenu>
        
        <IonRouterOutlet id="main">
          <Route exact path="/it35-lab2/app/home" component={Home} />
          <Route exact path="/it35-lab2/app/home/details" component={Details} />
          <Route exact path="/it35-lab2/app/about" component={About} />
          
          <Route exact path="/it35-lab2/app">
            <Redirect to="/it35-lab2/app/home"/>
          </Route>
        </IonRouterOutlet>
        
        {/* Error Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Sign Out Failed"
          message={errorMessage}
          buttons={['OK']}
        />
        
        {/* Success Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Successfully signed out. Goodbye!"
          duration={2000}
          position="top"
          color="success"
        />

        {/* Custom Styles */}
        <style>{`
          .menu-item:hover {
            --background: rgba(102, 126, 234, 0.05) !important;
            transform: translateX(4px);
            transition: all 0.2s ease;
          }
        `}</style>
      </IonSplitPane>
    </IonPage>
  );
};

export default Menu;