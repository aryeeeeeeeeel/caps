// src/pages/Home.tsx - FIXED: Profile popover with better alignment and removed items
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonRouterOutlet,
  IonAvatar,
  IonPopover,
  IonBadge,
  IonItem
} from '@ionic/react';
import { Route, Redirect, useHistory, useLocation } from 'react-router-dom';
import {
  personCircle,
  notificationsOutline,
  logOutOutline,
  chatbubbleOutline,
  homeOutline,
  addCircleOutline,
  listOutline,
  mapOutline
} from 'ionicons/icons';
import { supabase } from '../utils/supabaseClient';

// Import all page components
import Dashboard from './user-tabs/Dashboard';
import IncidentReport from './user-tabs/IncidentReport';
import IncidentMap from './user-tabs/IncidentMap';
import History from './user-tabs/History';
import Notifications from './Notifications';
import GiveFeedback from './user-tabs/GiveFeedback';

const Home: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userReports, setUserReports] = useState<any[]>([]);

  const tabs = [
    { name: 'Dashboard', tab: 'dashboard', url: '/it35-lab2/app/dashboard', icon: homeOutline },
    { name: 'Report an Incident', tab: 'submit', url: '/it35-lab2/app/submit', icon: addCircleOutline },
    { name: 'My Reports', tab: 'map', url: '/it35-lab2/app/map', icon: mapOutline },
    { name: 'History', tab: 'reports', url: '/it35-lab2/app/history', icon: listOutline },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);

          // Fetch user profile from users table
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_email', user.email)
            .single();

          if (!error && profile) {
            setUserProfile(profile);
          }

          // Fetch user reports
          if (user.email) {
            await fetchUserReports(user.email);
            await fetchNotifications(user.email);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, []);

  const fetchUserReports = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('reporter_email', email)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserReports(data);
      }
    } catch (err) {
      console.error('Error fetching user reports:', err);
    }
  };

  const fetchNotifications = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', email)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUnreadNotifications(data.length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowProfilePopover(false);
    history.push('/it35-lab2');
  };

  const openProfilePopover = (e: any) => {
    setPopoverEvent(e);
    setShowProfilePopover(true);
  };

  const handlePopoverNavigation = (route: string) => {
    setShowProfilePopover(false);
    setTimeout(() => {
      history.push(route);
    }, 100);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{
          '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '--color': 'white'
        } as any}>
          <IonButtons slot="start">
            {/* Remove menu button since we're using bottom tabs */}
          </IonButtons>

          <IonTitle style={{
            fontWeight: 'bold',
            fontSize: '20px'
          }}>iAMUMA ta</IonTitle>

          <IonButtons slot="end">
            {/* Notifications Button */}
            <IonButton
              fill="clear"
              onClick={() => handlePopoverNavigation('/it35-lab2/app/notifications')}
              style={{ color: 'white', position: 'relative' }}
            >
              <IonIcon icon={notificationsOutline} slot="icon-only" />
              {unreadNotifications > 0 && (
                <IonBadge
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#e53e3e',
                    minWidth: '18px',
                    height: '18px',
                    fontSize: '10px'
                  }}
                >
                  {unreadNotifications}
                </IonBadge>
              )}
            </IonButton>

            {/* Profile Button */}
            {user ? (
              <IonButton fill="clear" onClick={openProfilePopover} style={{ color: 'white' }}>
                {userProfile?.user_avatar_url ? (
                  <IonAvatar slot="icon-only" style={{ width: '32px', height: '32px' }}>
                    <img src={userProfile.user_avatar_url} alt="Profile" />
                  </IonAvatar>
                ) : (
                  <IonIcon icon={personCircle} slot="icon-only" size="large" />
                )}
              </IonButton>
            ) : (
              <IonButton onClick={() => history.push('/it35-lab2/user-login')} fill="clear" style={{ color: 'white' }}>
                Login
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Profile Popover - FIXED */}
      <IonPopover
        isOpen={showProfilePopover}
        event={popoverEvent}
        onDidDismiss={() => setShowProfilePopover(false)}
      >
        <IonContent>
          <div style={{ padding: '0', minWidth: '280px' }}>
            {user && (
              <>
                {/* Profile Header - FIXED ALIGNMENT */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '24px 20px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  {userProfile?.user_avatar_url ? (
                    <IonAvatar style={{ 
                      width: '60px', 
                      height: '60px', 
                      margin: '0 auto 12px',
                      border: '3px solid rgba(255,255,255,0.3)'
                    }}>
                      <img src={userProfile.user_avatar_url} alt="Profile" />
                    </IonAvatar>
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      margin: '0 auto 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonIcon icon={personCircle} style={{ fontSize: '40px' }} />
                    </div>
                  )}

                  <h3 style={{
                    margin: '0 0 4px 0',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {userProfile ? `${userProfile.user_firstname} ${userProfile.user_lastname}` : 'Community Member'}
                  </h3>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    opacity: 0.9,
                    textAlign: 'center'
                  }}>
                    {user.email}
                  </p>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    padding: '6px 12px',
                    display: 'inline-block'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>
                      {userReports.length} Reports Submitted
                    </span>
                  </div>
                </div>

                {/* Profile Menu Items - REMOVED MY REPORTS AND NOTIFICATIONS */}
                <div style={{ padding: '12px 0' }}>
                  <IonItem
                    button
                    onClick={() => handlePopoverNavigation('/it35-lab2/app/profile')}
                    style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                  >
                    <IonIcon icon={personCircle} slot="start" color="primary" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>View Profile</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Manage account settings</p>
                    </IonLabel>
                  </IonItem>

                  <IonItem
                    button
                    onClick={() => handlePopoverNavigation('/it35-lab2/app/feedback')}
                    style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                  >
                    <IonIcon icon={chatbubbleOutline} slot="start" color="success" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Give Feedback</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Rate our response service</p>
                    </IonLabel>
                  </IonItem>

                  <IonItem
                    button
                    onClick={handleSignOut}
                    style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                  >
                    <IonIcon icon={logOutOutline} slot="start" color="danger" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Sign Out</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Logout from account</p>
                    </IonLabel>
                  </IonItem>
                </div>
              </>
            )}
          </div>
        </IonContent>
      </IonPopover>

      <IonContent>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/it35-lab2/app/dashboard" component={Dashboard} />
            <Route exact path="/it35-lab2/app/submit" component={IncidentReport} />
            <Route exact path="/it35-lab2/app/map" component={IncidentMap} />
            <Route exact path="/it35-lab2/app/history" component={History} />
            <Route exact path="/it35-lab2/app/notifications" component={Notifications} />
            <Route exact path="/it35-lab2/app/feedback" component={GiveFeedback} />

            <Route exact path="/it35-lab2/app">
              <Redirect to="/it35-lab2/app/dashboard" />
            </Route>
          </IonRouterOutlet>

          {/* Bottom Tab Bar */}
          <IonTabBar
            slot="bottom"
            style={{
              '--background': 'white',
              '--border': '1px solid #e2e8f0',
              height: '70px',
              paddingTop: '8px',
              paddingBottom: '8px'
            } as any}
          >
            {tabs.map((item, index) => (
              <IonTabButton
                key={index}
                tab={item.tab}
                href={item.url}
                style={{
                  '--color': '#94a3b8',
                  '--color-selected': '#667eea'
                } as any}
              >
                <IonIcon
                  icon={item.icon}
                  style={{
                    marginBottom: '4px',
                    fontSize: '22px'
                  }}
                />
                <IonLabel style={{
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {item.name}
                </IonLabel>
              </IonTabButton>
            ))}
          </IonTabBar>
        </IonTabs>
      </IonContent>
    </IonPage>
  );
};

export default Home;