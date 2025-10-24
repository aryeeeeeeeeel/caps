// src/pages/Home.tsx - FIXED: Badge count updates, Profile picture & Full name display
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
  IonItem,
  IonToast
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
  mapOutline,
  addSharp,
  documentTextOutline
} from 'ionicons/icons';
import { supabase } from '../utils/supabaseClient';
import { logUserLogout } from '../utils/activityLogger';

// Import all page components
import Dashboard from './user-tabs/Dashboard';
import IncidentReport from './user-tabs/IncidentReport';
import IncidentMap from './user-tabs/IncidentMap';
import History from './user-tabs/History';
import Notifications from './Notifications';
import GiveFeedback from './user-tabs/GiveFeedback';
import ActivityLogs from './user-tabs/ActivityLogs';

const Home: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const [userReports, setUserReports] = useState<any[]>([]);

  const tabs = [
    { name: 'Dashboard', tab: 'dashboard', url: '/it35-lab2/app/dashboard', icon: homeOutline },
    { name: 'Report an Incident', tab: 'submit', url: '/it35-lab2/app/submit', icon: addCircleOutline },
    { name: 'My Reports', tab: 'map', url: '/it35-lab2/app/map', icon: mapOutline },
    { name: 'History', tab: 'reports', url: '/it35-lab2/app/history', icon: listOutline },
  ];

  useEffect(() => {
    let notificationsChannel: any;
    let reportsChannel: any;

    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          setUser(user);
          
          // Fetch user profile data using email instead of id
          await fetchUserProfile(user.email);
          
          // Fetch initial data
          await fetchUserReports(user.email);
          await fetchNotifications(user.email);
          
          // Set up real-time subscription for notifications
          notificationsChannel = supabase
            .channel('notifications_changes')
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_email=eq.${user.email}`
            }, () => {
              if (user.email) {
                fetchNotifications(user.email);
              }
            })
            .subscribe();

          // Set up real-time subscription for incident reports
          reportsChannel = supabase
            .channel('incident_reports_changes')
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'incident_reports',
              filter: `reporter_email=eq.${user.email}`
            }, (payload) => {
              console.log('Change received!', payload);
              if (user.email) {
                fetchUserReports(user.email);
                fetchNotifications(user.email); // Also update notifications when reports change
              }
            })
            .subscribe();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();

    // Cleanup function
    return () => {
      if (notificationsChannel) {
        supabase.removeChannel(notificationsChannel);
      }
      if (reportsChannel) {
        supabase.removeChannel(reportsChannel);
      }
    };
  }, []);

  const fetchUserProfile = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_email', userEmail)
        .single();
        
      if (!error && data) {
        setUserProfile(data);
      } else if (error) {
        console.error('Error fetching user profile:', error);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

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
      console.log('Fetching notifications...');
      // Fetch from notifications table
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', email)
        .eq('read', false);

      if (notificationsError) {
        console.error('Notifications error:', notificationsError);
      }

      // Fetch from incident_reports table
      const { data: incidentUpdates, error: reportsError } = await supabase
        .from('incident_reports')
        .select('id, title, admin_response, updated_at, read')
        .eq('reporter_email', email)
        .not('admin_response', 'is', null)
        .eq('read', false);

      if (reportsError) {
        console.error('Reports error:', reportsError);
      }

      // Calculate total unread count
      const unreadCount = (notificationsData?.length || 0) + (incidentUpdates?.length || 0);
      console.log('New unread count:', unreadCount, 'Previous:', prevUnreadCount);
      setUnreadNotifications(unreadCount);
      
      // Show toast if new notifications arrive
      if (unreadCount > prevUnreadCount) {
        console.log('Showing toast for new notifications');
        setShowToast(true);
      }
      setPrevUnreadCount(unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const refreshNotificationCount = async () => {
    if (user?.email) {
      await fetchNotifications(user.email);
    }
  };

  const handleSignOut = async () => {
    // Log user logout activity before signing out
    await logUserLogout(user?.email);
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
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={unreadNotifications > 0 ? "Your pending report has been updated to active. Check it out for more info!" : "Your report has been resolved. Check it out to review and rate it!"}
        duration={3000}
        position="top"
        color={unreadNotifications > 0 ? 'primary' : 'success'}
      />
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
              style={{
                color: 'white',
                position: 'relative',
                borderBottom: location.pathname === '/it35-lab2/app/notifications' ? '2px solid white' : 'none'
              }}
            >
              <IonIcon icon={notificationsOutline} slot="icon-only" />
              {unreadNotifications > 0 && (
                <IonBadge
                  color="danger"
                  style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    fontSize: '10px',
                    transform: 'translate(25%, -25%)'
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

      {/* Profile Popover */}
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
                    {userProfile?.user_firstname && userProfile?.user_lastname
                      ? `${userProfile.user_firstname} ${userProfile.user_lastname}`
                      : 'Community Member'}
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

                {/* Profile Menu Items */}
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
                    onClick={() => handlePopoverNavigation('/it35-lab2/app/activity-logs')}
                    style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                  >
                    <IonIcon icon={documentTextOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Activity Logs</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>View your account activities</p>
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
            <Route exact path="/it35-lab2/app/notifications" render={() => <Notifications refreshCount={refreshNotificationCount} />} />
            <Route exact path="/it35-lab2/app/feedback" component={GiveFeedback} />
            <Route exact path="/it35-lab2/app/activity-logs" component={ActivityLogs} />

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