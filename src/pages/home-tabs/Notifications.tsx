// src/pages/home-tabs/Notifications.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  IonBadge,
  IonActionSheet,
  IonAlert,
  IonToast,
  IonCheckbox,
  IonGrid,
  IonRow,
  IonCol,
  IonSkeletonText,
  IonToggle
} from '@ionic/react';
import {
  notificationsOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  warningOutline,
  timeOutline,
  trashOutline,
  checkmarkOutline,
  ellipsisVerticalOutline,
  refreshOutline,
  settingsOutline,
  mailOpenOutline,
  mailOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import { generateMockNotifications, safeQuery, logger, type Notification } from '../../utils/databaseInit';

// Type definitions for better type safety

interface NotificationCounts {
  all: number;
  unread: number;
  read: number;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const filteredNotifications = useMemo<Notification[]>(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  }, [notifications, filter]);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [autoMarkRead, setAutoMarkRead] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized filter counts for performance optimization
  const counts = useMemo<NotificationCounts>(() => ({
    all: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length
  }), [notifications]);

  // Cleanup function for async operations
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isMounted) {
        await fetchNotifications();
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  /* filteredNotifications derived via useMemo */

  const fetchNotifications = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications(generateMockNotifications());
        setIsLoading(false);
        return;
      }

      const data = await safeQuery<Notification[]>(
        async () =>
          supabase
            .from('notifications')
            .select('*')
            .eq('user_email', user.email)
            .order('created_at', { ascending: false }),
        generateMockNotifications()
      );
      setNotifications(data);
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Using offline data.');
      setNotifications(generateMockNotifications());
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* applyFilter removed; using useMemo */

  const updateNotificationLocally = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, ...updates } : n
      )
    );
  }, []);

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        updateNotificationLocally(notificationId, { read: true });
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        logger.warn('Database update failed, updating locally:', error.message);
      }

      updateNotificationLocally(notificationId, { read: true });

    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      updateNotificationLocally(notificationId, { read: true });
    }
  }, [updateNotificationLocally]);

  const markAsUnread = useCallback(async (notificationId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        updateNotificationLocally(notificationId, { read: false });
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: false })
        .eq('id', notificationId);

      if (error) {
        logger.warn('Database update failed, updating locally:', error.message);
      }

      updateNotificationLocally(notificationId, { read: false });

    } catch (error) {
      logger.error('Failed to mark notification as unread:', error);
      updateNotificationLocally(notificationId, { read: false });
    }
  }, [updateNotificationLocally]);

  const markAllAsRead = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);

      if (user) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_email', user.email)
          .eq('read', false);

        if (error) {
          logger.warn('Database update failed, updating locally:', error.message);
        }
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

      setToastMessage(`${unreadIds.length} notifications marked as read`);
      setShowToast(true);

    } catch (error) {
      logger.error('Failed to mark all as read:', error);
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

      setToastMessage(`${unreadIds.length} notifications marked as read`);
      setShowToast(true);
    }
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        logger.warn('Database delete failed, updating locally:', error.message);
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      setToastMessage('Notification deleted');
      setShowToast(true);

    } catch (error) {
      logger.error('Failed to delete notification:', error);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      setToastMessage('Notification deleted');
      setShowToast(true);
    }
  };

  const deleteSelectedNotifications = async (): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', selectedNotifications);

      if (error) {
        logger.warn('Database delete failed, updating locally:', error.message);
      }

      setNotifications(prev =>
        prev.filter(n => !selectedNotifications.includes(n.id))
      );

      const count = selectedNotifications.length;
      setSelectedNotifications([]);
      setSelectionMode(false);
      setToastMessage(`${count} notifications deleted`);
      setShowToast(true);

    } catch (error) {
      logger.error('Failed to delete selected notifications:', error);
      const count = selectedNotifications.length;
      setNotifications(prev =>
        prev.filter(n => !selectedNotifications.includes(n.id))
      );

      setSelectedNotifications([]);
      setSelectionMode(false);
      setToastMessage(`${count} notifications deleted`);
      setShowToast(true);
    }
  };

  const markSelectedAsRead = async (): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', selectedNotifications);

      if (error) {
        logger.warn('Database update failed, updating locally:', error.message);
      }

      setNotifications(prev =>
        prev.map(n =>
          selectedNotifications.includes(n.id) ? { ...n, read: true } : n
        )
      );

      const count = selectedNotifications.length;
      setSelectedNotifications([]);
      setSelectionMode(false);
      setToastMessage(`${count} notifications marked as read`);
      setShowToast(true);

    } catch (error) {
      logger.error('Failed to mark selected as read:', error);
      const count = selectedNotifications.length;
      setNotifications(prev =>
        prev.map(n =>
          selectedNotifications.includes(n.id) ? { ...n, read: true } : n
        )
      );

      setSelectedNotifications([]);
      setSelectionMode(false);
      setToastMessage(`${count} notifications marked as read`);
      setShowToast(true);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (selectionMode) {
      toggleSelection(notification.id);
      return;
    }

    if (!notification.read && autoMarkRead) {
      markAsRead(notification.id);
    }

    if (notification.action_url) {
      // Navigate to related content
      logger.info('Navigation requested to:', notification.action_url);
      // In a real app, you would use the router here
      // Example: history.push(notification.action_url);
    }
  };

  const toggleSelection = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
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

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'update': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>): Promise<void> => {
    await fetchNotifications();
    event.detail.complete();
  };


  return (
    <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as React.CSSProperties & Record<string, string>}>
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
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px'
                }}>
                  <IonIcon icon={notificationsOutline} style={{ fontSize: '24px', color: 'white' }} />
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
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => {
                    setSelectionMode(!selectionMode);
                    setSelectedNotifications([]);
                  }}
                  color={selectionMode ? 'primary' : 'medium'}
                >
                  <IonIcon icon={checkmarkOutline} />
                </IonButton>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => setShowActionSheet(true)}
                >
                  <IonIcon icon={ellipsisVerticalOutline} />
                </IonButton>
              </div>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Settings Card */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardContent style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                  Auto-mark as read
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  Automatically mark notifications as read when clicked
                </p>
              </div>
              <IonToggle
                checked={autoMarkRead}
                onIonChange={e => setAutoMarkRead(e.detail.checked)}
              />
            </div>
          </IonCardContent>
        </IonCard>

        {/* Filter Tabs */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardContent style={{ padding: '16px' }}>
            <IonSegment value={filter} onIonChange={e => setFilter(e.detail.value as 'all' | 'unread' | 'read')}>
              <IonSegmentButton value="all">
                <IonLabel>All ({counts.all})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="unread">
                <IonLabel>
                  Unread ({counts.unread})
                  {counts.unread > 0 && (
                    <IonBadge color="danger" style={{ marginLeft: '4px' }}>
                      {counts.unread}
                    </IonBadge>
                  )}
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="read">
                <IonLabel>Read ({counts.read})</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {selectionMode && (
              <div style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <span style={{ fontSize: '14px', color: '#075985', fontWeight: '600' }}>
                  {selectedNotifications.length} of {filteredNotifications.length} selected
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <IonButton size="small" fill="clear" onClick={selectAll}>
                    {selectedNotifications.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}
                  </IonButton>
                  {selectedNotifications.length > 0 && (
                    <>
                      <IonButton size="small" fill="clear" onClick={markSelectedAsRead}>
                        <IonIcon icon={mailOpenOutline} slot="start" />
                        Mark Read
                      </IonButton>
                      <IonButton size="small" fill="clear" color="danger" onClick={() => setShowDeleteAlert(true)}>
                        <IonIcon icon={trashOutline} slot="start" />
                        Delete
                      </IonButton>
                    </>
                  )}
                </div>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Notifications List */}
        <IonCard style={{ borderRadius: '16px' }}>
          <IonCardContent style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: '20px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <IonSkeletonText animated style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                      <div style={{ flex: 1 }}>
                        <IonSkeletonText animated style={{ width: '60%', height: '16px' }} />
                        <IonSkeletonText animated style={{ width: '100%', height: '14px', marginTop: '8px' }} />
                        <IonSkeletonText animated style={{ width: '30%', height: '12px', marginTop: '8px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <IonIcon icon={notificationsOutline} style={{ fontSize: '64px', color: '#d1d5db' }} />
                <h3 style={{ color: '#9ca3af', marginTop: '16px', fontSize: '18px' }}>
                  {filter === 'unread' ? 'No unread notifications' :
                    filter === 'read' ? 'No read notifications' : 'No notifications'}
                </h3>
                <p style={{ color: '#d1d5db', fontSize: '14px', margin: '8px 0 20px 0' }}>
                  You're all caught up!
                </p>
                <IonButton fill="outline" onClick={fetchNotifications}>
                  <IonIcon icon={refreshOutline} slot="start" />
                  Refresh
                </IonButton>
              </div>
            ) : (
              <IonList style={{ background: 'transparent' }}>
                {filteredNotifications.map((notification) => (
                  <IonItem
                    key={notification.id}
                    button={!selectionMode}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      '--padding-start': '20px',
                      '--inner-padding-end': '20px',
                      '--border-color': '#f1f5f9',
                      '--background': notification.read ? 'transparent' : '#fefce8'
                    } as React.CSSProperties & Record<string, string>}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      width: '100%',
                      padding: '16px 0'
                    }}>
                      {selectionMode && (
                        <IonCheckbox
                          checked={selectedNotifications.includes(notification.id)}
                          onIonChange={() => toggleSelection(notification.id)}
                          style={{ marginRight: '16px', marginTop: '4px' }}
                        />
                      )}

                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: getNotificationColor(notification.type) + '20',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '16px',
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
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: notification.read ? '500' : '600',
                            color: notification.read ? '#6b7280' : '#1f2937',
                            margin: '0 0 8px 0',
                            flex: 1,
                            lineHeight: '1.3'
                          }}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              background: '#3b82f6',
                              borderRadius: '50%',
                              marginLeft: '12px',
                              marginTop: '4px',
                              flexShrink: 0
                            }}></div>
                          )}
                        </div>

                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: '0 0 12px 0',
                          lineHeight: '1.5'
                        }}>
                          {notification.message}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IonChip
                              style={{
                                '--background': getNotificationColor(notification.type) + '20',
                                '--color': getNotificationColor(notification.type),
                                height: '24px',
                                fontSize: '11px',
                                fontWeight: '600'
                              } as React.CSSProperties & Record<string, string>}
                            >
                              {notification.type.toUpperCase()}
                            </IonChip>
                            <span style={{
                              fontSize: '12px',
                              color: '#9ca3af',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <IonIcon icon={timeOutline} style={{ fontSize: '12px' }} />
                              {(() => { const d = new Date(notification.created_at); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(); })()}
                            </span>
                          </div>

                          {!selectionMode && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <IonButton
                                size="small"
                                fill="clear"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notification.read ? markAsUnread(notification.id) : markAsRead(notification.id);
                                }}
                              >
                                <IonIcon icon={notification.read ? mailOutline : mailOpenOutline} color="primary" />
                              </IonButton>
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
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        {/* Quick Actions */}
        {!selectionMode && filteredNotifications.length > 0 && (
          <IonCard style={{ borderRadius: '16px', marginTop: '20px' }}>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={markAllAsRead}
                      disabled={counts.unread === 0}
                    >
                      <IonIcon icon={mailOpenOutline} slot="start" />
                      Mark All Read
                    </IonButton>
                  </IonCol>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      fill="outline"
                      color="secondary"
                      routerLink="/it35-lab2/app/profile"
                    >
                      <IonIcon icon={settingsOutline} slot="start" />
                      Settings
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        )}
      </div>

      {/* Action Sheet */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header="Notification Actions"
        buttons={[
          {
            text: 'Mark All as Read',
            icon: mailOpenOutline,
            handler: markAllAsRead
          },
          {
            text: selectionMode ? 'Exit Selection Mode' : 'Select Multiple',
            icon: checkmarkOutline,
            handler: () => {
              setSelectionMode(!selectionMode);
              setSelectedNotifications([]);
            }
          },
          {
            text: 'Refresh',
            icon: refreshOutline,
            handler: fetchNotifications
          },
          {
            text: 'Settings',
            icon: settingsOutline,
            handler: () => {
              logger.info('Navigate to notification settings');
              // In a real app, you would navigate to settings page
              // Example: history.push('/settings/notifications');
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />

      {/* Delete Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Notifications"
        message={`Are you sure you want to delete ${selectedNotifications.length} selected notification(s)? This action cannot be undone.`}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Delete',
            handler: deleteSelectedNotifications
          }
        ]}
      />

      {/* Toast */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
        color="primary"
      />

      {/* Error Toast */}
      {error && (
        <IonToast
          isOpen={!!error}
          onDidDismiss={() => setError(null)}
          message={error}
          duration={5000}
          position="top"
          color="warning"
        />
      )}
    </IonContent>
  );
};

export default Notifications;