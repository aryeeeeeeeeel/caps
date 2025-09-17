// src/pages/Menu.tsx
import React, { useState, useEffect } from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonSplitPane,
  IonRouterOutlet,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonButton
} from '@ionic/react';
import { Route, Redirect, useHistory } from 'react-router-dom';
import {
  homeOutline,
  addCircleOutline,
  listOutline,
  mapOutline,
  informationCircleOutline,
  personCircleOutline,
  logOutOutline,
  locationOutline,
  notificationsOutline,
  chatbubbleOutline
} from 'ionicons/icons';

import { supabase } from '../utils/supabaseClient';

// Import components directly
import Dashboard from './home-tabs/Dashboard';
import SubmitHazards from './home-tabs/SubmitHazards';
import ViewHazardMap from './home-tabs/ViewHazardMap';
import MyReports from './home-tabs/MyReports';
import Notifications from './home-tabs/Notifications';
import GiveFeedback from './home-tabs/GiveFeedback';
import Profile from './Profile';

const Menu: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const history = useHistory();

  const appPages = [
    {
      title: 'Dashboard',
      url: '/it35-lab2/app/dashboard',
      icon: homeOutline
    },
    {
      title: 'Report Incident',
      url: '/it35-lab2/app/submit',
      icon: addCircleOutline
    },
    {
      title: 'My Reports',
      url: '/it35-lab2/app/reports',
      icon: listOutline
    },
    {
      title: 'Hazard Map',
      url: '/it35-lab2/app/map',
      icon: mapOutline
    },
    {
      title: 'Notifications',
      url: '/it35-lab2/app/notifications',
      icon: notificationsOutline
    },
    {
      title: 'Give Feedback',
      url: '/it35-lab2/app/feedback',
      icon: chatbubbleOutline
    }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('user_email', user.email)
          .single();
          
        if (profile) {
          setUserProfile(profile);
        }
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      // Sign out
      await supabase.auth.signOut();
      
      // Redirect to landing page
      history.push('/it35-lab2');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMenuItemClick = (url: string) => {
    // Navigate to the URL
    history.push(url);
  };

  const handleProfileClick = () => {
    history.push('/it35-lab2/app/profile');
  };

  return (
    <IonSplitPane contentId="main" when="lg">
      <IonMenu contentId="main" type="overlay">
        <IonHeader>
          <IonToolbar style={{
            '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '--color': 'white'
          } as any}>
            <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent style={{ '--background': '#1a1a2e' }}>
          {/* User Profile Section */}
          {user && (
            <IonCard 
              style={{ 
                margin: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
              button
              onClick={handleProfileClick}
            >
              <IonCardContent style={{ padding: '16px', textAlign: 'center' }}>
                <IonAvatar style={{ 
                  width: '60px', 
                  height: '60px', 
                  margin: '0 auto 12px auto',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Profile" />
                  ) : (
                    <IonIcon icon={personCircleOutline} style={{ fontSize: '40px' }} />
                  )}
                </IonAvatar>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  {userProfile ? `${userProfile.user_firstname} ${userProfile.user_lastname}` : 'Community Member'}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
                  Active Reporter
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
                  <IonIcon icon={locationOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>
                    Manolo Fortich, Bukidnon
                  </span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  marginTop: '8px',
                  display: 'inline-block'
                }}>
                  <span style={{ fontSize: '10px', fontWeight: '600' }}>
                    Community Member
                  </span>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Main Menu */}
          <div style={{ padding: '0 8px' }}>
            <h6 style={{ 
              color: '#8892b0', 
              fontSize: '12px', 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '20px 16px 8px 16px'
            }}>
              MAIN MENU
            </h6>
            
            <IonList style={{ background: 'transparent' }}>
              {appPages.map((appPage, index) => (
                <IonMenuToggle key={index} autoHide={false}>
                  <IonItem
                    button
                    onClick={() => handleMenuItemClick(appPage.url)}
                    style={{
                      '--background': 'transparent',
                      '--color': '#ccd6f6',
                      '--border-radius': '8px',
                      margin: '4px 8px',
                      '--padding-start': '16px',
                      '--inner-padding-end': '16px'
                    } as any}
                  >
                    <IonIcon 
                      icon={appPage.icon} 
                      slot="start" 
                      style={{ color: '#64ffda', marginRight: '16px' }}
                    />
                    <IonLabel>
                      <h3 style={{ 
                        color: '#ccd6f6', 
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {appPage.title}
                      </h3>
                      <p style={{ 
                        color: '#8892b0', 
                        fontSize: '12px',
                        margin: '2px 0 0 0'
                      }}>
                        {appPage.title === 'Dashboard' && 'Overview and stats'}
                        {appPage.title === 'Report Incident' && 'Report new hazard'}
                        {appPage.title === 'My Reports' && 'View submitted reports'}
                        {appPage.title === 'Hazard Map' && 'Community insights'}
                        {appPage.title === 'Notifications' && 'View alerts and updates'}
                        {appPage.title === 'Give Feedback' && 'Rate our service'}
                      </p>
                    </IonLabel>
                  </IonItem>
                </IonMenuToggle>
              ))}
            </IonList>
          </div>

          {/* More Options */}
          <div style={{ padding: '0 8px', marginTop: '20px' }}>
            <h6 style={{ 
              color: '#8892b0', 
              fontSize: '12px', 
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '20px 16px 8px 16px'
            }}>
              ACCOUNT
            </h6>
            
            <IonList style={{ background: 'transparent' }}>
              <IonItem
                button
                onClick={() => handleMenuItemClick('/it35-lab2/app/profile')}
                style={{
                  '--background': 'transparent',
                  '--color': '#ccd6f6',
                  '--border-radius': '8px',
                  margin: '4px 8px',
                  '--padding-start': '16px',
                  '--inner-padding-end': '16px'
                } as any}
              >
                <IonIcon 
                  icon={personCircleOutline} 
                  slot="start" 
                  style={{ color: '#64ffda', marginRight: '16px' }}
                />
                <IonLabel>
                  <h3 style={{ 
                    color: '#ccd6f6', 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    My Profile
                  </h3>
                  <p style={{ 
                    color: '#8892b0', 
                    fontSize: '12px',
                    margin: '2px 0 0 0'
                  }}>
                    Manage account settings
                  </p>
                </IonLabel>
              </IonItem>
            </IonList>
          </div>

          {/* Sign Out Button */}
          <div style={{ 
            position: 'absolute', 
            bottom: '20px', 
            left: '16px', 
            right: '16px'
          }}>
            <IonButton
              expand="block"
              fill="clear"
              onClick={handleSignOut}
              style={{
                '--color': '#ff6b6b',
                '--border-color': '#ff6b6b',
                '--border-radius': '8px',
                '--padding-top': '12px',
                '--padding-bottom': '12px',
                border: '1px solid #ff6b6b'
              } as any}
            >
              <IonIcon icon={logOutOutline} slot="start" />
              Sign Out
            </IonButton>
          </div>
        </IonContent>
      </IonMenu>

      <IonRouterOutlet id="main">
        {/* Direct route mapping without nested routing */}
        <Route exact path="/it35-lab2/app/dashboard" component={Dashboard} />
        <Route exact path="/it35-lab2/app/submit" component={SubmitHazards} />
        <Route exact path="/it35-lab2/app/map" component={ViewHazardMap} />
        <Route exact path="/it35-lab2/app/reports" component={MyReports} />
        <Route exact path="/it35-lab2/app/notifications" component={Notifications} />
        <Route exact path="/it35-lab2/app/feedback" component={GiveFeedback} />
        <Route exact path="/it35-lab2/app/profile" component={Profile} />
        <Route exact path="/it35-lab2/app/reports/:id" component={MyReports} />
        <Route exact path="/it35-lab2/app">
          <Redirect to="/it35-lab2/app/dashboard" />
        </Route>
      </IonRouterOutlet>
    </IonSplitPane>
  );
};

export default Menu;