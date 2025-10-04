// src/pages/admin-tabs/AdminAnalytics.tsx - Enhanced with proper reporting
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
  useIonRouter
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
  alertCircleOutline
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

const AdminAnalytics: React.FC = () => {
  const navigation = useIonRouter();
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
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

        // Group by barangay
        data.forEach(report => {
          const barangay = report.barangay || 'Unknown';
          reportData.byBarangay[barangay] = (reportData.byBarangay[barangay] || 0) + 1;
        });

        // Group by category
        data.forEach(report => {
          const category = report.category || 'Unknown';
          reportData.byCategory[category] = (reportData.byCategory[category] || 0) + 1;
        });

        setReportData(reportData);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
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

  return (
    <IonPage>
      // In AdminAnalytics.tsx - Replace the header section
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', '--color': 'white' } as any}>
          <IonButtons slot="start">
            <IonButton onClick={() => navigation.push('/it35-lab2/admin-dashboard', 'back', 'pop')}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta - Analytics & Reports</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" style={{ color: 'white' }}>
              <IonIcon icon={notificationsOutline} />
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

        {/* Menu Bar */}
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
          {/* Report Generator Card */}
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
                disabled={isLoading || !startDate || !endDate}
                style={{ marginTop: '16px' }}
              >
                {isLoading ? (
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

          {/* Report Results */}
          {reportData && (
            <>
              {/* Summary Cards */}
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

              {/* Priority Breakdown */}
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

              {/* By Barangay */}
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

              {/* By Category */}
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

              {/* Download Button */}
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

          {/* Empty State */}
          {!reportData && !isLoading && (
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
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminAnalytics;