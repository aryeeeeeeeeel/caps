// src/pages/admin-tabs/SystemLogs.tsx - Admin System Logs with Header and Navigation
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
  IonSearchbar,
  RefresherEventDetail
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  timeOutline,
  logInOutline,
  logOutOutline,
  notificationsOutline,
  checkmarkCircleOutline,
  warningOutline,
  personRemoveOutline,
  personAddOutline,
  refreshOutline,
  arrowBackOutline,
  informationCircleOutline,
  eyeOutline,
  downloadOutline,
  documentTextOutline,
  searchOutline,
  banOutline,
  shieldOutline,
  statsChartOutline,
  peopleOutline,
  homeOutline,
  addCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import { logAdminLogout } from '../../utils/activityLogger';

interface SystemLog {
  id: string;
  admin_email: string;
  activity_type: string;
  activity_description: string;
  target_user_email?: string;
  target_report_id?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

const SystemLogs: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'login' | 'logout' | 'notify' | 'update_report' | 'user_action' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const adminMenu = [
    { id: "dashboard", label: "Dashboard", icon: homeOutline, route: "/it35-lab2/admin-dashboard" },
    { id: "incidents", label: "Incidents", icon: alertCircleOutline, route: "/it35-lab2/admin/incidents" },
    { id: "users", label: "Users", icon: peopleOutline, route: "/it35-lab2/admin/users" },
    { id: "analytics", label: "Analytics", icon: statsChartOutline, route: "/it35-lab2/admin/analytics" },
    { id: "systemlogs", label: "System Logs", icon: documentTextOutline, route: "/it35-lab2/admin/system-logs" },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          setUser(user);
          await fetchNotifications(user.email);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
    fetchSystemLogs();
  }, []);

  const fetchNotifications = async (_email: string) => {
    try {
      console.log('Fetching notifications...');
      // Fetch unread from incident_reports and feedback tables
      const { data: unreadReports } = await supabase
        .from('incident_reports')
        .select('id')
        .eq('read', false);
      const { data: unreadFeedback } = await supabase
        .from('feedback')
        .select('id')
        .eq('read', false);

      if (Notification) {
        console.error('Notifications error:', Notification);
      }

      // Calculate total unread count
      const unreadCount = (unreadReports?.length || 0) + (unreadFeedback?.length || 0);
      console.log('New unread count:', unreadCount, 'Previous:', prevUnreadCount);
      setUnreadNotifications(unreadCount);
      setPrevUnreadCount(unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching system logs:', error);
        setToastMessage('Failed to load system logs');
        setShowToast(true);
        return;
      }

      setSystemLogs(data || []);
    } catch (error) {
      console.error('Error fetching system logs:', error);
      setToastMessage('Failed to load system logs');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    // Log admin logout activity before signing out
    await logAdminLogout(user?.email);
    await supabase.auth.signOut();
    history.push('/it35-lab2/admin-login');
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchSystemLogs();
    event.detail.complete();
  };

  const filteredLogs = systemLogs.filter(log => {
    // Filter by activity type
    if (filter !== 'all' && log.activity_type !== filter) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.activity_description.toLowerCase().includes(query) ||
        log.admin_email.toLowerCase().includes(query) ||
        (log.target_user_email && log.target_user_email.toLowerCase().includes(query)) ||
        (log.target_report_id && log.target_report_id.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login': return logInOutline;
      case 'logout': return logOutOutline;
      case 'notify': return notificationsOutline;
      case 'update_report': return checkmarkCircleOutline;
      case 'user_action': return personRemoveOutline;
      case 'system': return shieldOutline;
      default: return informationCircleOutline;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'login': return '#10b981';
      case 'logout': return '#6b7280';
      case 'notify': return '#3b82f6';
      case 'update_report': return '#f59e0b';
      case 'user_action': return '#ef4444';
      case 'system': return '#8b5cf6';
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
    total: systemLogs.length,
    login: systemLogs.filter(log => log.activity_type === 'login').length,
    notify: systemLogs.filter(log => log.activity_type === 'notify').length,
    update_report: systemLogs.filter(log => log.activity_type === 'update_report').length,
    user_action: systemLogs.filter(log => log.activity_type === 'user_action').length
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar
            style={{ "--background": "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)", "--color": "white" } as any}
          >
            <IonTitle style={{ fontWeight: "bold" }}>
              <IonSkeletonText animated style={{ width: "250px", height: "20px" }} />
            </IonTitle>
            <IonButtons slot="end">
              <IonSkeletonText
                animated
                style={{ width: "32px", height: "32px", borderRadius: "50%", marginRight: "8px" }}
              />
              <IonSkeletonText animated style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
            </IonButtons>
          </IonToolbar>

          <IonToolbar style={{ "--background": "white" } as any}>
            <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #e5e7eb" }}>
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} style={{ flex: 1, padding: "12px", textAlign: "center" }}>
                  <IonSkeletonText animated style={{ width: "80%", height: "16px", margin: "0 auto" }} />
                </div>
              ))}
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ "--background": "#f8fafc" } as any} fullscreen>
          <div style={{ padding: '20px' }}>
            {/* Header Skeleton */}
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

            {/* Stats Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <IonSkeletonText animated style={{ width: '60%', height: '14px', margin: '0 auto 12px' }} />
                  <IonSkeletonText animated style={{ width: '80%', height: '28px', margin: '0 auto' }} />
                </div>
              ))}
            </div>

            {/* System Logs List Skeleton */}
            <IonCard style={{ borderRadius: '16px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <IonSkeletonText animated style={{ width: '50%', height: '18px', marginBottom: '16px' }} />
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <IonSkeletonText animated style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <IonSkeletonText animated style={{ width: '70%', height: '16px', marginBottom: '8px' }} />
                      <IonSkeletonText animated style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
                      <IonSkeletonText animated style={{ width: '50%', height: '12px' }} />
                    </div>
                  </div>
                ))}
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar
          style={{ "--background": "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)", "--color": "white" } as any}
        >
          <IonTitle style={{ fontWeight: "bold" }}>iAMUMA ta - System Logs</IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              onClick={() => history.push("/it35-lab2/admin/notifications")}
              style={{ color: 'white' }}
            >
              <IonIcon icon={notificationsOutline} />
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
            <IonButton
              fill="clear"
              onClick={handleSignOut}
              style={{ color: 'white' }}
            >
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        <IonToolbar style={{ "--background": "white" } as any}>
          <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #e5e7eb" }}>
            {adminMenu.map((menu) => (
              <IonButton
                key={menu.id}
                fill="clear"
                onClick={() => {
                  if (menu.route) {
                    history.push(menu.route);
                  }
                }}
                style={{
                  "--color": menu.id === "systemlogs" ? "#3b82f6" : "#6b7280",
                  "--background": "transparent",
                  "--border-radius": "0",
                  borderBottom: menu.id === "systemlogs" ? "2px solid #3b82f6" : "2px solid transparent",
                  margin: 0,
                  flex: 1,
                  padding: "12px",
                  fontSize: "14px"
                } as any}
              >
                <IonIcon icon={menu.icon} slot="start" style={{ fontSize: "20px" }} />
                {menu.label}
              </IonButton>
            ))}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ "--background": "#f8fafc" } as any} fullscreen>
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
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IonIcon icon={shieldOutline} style={{ fontSize: '28px', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                System Logs
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Track all admin activities and system events
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '0 20px 20px 20px' }}>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value!)}
            placeholder="Search logs..."
            style={{
              '--background': 'white',
              '--border-radius': '12px',
              '--box-shadow': '0 2px 8px rgba(0,0,0,0.08)'
            } as any}
          />
        </div>

        {/* Stats Overview */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#f8fafc',
          padding: '0 20px 20px 20px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {[
              { label: 'Total', value: stats.total, color: '#6b7280', icon: documentTextOutline, filter: 'all' },
              { label: 'Logins', value: stats.login, color: '#10b981', icon: logInOutline, filter: 'login' },
              { label: 'Notifications', value: stats.notify, color: '#3b82f6', icon: notificationsOutline, filter: 'notify' },
              { label: 'Report Updates', value: stats.update_report, color: '#f59e0b', icon: checkmarkCircleOutline, filter: 'update_report' },
              { label: 'User Actions', value: stats.user_action, color: '#ef4444', icon: personRemoveOutline, filter: 'user_action' }
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
                  transition: 'all 0.3s ease'
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

        {/* System Logs List */}
        <div style={{ padding: '0 20px 20px 20px' }}>
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
                {filter === 'all' ? 'All System Activities' : filter.charAt(0).toUpperCase() + filter.slice(1) + ' Activities'} ({filteredLogs.length})
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

                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                              <strong>Admin:</strong> {log.admin_email}
                            </div>
                            {log.target_user_email && (
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                                <strong>Target User:</strong> {log.target_user_email}
                              </div>
                            )}
                            {log.target_report_id && (
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                                <strong>Report ID:</strong> {log.target_report_id}
                              </div>
                            )}
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
                  <IonIcon icon={shieldOutline} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No system logs found</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {filter === 'all' ? 'No system activities recorded yet' : `No ${filter} activities found`}
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default SystemLogs;