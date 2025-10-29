// src/pages/user-tabs/Notifications.tsx - FIXED: Dynamic Mark All Read/Unread button
import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonSkeletonText,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonPopover,
  IonAvatar
} from '@ionic/react';
import {
  notificationsOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  warningOutline,
  timeOutline,
  trashOutline,
  mailOpenOutline,
  mailOutline,
  refreshOutline,
  checkmarkDoneOutline,
  addCircleOutline,
  homeOutline,
  mapOutline,
  personCircle,
  chatbubbleOutline,
  documentTextOutline,
  logOutOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import { useHistory, useLocation } from 'react-router-dom';
import { logger } from '../../utils/databaseInit';

interface NotificationItem {
  id: string;
  user_email: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'update';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  related_report_id?: string;
  action_url?: string;
  is_automated?: boolean;
}

interface Props {
  refreshCount?: () => void;
}

const Notifications: React.FC<Props> = ({ refreshCount }) => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Bottom tabs (aligned with Home.tsx)
  const tabs = [
    { name: 'Dashboard', tab: 'dashboard', url: '/it35-lab2/app/dashboard', icon: homeOutline },
    { name: 'Report an Incident', tab: 'submit', url: '/it35-lab2/app/submit', icon: addCircleOutline },
    { name: 'My Reports', tab: 'map', url: '/it35-lab2/app/map', icon: mapOutline },
    { name: 'History', tab: 'reports', url: '/it35-lab2/app/history', icon: timeOutline },
  ];

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase.from('users').select('*').eq('user_email', user.email).single();
        if (profile) setUserProfile(profile);
      }
      await fetchNotifications();
    })();
    setupRealtimeSubscription();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      const { data: incidentUpdates } = await supabase
        .from('incident_reports')
        .select('id, title, admin_response, updated_at, read')
        .eq('reporter_email', user.email)
        .not('admin_response', 'is', null)
        .order('updated_at', { ascending: false });

      const allNotifications: NotificationItem[] = [
        ...(notificationsData as NotificationItem[] | null || []),
        ...((incidentUpdates || []).map((incident: any) => ({
          id: `incident-${incident.id}`,
          user_email: user.email!,
          title: `Update on your report: ${incident.title}`,
          message: incident.admin_response || 'Admin response',
          type: 'update' as const,
          read: !!incident.read,
          created_at: incident.updated_at,
          related_report_id: incident.id,
          action_url: `/it35-lab2/app/reports/${incident.id}`
        })))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      if (refreshCount) refreshCount();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('user_notifications_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_email=eq.${user.email}` },
        () => fetchNotifications()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_reports', filter: `reporter_email=eq.${user.email}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' ? true : filter === 'unread' ? !n.read : n.read);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (notification.id.startsWith('incident-')) {
            const reportId = notification.id.replace('incident-', '');
            await supabase.from('incident_reports').update({ read: true }).eq('id', reportId);
          } else {
            await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
          }
          setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
          if (refreshCount) refreshCount();
        }
      } catch (error) { logger.error('Error marking notification as read:', error); }
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const unreadNotifications = notifications.filter(n => !n.read);
      const regularIds = unreadNotifications.filter(n => !n.id.startsWith('incident-')).map(n => n.id);
      if (regularIds.length) await supabase.from('notifications').update({ read: true }).in('id', regularIds);
      const incidentIds = unreadNotifications.filter(n => n.id.startsWith('incident-')).map(n => n.id.replace('incident-', ''));
      if (incidentIds.length) await supabase.from('incident_reports').update({ read: true }).in('id', incidentIds);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setToastMessage(`${unreadNotifications.length} notifications marked as read`);
      setShowToast(true);
      if (refreshCount) refreshCount();
    } catch (error) {
      logger.error('Error marking all as read:', error);
      setToastMessage('Error marking notifications as read');
      setShowToast(true);
    }
  };

  const markAllAsUnread = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const readNotifications = notifications.filter(n => n.read);
      const regularIds = readNotifications.filter(n => !n.id.startsWith('incident-')).map(n => n.id);
      if (regularIds.length) await supabase.from('notifications').update({ read: false }).in('id', regularIds);
      const incidentIds = readNotifications.filter(n => n.id.startsWith('incident-')).map(n => n.id.replace('incident-', ''));
      if (incidentIds.length) await supabase.from('incident_reports').update({ read: false }).in('id', incidentIds);
      setNotifications(prev => prev.map(n => ({ ...n, read: false })));
      setToastMessage(`${readNotifications.length} notifications marked as unread`);
      setShowToast(true);
      if (refreshCount) refreshCount();
    } catch (error) {
      logger.error('Error marking all as unread:', error);
      setToastMessage('Error marking notifications as unread');
      setShowToast(true);
    }
  };

  const handleMarkUnread = async (notification: NotificationItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (notification.id.startsWith('incident-')) {
          const reportId = notification.id.replace('incident-', '');
          await supabase.from('incident_reports').update({ read: false }).eq('id', reportId);
        } else {
          await supabase.from('notifications').update({ read: false }).eq('id', notification.id);
        }
      }
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: false } : n));
      setToastMessage('Notification marked as unread');
      setShowToast(true);
      if (refreshCount) refreshCount();
    } catch (error) {
      logger.error('Error marking notification as unread:', error);
      setToastMessage('Error updating notification');
      setShowToast(true);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      if (notificationId.startsWith('incident-')) {
        setToastMessage('Cannot delete incident updates');
        setShowToast(true);
        return;
      }
      await supabase.from('notifications').delete().eq('id', notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setToastMessage('Notification deleted');
      setShowToast(true);
      if (refreshCount) refreshCount();
    } catch (error) { logger.error('Error deleting notification:', error); }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return checkmarkCircleOutline;
      case 'warning': return warningOutline;
      case 'error': return alertCircleOutline;
      case 'update': return refreshOutline;
      default: return informationCircleOutline;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return '#10b981';
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'update': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchNotifications();
    event.detail.complete();
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length
  };

  const allRead = stats.unread === 0 && stats.total > 0;

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '--color': 'white' } as any}>
            <IonButtons slot="start" />
            <IonTitle style={{ fontWeight: 'bold', fontSize: '20px' }}>iAMUMA ta</IonTitle>
            <IonButtons slot="end">
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px' }} />
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#f8fafc' } as any}>
          <div style={{ padding: '20px' }}>
            {/* Header Stats Skeleton */}
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

            {/* Action Buttons Skeleton */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <IonSkeletonText animated style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
                <IonSkeletonText animated style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
                <IonSkeletonText animated style={{ width: '80px', height: '36px', borderRadius: '8px' }} />
              </div>
            </div>

            {/* Notifications List Skeleton */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <IonSkeletonText animated style={{ width: '120px', height: '18px', marginBottom: '16px' }} />
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: item < 5 ? '1px solid #f1f5f9' : 'none'
                }}>
                  <IonSkeletonText animated style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <IonSkeletonText animated style={{ width: '80%', height: '16px', marginBottom: '8px' }} />
                    <IonSkeletonText animated style={{ width: '60%', height: '14px', marginBottom: '4px' }} />
                    <IonSkeletonText animated style={{ width: '40%', height: '12px' }} />
                  </div>
                  <IonSkeletonText animated style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                </div>
              ))}
            </div>
          </div>
        </IonContent>
        <IonTabBar
          slot="bottom"
          style={{ '--background': 'white', '--border': '1px solid #e2e8f0', height: '70px', paddingTop: '8px', paddingBottom: '8px' } as any}
        >
          {[1, 2, 3, 4].map((item) => (
            <IonTabButton key={item} style={{ '--color': '#94a3b8' } as any}>
              <IonSkeletonText animated style={{ width: '24px', height: '24px', borderRadius: '4px', marginBottom: '4px' }} />
              <IonSkeletonText animated style={{ width: '60px', height: '12px', borderRadius: '4px' }} />
            </IonTabButton>
          ))}
        </IonTabBar>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '--color': 'white' } as any}>
          <IonButtons slot="start" />
          <IonTitle style={{ fontWeight: 'bold', fontSize: '20px' }}>iAMUMA ta</IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              onClick={() => history.push('/it35-lab2/app/notifications')}
              style={{ color: 'white', position: 'relative', borderBottom: location.pathname === '/it35-lab2/app/notifications' ? '2px solid white' : 'none' }}
            >
              <IonIcon icon={notificationsOutline} slot="icon-only" />
            </IonButton>
            {user ? (
              <IonButton fill="clear" onClick={(e) => { setPopoverEvent(e); setShowProfilePopover(true); }} style={{ color: 'white' }}>
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
      <IonPopover isOpen={showProfilePopover} event={popoverEvent} onDidDismiss={() => setShowProfilePopover(false)}>
        <IonContent>
          <div style={{ padding: '0', minWidth: '280px' }}>
            {user && (
              <>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px 20px', textAlign: 'center', color: 'white' }}>
                  {userProfile?.user_avatar_url ? (
                    <IonAvatar style={{ width: '60px', height: '60px', margin: '0 auto 12px', border: '3px solid rgba(255,255,255,0.3)' }}>
                      <img src={userProfile.user_avatar_url} alt="Profile" />
                    </IonAvatar>
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IonIcon icon={personCircle} style={{ fontSize: '40px' }} />
                    </div>
                  )}
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
                    {userProfile?.user_firstname && userProfile?.user_lastname ? `${userProfile.user_firstname} ${userProfile.user_lastname}` : 'Community Member'}
                  </h3>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9, textAlign: 'center' }}>{user.email}</p>
                </div>
                <div style={{ padding: '12px 0' }}>
                  <IonItem button onClick={() => { setShowProfilePopover(false); history.push('/it35-lab2/app/profile'); }} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                    <IonIcon icon={personCircle} slot="start" color="primary" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>View Profile</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Manage account settings</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem button onClick={() => { setShowProfilePopover(false); history.push('/it35-lab2/app/feedback'); }} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                    <IonIcon icon={chatbubbleOutline} slot="start" color="success" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Give Feedback</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Rate our response service</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem button onClick={() => { setShowProfilePopover(false); history.push('/it35-lab2/app/activity-logs'); }} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                    <IonIcon icon={documentTextOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Activity Logs</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>View your account activities</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem button onClick={async () => { await supabase.auth.signOut(); setShowProfilePopover(false); history.push('/it35-lab2'); }} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
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
      <IonContent style={{ '--background': '#f8fafc' } as any}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '20px 20px 0 20px' }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IonIcon icon={notificationsOutline} style={{ fontSize: '28px', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Notifications</h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{stats.unread} unread notification{stats.unread !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px 20px 20px' }}>
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                All Notifications ({filteredNotifications.length})
                {stats.total > 0 && (
                  allRead ? (
                    <IonButton shape="round" fill="clear" onClick={markAllAsUnread} style={{ '--padding-start': '12px', '--padding-end': '12px' } as any}>
                      <IonIcon icon={mailOutline} slot="start" style={{ marginRight: '6px' }} />
                      Mark All Unread
                    </IonButton>
                  ) : (
                    <IonButton shape="round" fill="clear" onClick={markAllAsRead} style={{ '--padding-start': '12px', '--padding-end': '12px' } as any}>
                      <IonIcon icon={checkmarkDoneOutline} slot="start" style={{ marginRight: '6px' }} />
                      Mark All Read
                    </IonButton>
                  )
                )}
              </h3>

              <IonList style={{ background: 'transparent' }}>
                {filteredNotifications.map(notification => (
                  <IonItem key={notification.id} button onClick={() => handleNotificationClick(notification)} style={{ '--background': notification.read ? 'transparent' : '#f0f9ff', '--border-radius': '8px', marginBottom: '12px' } as any}>
                    <div style={{ width: '100%', padding: '12px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '40px', height: '40px', background: getNotificationColor(notification.type, notification.read) + '20', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IonIcon icon={getNotificationIcon(notification.type)} style={{ fontSize: '20px', color: getNotificationColor(notification.type, notification.read) }} />
                          {!notification.read && (<div style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#3b82f6', color: 'white', borderRadius: '6px', minWidth: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', border: '1px solid white', boxShadow: '0 1px 2px rgba(0,0,0,0.2)', zIndex: 5 }} />)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: notification.read ? '500' : '600', color: notification.read ? '#6b7280' : '#1f2937' }}>{notification.title}</h4>
                            {notification.read ? (
                              <IonButton fill="clear" size="small" onClick={(e) => { e.stopPropagation(); handleMarkUnread(notification); }}>
                                <IonIcon icon={mailOutline} />
                              </IonButton>
                            ) : (
                              <IonBadge color="primary" style={{ fontSize: '10px' }}>New</IonBadge>
                            )}
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.4' }}>{notification.message}</p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <IonChip style={{ '--background': getNotificationColor(notification.type, notification.read) + '20', '--color': getNotificationColor(notification.type, notification.read), height: '24px', fontSize: '10px', fontWeight: '600' } as any}>
                                {notification.type.toUpperCase()}
                              </IonChip>
                              <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <IonIcon icon={timeOutline} style={{ fontSize: '12px' }} />
                                {new Date(notification.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {!notification.id.startsWith('incident-') && (
                              <IonButton size="small" fill="clear" color="danger" onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}>
                                <IonIcon icon={trashOutline} />
                              </IonButton>
                            )}
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

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} position="top" />
      </IonContent>
      <IonTabBar
        slot="bottom"
        style={{ '--background': 'white', '--border': '1px solid #e2e8f0', height: '70px', paddingTop: '8px', paddingBottom: '8px' } as any}
      >
        {tabs.map((item, index) => (
          <IonTabButton
            key={index}
            tab={item.tab}
            onClick={() => history.push(item.url)}
            style={{ '--color': '#94a3b8', '--color-selected': '#667eea' } as any}
          >
            <IonIcon icon={item.icon} style={{ marginBottom: '4px', fontSize: '22px' }} />
            <IonLabel style={{ fontSize: '11px', fontWeight: '600' }}>{item.name}</IonLabel>
          </IonTabButton>
        ))}
      </IonTabBar>
    </IonPage>
  );
};

export default Notifications;


