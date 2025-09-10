// src/pages/user-tabs/Notifications.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonSegment,
  IonSegmentButton,
  IonAlert,
  IonToast,
  IonBadge
} from '@ionic/react';
import {
  notificationsOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  informationCircleOutline,
  warningOutline,
  timeOutline,
  trashOutline,
  checkmarkDoneOutline,
  refreshOutline,
  filterOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  created_at: string;
  report_id?: string;
  action_url?: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, handleNewNotification)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    applyFilter();
  }, [notifications, filter]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setToastMessage('Failed to load notifications');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewNotification = (payload: any) => {
    const newNotification = payload.new;
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast for new notification
    setToastMessage(`New notification: ${newNotification.title}`);
    setShowToast(true);
  };

  const applyFilter = () => {
    let filtered = notifications;

    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.read);
        break;
      case 'read':
        filtered = notifications.filter(n => n.read);
        break;
      default:
        filtered = notifications;
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_email', user.email)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );

      setToastMessage('All notifications marked as read');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to mark all as read');
      setShowToast(true);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setToastMessage('Notification deleted');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to delete notification');
      setShowToast(true);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_email', user.email);

      if (error) throw error;

      setNotifications([]);
      setToastMessage('All notifications cleared');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to clear notifications');
      setShowToast(true);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return checkmarkCircleOutline;
      case 'warning': return warningOutline;
      case 'alert': return alertCircleOutline;
      default: return informationCircleOutline;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'alert': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchNotifications();
    event.detail.complete();
  };

  const getFilterCounts = () => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      read: notifications.filter(n => n.read).length
    };
  };

  const counts = getFilterCounts();

  return (
    <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <div style={{ padding: '20px' }}>
        {/* Header */}
        <IonCard style={{
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          <IonCardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  position: 'relative'
                }}>
                  <IonIcon icon={notificationsOutline} style={{ fontSize: '24px', color: 'white' }} />
                  {counts.unread > 0 && (
                    <IonBadge 
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ef4444',
                        minWidth: '20px',
                        height: '20px',
                        fontSize: '11px'
                      }}
                    >
                      {counts.unread}
                    </IonBadge>
                  )}
                </div>
                <div>
                  <IonCardTitle style={{ color: '#1f2937', fontSize: '20px', margin: '0 0 4px 0' }}>
                    Notifications
                  </IonCardTitle>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {counts.unread} unread of {counts.all} total
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <IonButton fill="clear" onClick={fetchNotifications}>
                  <IonIcon icon={refreshOutline} color="primary" />
                </IonButton>
                {counts.unread > 0 && (
                  <IonButton fill="clear" onClick={markAllAsRead}>
                    <IonIcon icon={checkmarkDoneOutline} color="secondary" />
                  </IonButton>
                )}
              </div>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Filter Segment */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardContent style={{ padding: '16px' }}>
            <IonSegment 
              value={filter} 
              onIonChange={e => setFilter(e.detail.value as any)}
            >
              <IonSegmentButton value="all">
                <IonLabel>All ({counts.all})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="unread">
                <IonLabel>Unread ({counts.unread})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="read">
                <IonLabel>Read ({counts.read})</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonCardContent>
        </IonCard>

        {/* Notifications List */}
        {isLoading ? (
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
              <IonIcon icon={refreshOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading notifications...</p>
            </IonCardContent>
          </IonCard>
        ) : filteredNotifications.length === 0 ? (
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
              <IonIcon icon={notificationsOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', marginTop: '16px', marginBottom: '20px' }}>
                {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
              </p>
              {filter === 'all' && (
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                  You'll receive notifications about your report updates here
                </p>
              )}
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList style={{ background: 'transparent' }}>
            {filteredNotifications.map((notification) => (
              <IonCard key={notification.id} style={{
                borderRadius: '16px',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: notification.read ? '1px solid #e5e7eb' : '2px solid #8b5cf6'
              }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                      {/* Notification Icon */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: getNotificationColor(notification.type) + '20',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px',
                        flexShrink: 0
                      }}>
                        <IonIcon 
                          icon={getNotificationIcon(notification.type)} 
                          style={{ 
                            fontSize: '20px', 
                            color: getNotificationColor(notification.type) 
                          }} 
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title and Status */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: notification.read ? '#6b7280' : '#1f2937',
                            margin: 0,
                            flex: 1
                          }}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#8b5cf6'
                            }}></div>
                          )}
                        </div>

                        {/* Message */}
                        <p style={{
                          fontSize: '14px',
                          color: notification.read ? '#9ca3af' : '#4b5563',
                          margin: '0 0 8px 0',
                          lineHeight: '1.5'
                        }}>
                          {notification.message}
                        </p>

                        {/* Time */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <IonIcon icon={timeOutline} style={{ 
                            fontSize: '12px', 
                            color: '#9ca3af', 
                            marginRight: '4px' 
                          }} />
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!notification.read && (
                            <IonButton 
                              size="small" 
                              fill="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <IonIcon icon={checkmarkDoneOutline} slot="start" />
                              Mark Read
                            </IonButton>
                          )}
                          {notification.action_url && (
                            <IonButton 
                              size="small" 
                              fill="clear"
                              routerLink={notification.action_url}
                            >
                              View Report
                            </IonButton>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <IonButton 
                      fill="clear" 
                      size="small"
                      color="medium"
                      onClick={() => {
                        setSelectedNotification(notification);
                        setShowDeleteAlert(true);
                      }}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        {/* Clear All Button */}
        {notifications.length > 0 && (
          <IonCard style={{ borderRadius: '16px', marginTop: '20px' }}>
            <IonCardContent style={{ padding: '16px', textAlign: 'center' }}>
              <IonButton 
                fill="outline"
                color="danger"
                onClick={() => {
                  setSelectedNotification(null);
                  setShowDeleteAlert(true);
                }}
              >
                <IonIcon icon={trashOutline} slot="start" />
                Clear All Notifications
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}
      </div>

      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={selectedNotification ? "Delete Notification" : "Clear All Notifications"}
        message={selectedNotification 
          ? "Are you sure you want to delete this notification?"
          : "Are you sure you want to clear all notifications? This action cannot be undone."
        }
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: selectedNotification ? 'Delete' : 'Clear All',
            handler: () => {
              if (selectedNotification) {
                deleteNotification(selectedNotification.id);
              } else {
                clearAllNotifications();
              }
            }
          }
        ]}
      />

      {/* Toast */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />
    </IonContent>
  );
};

export default Notifications;