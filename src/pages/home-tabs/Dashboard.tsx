// src/pages/home-tabs/Dashboard.tsx
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
  IonPage
} from '@ionic/react';
import {
  homeOutline,
  warningOutline,
  locationOutline,
  eyeOutline,
  mapOutline,
  notificationsOutline,
  statsChartOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  investigatingReports: number;
  resolvedReports: number;
  myReports: number;
  recentActivity: any[];
}

const Dashboard: React.FC = () => {
  const history = useHistory();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    pendingReports: 0,
    investigatingReports: 0,
    resolvedReports: 0,
    myReports: 0,
    recentActivity: []
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weatherInfo, setWeatherInfo] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userReports, setUserReports] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
    fetchDashboardData();
  }, []);

  const fetchUserData = async () => {
    try {
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
        setUnreadNotifications(data.length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Use mock data when no user is logged in
        setStats({
          totalReports: 0,
          pendingReports: 0,
          investigatingReports: 0,
          resolvedReports: 0,
          myReports: 0,
          recentActivity: []
        });
        setRecentReports([]);
        setIsLoading(false);
        return;
      }

      // Try to create tables if they don't exist (development mode)
      try {
        await createTablesIfNotExists();
      } catch (tableError) {
        console.log('Tables creation skipped - may already exist or need manual setup');
      }

      // Fetch all reports statistics with error handling
      try {
        const { data: allReports, error: allReportsError } = await supabase
          .from('hazard_reports')
          .select('*');

        if (allReportsError) {
          throw allReportsError;
        }

        // Process real data
        const pending = allReports?.filter(r => r.status === 'pending').length || 0;
        const investigating = allReports?.filter(r => r.status === 'investigating').length || 0;
        const resolved = allReports?.filter(r => r.status === 'resolved').length || 0;
        const myReports = allReports?.filter(r => r.reporter_email === user.email).length || 0;

        setStats({
          totalReports: allReports?.length || 0,
          pendingReports: pending,
          investigatingReports: investigating,
          resolvedReports: resolved,
          myReports: myReports,
          recentActivity: allReports?.slice(0, 5) || []
        });

        setRecentReports(allReports?.slice(0, 3) || []);

      } catch (reportsError) {
        console.warn('Database not available:', reportsError);
        setStats({
          totalReports: 0,
          pendingReports: 0,
          investigatingReports: 0,
          resolvedReports: 0,
          myReports: 0,
          recentActivity: []
        });
        setRecentReports([]);
      }

      setWeatherInfo(null);
    } catch (error) {
      console.warn('Error in fetchDashboardData, using fallback data:', error);
      // Remove all mock data fallback
      setStats({
        totalReports: 0,
        pendingReports: 0,
        investigatingReports: 0,
        resolvedReports: 0,
        myReports: 0,
        recentActivity: []
      });
      setRecentReports([]);
      setWeatherInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createTablesIfNotExists = async () => {
    try {
      // Create hazard_reports table
      await supabase.rpc('create_hazard_reports_table');
    } catch (error) {
      // Table might already exist or RPC not available
      console.log('Tables might already exist or need to be created manually');
    }
  };


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
                Help keep Manolo Fortich safe by reporting hazards in your community
              </p>

              {weatherInfo && (
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ fontSize: '14px', margin: 0, opacity: 0.8 }}>Current Weather</p>
                    <p style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      {weatherInfo.temperature} - {weatherInfo.condition}
                    </p>
                  </div>
                  <IonIcon icon={statsChartOutline} style={{ fontSize: '24px', opacity: 0.8 }} />
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Statistics Cards */}
          <IonGrid style={{ padding: 0, marginBottom: '20px' }}>
            <IonRow>
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
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px'
                    }}>
                      <IonIcon icon={statsChartOutline} style={{ fontSize: '20px', color: 'white' }} />
                    </div>
                    <div>
                      {isLoading ? (
                        <IonSkeletonText animated style={{ width: '40px', height: '24px' }} />
                      ) : (
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                          {stats.totalReports}
                        </h2>
                      )}
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Total Reports</p>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>

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
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>My Reports</p>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            <IonRow>
              {/* Pending Reports Box */}
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

              {/* Investigating Reports Box */}
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
                        {stats.investigatingReports}
                      </h3>
                    )}
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: 0, textAlign: 'center' }}>Investigating</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Resolved Reports Box */}
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
                  Recent Reports
                </IonCardTitle>
                <IonButton
                  fill="clear"
                  size="small"
                  routerLink="/it35-lab2/app/reports"
                >
                  View All
                </IonButton>
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
                  <p style={{ color: '##9ca3af', marginTop: '16px' }}>No recent reports</p>
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
                      routerLink="/it35-lab2/app/reports"
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

          {/* Safety Tips */}
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardHeader>
              <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                <IonIcon icon={shieldCheckmarkOutline} style={{ marginRight: '8px', color: '#10b981' }} />
                Safety Tips
              </IonCardTitle>
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
                  <li>Always prioritize your safety when reporting hazards</li>
                  <li>Take clear photos from a safe distance</li>
                  <li>Provide accurate location information</li>
                  <li>Report critical incidents immediately by calling emergency services</li>
                </ul>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;