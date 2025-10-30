// src/pages/user-tabs/ActivityLogs.tsx - User Activity Logs with Header and Tabs
import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonSkeletonText,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonText,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonRouterOutlet,
  IonAvatar,
  IonPopover,
  RefresherEventDetail
} from '@ionic/react';
import { Route, Redirect, useHistory, useLocation } from 'react-router-dom';
import {
  timeOutline,
  logInOutline,
  logOutOutline,
  addCircleOutline,
  chatbubbleOutline,
  personOutline,
  refreshOutline,
  arrowBackOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
  warningOutline,
  eyeOutline,
  downloadOutline,
  documentTextOutline,
  personCircle,
  notificationsOutline,
  homeOutline,
  listOutline,
  mapOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import { logUserLogout } from '../../utils/activityLogger';

// Import page components
import Dashboard from './Dashboard';
import IncidentReport from './IncidentReport';
import IncidentMap from './IncidentMap';
import History from './History';
import Notifications from './Notifications';
import GiveFeedback from './GiveFeedback';

interface ActivityLog {
  id: string;
  user_email: string;
  activity_type: string;
  activity_description: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

const ActivityLogs: React.FC = () => {
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

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'login' | 'logout' | 'report' | 'feedback' | 'profile'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Import tabs from Home.tsx for consistency
  const tabs = [
    { name: 'Dashboard', tab: 'dashboard', url: '/it35-lab2/app/dashboard', icon: homeOutline },
    { name: 'Report an Incident', tab: 'submit', url: '/it35-lab2/app/submit', icon: addCircleOutline },
    { name: 'My Reports', tab: 'map', url: '/it35-lab2/app/map', icon: mapOutline },
    { name: 'History', tab: 'reports', url: '/it35-lab2/app/history', icon: timeOutline },
  ];

  // Check if we're on the activity logs page specifically
  const isActivityLogsPage = location.pathname === '/it35-lab2/app/activity-logs';

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
          await fetchActivityLogs();
          
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
      
      // Show toast if new notifications arrive
      if (unreadCount > prevUnreadCount && prevUnreadCount > 0) {
        console.log('Showing toast for new notifications');
        setToastMessage(`You have ${unreadCount} unread notifications`);
        setShowToast(true);
      }
      
      setUnreadNotifications(unreadCount);
      setPrevUnreadCount(unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activity logs:', error);
        setToastMessage('Failed to load activity logs');
        setShowToast(true);
        return;
      }

      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setToastMessage('Failed to load activity logs');
      setShowToast(true);
    } finally {
      setIsLoading(false);
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

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchActivityLogs();
    event.detail.complete();
  };

  const filteredLogs = activityLogs.filter(log => {
    if (filter === 'all') return true;
    return log.activity_type === filter;
  });

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login': return logInOutline;
      case 'logout': return logOutOutline;
      case 'report': return addCircleOutline;
      case 'feedback': return chatbubbleOutline;
      case 'profile': return personOutline;
      default: return informationCircleOutline;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'login': return '#10b981';
      case 'logout': return '#6b7280';
      case 'report': return '#3b82f6';
      case 'feedback': return '#8b5cf6';
      case 'profile': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const stats = {
    total: activityLogs.length,
    login: activityLogs.filter(log => log.activity_type === 'login').length,
    report: activityLogs.filter(log => log.activity_type === 'report').length,
    feedback: activityLogs.filter(log => log.activity_type === 'feedback').length
  };

  // Skeleton Loading Component
  if (isLoading) {
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
              <IonSkeletonText animated style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                marginRight: '8px' 
              }} />
              <IonSkeletonText animated style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%' 
              }} />
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent fullscreen>
          <div>
            {/* Header Container Skeleton */}
            <div style={{ padding: '20px 20px 0 20px' }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <IonSkeletonText animated style={{ width: '56px', height: '56px', borderRadius: '16px' }} />
                <div style={{ flex: 1 }}>
                  <IonSkeletonText animated style={{ width: '60%', height: '20px', marginBottom: '8px' }} />
                  <IonSkeletonText animated style={{ width: '40%', height: '16px' }} />
                </div>
              </div>
            </div>

            {/* Stats Overview Skeleton */}
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: '#f8fafc',
              padding: '0 20px 20px 20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                      <IonSkeletonText animated style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                      <IonSkeletonText animated style={{ width: '40px', height: '12px' }} />
                    </div>
                    <IonSkeletonText animated style={{ width: '60%', height: '28px', margin: '0 auto' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Logs List Skeleton */}
            <div style={{ padding: '0 20px 20px 20px' }}>
              <IonCard style={{ borderRadius: '16px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <IonSkeletonText animated style={{ width: '180px', height: '18px' }} />
                  </div>

                  <IonList style={{ background: 'transparent' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <IonItem
                        key={i}
                        style={{
                          '--background': 'transparent',
                          '--border-radius': '8px',
                          marginBottom: '12px'
                        } as any}
                      >
                        <div style={{ width: '100%', padding: '12px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <IonSkeletonText 
                              animated 
                              style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '12px',
                                flexShrink: 0
                              }} 
                            />
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <IonSkeletonText animated style={{ width: '70%', height: '16px' }} />
                                <IonSkeletonText animated style={{ width: '40px', height: '20px', borderRadius: '10px' }} />
                              </div>
                              
                              <IonSkeletonText animated style={{ width: '90%', height: '14px', marginBottom: '8px' }} />
                              <IonSkeletonText animated style={{ width: '80%', height: '14px', marginBottom: '8px' }} />
                              
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between' 
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <IonSkeletonText animated style={{ width: '60px', height: '24px', borderRadius: '12px' }} />
                                  <IonSkeletonText animated style={{ width: '80px', height: '12px' }} />
                                </div>
                                <IonSkeletonText animated style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            </div>
          </div>
        </IonContent>

        {/* Bottom Tab Bar Skeleton */}
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
          {[1, 2, 3, 4].map((item, index) => (
            <IonTabButton
              key={index}
              style={{
                '--color': '#94a3b8',
                '--color-selected': '#667eea'
              } as any}
            >
              <IonSkeletonText
                animated
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  marginBottom: '4px'
                }}
              />
              <IonSkeletonText
                animated
                style={{
                  width: '60px',
                  height: '11px',
                  borderRadius: '4px'
                }}
              />
            </IonTabButton>
          ))}
        </IonTabBar>
      </IonPage>
    );
  }

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

      <IonContent fullscreen>
        {isActivityLogsPage ? (
          // Activity Logs Content
          <div>
            <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
              <IonRefresherContent />
            </IonRefresher>

            {/* Header Container */}
            <div style={{ padding: '20px 20px 0 20px' }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IonIcon icon={documentTextOutline} style={{ fontSize: '28px', color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                    Activity Logs
                  </h2>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    Track your account activities
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              background: '#f8fafc',
              padding: '0 20px 20px 20px'
            }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '12px'
                }}
              >
                {[
                  { label: 'Total', value: stats.total, color: '#6b7280', icon: documentTextOutline, filter: 'all' },
                  { label: 'Logins', value: stats.login, color: '#10b981', icon: logInOutline, filter: 'login' },
                  { label: 'Reports', value: stats.report, color: '#3b82f6', icon: addCircleOutline, filter: 'report' },
                  { label: 'Feedback', value: stats.feedback, color: '#8b5cf6', icon: chatbubbleOutline, filter: 'feedback' }
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    onClick={() => setFilter(stat.filter as any)}
                    style={{
                      background: filter === stat.filter ? stat.color + '20' : 'white',
                      border: `1px solid ${filter === stat.filter ? stat.color : '#e5e7eb'}`,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minWidth: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                      <IonIcon icon={stat.icon} style={{ color: stat.color, fontSize: '20px' }} />
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{stat.label}</div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Logs List */}
            <div style={{ padding: '0 20px 20px 20px' }}>
              <IonCard style={{ borderRadius: '16px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
                    {filter === 'all' ? 'All Activities' : filter.charAt(0).toUpperCase() + filter.slice(1) + ' Activities'} ({filteredLogs.length})
                  </h3>

                  <IonList style={{ background: 'transparent' }}>
                    {filteredLogs.map(log => (
                      <IonItem
                        key={log.id}
                        style={{
                          '--background': 'transparent',
                          '--border-radius': '8px',
                          marginBottom: '12px'
                        } as any}
                      >
                        <div style={{ width: '100%', padding: '12px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              background: getActivityColor(log.activity_type) + '20',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <IonIcon
                                icon={getActivityIcon(log.activity_type)}
                                style={{
                                  fontSize: '20px',
                                  color: getActivityColor(log.activity_type)
                                }}
                              />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <h4 style={{
                                  margin: 0,
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  color: '#1f2937'
                                }}>
                                  {log.activity_description}
                                </h4>
                                <IonChip
                                  style={{
                                    '--background': getActivityColor(log.activity_type) + '20',
                                    '--color': getActivityColor(log.activity_type),
                                    height: '24px',
                                    fontSize: '10px',
                                    fontWeight: '600'
                                  } as any}
                                >
                                  {log.activity_type.toUpperCase()}
                                </IonChip>
                              </div>

                              {log.details && Object.keys(log.details).length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                  {Object.entries(log.details).map(([key, value]) => (
                                    <div key={key} style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                                      <strong>{key}:</strong> {String(value)}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <IonIcon icon={timeOutline} style={{ fontSize: '12px' }} />
                                    {getTimeAgo(log.created_at)}
                                  </span>
                                  {log.ip_address && (
                                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                      IP: {log.ip_address}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                  {formatDate(log.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>

                  {filteredLogs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      <IonIcon icon={documentTextOutline} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                      <div style={{ fontSize: '16px', fontWeight: '500' }}>No activities found</div>
                      <div style={{ fontSize: '14px', marginTop: '4px' }}>
                        {filter === 'all' ? 'You have no activity logs yet' : `No ${filter} activities found`}
                      </div>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </div>
          </div>
        ) : (
          // Tabbed Content
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/it35-lab2/app/dashboard" component={Dashboard} />
              <Route exact path="/it35-lab2/app/submit" component={IncidentReport} />
              <Route exact path="/it35-lab2/app/map" component={IncidentMap} />
              <Route exact path="/it35-lab2/app/history" component={History} />
              <Route exact path="/it35-lab2/app/notifications" render={() => <Notifications refreshCount={() => {}} />} />
              <Route exact path="/it35-lab2/app/feedback" component={GiveFeedback} />
              <Route exact path="/it35-lab2/app">
                <Redirect to="/it35-lab2/app/dashboard" />
              </Route>
            </IonRouterOutlet>

          </IonTabs>
        )}

        {/* Global Toast */}
        <IonToast
          isOpen={false}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>

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
        {tabs.map((item, index) => {
          const isActive = location.pathname.startsWith(item.url);
          return (
            <IonTabButton
              key={index}
              tab={item.tab}
              onClick={() => history.push(item.url)}
              style={{
                '--color': isActive ? '#667eea' : '#94a3b8',
                '--color-selected': '#667eea',
                borderTop: isActive ? '2px solid #667eea' : '2px solid transparent'
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
          );
        })}
      </IonTabBar>
    </IonPage>
  );
};

export default ActivityLogs;