// src/pages/user-tabs/ActivityLogs.tsx - User Activity Logs
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
  RefresherEventDetail
} from '@ionic/react';
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
  documentTextOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import { useHistory } from 'react-router-dom';

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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'login' | 'logout' | 'report' | 'feedback' | 'profile'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchActivityLogs();
  }, []);

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

  if (isLoading) {
    return (
      <IonPage>
        <IonContent style={{ '--background': '#f8fafc' } as any}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[1, 2, 3, 4].map(i => (
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

            {/* Activity List Skeleton */}
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
      <IonContent style={{ '--background': '#f8fafc' } as any}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
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

export default ActivityLogs;
