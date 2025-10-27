// src/pages/Notifications.tsx - FIXED: Dynamic Mark All Read/Unread button
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
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonSkeletonText,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonTabBar,
  IonTabButton
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
  arrowBackOutline,
  checkmarkDoneOutline
} from 'ionicons/icons';
import { supabase } from '../utils/supabaseClient';
import { generateMockNotifications, safeQuery, logger } from '../utils/databaseInit';

interface Notification {
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscription();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch from notifications table
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      // Fetch from incident_reports table
      const { data: incidentUpdates } = await supabase
        .from('incident_reports')
        .select('id, title, admin_response, updated_at, read')
        .eq('reporter_email', user.email)
        .not('admin_response', 'is', null)
        .order('updated_at', { ascending: false });

      // Combine both data sources
      const allNotifications = [
        ...(notificationsData || []),
        ...(incidentUpdates || []).map(incident => ({
          id: `incident-${incident.id}`,
          user_email: user.email!,
          title: `Update on your report: ${incident.title}`,
          message: incident.admin_response || 'Admin response',
          type: 'update' as const,
          read: incident.read || false,
          created_at: incident.updated_at,
          related_report_id: incident.id,
          action_url: `/it35-lab2/app/reports/${incident.id}`
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      
      // Call refreshCount to update badge
      if (refreshCount) {
        refreshCount();
      }
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
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_email=eq.${user.email}`
        },
        () => fetchNotifications()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_reports',
          filter: `reporter_email=eq.${user.email}`
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (notification.id.startsWith('incident-')) {
            // Update incident report read status
            const reportId = notification.id.replace('incident-', '');
            await supabase
              .from('incident_reports')
              .update({ read: true })
              .eq('id', reportId);
          } else {
            // Update regular notification read status
            await supabase
              .from('notifications')
              .update({ read: true })
              .eq('id', notification.id);
          }
          
          // Update local state
          setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
          );
          
          // Refresh badge count
          if (refreshCount) refreshCount();
        }
      } catch (error) {
        logger.error('Error marking notification as read:', error);
      }
    }

    if (notification.action_url) {
      logger.info('Navigate to:', notification.action_url);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const unreadNotifications = notifications.filter(n => !n.read);

      // Update regular notifications
      const regularNotificationIds = unreadNotifications
        .filter(n => !n.id.startsWith('incident-'))
        .map(n => n.id);
      
      if (regularNotificationIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', regularNotificationIds);
      }

      // Update incident report notifications
      const incidentIds = unreadNotifications
        .filter(n => n.id.startsWith('incident-'))
        .map(n => n.id.replace('incident-', ''));
      
      if (incidentIds.length > 0) {
        await supabase
          .from('incident_reports')
          .update({ read: true })
          .in('id', incidentIds);
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

      setToastMessage(`${unreadNotifications.length} notifications marked as read`);
      setShowToast(true);
      
      // Refresh badge count
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

      // Update regular notifications
      const regularNotificationIds = readNotifications
        .filter(n => !n.id.startsWith('incident-'))
        .map(n => n.id);
      
      if (regularNotificationIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read: false })
          .in('id', regularNotificationIds);
      }

      // Update incident report notifications
      const incidentIds = readNotifications
        .filter(n => n.id.startsWith('incident-'))
        .map(n => n.id.replace('incident-', ''));
      
      if (incidentIds.length > 0) {
        await supabase
          .from('incident_reports')
          .update({ read: false })
          .in('id', incidentIds);
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: false }))
      );

      setToastMessage(`${readNotifications.length} notifications marked as unread`);
      setShowToast(true);
      
      // Refresh badge count
      if (refreshCount) refreshCount();
    } catch (error) {
      logger.error('Error marking all as unread:', error);
      setToastMessage('Error marking notifications as unread');
      setShowToast(true);
    }
  };

  const handleMarkUnread = async (notification: Notification) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (notification.id.startsWith('incident-')) {
          // Handle incident reports
          const reportId = notification.id.replace('incident-', '');
          await supabase
            .from('incident_reports')
            .update({ read: false })
            .eq('id', reportId);
        } else {
          // Handle regular notifications
          await supabase
            .from('notifications')
            .update({ read: false })
            .eq('id', notification.id);
        }
      }

      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: false } : n)
      );
      
      setToastMessage('Notification marked as unread');
      setShowToast(true);
      
      // Refresh badge count
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

      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setToastMessage('Notification deleted');
      setShowToast(true);
      
      // Refresh badge count
      if (refreshCount) refreshCount();
    } catch (error) {
      logger.error('Error deleting notification:', error);
    }
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
    if (read) return '#10b981'; // Resolved/read color
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

  // Determine if all notifications are read or unread
  const allRead = stats.unread === 0 && stats.total > 0;
  const allUnread = stats.read === 0 && stats.total > 0;

  if (isLoading) {
    return (
      <IonContent style={{ '--background': '#f8fafc' } as any}>
          <div style={{ padding: '20px' }}>
            {/* Header Container Skeleton */}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[1, 2, 3].map(i => (
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

            {/* Notifications List Skeleton */}
            <IonCard style={{ borderRadius: '16px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <IonSkeletonText animated style={{ width: '50%', height: '18px', marginBottom: '16px' }} />
                {[1, 2, 3, 4].map(i => (
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
    );
  }

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f8fafc' } as any}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Header Container with Icon - Similar to Incident Map */}
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
              <IonIcon icon={notificationsOutline} style={{ fontSize: '28px', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                Notifications
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                {stats.unread} unread notification{stats.unread !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview - Fixed at top */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#f8fafc',
          padding: '0 20px 20px 20px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Total', value: stats.total, color: '#6b7280', icon: notificationsOutline, filter: 'all' },
              { label: 'Unread', value: stats.unread, color: '#f59e0b', icon: mailOutline, filter: 'unread' },
              { label: 'Read', value: stats.read, color: '#10b981', icon: mailOpenOutline, filter: 'read' }
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

        {/* Notifications List */}
        <div style={{ padding: '0 20px 20px 20px' }}>
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {filter === 'all' ? 'All Notifications' : filter === 'unread' ? 'Unread Notifications' : 'Read Notifications'} ({filteredNotifications.length})
                {stats.total > 0 && (
                  allRead ? (
                    <IonButton
                      shape="round"
                      fill="clear"
                      onClick={markAllAsUnread}
                      style={{ '--padding-start': '12px', '--padding-end': '12px' }}
                    >
                      <IonIcon icon={mailOutline} slot="start" style={{ marginRight: '6px' }} />
                      Mark All Unread
                    </IonButton>
                  ) : (
                    <IonButton
                      shape="round"
                      fill="clear"
                      onClick={markAllAsRead}
                      style={{ '--padding-start': '12px', '--padding-end': '12px' }}
                    >
                      <IonIcon icon={checkmarkDoneOutline} slot="start" style={{ marginRight: '6px' }} />
                      Mark All Read
                    </IonButton>
                  )
                )}
              </h3>

              <IonList style={{ background: 'transparent' }}>
                {filteredNotifications.map(notification => (
                  <IonItem
                    key={notification.id}
                    button
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      '--background': notification.read ? 'transparent' : '#f0f9ff',
                      '--border-radius': '8px',
                      marginBottom: '12px'
                    } as any}
                  >
                    <div style={{ width: '100%', padding: '12px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          position: 'relative',
                          width: '40px',
                          height: '40px',
                          background: getNotificationColor(notification.type, notification.read) + '20',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <IonIcon
                            icon={getNotificationIcon(notification.type)}
                            style={{
                              fontSize: '20px',
                              color: getNotificationColor(notification.type, notification.read)
                            }}
                          />

                          {/* New badge positioned properly */}
                          {!notification.read && (
                            <div style={{
                              position: 'absolute',
                              top: '-4px',
                              right: '-4px',
                              background: '#3b82f6',
                              color: 'white',
                              borderRadius: '6px',
                              minWidth: '12px',
                              height: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
                              fontWeight: 'bold',
                              border: '1px solid white',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                              zIndex: 5
                            }}></div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <h4 style={{
                              margin: 0,
                              fontSize: '16px',
                              fontWeight: notification.read ? '500' : '600',
                              color: notification.read ? '#6b7280' : '#1f2937'
                            }}>
                              {notification.title}
                            </h4>
                            {notification.read ? (
                              <IonButton
                                fill="clear"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkUnread(notification);
                                }}
                              >
                                <IonIcon icon={mailOutline} />
                              </IonButton>
                            ) : (
                              <IonBadge color="primary" style={{ fontSize: '10px' }}>
                                New
                              </IonBadge>
                            )}
                          </div>

                          <p style={{
                            margin: '0 0 8px 0',
                            fontSize: '14px',
                            color: '#6b7280',
                            lineHeight: '1.4'
                          }}>
                            {notification.message}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <IonChip
                                style={{
                                  '--background': getNotificationColor(notification.type, notification.read) + '20',
                                  '--color': getNotificationColor(notification.type, notification.read),
                                  height: '24px',
                                  fontSize: '10px',
                                  fontWeight: '600'
                                } as any}
                              >
                                {notification.type.toUpperCase()}
                              </IonChip>
                              <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <IonIcon icon={timeOutline} style={{ fontSize: '12px' }} />
                                {new Date(notification.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {!notification.id.startsWith('incident-') && (
                              <IonButton
                                size="small"
                                fill="clear"
                                color="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
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

              {filteredNotifications.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <IonIcon icon={notificationsOutline} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No notifications found</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {filter === 'unread' ? 'All caught up!' : filter === 'read' ? 'No read notifications yet' : 'You have no notifications'}
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

export default Notifications;