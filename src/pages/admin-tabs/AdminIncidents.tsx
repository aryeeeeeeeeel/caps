// src/pages/admin-tabs/AdminIncidents.tsx - Fixed skeleton screen
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
  IonSearchbar,
  IonModal,
  IonTextarea,
  IonDatetime,
  IonToast,
  IonImg,
  useIonRouter,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSkeletonText,
  IonInput,
  IonLabel,
  IonSelect,
  IonSelectOption
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
  desktopOutline,
  trashOutline,
  createOutline
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

// Skeleton Components
const SkeletonStatsCard: React.FC = () => (
  <div style={{
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    cursor: 'pointer'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
      <IonSkeletonText animated style={{ width: '20px', height: '20px' }} />
      <IonSkeletonText animated style={{ width: '60px', height: '14px' }} />
    </div>
    <IonSkeletonText animated style={{ width: '40px', height: '28px', margin: '0 auto' }} />
  </div>
);

const SkeletonIncidentItem: React.FC = () => (
  <IonItem
    style={{
      '--background': 'white',
      '--border-radius': '8px',
      marginBottom: '12px'
    } as any}
  >
    <div style={{ width: '100%', padding: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <IonSkeletonText animated style={{ width: '70%', height: '16px', marginBottom: '8px' }} />
          <IonSkeletonText animated style={{ width: '50%', height: '12px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <IonSkeletonText animated style={{ width: '40px', height: '20px', borderRadius: '10px' }} />
          <IonSkeletonText animated style={{ width: '40px', height: '20px', borderRadius: '10px' }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
        <IonSkeletonText animated style={{ width: '12px', height: '12px' }} />
        <IonSkeletonText animated style={{ width: '40%', height: '12px' }} />
      </div>

      <IonSkeletonText animated style={{ width: '60%', height: '12px', marginBottom: '12px' }} />

      <IonSkeletonText animated style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
    </div>
  </IonItem>
);

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
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReport, setEditingReport] = useState<IncidentReport | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'pending' as 'pending' | 'active' | 'resolved',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: '',
    barangay: ''
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: reports } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('read', false);

      const { data: feedbackFromReports } = await supabase
        .from('incident_reports')
        .select('*')
        .not('feedback_comment', 'is', null)
        .eq('feedback_read', false);

      const { data: feedback } = await supabase
        .from('feedback')
        .select('*')
        .eq('read', false);

      setUnreadCount(
        (reports?.length || 0) +
        (feedbackFromReports?.length || 0) +
        (feedback?.length || 0)
      );
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
  }, []);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };

    checkDevice();
  }, []);

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
    if (!selectedReport || !notificationMessage.trim()) return;

    try {
      // Store the estimated time in the incident report if provided
      if (estimatedTime) {
        await supabase
          .from('incident_reports')
          .update({
            estimated_arrival_time: estimatedTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedReport.id);
      }

      // Send notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_email: selectedReport.reporter_email,
          title: `Update: ${selectedReport.title}`,
          message: notificationMessage,
          related_report_id: selectedReport.id,
          type: 'update',
          // Store estimated time in the message if provided
          ...(estimatedTime && {
            message: `${notificationMessage}\n\nEstimated resolution: ${new Date(estimatedTime).toLocaleString()}`
          })
        });

      if (error) throw error;

      setToastMessage('User notified successfully');
      setShowToast(true);
      setShowNotifyModal(false);
      setNotificationMessage('');
      setEstimatedTime('');

      // Refresh reports to show updated estimated time
      fetchReports();

    } catch (error) {
      console.error('Error sending notification:', error);
      setToastMessage('Error sending notification. Please check RLS policies.');
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

  const handleStatusFilterClick = (status: 'all' | 'pending' | 'active' | 'resolved') => {
    setStatusFilter(status);
    setPriorityFilter('all');
  };

  const handleEditReport = (report: IncidentReport) => {
    setEditingReport(report);
    setEditForm({
      title: report.title,
      description: report.description,
      status: report.status,
      priority: report.priority,
      category: report.category,
      barangay: report.barangay
    });
    setShowEditModal(true);
  };

  const handleUpdateReport = async () => {
    if (!editingReport) return;

    try {
      const { error } = await supabase
        .from('incident_reports')
        .update({
          title: editForm.title,
          description: editForm.description,
          status: editForm.status,
          priority: editForm.priority,
          category: editForm.category,
          barangay: editForm.barangay,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingReport.id);

      if (error) throw error;

      setToastMessage('Report updated successfully');
      setShowToast(true);
      setShowEditModal(false);
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      setToastMessage('Error updating report');
      setShowToast(true);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('incident_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setToastMessage('Report deleted successfully');
      setShowToast(true);
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      setToastMessage('Error deleting report');
      setShowToast(true);
    }
  };

  // Show skeleton loading screen - FIRST CHECK
  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', '--color': 'white' } as any}>
            <IonTitle style={{ fontWeight: 'bold' }}>
              <IonSkeletonText animated style={{ width: '200px', height: '20px' }} />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <SkeletonStatsCard />
              <SkeletonStatsCard />
              <SkeletonStatsCard />
              <SkeletonStatsCard />
            </div>

            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
              <IonSkeletonText animated style={{ width: '100%', height: '48px', borderRadius: '8px', marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <IonSkeletonText animated style={{ width: '80px', height: '14px' }} />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4].map((item) => (
                    <IonSkeletonText key={item} animated style={{ width: '60px', height: '28px', borderRadius: '14px' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <IonSkeletonText animated style={{ width: '80px', height: '14px' }} />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <IonSkeletonText key={item} animated style={{ width: '50px', height: '28px', borderRadius: '14px' }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
              <IonSkeletonText animated style={{ width: '120px', height: '18px', marginBottom: '16px' }} />
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <SkeletonIncidentItem key={item} />
              ))}
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Show mobile restriction - SECOND CHECK
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
                This incidents management page is only accessible by an admin.
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

  // MAIN CONTENT - Only renders when not loading and not mobile
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', '--color': 'white' } as any}>
          <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta - Admin Dashboard</IonTitle>
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

              <IonSearchbar
                value={searchText}
                onIonInput={e => setSearchText(e.detail.value!)}
                placeholder="Search incidents by title, location, or barangay..."
              />
            </IonCardContent>
          </IonCard>

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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        <IonIcon icon={timeOutline} style={{ fontSize: '12px', color: '#6b7280' }} />
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {new Date(report.created_at).toLocaleDateString()} - {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        Reporter: {report.reporter_name}
                      </div>

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

                      {report.scheduled_response_time && (
                        <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                          <IonIcon icon={calendarOutline} style={{ fontSize: '10px', marginRight: '4px' }} />
                          Scheduled: {new Date(report.scheduled_response_time).toLocaleString()}
                        </div>
                      )}

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

        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowEditModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Edit Incident Report</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={handleUpdateReport}>
                  Save
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {editingReport && (
              <div style={{ padding: '16px' }}>
                <IonCard>
                  <IonCardContent>
                    <IonItem>
                      <IonLabel position="stacked">Title</IonLabel>
                      <IonInput
                        value={editForm.title}
                        onIonInput={e => setEditForm({ ...editForm, title: e.detail.value! })}
                      />
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Description</IonLabel>
                      <IonTextarea
                        value={editForm.description}
                        onIonInput={e => setEditForm({ ...editForm, description: e.detail.value! })}
                        rows={4}
                      />
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Status</IonLabel>
                      <IonSelect
                        value={editForm.status}
                        onIonChange={e => setEditForm({ ...editForm, status: e.detail.value })}
                      >
                        <IonSelectOption value="pending">Pending</IonSelectOption>
                        <IonSelectOption value="active">Active</IonSelectOption>
                        <IonSelectOption value="resolved">Resolved</IonSelectOption>
                      </IonSelect>
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Priority</IonLabel>
                      <IonSelect
                        value={editForm.priority}
                        onIonChange={e => setEditForm({ ...editForm, priority: e.detail.value })}
                      >
                        <IonSelectOption value="low">Low</IonSelectOption>
                        <IonSelectOption value="medium">Medium</IonSelectOption>
                        <IonSelectOption value="high">High</IonSelectOption>
                        <IonSelectOption value="critical">Critical</IonSelectOption>
                      </IonSelect>
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Category</IonLabel>
                      <IonInput
                        value={editForm.category}
                        onIonInput={e => setEditForm({ ...editForm, category: e.detail.value! })}
                      />
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Barangay</IonLabel>
                      <IonInput
                        value={editForm.barangay}
                        onIonInput={e => setEditForm({ ...editForm, barangay: e.detail.value! })}
                      />
                    </IonItem>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                      <IonButton
                        expand="block"
                        color="danger"
                        onClick={() => {
                          if (editingReport) {
                            handleDeleteReport(editingReport.id);
                            setShowEditModal(false);
                          }
                        }}
                      >
                        <IonIcon icon={trashOutline} slot="start" />
                        Delete Report
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>

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
                  style={{ '--background': '#dc2626', '--color': 'white', '--border-radius': '8px' } as any}
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
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <h1 style={{ margin: 0, flex: 1 }}>{selectedReport.title}</h1>
                      <IonButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          if (selectedReport) {
                            handleEditReport(selectedReport);
                            setShowReportModal(false);
                          }
                        }}
                        style={{ marginLeft: '16px' }}
                      >
                        <IonIcon icon={createOutline} slot="start" />
                        Edit Report
                      </IonButton>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <IonBadge style={{ '--background': getStatusColor(selectedReport.status) } as any}>
                        {selectedReport.status}
                      </IonBadge>
                      <IonBadge style={{ '--background': getPriorityColor(selectedReport.priority) } as any}>
                        {selectedReport.priority}
                      </IonBadge>
                    </div>

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
                            <p>{new Date(selectedReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </IonCol>


                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Description:</strong>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.description}</p>
                          </div>
                        </IonCol>
                      </IonRow>
                    </IonGrid>

                    <IonCard style={{ background: '#f8fafc' }}>
                      <IonCardContent>
                        <h2 style={{ marginTop: 0 }}>Reporter Information</h2>
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

                    {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <strong>Attached Images:</strong>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {selectedReport.image_urls.map((url, index) => (
                            <IonButton
                              key={index}
                              fill="clear"
                              style={{
                                '--padding-start': '0',
                                '--padding-end': '0',
                                '--border-radius': '8px'
                              }}
                              onClick={() => window.open(url, '_blank')}
                            >
                              <IonImg
                                src={url}
                                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                              />
                            </IonButton>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedReport.admin_response && (
                      <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '8px' }}>
                        <strong>Admin Response:</strong>
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selectedReport.admin_response}</p>
                      </div>
                    )}

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

        <IonModal isOpen={showNotifyModal} onDidDismiss={() => setShowNotifyModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowNotifyModal(false)}>
                  <IonIcon icon={closeOutline} />

                </IonButton>
              </IonButtons>
              <IonTitle>Notify User</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={handleNotifyUser}
                  strong
                  disabled={!notificationMessage.trim()}
                  color="primary"
                >
                  <IonIcon icon={sendOutline} slot="start" />
                  Send
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonCard>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="stacked" color="primary">
                      Message to User *
                    </IonLabel>
                    <IonTextarea
                      value={notificationMessage}
                      onIonInput={e => setNotificationMessage(e.detail.value!)}
                      placeholder="Enter update about their report..."
                      rows={4}
                      autoGrow
                      counter
                      maxlength={500}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked" color="primary">
                      Estimated Resolution Time (Optional)
                    </IonLabel>
                    <IonDatetime
                      value={estimatedTime}
                      onIonChange={e => setEstimatedTime(e.detail.value as string)}
                      presentation="date-time"
                      min={new Date().toISOString()}
                      preferred-columns="date-time"
                    />
                  </IonItem>

                  {estimatedTime && (
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '8px',
                      padding: '12px',
                      marginTop: '12px',
                      fontSize: '14px',
                      color: '#0369a1'
                    }}>
                      <strong>User will be notified about resolution by:</strong><br />
                      {new Date(estimatedTime).toLocaleString()}
                    </div>
                  )}
                </IonCardContent>
              </IonCard>

              {/* Preview of who we're notifying */}
              {selectedReport && (
                <IonCard style={{ marginTop: '16px' }}>
                  <IonCardContent>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      <strong>Notifying:</strong> {selectedReport.reporter_name} ({selectedReport.reporter_email})<br />
                      <strong>Report:</strong> {selectedReport.title}
                    </div>
                  </IonCardContent>
                </IonCard>
              )}
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