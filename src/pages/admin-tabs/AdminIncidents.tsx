// src/pages/admin-tabs/AdminIncidents.tsx - Updated with consistent changes
import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonItem,
  IonChip,
  IonSearchbar,
  IonModal,
  IonTextarea,
  IonDatetime,
  IonToast,
  IonSpinner,
  IonImg,
  useIonRouter,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  logOutOutline,
  notificationsOutline,
  locationOutline,
  closeOutline,
  sendOutline,
  navigateOutline,
  statsChartOutline,
  alertCircleOutline,
  peopleOutline,
  documentTextOutline,
  timeOutline,
  checkmarkCircleOutline,
  carOutline,
  calendarOutline,
  checkmarkDoneOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';

interface IncidentReport {
  id: string;
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'active' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reporter_name: string;
  reporter_email: string;
  reporter_address: string;
  reporter_contact: string;
  created_at: string;
  barangay: string;
  coordinates?: { lat: number; lng: number };
  category: string;
  image_urls?: string[];
  admin_response?: string;
  scheduled_response_time?: string;
  estimated_arrival_time?: string;
  current_eta_minutes?: number;
}

const AdminIncidents: React.FC = () => {
  const navigation = useIonRouter();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchReports();
    setupRealtimeSubscription();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('incidents_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_reports' },
        () => fetchReports()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleNotifyUser = async () => {
    if (!selectedReport) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_email: selectedReport.reporter_email,
          title: 'Update on Your Report',
          message: notificationMessage,
          related_report_id: selectedReport.id,
          type: 'update'
        });

      if (error) throw error;

      setToastMessage('User notified successfully');
      setShowToast(true);
      setShowNotifyModal(false);
      setNotificationMessage('');
      setEstimatedTime('');
    } catch (error) {
      console.error('Error sending notification:', error);
      setToastMessage('Error sending notification');
      setShowToast(true);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchText.toLowerCase()) ||
                         report.barangay.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    active: reports.filter(r => r.status === 'active').length,
    resolved: reports.filter(r => r.status === 'resolved').length
  };

  // Handle status filter click - reset priority to 'all'
  const handleStatusFilterClick = (status: 'all' | 'pending' | 'active' | 'resolved') => {
    setStatusFilter(status);
    setPriorityFilter('all'); // Reset priority filter when status changes
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', '--color': 'white' } as any}>
          <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta - Admin Dashboard</IonTitle>
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
              { id: 'incidents', label: 'Incidents', icon: alertCircleOutline },
              { id: 'users', label: 'Users', icon: peopleOutline, route: '/it35-lab2/admin/users' },
              { id: 'analytics', label: 'Analytics', icon: documentTextOutline, route: '/it35-lab2/admin/analytics' }
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
                  '--color': menu.id === 'incidents' ? '#3b82f6' : '#6b7280',
                  '--background': 'transparent',
                  '--border-radius': '0',
                  borderBottom: menu.id === 'incidents' ? '2px solid #3b82f6' : '2px solid transparent',
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
          {/* Stats Cards - Clickable Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Pending', value: stats.pending, color: '#f59e0b', icon: timeOutline, status: 'pending' },
              { label: 'Active', value: stats.active, color: '#3b82f6', icon: alertCircleOutline, status: 'active' },
              { label: 'Resolved', value: stats.resolved, color: '#10b981', icon: checkmarkCircleOutline, status: 'resolved' },
              { label: 'Total', value: stats.total, color: '#6b7280', icon: documentTextOutline, status: 'all' }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                onClick={() => handleStatusFilterClick(stat.status as any)}
                style={{
                  background: statusFilter === stat.status ? stat.color + '20' : 'white',
                  border: `1px solid ${statusFilter === stat.status ? stat.color : '#e5e7eb'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
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

          {/* Priority Filters - Clickable Chips */}
          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardContent>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                  Priority Filter
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'All', value: 'all', color: '#6b7280' },
                    { label: 'Critical', value: 'critical', color: '#dc2626' },
                    { label: 'High', value: 'high', color: '#f97316' },
                    { label: 'Medium', value: 'medium', color: '#f59e0b' },
                    { label: 'Low', value: 'low', color: '#10b981' }
                  ].map((priority) => (
                    <div
                      key={priority.value}
                      onClick={() => setPriorityFilter(priority.value as any)}
                      style={{
                        padding: '8px 16px',
                        background: priorityFilter === priority.value ? priority.color : '#f3f4f6',
                        color: priorityFilter === priority.value ? 'white' : priority.color,
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        border: `1px solid ${priorityFilter === priority.value ? priority.color : '#e5e7eb'}`,
                        transition: 'all 0.2s'
                      }}
                    >
                      {priority.label}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Search Bar */}
              <IonSearchbar
                value={searchText}
                onIonInput={e => setSearchText(e.detail.value!)}
                placeholder="Search incidents by title, location, or barangay..."
              />
            </IonCardContent>
          </IonCard>

          {/* Incidents List */}
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold' }}>
                Showing {filteredReports.length} Incidents
              </h3>
              <IonList style={{ background: 'transparent' }}>
                {filteredReports.map(report => (
                  <IonItem
                    key={report.id}
                    button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowReportModal(true);
                    }}
                    style={{
                      '--background': 'white',
                      '--border-radius': '8px',
                      marginBottom: '12px'
                    } as any}
                  >
                    <div style={{ width: '100%', padding: '16px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                            {report.title}
                          </h3>
                          {/* CHANGED: Location replaced with Barangay */}
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                            <IonIcon icon={locationOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                            {report.barangay}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <IonBadge
                            style={{
                              fontSize: '10px',
                              '--background': getStatusColor(report.status),
                              '--color': 'white'
                            } as any}
                          >
                            {report.status}
                          </IonBadge>
                          <IonBadge
                            style={{
                              fontSize: '10px',
                              '--background': getPriorityColor(report.priority),
                              '--color': 'white'
                            } as any}
                          >
                            {report.priority}
                          </IonBadge>
                        </div>
                      </div>
                      
                      {/* CHANGED: Date and Time swapped */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        <IonIcon icon={timeOutline} style={{ fontSize: '12px', color: '#6b7280' }} />
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {new Date(report.created_at).toLocaleDateString()} - {new Date(report.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        Reporter: {report.reporter_name}
                      </div>

                      {/* NEW: Track button positioned below status and priority */}
                      <div style={{ marginTop: '8px' }}>
                        <IonButton
                          size="small"
                          fill="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigation.push('/it35-lab2/admin-dashboard', 'forward', 'push');
                          }}
                          disabled={report.status === 'resolved'}
                          style={{
                            '--background': '#dc2626',
                            '--color': 'white',
                            '--border-color': '#dc2626',
                            fontSize: '10px',
                            height: '24px'
                          } as any}
                        >
                          <IonIcon icon={navigateOutline} slot="start" style={{ fontSize: '10px' }} />
                          Track
                        </IonButton>
                      </div>

                      {/* NEW: Show scheduled time if exists */}
                      {report.scheduled_response_time && (
                        <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                          <IonIcon icon={calendarOutline} style={{ fontSize: '10px', marginRight: '4px' }} />
                          Scheduled: {new Date(report.scheduled_response_time).toLocaleString()}
                        </div>
                      )}

                      {/* NEW: Show ETA if exists */}
                      {report.current_eta_minutes && report.status === 'active' && (
                        <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px' }}>
                          <IonIcon icon={carOutline} style={{ fontSize: '10px', marginRight: '4px' }} />
                          ETA: {report.current_eta_minutes} min
                        </div>
                      )}
                    </div>
                  </IonItem>
                ))}
              </IonList>

              {filteredReports.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <IonIcon icon={alertCircleOutline} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No incidents found</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {searchText ? 'Try adjusting your search terms' : 'No incidents match the current filters'}
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        {/* Report Detail Modal */}
        <IonModal isOpen={showReportModal} onDidDismiss={() => setShowReportModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowReportModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Incident Details</IonTitle>
              <IonButtons slot="end">
                <IonButton 
                  onClick={() => {
                    navigation.push('/it35-lab2/admin-dashboard', 'forward', 'push');
                    setShowReportModal(false);
                  }}
                  style={{ '--background': '#dc2626', '--color': 'white' } as any}
                >
                  <IonIcon icon={navigateOutline} slot="start" />
                  Track
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedReport && (
              <div style={{ padding: '16px' }}>
                <IonCard>
                  <IonCardContent>
                    <h2 style={{ marginTop: 0, marginBottom: '16px' }}>{selectedReport.title}</h2>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <IonBadge style={{ '--background': getStatusColor(selectedReport.status) } as any}>
                        {selectedReport.status}
                      </IonBadge>
                      <IonBadge style={{ '--background': getPriorityColor(selectedReport.priority) } as any}>
                        {selectedReport.priority}
                      </IonBadge>
                    </div>

                    {/* NEW: Scheduled and ETA Information */}
                    {selectedReport.scheduled_response_time && (
                      <div style={{
                        background: '#fffbeb',
                        border: '1px solid #fcd34d',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <IonIcon icon={calendarOutline} style={{ color: '#f59e0b' }} />
                          <strong style={{ color: '#92400e' }}>Scheduled Response</strong>
                        </div>
                        <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                          {new Date(selectedReport.scheduled_response_time).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {selectedReport.current_eta_minutes && selectedReport.status === 'active' && (
                      <div style={{
                        background: '#eff6ff',
                        border: '1px solid #93c5fd',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <IonIcon icon={carOutline} style={{ color: '#3b82f6' }} />
                          <strong style={{ color: '#1e40af' }}>Estimated Arrival</strong>
                        </div>
                        <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>
                          {selectedReport.current_eta_minutes} minutes
                        </p>
                        {selectedReport.estimated_arrival_time && (
                          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
                            Arrival at: {new Date(selectedReport.estimated_arrival_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    <IonGrid>
                      <IonRow>
                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Barangay:</strong>
                            <p>{selectedReport.barangay}</p>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Reported Date:</strong>
                            <p>{new Date(selectedReport.created_at).toLocaleDateString()}</p>
                          </div>
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Category:</strong>
                            <p>{selectedReport.category}</p>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Reported Time:</strong>
                            <p>{new Date(selectedReport.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </IonCol>
                      </IonRow>
                    </IonGrid>

                    <div style={{ marginBottom: '16px' }}>
                      <strong>Description:</strong>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.description}</p>
                    </div>

                    {/* Reporter Information */}
                    <IonCard style={{ background: '#f8fafc' }}>
                      <IonCardContent>
                        <h3 style={{ marginTop: 0 }}>Reporter Information</h3>
                        <IonGrid>
                          <IonRow>
                            <IonCol size="6">
                              <strong>Name:</strong>
                              <p>{selectedReport.reporter_name}</p>
                            </IonCol>
                            <IonCol size="6">
                              <strong>Email:</strong>
                              <p>{selectedReport.reporter_email}</p>
                            </IonCol>
                          </IonRow>
                          <IonRow>
                            <IonCol size="6">
                              <strong>Contact:</strong>
                              <p>{selectedReport.reporter_contact}</p>
                            </IonCol>
                            <IonCol size="6">
                              <strong>Address:</strong>
                              <p>{selectedReport.reporter_address}</p>
                            </IonCol>
                          </IonRow>
                        </IonGrid>
                      </IonCardContent>
                    </IonCard>

                    {/* Images */}
                    {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <strong>Attached Images:</strong>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {selectedReport.image_urls.map((url, index) => (
                            <IonImg
                              key={index}
                              src={url}
                              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Response */}
                    {selectedReport.admin_response && (
                      <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '8px' }}>
                        <strong>Admin Response:</strong>
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selectedReport.admin_response}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
                      <IonButton
                        expand="block"
                        color="primary"
                        onClick={() => setShowNotifyModal(true)}
                      >
                        <IonIcon icon={sendOutline} slot="start" />
                        Notify User
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Notify User Modal */}
        <IonModal isOpen={showNotifyModal} onDidDismiss={() => setShowNotifyModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Notify User</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowNotifyModal(false)}>Cancel</IonButton>
                <IonButton onClick={handleNotifyUser} strong>Send</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px' }}>
              <IonCard>
                <IonCardContent>
                  <IonItem>
                    <IonTextarea
                      value={notificationMessage}
                      onIonChange={e => setNotificationMessage(e.detail.value!)}
                      placeholder="Enter update message for the user..."
                      rows={6}
                      label="Message"
                      labelPlacement="stacked"
                    />
                  </IonItem>
                  <IonItem>
                    <IonDatetime
                      value={estimatedTime}
                      onIonChange={e => setEstimatedTime(e.detail.value as string)}
                      presentation="date-time"
                    >
                      <div slot="title">Estimated Resolution Time</div>
                    </IonDatetime>
                  </IonItem>
                </IonCardContent>
              </IonCard>
            </div>
          </IonContent>
        </IonModal>

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

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'active': return '#3b82f6';
    case 'resolved': return '#10b981';
    default: return '#6b7280';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'high': return '#f97316';
    case 'critical': return '#dc2626';
    default: return '#6b7280';
  }
};

export default AdminIncidents;