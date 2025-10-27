// src/pages/user-tabs/Dashboard.tsx - UPDATED: Fixed skeleton loading and removed View All
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonSkeletonText,
  IonProgressBar,
  IonPage,
  IonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonTabBar,
  IonTabButton
} from '@ionic/react';
import {
  homeOutline,
  warningOutline,
  locationOutline,
  eyeOutline,
  mapOutline,
  notificationsOutline,
  statsChartOutline,
  shieldCheckmarkOutline,
  callOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

interface DashboardStats {
  pendingReports: number;
  activeReports: number;
  resolvedReports: number;
  myReports: number;
}

// Skeleton Components
const SkeletonStatsCard: React.FC = () => (
  <IonCol size="6">
    <IonCard style={{
      borderRadius: '16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      height: '100px'
    }}>
      <IonCardContent style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        height: '100%'
      }}>
        <IonSkeletonText animated style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          marginRight: '16px'
        }} />
        <div style={{ flex: 1 }}>
          <IonSkeletonText animated style={{ width: '60%', height: '24px', marginBottom: '8px' }} />
          <IonSkeletonText animated style={{ width: '40%', height: '12px' }} />
        </div>
      </IonCardContent>
    </IonCard>
  </IonCol>
);

const SkeletonMiniStatsCard: React.FC = () => (
  <IonCol size="4">
    <IonCard style={{
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      height: '80px'
    }}>
      <IonCardContent style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <IonSkeletonText animated style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          marginBottom: '8px'
        }} />
        <IonSkeletonText animated style={{ width: '20px', height: '16px', marginBottom: '4px' }} />
        <IonSkeletonText animated style={{ width: '30px', height: '10px' }} />
      </IonCardContent>
    </IonCard>
  </IonCol>
);

