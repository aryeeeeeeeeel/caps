// src/pages/admin-tabs/AdminAnalytics.tsx - Fixed skeleton screen
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonBadge,
  useIonRouter,
  IonText,
  IonSkeletonText,
  IonToast
} from '@ionic/react';
import {
  arrowBackOutline,
  downloadOutline,
  calendarOutline,
  statsChartOutline,
  documentTextOutline,
  notificationsOutline,
  logOutOutline,
  peopleOutline,
  alertCircleOutline,
  desktopOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';

interface ReportData {
  total: number;
  pending: number;
  active: number;
  resolved: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byBarangay: { [key: string]: number };
  byCategory: { [key: string]: number };
}

// Skeleton Components
const SkeletonStatsCard: React.FC = () => (
  <IonCol size="6" sizeMd="3">
    <IonCard style={{ borderRadius: '12px', textAlign: 'center' }}>
      <IonCardContent>
        <IonSkeletonText animated style={{ width: '32px', height: '32px', margin: '0 auto 8px', borderRadius: '50%' }} />
        <IonSkeletonText animated style={{ width: '60%', height: '16px', margin: '0 auto 4px' }} />
        <IonSkeletonText animated style={{ width: '40%', height: '24px', margin: '0 auto' }} />
      </IonCardContent>
    </IonCard>
  </IonCol>
);

const SkeletonPriorityItem: React.FC = () => (
  <IonCol size="6" sizeMd="3">
    <div style={{
      padding: '12px',
      background: '#f8fafc',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <IonSkeletonText animated style={{ width: '50px', height: '20px', margin: '0 auto 8px', borderRadius: '10px' }} />
      <IonSkeletonText animated style={{ width: '30px', height: '24px', margin: '0 auto' }} />
    </div>
  </IonCol>
);

const SkeletonListItems: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '6px',
          marginBottom: '8px'
        }}
      >
        <IonSkeletonText animated style={{ width: '60%', height: '16px' }} />
        <IonSkeletonText animated style={{ width: '20px', height: '20px', borderRadius: '10px' }} />
      </div>
    ))}
  </>
);

