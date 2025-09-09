// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge,
  IonItem,
  IonLabel,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonChip,
  IonAvatar,
  IonPopover,
  IonSegment,
  IonSegmentButton,
  IonAlert,
  IonToast,
  useIonRouter
} from '@ionic/react';
import {
  statsChartOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  timeOutline,
  locationOutline,
  peopleOutline,
  documentsOutline,
  warningOutline,
  shieldOutline,
  logOutOutline,
  notificationsOutline,
  settingsOutline,
  mapOutline,
  cameraOutline,
  eyeOutline,
  createOutline,
  downloadOutline,
  refreshOutline
} from 'ionicons/icons';
import { supabase } from '../utils/supabaseClient';

interface IncidentReport {
  id: string;
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'investigating' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reporter: string;
  createdAt: string;
  barangay: string;
  coordinates?: { lat: number; lng: number };
}

const AdminDashboard: React.FC = () => {
  const navigation = useIonRouter();
  const [activeSegment, setActiveSegment] = useState('overview');
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Sample data - replace with real Supabase calls
  const [dashboardStats] = useState({
    totalReports: 347,
    pendingReports: 23,
    activeReports: 12,
    resolvedToday: 8,
    criticalAlerts: 3,
    activeUsers: 156
  });

  const [recentReports] = useState<IncidentReport[]>([
    {
      id: '1',
      title: 'Pothole on Main Street',
      description: 'Large pothole causing traffic issues',
      location: 'Main Street, Damilag',
      barangay: 'Damilag',
      status: 'pending',
      priority: 'high',
      reporter: 'Juan Dela Cruz',
      createdAt: '2025-01-15T10:30:00Z',
      coordinates: { lat: 8.3830, lng: 124.8500 }
    },
    {
      id: '2',
      title: 'Fallen Tree Blocking Road',
      description: 'Tree fell due to strong winds, blocking half the road',
      location: 'Provincial Road, Lindaban',
      barangay: 'Lindaban',
      status: 'investigating',
      priority: 'critical',
      reporter: 'Maria Santos',
      createdAt: '2025-01-15T08:15:00Z',
      coordinates: { lat: 8.3900, lng: 124.8600 }
    },
    {
      id: '3',
      title: 'Open Manhole Cover',
      description: 'Manhole cover missing, potential safety hazard',
      location: 'Poblacion Street, Alae',
      barangay: 'Alae',
      status: 'resolved',
      priority: 'medium',
      reporter: 'Pedro Reyes',
      createdAt: '2025-01-14T16:45:00Z',
      coordinates: { lat: 8.3750, lng: 124.8400 }
    }
  ]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setToastMessage('Logged out successfully');
      setShowToast(true);
      setTimeout(() => {
        navigation.push('/it35-lab2', 'back', 'replace');
      }, 1000);
    } else {
      setToastMessage('Logout failed. Please try again.');
      setShowToast(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'investigating': return '#3b82f6';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredReports = recentReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchText.toLowerCase()) ||
                         report.barangay.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{
          '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
          '--color': 'white'
        } as any}>
          <IonTitle style={{ fontWeight: 'bold', fontSize: '18px' }}>
            LDRRMO Dashboard
          </IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" style={{ color: 'white', position: 'relative' }}>
              <IonIcon icon={notificationsOutline} />
              <IonBadge style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                background: '#ef4444',
                minWidth: '18px',
                height: '18px',
                fontSize: '10px'
              }}>
                {dashboardStats.criticalAlerts}
              </IonBadge>
            </IonButton>
            <IonButton 
              fill="clear" 
              onClick={(e) => {
                setPopoverEvent(e);
                setShowProfilePopover(true);
              }}
              style={{ color: 'white' }}
            >
              <IonIcon icon={shieldOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{
        '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      } as any}>
        
        {/* Navigation Segment */}
        <div style={{ padding: '16px 20px 0' }}>
          <IonSegment 
            value={activeSegment} 
            onIonChange={e => setActiveSegment(e.detail.value as string)}
            style={{
              '--background': 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            } as any}
          >
            <IonSegmentButton value="overview">
              <IonLabel style={{ fontWeight: '600' }}>Overview</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="reports">
              <IonLabel style={{ fontWeight: '600' }}>Reports</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="analytics">
              <IonLabel style={{ fontWeight: '600' }}>Analytics</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Overview Section */}
        {activeSegment === 'overview' && (
          <div style={{ padding: '20px' }}>
            {/* Stats Cards Grid */}
            <IonGrid>
              <IonRow>
                {[
                  { title: 'Total Reports', value: dashboardStats.totalReports, icon: documentsOutline, color: '#3b82f6', bgColor: '#dbeafe' },
                  { title: 'Pending Review', value: dashboardStats.pendingReports, icon: timeOutline, color: '#f59e0b', bgColor: '#fef3c7' },
                  { title: 'Under Investigation', value: dashboardStats.activeReports, icon: alertCircleOutline, color: '#8b5cf6', bgColor: '#e9d5ff' },
                  { title: 'Resolved Today', value: dashboardStats.resolvedToday, icon: checkmarkCircleOutline, color: '#10b981', bgColor: '#d1fae5' },
                  { title: 'Critical Alerts', value: dashboardStats.criticalAlerts, icon: warningOutline, color: '#ef4444', bgColor: '#fee2e2' },
                  { title: 'Active Users', value: dashboardStats.activeUsers, icon: peopleOutline, color: '#06b6d4', bgColor: '#cffafe' }
                ].map((stat, index) => (
                  <IonCol key={index} size="12" sizeMd="6" sizeLg="4">
                    <IonCard style={{
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(226,232,240,0.8)',
                      height: '100%'
                    }}>
                      <IonCardContent style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{
                              fontSize: '32px',
                              fontWeight: 'bold',
                              color: '#1f2937',
                              margin: '0 0 8px 0'
                            }}>
                              {stat.value}
                            </h3>
                            <p style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              fontWeight: '500',
                              margin: 0
                            }}>
                              {stat.title}
                            </p>
                          </div>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            background: stat.bgColor,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <IonIcon icon={stat.icon} style={{
                              fontSize: '24px',
                              color: stat.color
                            }} />
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>

            {/* Quick Actions */}
            <IonCard style={{
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(226,232,240,0.8)',
              marginTop: '20px'
            }}>
              <IonCardHeader style={{ padding: '24px 24px 16px' }}>
                <IonCardTitle style={{ color: '#1f2937', fontSize: '18px' }}>Quick Actions</IonCardTitle>
              </IonCardHeader>
              <IonCardContent style={{ padding: '0 24px 24px' }}>
                <IonGrid>
                  <IonRow>
                    {[
                      { title: 'View Map', icon: mapOutline, color: '#3b82f6' },
                      { title: 'Generate Report', icon: downloadOutline, color: '#10b981' },
                      { title: 'System Settings', icon: settingsOutline, color: '#6b7280' },
                      { title: 'Refresh Data', icon: refreshOutline, color: '#f59e0b' }
                    ].map((action, index) => (
                      <IonCol key={index} size="6" sizeMd="3">
                        <IonButton 
                          expand="block" 
                          fill="outline"
                          style={{
                            '--border-radius': '12px',
                            '--border-color': action.color,
                            '--color': action.color,
                            height: '80px',
                            flexDirection: 'column',
                            gap: '8px'
                          } as any}
                        >
                          <IonIcon icon={action.icon} style={{ fontSize: '24px' }} />
                          <span style={{ fontSize: '12px', fontWeight: '600' }}>{action.title}</span>
                        </IonButton>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Reports Section */}
        {activeSegment === 'reports' && (
          <div style={{ padding: '20px' }}>
            {/* Filters */}
            <IonCard style={{
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(226,232,240,0.8)',
              marginBottom: '20px'
            }}>
              <IonCardContent style={{ padding: '20px' }}>
                <IonGrid>
                  <IonRow>
                    <IonCol size="12" sizeMd="6">
                      <IonSearchbar
                        value={searchText}
                        onIonInput={e => setSearchText(e.detail.value!)}
                        placeholder="Search reports..."
                        style={{
                          '--background': '#f8fafc',
                          '--border-radius': '12px'
                        } as any}
                      />
                    </IonCol>
                    <IonCol size="6" sizeMd="3">
                      <IonSelect
                        value={filterStatus}
                        onIonChange={e => setFilterStatus(e.detail.value)}
                        placeholder="Filter by Status"
                        interface="popover"
                      >
                        <IonSelectOption value="all">All Status</IonSelectOption>
                        <IonSelectOption value="pending">Pending</IonSelectOption>
                        <IonSelectOption value="investigating">Investigating</IonSelectOption>
                        <IonSelectOption value="resolved">Resolved</IonSelectOption>
                      </IonSelect>
                    </IonCol>
                    <IonCol size="6" sizeMd="3">
                      <IonSelect
                        value={filterPriority}
                        onIonChange={e => setFilterPriority(e.detail.value)}
                        placeholder="Filter by Priority"
                        interface="popover"
                      >
                        <IonSelectOption value="all">All Priority</IonSelectOption>
                        <IonSelectOption value="low">Low</IonSelectOption>
                        <IonSelectOption value="medium">Medium</IonSelectOption>
                        <IonSelectOption value="high">High</IonSelectOption>
                        <IonSelectOption value="critical">Critical</IonSelectOption>
                      </IonSelect>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

            {/* Reports List */}
            <IonCard style={{
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(226,232,240,0.8)'
            }}>
              <IonCardHeader style={{ padding: '24px 24px 16px' }}>
                <IonCardTitle style={{ color: '#1f2937', fontSize: '18px' }}>
                  Recent Reports ({filteredReports.length})
                </IonCardTitle>
              </IonCardHeader>
              <IonList style={{ background: 'transparent' }}>
                {filteredReports.map((report) => (
                  <IonItem 
                    key={report.id}
                    style={{
                      '--padding-start': '24px',
                      '--inner-padding-end': '24px',
                      '--border-color': '#f1f5f9',
                      '--background': 'transparent'
                    } as any}
                    button
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%',
                      padding: '12px 0'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: getPriorityColor(report.priority),
                        marginRight: '16px',
                        flexShrink: 0
                      }}></div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: '16px',
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
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: '0 0 8px 0'
                        }}>
                          <IonIcon icon={locationOutline} style={{ fontSize: '14px', marginRight: '4px' }} />
                          {report.location}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <IonChip 
                            style={{
                              '--background': getStatusColor(report.status) + '20',
                              '--color': getStatusColor(report.status),
                              height: '24px',
                              fontSize: '11px',
                              fontWeight: '600'
                            } as any}
                          >
                            {report.status.toUpperCase()}
                          </IonChip>
                          <span style={{
                            fontSize: '12px',
                            color: '#9ca3af'
                          }}>
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <IonButton size="small" fill="clear" color="primary">
                          <IonIcon icon={eyeOutline} slot="icon-only" />
                        </IonButton>
                        <IonButton size="small" fill="clear" color="secondary">
                          <IonIcon icon={createOutline} slot="icon-only" />
                        </IonButton>
                      </div>
                    </div>
                  </IonItem>
                ))}
              </IonList>
            </IonCard>
          </div>
        )}

        {/* Analytics Section */}
        {activeSegment === 'analytics' && (
          <div style={{ padding: '20px' }}>
            <IonCard style={{
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(226,232,240,0.8)',
              textAlign: 'center',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IonCardContent>
                <IonIcon icon={statsChartOutline} style={{
                  fontSize: '64px',
                  color: '#d1d5db',
                  marginBottom: '16px'
                }} />
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#374151',
                  margin: '0 0 8px 0'
                }}>Analytics Dashboard</h2>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  margin: 0
                }}>Detailed analytics and reporting features coming soon</p>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Profile Popover */}
        <IonPopover
          isOpen={showProfilePopover}
          event={popoverEvent}
          onDidDismiss={() => setShowProfilePopover(false)}
        >
          <IonContent>
            <div style={{ padding: '0' }}>
              {/* Profile Header */}
              <div style={{
                background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                padding: '24px 20px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IonIcon icon={shieldOutline} style={{ fontSize: '30px' }} />
                </div>
                <h3 style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>LDRRMO Admin</h3>
                <p style={{ 
                  margin: 0,
                  fontSize: '12px',
                  opacity: 0.8
                }}>Manolo Fortich</p>
              </div>
              
              {/* Profile Menu */}
              <div style={{ padding: '12px 0' }}>
                <IonItem button style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                  <IonIcon icon={settingsOutline} slot="start" color="medium" />
                  <IonLabel>
                    <h3>Account Settings</h3>
                    <p>Manage your admin account</p>
                  </IonLabel>
                </IonItem>
                
                <IonItem button style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                  <IonIcon icon={documentsOutline} slot="start" color="medium" />
                  <IonLabel>
                    <h3>System Logs</h3>
                    <p>View system activity</p>
                  </IonLabel>
                </IonItem>
                
                <IonItem 
                  button 
                  onClick={() => {
                    setShowProfilePopover(false);
                    setShowLogoutAlert(true);
                  }}
                  style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                >
                  <IonIcon icon={logOutOutline} slot="start" color="danger" />
                  <IonLabel>
                    <h3>Sign Out</h3>
                    <p>Logout from admin panel</p>
                  </IonLabel>
                </IonItem>
              </div>
            </div>
          </IonContent>
        </IonPopover>

        {/* Logout Alert */}
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Confirm Logout"
          message="Are you sure you want to sign out from the admin dashboard?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Sign Out',
              handler: handleLogout
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
          color={toastMessage.includes('success') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;