const SkeletonRecentReportItem: React.FC = () => (
  <IonItem style={{ '--background': 'transparent' } as any}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      padding: '12px 0'
    }}>
      <IonSkeletonText animated style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        marginRight: '12px'
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <IonSkeletonText animated style={{ width: '70%', height: '16px', marginBottom: '8px' }} />
        <IonSkeletonText animated style={{ width: '50%', height: '12px', marginBottom: '8px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IonSkeletonText animated style={{ width: '40px', height: '20px', borderRadius: '10px' }} />
          <IonSkeletonText animated style={{ width: '30px', height: '12px' }} />
        </div>
      </div>
    </div>
  </IonItem>
);

const Dashboard: React.FC = () => {
  const history = useHistory();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    pendingReports: 0,
    activeReports: 0,
    resolvedReports: 0,
    myReports: 0
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_email', user.email)
          .single();

        if (!error && profile) {
          setUserProfile(profile);
        }

        if (user.email) {
          fetchUserReports(user.email);
          fetchNotifications(user.email);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
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

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats({
          pendingReports: 0,
          activeReports: 0,
          resolvedReports: 0,
          myReports: 0
        });
        setRecentReports([]);
        setIsLoading(false);
        return;
      }

      // Fetch ONLY user's reports
      const { data: userReports, error: userReportsError } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('reporter_email', user.email)
        .order('created_at', { ascending: false });

      if (userReportsError) {
        console.error('Error fetching reports:', userReportsError);
        setStats({
          pendingReports: 0,
          activeReports: 0,
          resolvedReports: 0,
          myReports: 0
        });
        setRecentReports([]);
        setIsLoading(false);
        return;
      }

      // Process user's reports only
      const pending = userReports?.filter(r => r.status === 'pending').length || 0;
      const active = userReports?.filter(r => r.status === 'active').length || 0;
      const resolved = userReports?.filter(r => r.status === 'resolved').length || 0;

      setStats({
        pendingReports: pending,
        activeReports: active,
        resolvedReports: resolved,
        myReports: userReports?.length || 0
      });

      // Set recent reports (last 3)
      setRecentReports(userReports?.slice(0, 3) || []);

    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setStats({
        pendingReports: 0,
        activeReports: 0,
        resolvedReports: 0,
        myReports: 0
      });
      setRecentReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          history.replace('/it35-lab2');
          return;
        }
        await fetchUserData();
        await fetchDashboardData();
      } catch (error) {
        console.error('Error in checkAuth:', error);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleStatBoxClick = (type: 'pending' | 'active' | 'resolved') => {
    const count = stats[`${type}Reports`];
    
    if (count === 0) {
      setToastMessage(`No ${type} reports found`);
      setShowToast(true);
      return;
    }

    if (type === 'resolved') {
      history.push('/it35-lab2/app/history');
    } else {
      history.push('/it35-lab2/app/map');
    }
  };

  if (isLoading) {
    return (
      <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
          <div style={{ padding: '20px' }}>
            {/* Welcome Header Skeleton */}
            <IonCard style={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              marginBottom: '20px',
              overflow: 'hidden'
            }}>
              <IonCardContent style={{ padding: '24px', position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  right: '-20px',
                  top: '-20px',
                  width: '120px',
                  height: '120px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%'
                }}></div>
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  bottom: '-30px',
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '50%'
                }}></div>

                <IonSkeletonText animated style={{
                  width: '60%',
                  height: '28px',
                  marginBottom: '12px',
                  background: 'rgba(255,255,255,0.8)'
                }} />
                <IonSkeletonText animated style={{
                  width: '80%',
                  height: '16px',
                  marginBottom: '20px',
                  background: 'rgba(255,255,255,0.6)'
                }} />

                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ flex: 1 }}>
                    <IonSkeletonText animated style={{
                      width: '40%',
                      height: '14px',
                      marginBottom: '8px',
                      background: 'rgba(255,255,255,0.8)'
                    }} />
                    <IonSkeletonText animated style={{
                      width: '60%',
                      height: '16px',
                      background: 'rgba(255,255,255,0.8)'
                    }} />
                  </div>
                  <IonSkeletonText animated style={{
                    width: '24px',
                    height: '24px',
                    background: 'rgba(255,255,255,0.8)'
                  }} />
                </div>
              </IonCardContent>
            </IonCard>

            {/* Statistics Cards Skeleton */}
            <IonGrid style={{ padding: 0, marginBottom: '20px' }}>
              <IonRow>
                <IonCol size="12">
                  <IonCard style={{
                    borderRadius: '16px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    height: '100px'
                  }}>
                    <IonCardContent style={{
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      height: '100%'
                    }}>
                      <IonSkeletonText animated style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        marginRight: '16px'
                      }} />
                      <div style={{ flex: 1 }}>
                        <IonSkeletonText animated style={{ width: '60%', height: '24px', marginBottom: '8px' }} />
                        <IonSkeletonText animated style={{ width: '40%', height: '12px' }} />
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              <IonRow>
                {[1, 2, 3].map((item) => (
                  <SkeletonMiniStatsCard key={item} />
                ))}
              </IonRow>
            </IonGrid>

            {/* Recent Reports Skeleton */}
            <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonSkeletonText animated style={{ width: '120px', height: '18px' }} />
                </div>
              </IonCardHeader>
              <IonCardContent style={{ padding: 0 }}>
                <div style={{ padding: '20px' }}>
                  <IonProgressBar type="indeterminate" />
                </div>
                <IonList style={{ background: 'transparent' }}>
                  {[1, 2, 3].map((item) => (
                    <SkeletonRecentReportItem key={item} />
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Safety Tips Skeleton */}
            <IonCard style={{ borderRadius: '16px' }}>
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonSkeletonText animated style={{ width: '100px', height: '18px' }} />
                  <IonSkeletonText animated style={{ width: '100px', height: '32px', borderRadius: '20px' }} />
                </div>
              </IonCardHeader>
              <IonCardContent>
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  {[1, 2, 3, 4].map((item) => (
                    <IonSkeletonText
                      key={item}
                      animated
                      style={{
                        width: item % 2 === 0 ? '90%' : '80%',
                        height: '12px',
                        marginBottom: '8px'
                      }}
                    />
                  ))}
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#10b981';
      case 'investigating': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleDialLDRRMO = () => {
    const ldrrmoNumber = '09564022605';
    window.open(`tel:${ldrrmoNumber}`, '_self');
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchDashboardData();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '20px' }}>
          {/* Welcome Header */}
          <IonCard style={{
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <IonCardContent style={{ padding: '24px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                right: '-20px',
                top: '-20px',
                width: '120px',
                height: '120px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }}></div>
              <div style={{
                position: 'absolute',
                right: '20px',
                bottom: '-30px',
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '50%'
              }}></div>

              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 0 8px 0'
              }}>
                Welcome to iAMUMA ta
              </h2>
              <p style={{
                fontSize: '16px',
                opacity: 0.9,
                margin: '0 0 20px 0',
                lineHeight: '1.5'
              }}>
                Help keep Manolo Fortich safe by reporting incidents in your community
              </p>

              {userProfile && (
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ fontSize: '14px', margin: 0, opacity: 0.8 }}>Welcome back</p>
                    <p style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      {userProfile.username || 'User'}
                    </p>
                  </div>
                  <IonIcon icon={homeOutline} style={{ fontSize: '24px', opacity: 0.8 }} />
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Statistics Cards */}
          <IonGrid style={{ padding: 0, marginBottom: '20px' }}>
            <IonRow>
              <IonCol size="12">
                <IonCard style={{
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  height: '100px'
                }}>
                  <IonCardContent style={{
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px'
                    }}>
                      <IonIcon icon={eyeOutline} style={{ fontSize: '20px', color: 'white' }} />
                    </div>
                    <div>
                      {isLoading ? (
                        <IonSkeletonText animated style={{ width: '30px', height: '24px' }} />
                      ) : (
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                          {stats.myReports}
                        </h2>
                      )}
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>My Total Reports</p>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            <IonRow>
              {/* Pending Reports Box - Clickable */}
              <IonCol size="4">
                <IonCard 
                  button
                  onClick={() => handleStatBoxClick('pending')}
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '80px',
                    cursor: 'pointer'
                  }}>
                  <IonCardContent style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: '#f59e0b',
                      borderRadius: '50%',
                      marginBottom: '8px'
                    }}></div>
                    {isLoading ? (
                      <IonSkeletonText animated style={{ width: '20px', height: '16px' }} />
                    ) : (
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                        {stats.pendingReports}
                      </h3>
                    )}
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: 0, textAlign: 'center' }}>Pending</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Active Reports Box - Clickable */}
              <IonCol size="4">
                <IonCard
                  button
                  onClick={() => handleStatBoxClick('active')}
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '80px',
                    cursor: 'pointer'
                  }}>
                  <IonCardContent style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: '#3b82f6',
                      borderRadius: '50%',
                      marginBottom: '8px'
                    }}></div>
                    {isLoading ? (
                      <IonSkeletonText animated style={{ width: '20px', height: '16px' }} />
                    ) : (
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                        {stats.activeReports}
                      </h3>
                    )}
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: 0, textAlign: 'center' }}>Active</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Resolved Reports Box - Clickable */}
              <IonCol size="4">
                <IonCard
                  button
                  onClick={() => handleStatBoxClick('resolved')}
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '80px',
                    cursor: 'pointer'
                  }}>
                  <IonCardContent style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: '#10b981',
                      borderRadius: '50%',
                      marginBottom: '8px'
                    }}></div>
                    {isLoading ? (
                      <IonSkeletonText animated style={{ width: '20px', height: '16px' }} />
                    ) : (
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                        {stats.resolvedReports}
                      </h3>
                    )}
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: 0, textAlign: 'center' }}>Resolved</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Recent Reports */}
          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                  My Recent Reports
                </IonCardTitle>
              </div>
            </IonCardHeader>
            <IonCardContent style={{ padding: 0 }}>
              {isLoading ? (
                <div style={{ padding: '20px' }}>
                  <IonProgressBar type="indeterminate" />
                </div>
              ) : recentReports.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <IonIcon icon={homeOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
                  <p style={{ color: '#9ca3af', marginTop: '16px' }}>No reports found</p>
                  <IonButton
                    routerLink="/it35-lab2/app/submit"
                    fill="outline"
                    size="small"
                  >
                    Submit First Report
                  </IonButton>
                </div>
              ) : (
                <IonList style={{ background: 'transparent' }}>
                  {recentReports.map((report, index) => (
                    <IonItem
                      key={report.id || index}
                      button
                      routerLink="/it35-lab2/app/map"
                      style={{
                        '--padding-start': '20px',
                        '--inner-padding-end': '20px',
                        '--border-color': '#f1f5f9'
                      } as any}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '12px 0'
                      }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: getPriorityColor(report.priority || 'medium'),
                          marginRight: '12px',
                          flexShrink: 0
                        }}></div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: '0 0 4px 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {report.title}
                          </h3>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 4px 0'
                          }}>
                            <IonIcon icon={locationOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                            {report.location}, {report.barangay}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IonChip
                              style={{
                                '--background': getStatusColor(report.status) + '20',
                                '--color': getStatusColor(report.status),
                                height: '20px',
                                fontSize: '10px',
                                fontWeight: '600'
                              } as any}
                            >
                              {report.status?.toUpperCase() || 'PENDING'}
                            </IonChip>
                            <span style={{
                              fontSize: '10px',
                              color: '#9ca3af'
                            }}>
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              )}
            </IonCardContent>
          </IonCard>

          {/* Safety Tips with Dial LDRRMO */}
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <IonCardTitle style={{ fontSize: '18px', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                  <IonIcon icon={shieldCheckmarkOutline} style={{ marginRight: '8px', color: '#10b981' }} />
                  Safety Tips
                </IonCardTitle>
                <IonButton
                  fill="solid"
                  size="small"
                  color="danger"
                  onClick={handleDialLDRRMO}
                  style={{
                    '--border-radius': '20px',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    height: '32px',
                    fontWeight: '600',
                    fontSize: '12px'
                  } as any}
                >
                  <IonIcon icon={callOutline} slot="start" style={{ fontSize: '14px' }} />
                  Dial LDRRMO
                </IonButton>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <ul style={{
                  color: '#166534',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0,
                  paddingLeft: '20px'
                }}>
                  <li>Always prioritize your safety when reporting incidents</li>
                  <li>Take clear photos from a safe distance</li>
                  <li>Provide accurate location information</li>
                  <li>Report critical incidents immediately by calling emergency services</li>
                </ul>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Toast for empty stat boxes */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
          color="warning"
        />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;