const AdminAnalytics: React.FC = () => {
  const navigation = useIonRouter();
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const [showNewNotificationToast, setShowNewNotificationToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: reports } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('read', false);

      const { data: feedbackFromReports } = await supabase
        .from('feedback')
        .select('*')
        .eq('read', false);

      const { data: feedback } = await supabase
        .from('feedback')
        .select('*')
        .eq('read', false);

      const newCount = (reports?.length || 0) +
        (feedbackFromReports?.length || 0) +
        (feedback?.length || 0);

      // Combine all notifications to find last one
      const allNotifications = [
        ...(reports || []).map(r => ({ type: 'incident_report', created_at: r.created_at })),
        ...(feedbackFromReports || []).map(f => ({ type: 'feedback', created_at: f.created_at })),
        ...(feedback || []).map(f => ({ type: 'feedback', created_at: f.created_at }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const lastNotification = allNotifications[0];

      // Show toast when unread count increases
      if (newCount > prevUnreadCount && prevUnreadCount > 0 && lastNotification) {
        setToastMessage(
          lastNotification.type === 'incident_report'
            ? "A new incident report was submitted. Check it out!"
            : "A new feedback was submitted. Check it out!"
        );
        setShowNewNotificationToast(true);
      }
      setPrevUnreadCount(newCount);
      setUnreadCount(newCount);
    };

    fetchUnreadCount();

    const reportsChannel = supabase
      .channel('reports_unread_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_reports' }, () => fetchUnreadCount())
      .subscribe();

    const feedbackChannel = supabase
      .channel('feedback_unread_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => fetchUnreadCount())
      .subscribe();

    return () => {
      reportsChannel.unsubscribe();
      feedbackChannel.unsubscribe();
    };
  }, [prevUnreadCount]); // Added dependency

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };

    checkDevice();
    setIsInitialLoading(false);
  }, []);

  useEffect(() => {
    setDefaultDates();
  }, [reportPeriod]);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };

    checkDevice();
    setIsInitialLoading(false);
  }, []);

  useEffect(() => {
    setDefaultDates();
  }, [reportPeriod]);

  const setDefaultDates = () => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = new Date();

    switch (reportPeriod) {
      case 'daily':
        start = today;
        break;
      case 'weekly':
        start.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(today.getMonth() - 3);
        break;
      case 'yearly':
        start.setFullYear(today.getFullYear() - 1);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end);
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

      if (error) throw error;

      if (data) {
        const reportData: ReportData = {
          total: data.length,
          pending: data.filter(r => r.status === 'pending').length,
          active: data.filter(r => r.status === 'active').length,
          resolved: data.filter(r => r.status === 'resolved').length,
          byPriority: {
            low: data.filter(r => r.priority === 'low').length,
            medium: data.filter(r => r.priority === 'medium').length,
            high: data.filter(r => r.priority === 'high').length,
            critical: data.filter(r => r.priority === 'critical').length
          },
          byBarangay: {},
          byCategory: {}
        };

        data.forEach(report => {
          const barangay = report.barangay || 'Unknown';
          reportData.byBarangay[barangay] = (reportData.byBarangay[barangay] || 0) + 1;
        });

        data.forEach(report => {
          const category = report.category || 'Unknown';
          reportData.byCategory[category] = (reportData.byCategory[category] || 0) + 1;
        });

        setReportData(reportData);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    const reportText = `
INCIDENT REPORT - ${reportPeriod.toUpperCase()}
Period: ${startDate} to ${endDate}
Generated: ${new Date().toLocaleString()}

==================================================

SUMMARY
==================================================
Total Incidents: ${reportData.total}
Pending: ${reportData.pending}
Active: ${reportData.active}
Resolved: ${reportData.resolved}

PRIORITY BREAKDOWN
==================================================
Critical: ${reportData.byPriority.critical}
High: ${reportData.byPriority.high}
Medium: ${reportData.byPriority.medium}
Low: ${reportData.byPriority.low}

BY BARANGAY
==================================================
${Object.entries(reportData.byBarangay)
        .sort((a, b) => b[1] - a[1])
        .map(([barangay, count]) => `${barangay}: ${count}`)
        .join('\n')}

BY CATEGORY
==================================================
${Object.entries(reportData.byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => `${category}: ${count}`)
        .join('\n')}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident_report_${reportPeriod}_${startDate}_to_${endDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show skeleton during initial load
  if (isInitialLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', '--color': 'white' } as any}>
            <IonButtons slot="start">
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </IonButtons>
            <IonTitle style={{ fontWeight: 'bold' }}>
              <IonSkeletonText animated style={{ width: '250px', height: '20px' }} />
            </IonTitle>
            <IonButtons slot="end">
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px' }} />
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </IonButtons>
          </IonToolbar>

          <IonToolbar style={{ '--background': 'white' } as any}>
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb' }}>
              {[1, 2, 3, 4].map((item) => (
                <div key={item} style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                  <IonSkeletonText animated style={{ width: '80%', height: '16px', margin: '0 auto' }} />
                </div>
              ))}
            </div>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#f8fafc' } as any}>
          <div style={{ padding: '20px' }}>
            <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
              <IonCardContent>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <IonSkeletonText animated style={{ width: '24px', height: '24px' }} />
                  <IonSkeletonText animated style={{ width: '150px', height: '20px' }} />
                </div>

                <IonGrid>
                  <IonRow>
                    <IonCol size="12" sizeMd="4">
                      <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px' }} />
                    </IonCol>
                    <IonCol size="12" sizeMd="4">
                      <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px' }} />
                    </IonCol>
                    <IonCol size="12" sizeMd="4">
                      <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px' }} />
                    </IonCol>
                  </IonRow>
                </IonGrid>

                <IonSkeletonText animated style={{ width: '100%', height: '48px', borderRadius: '12px', marginTop: '16px' }} />
              </IonCardContent>
            </IonCard>

            <IonCard style={{ borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
              <IonCardContent>
                <IonSkeletonText animated style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%' }} />
                <IonSkeletonText animated style={{ width: '200px', height: '20px', margin: '0 auto 8px' }} />
                <IonSkeletonText animated style={{ width: '300px', height: '14px', margin: '0 auto' }} />
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Show mobile restriction
  if (isMobileDevice) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '400px', padding: '40px 20px' }}>
            <IonIcon
              icon={desktopOutline}
              style={{ fontSize: '64px', color: '#667eea', marginBottom: '20px' }}
            />
            <IonText>
              <h2 style={{ color: '#2d3748', marginBottom: '16px' }}>
                Admin Access Restricted
              </h2>
              <p style={{ color: '#718096', lineHeight: '1.6' }}>
                This analytics page is only accessible by an admin.
              </p>
            </IonText>
            <IonButton
              onClick={() => navigation.push('/it35-lab2')}
              style={{ marginTop: '20px' }}
            >
              Return to Home
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', '--color': 'white' } as any}>
          <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta - Analytics & Reports</IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              onClick={() => navigation.push("/it35-lab2/admin/notifications", "forward", "push")}
              style={{ color: 'white' }}
            >
              <IonIcon icon={notificationsOutline} />
              {unreadCount > 0 && (
                <IonBadge
                  color="danger"
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: '0px',
                    fontSize: '10px',
                    transform: 'translate(25%, -25%)'
                  }}
                >
                  {unreadCount}
                </IonBadge>
              )}
            </IonButton>
            <IonButton
              fill="clear"
              onClick={async () => {
                await supabase.auth.signOut();
                navigation.push('/it35-lab2', 'root', 'replace');
              }}
              style={{ color: 'white' }}
            >
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        <IonToolbar style={{ '--background': 'white' } as any}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: statsChartOutline, route: '/it35-lab2/admin-dashboard' },
              { id: 'incidents', label: 'Incidents', icon: alertCircleOutline, route: '/it35-lab2/admin/incidents' },
              { id: 'users', label: 'Users', icon: peopleOutline, route: '/it35-lab2/admin/users' },
              { id: 'analytics', label: 'Analytics', icon: documentTextOutline }
            ].map(menu => (
              <IonButton
                key={menu.id}
                fill="clear"
                onClick={() => {
                  if (menu.route) {
                    navigation.push(menu.route, 'forward', 'push');
                  }
                }}
                style={{
                  '--color': menu.id === 'analytics' ? '#3b82f6' : '#6b7280',
                  '--background': 'transparent',
                  '--border-radius': '0',
                  borderBottom: menu.id === 'analytics' ? '2px solid #3b82f6' : '2px solid transparent',
                  margin: 0,
                  flex: 1
                } as any}
              >
                <IonIcon icon={menu.icon} slot="start" />
                {menu.label}
              </IonButton>
            ))}
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': '#f8fafc' } as any}>
        <div style={{ padding: '20px' }}>
          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <IonIcon icon={calendarOutline} style={{ fontSize: '24px', color: '#3b82f6' }} />
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Generate Report</h2>
              </div>

              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="4">
                    <IonItem>
                      <IonLabel position="stacked">Report Period</IonLabel>
                      <IonSelect
                        value={reportPeriod}
                        onIonChange={e => setReportPeriod(e.detail.value)}
                      >
                        <IonSelectOption value="daily">Daily</IonSelectOption>
                        <IonSelectOption value="weekly">Weekly</IonSelectOption>
                        <IonSelectOption value="monthly">Monthly</IonSelectOption>
                        <IonSelectOption value="quarterly">Quarterly</IonSelectOption>
                        <IonSelectOption value="yearly">Yearly</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="4">
                    <IonItem>
                      <IonLabel position="stacked">Start Date</IonLabel>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: 'none',
                          background: 'transparent',
                          fontSize: '14px'
                        }}
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="4">
                    <IonItem>
                      <IonLabel position="stacked">End Date</IonLabel>
                      <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: 'none',
                          background: 'transparent',
                          fontSize: '14px'
                        }}
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>

              <IonButton
                expand="block"
                onClick={generateReport}
                disabled={isGenerating || !startDate || !endDate}
                style={{ marginTop: '16px' }}
              >
                {isGenerating ? (
                  <>
                    <IonSpinner name="circular" style={{ marginRight: '8px' }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <IonIcon icon={statsChartOutline} slot="start" />
                    Generate Report
                  </>
                )}
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Show skeleton while generating report */}
          {isGenerating && (
            <>
              <IonGrid>
                <IonRow>
                  <SkeletonStatsCard />
                  <SkeletonStatsCard />
                  <SkeletonStatsCard />
                  <SkeletonStatsCard />
                </IonRow>
              </IonGrid>

              <IonCard style={{ borderRadius: '16px', marginBottom: '20px', marginTop: '20px' }}>
                <IonCardContent>
                  <IonSkeletonText animated style={{ width: '120px', height: '18px', marginBottom: '16px' }} />
                  <IonGrid>
                    <IonRow>
                      <SkeletonPriorityItem />
                      <SkeletonPriorityItem />
                      <SkeletonPriorityItem />
                      <SkeletonPriorityItem />
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>

              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardContent>
                  <IonSkeletonText animated style={{ width: '140px', height: '18px', marginBottom: '16px' }} />
                  <SkeletonListItems count={6} />
                </IonCardContent>
              </IonCard>

              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardContent>
                  <IonSkeletonText animated style={{ width: '130px', height: '18px', marginBottom: '16px' }} />
                  <SkeletonListItems count={4} />
                </IonCardContent>
              </IonCard>

              <IonSkeletonText animated style={{ width: '100%', height: '48px', borderRadius: '12px' }} />
            </>
          )}

          {/* Report Results - Only show when not generating */}
          {reportData && !isGenerating && (
            <>
              <IonGrid>
                <IonRow>
                  {[
                    { label: 'Total Incidents', value: reportData.total, color: '#6b7280' },
                    { label: 'Pending', value: reportData.pending, color: '#f59e0b' },
                    { label: 'Active', value: reportData.active, color: '#3b82f6' },
                    { label: 'Resolved', value: reportData.resolved, color: '#10b981' }
                  ].map((stat, idx) => (
                    <IonCol key={idx} size="6" sizeMd="3">
                      <IonCard style={{ borderRadius: '12px', textAlign: 'center' }}>
                        <IonCardContent>
                          <div style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color }}>
                            {stat.value}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            {stat.label}
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>

              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardContent>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    Priority Breakdown
                  </h3>
                  <IonGrid>
                    <IonRow>
                      {Object.entries(reportData.byPriority).map(([priority, count]) => (
                        <IonCol key={priority} size="6" sizeMd="3">
                          <div style={{
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <IonBadge
                              color={priority === 'critical' ? 'danger' : priority === 'high' ? 'warning' : priority === 'medium' ? 'primary' : 'success'}
                              style={{ marginBottom: '8px' }}
                            >
                              {priority.toUpperCase()}
                            </IonBadge>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{count}</div>
                          </div>
                        </IonCol>
                      ))}
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>

              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardContent>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    Incidents by Barangay
                  </h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {Object.entries(reportData.byBarangay)
                      .sort((a, b) => b[1] - a[1])
                      .map(([barangay, count]) => (
                        <div
                          key={barangay}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '6px'
                          }}
                        >
                          <span style={{ fontWeight: '500' }}>{barangay}</span>
                          <IonBadge color="primary">{count}</IonBadge>
                        </div>
                      ))}
                  </div>
                </IonCardContent>
              </IonCard>

              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardContent>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    Incidents by Category
                  </h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {Object.entries(reportData.byCategory)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, count]) => (
                        <div
                          key={category}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '6px'
                          }}
                        >
                          <span style={{ fontWeight: '500' }}>{category}</span>
                          <IonBadge color="secondary">{count}</IonBadge>
                        </div>
                      ))}
                  </div>
                </IonCardContent>
              </IonCard>

              <IonButton
                expand="block"
                onClick={downloadReport}
                color="success"
              >
                <IonIcon icon={downloadOutline} slot="start" />
                Download Report
              </IonButton>
            </>
          )}

          {/* Empty State - Only show when not generating and no data */}
          {!reportData && !isGenerating && (
            <IonCard style={{ borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
              <IonCardContent>
                <IonIcon icon={documentTextOutline} style={{ fontSize: '64px', color: '#d1d5db', marginBottom: '16px' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', margin: '0 0 8px 0' }}>
                  No Report Generated
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Select a period and generate a report to view analytics
                </p>
              </IonCardContent>
            </IonCard>
          )}
        <IonToast
          isOpen={showNewNotificationToast}
          onDidDismiss={() => setShowNewNotificationToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminAnalytics;

function setShowToast(arg0: boolean) {
  throw new Error('Function not implemented.');
}