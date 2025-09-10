// src/pages/Home.tsx - Complete User Dashboard
import { 
  IonButton,
  IonButtons,
  IonContent, 
  IonHeader,
  IonIcon, 
  IonLabel, 
  IonMenuButton, 
  IonPage,
  IonRouterOutlet, 
  IonTabBar, 
  IonTabButton, 
  IonTabs,  
  IonTitle, 
  IonToolbar,
  IonAvatar,
  IonItem,
  IonPopover,
  IonCard,
  IonCardContent,
  IonText,
  IonBadge,
  IonFab,
  IonFabButton
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { 
  homeOutline, 
  addCircleOutline, 
  listOutline, 
  personCircle, 
  notificationsOutline, 
  logOutOutline, 
  statsChartOutline, 
  locationOutline,
  mapOutline,
  chatbubbleOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { Route, Redirect } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

// Import all the new components we'll need
import Dashboard from './home-tabs/Dashboard';
import SubmitHazards from './home-tabs/SubmitHazards';
import ViewHazardMap from './home-tabs/ViewHazardMap';
import MyReports from './home-tabs/MyReports';
import Notifications from './home-tabs/Notifications';
import GiveFeedback from './home-tabs/GiveFeedback';

const Home: React.FC = () => {
  const tabs = [
    {name:'Dashboard', tab:'dashboard', url: '/it35-lab2/app/home/dashboard', icon: homeOutline},
    {name:'Submit Hazard', tab:'submit', url: '/it35-lab2/app/home/submit', icon: addCircleOutline},
    {name:'Hazard Map', tab:'map', url: '/it35-lab2/app/home/map', icon: mapOutline},
    {name:'My Reports', tab:'reports', url: '/it35-lab2/app/home/reports', icon: listOutline},
  ];

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
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
          fetchUserReports(user.email);
          
          // Fetch notifications
          fetchNotifications(user.email);
        }
      }
    };

    fetchUser();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserReports = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('hazard_reports')
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
        setAlerts(data);
        setUnreadNotifications(data.length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowProfilePopover(false);
  };

  const openProfilePopover = (e: any) => {
    setPopoverEvent(e);
    setShowProfilePopover(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{
          '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '--color': 'white'
        } as any}>
          <IonButtons slot="start">
            <IonMenuButton style={{ color: 'white' }} />
          </IonButtons>
          
          <IonTitle style={{ 
            fontWeight: 'bold',
            fontSize: '20px'
          }}>iAMUMA ta</IonTitle>
          
          <IonButtons slot="end">
            {/* Notifications Button */}
            <IonButton 
              fill="clear" 
              routerLink="/it35-lab2/app/home/notifications"
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
                {userProfile?.avatar_url ? (
                  <IonAvatar slot="icon-only" style={{ width: '32px', height: '32px' }}>
                    <img src={userProfile.avatar_url} alt="Profile" />
                  </IonAvatar>
                ) : (
                  <IonIcon icon={personCircle} slot="icon-only" size="large" />
                )}
              </IonButton>
            ) : (
              <IonButton routerLink="/it35-lab2/user-login" fill="clear" style={{ color: 'white' }}>
                Login
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Enhanced Profile Popover */}
      <IonPopover
        isOpen={showProfilePopover}
        event={popoverEvent}
        onDidDismiss={() => setShowProfilePopover(false)}
      >
        <IonContent>
          <div style={{ padding: '0', minWidth: '280px' }}>
            {user && (
              <>
                {/* Profile Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '24px 20px',
                  textAlign: 'center',
                  color: 'white'
                }}>
                  {userProfile?.avatar_url ? (
                    <IonAvatar style={{ width: '60px', height: '60px', margin: '0 auto 12px' }}>
                      <img src={userProfile.avatar_url} alt="Profile" />
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
                    fontWeight: 'bold'
                  }}>
                    {userProfile ? `${userProfile.user_firstname} ${userProfile.user_lastname}` : 'Community Member'}
                  </h3>
                  <p style={{ 
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    opacity: 0.9
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
                
                {/* Profile Menu Items */}
                <div style={{ padding: '12px 0' }}>
                  <IonItem 
                    button
                    routerLink="/it35-lab2/app/profile"
                    onClick={() => setShowProfilePopover(false)}
                    style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                  >
                    <IonIcon icon={personCircle} slot="start" color="primary" />
                    <IonLabel>
                      <h3>View Profile</h3>
                      <p>Manage account settings</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem 
                    button
                    routerLink="/it35-lab2/app/home/reports"
                    onClick={() => setShowProfilePopover(false)}
                    style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                  >
                    <IonIcon icon={listOutline} slot="start" color="secondary" />
                    <IonLabel>
                      <h3>My Reports</h3>
                      <p>View & edit submitted reports</p>
                    </IonLabel>
                    <IonBadge color="primary" slot="end">{userReports.length}</IonBadge>
                  </IonItem>

                  <IonItem 
                    button
                    routerLink="/it35-lab2/app/home/notifications"
                    onClick={() => setShowProfilePopover(false)}
                    style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                  >
                    <IonIcon icon={notificationsOutline} slot="start" color="warning" />
                    <IonLabel>
                      <h3>Notifications</h3>
                      <p>Alerts and updates</p>
                    </IonLabel>
                    {unreadNotifications > 0 && (
                      <IonBadge color="danger" slot="end">{unreadNotifications}</IonBadge>
                    )}
                  </IonItem>

                  <IonItem 
                    button
                    routerLink="/it35-lab2/app/home/feedback"
                    onClick={() => setShowProfilePopover(false)}
                    style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                  >
                    <IonIcon icon={chatbubbleOutline} slot="start" color="success" />
                    <IonLabel>
                      <h3>Give Feedback</h3>
                      <p>Rate our response service</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem 
                    button
                    onClick={handleSignOut}
                    style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                  >
                    <IonIcon icon={logOutOutline} slot="start" color="danger" />
                    <IonLabel>
                      <h3>Sign Out</h3>
                      <p>Logout from account</p>
                    </IonLabel>
                  </IonItem>
                </div>
              </>
            )}
          </div>
        </IonContent>
      </IonPopover>

      <IonContent fullscreen>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              {/* Main tab routes */}
              <Route exact path="/it35-lab2/app/home/dashboard" component={Dashboard} />
              <Route exact path="/it35-lab2/app/home/submit" component={SubmitHazards} />
              <Route exact path="/it35-lab2/app/home/map" component={ViewHazardMap} />
              <Route exact path="/it35-lab2/app/home/reports" component={MyReports} />
              
              {/* Additional feature routes */}
              <Route exact path="/it35-lab2/app/home/notifications" component={Notifications} />
              <Route exact path="/it35-lab2/app/home/feedback" component={GiveFeedback} />
              
              {/* Report detail routes */}
              <Route exact path="/it35-lab2/app/home/reports/:id" component={MyReports} />
              
              <Route exact path="/it35-lab2/app/home">
                <Redirect to="/it35-lab2/app/home/dashboard" />
              </Route>
            </IonRouterOutlet>

            {/* Enhanced Tab Bar */}
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
        </IonReactRouter>

        {/* Quick Action FAB for urgent reports */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton 
            routerLink="/it35-lab2/app/home/submit"
            style={{
              '--background': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              '--color': 'white'
            } as any}
          >
            <IonIcon icon={alertCircleOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Home;