// src/pages/AdminDashboard.tsx - Complete with Footer Quick Actions
import React, { useState, useEffect, useRef } from 'react';
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
  IonPopover,
  IonSegment,
  IonSegmentButton,
  IonAlert,
  IonToast,
  IonModal,
  IonTextarea,
  IonDatetime,
  useIonRouter,
  IonSpinner,
  IonActionSheet,
  IonInput,
  IonFooter
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
  mapOutline,
  eyeOutline,
  createOutline,
  downloadOutline,
  trashOutline,
  navigateOutline,
  sendOutline,
  analyticsOutline
} from 'ionicons/icons';
import { supabase } from '../utils/supabaseClient';

interface IncidentReport {
  id: string;
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'active' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reporter_name: string;
  reporter_email: string;
  reporter_address: string; // NEW
  reporter_contact: string; // NEW
  created_at: string;
  barangay: string;
  coordinates?: { lat: number; lng: number };
  category: string;
  image_urls?: string[];
  admin_response?: string;
  updated_at?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'banned';
  warnings: number;
  last_warning_date?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const navigation = useIonRouter();
  const [activeSegment, setActiveSegment] = useState('overview');
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    activeReports: 0,
    resolvedToday: 0,
    criticalAlerts: 0,
    activeUsers: 0
  });
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [editingReport, setEditingReport] = useState<IncidentReport | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    verifyAdminAccess();
    initializeAudio();
  }, []);

  const initializeAudio = () => {
    notificationAudioRef.current = new Audio('./notification_sound.mp3');
    notificationAudioRef.current.load();
  };

  const playNotificationSound = () => {
    if (notificationAudioRef.current) {
      notificationAudioRef.current.play().catch(e => console.error('Error playing sound:', e));
    }
  };

  const verifyAdminAccess = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role, user_email')
        .eq('auth_uuid', user.id)
        .single();
      
      if (userError) throw userError;
      
      if (!userData?.role || userData.role !== 'admin') {
        await supabase.auth.signOut();
        navigation.push('/it35-lab2', 'root', 'replace');
        return;
      }
      
      setUserEmail(userData.user_email);
      await fetchInitialData();
      setupRealtimeSubscriptions();
      
    } catch (error) {
      console.error('Admin access verification failed:', error);
      await supabase.auth.signOut();
      navigation.push('/it35-lab2', 'root', 'replace');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInitialData = async () => {
  try {
    // Change from 'incident_reports' to 'incident_reports'
    const { data: reportsData, error: reportsError } = await supabase
      .from('incident_reports') // ← Fixed table name
      .select('*')
      .order('created_at', { ascending: false });

    if (!reportsError && reportsData) {
      setReports(reportsData);
      updateDashboardStats(reportsData);
    }

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin');

      if (!usersError && usersData) {
        setUsers(usersData);
      }

      if (userEmail) {
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_email', userEmail)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!notificationsError && notificationsData) {
          setNotifications(notificationsData);
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
  const reportsChannel = supabase
    .channel('reports_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'incident_reports' // ← Fixed table name
      },
      (payload) => {
        console.log('Real-time report update:', payload);
        fetchInitialData();
        
        if (payload.eventType === 'INSERT') {
          if ((payload.new as any).priority === 'critical') {
            playNotificationSound();
          }
        }
      }
    );

  reportsChannel.subscribe();

    let notificationsChannel: any = null;
    if (userEmail) {
      notificationsChannel = supabase
        .channel('admin_notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_email=eq.${userEmail}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              const newNotification = payload.new as any;
              setNotifications(prev => [newNotification, ...prev]);
              
              if (newNotification.type === 'critical' || newNotification.type === 'error') {
                playNotificationSound();
              }
            }
          }
        );

      notificationsChannel.subscribe();
    }

    return () => {
      reportsChannel.unsubscribe();
      if (notificationsChannel) {
        notificationsChannel.unsubscribe();
      }
    };
  };

  const updateDashboardStats = (reportsData: IncidentReport[]) => {
    const today = new Date().toDateString();
    const resolvedToday = reportsData.filter(report => 
      report.status === 'resolved' && 
      new Date(report.created_at).toDateString() === today
    ).length;

    setDashboardStats({
      totalReports: reportsData.length,
      pendingReports: reportsData.filter(r => r.status === 'pending').length,
      activeReports: reportsData.filter(r => r.status === 'active').length,
      resolvedToday,
      criticalAlerts: reportsData.filter(r => r.priority === 'critical').length,
      activeUsers: users.filter(u => u.status === 'active').length
    });
  };

  const handleStatusUpdate = async (reportId: string, newStatus: 'pending' | 'active' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('incident_reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;

      setToastMessage(`Report status updated to ${newStatus}`);
      setShowToast(true);
      fetchInitialData();
    } catch (error) {
      console.error('Error updating status:', error);
      setToastMessage('Error updating status');
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
      setShowReportModal(false);
      fetchInitialData();
    } catch (error) {
      console.error('Error deleting report:', error);
      setToastMessage('Error deleting report');
      setShowToast(true);
    }
  };

  const handleUpdateReport = async () => {
  if (!editingReport) return;
  
  try {
    const { error } = await supabase
      .from('incident_reports') // ← Fixed table name
      .update({
        title: editingReport.title,
        description: editingReport.description,
        status: editingReport.status,
        priority: editingReport.priority,
        admin_response: editingReport.admin_response // Map to correct column
      })
      .eq('id', editingReport.id);

    if (error) throw error;

    setToastMessage('Report updated successfully');
    setShowToast(true);
    setShowEditModal(false);
    setEditingReport(null);
    fetchInitialData();
  } catch (error) {
    console.error('Error updating report:', error);
    setToastMessage('Error updating report');
    setShowToast(true);
  }
};

  const sendUserNotification = async () => {
  if (!selectedReport) return;
  
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_email: selectedReport.reporter_email, // Use email instead of contact
        title: 'Update on Your Report',
        message: feedbackMessage,
        related_report_id: selectedReport.id,
        type: 'update'
        // Remove estimated_resolution_time as it's not in notifications table
      });

    if (error) throw error;

    setToastMessage('Notification sent to user');
    setShowToast(true);
    setShowFeedbackModal(false);
    setFeedbackMessage('');
    setEstimatedTime('');
  } catch (error) {
    console.error('Error sending notification:', error);
    setToastMessage('Error sending notification');
    setShowToast(true);
  }
};

  const handleUserAction = async (userId: string, action: 'warn' | 'suspend' | 'ban') => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      let updates: any = {};
      
      switch (action) {
        case 'warn':
          updates = { 
            warnings: user.warnings + 1,
            last_warning_date: new Date().toISOString(),
            status: user.warnings + 1 >= 3 ? 'suspended' : 'active'
          };
          break;
        case 'suspend':
          updates = { status: 'suspended' };
          break;
        case 'ban':
          updates = { status: 'banned' };
          break;
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      setToastMessage(`User ${action}ed successfully`);
      setShowToast(true);
      fetchInitialData();
    } catch (error) {
      console.error('Error performing user action:', error);
      setToastMessage('Error performing action');
      setShowToast(true);
    }
  };

  const generateReport = async (period: 'monthly' | 'quarterly' | 'yearly') => {
    try {
      setToastMessage(`${period} report generation feature coming soon`);
      setShowToast(true);
    } catch (error) {
      console.error('Error generating report:', error);
      setToastMessage('Error generating report');
      setShowToast(true);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchText.toLowerCase()) ||
                         report.barangay.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'active': return '#3b82f6';
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

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%'
        }}>
          <div style={{ textAlign: 'center' }}>
            <IonSpinner />
            <p>Loading admin dashboard...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

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
            <IonButton 
              fill="clear" 
              style={{ color: 'white', position: 'relative' }}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <IonIcon icon={notificationsOutline} />
              {notifications.some(n => !n.read) && (
                <IonBadge style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: '#ef4444',
                  minWidth: '18px',
                  height: '18px',
                  fontSize: '10px'
                }}>
                  {notifications.filter(n => !n.read).length}
                </IonBadge>
              )}
            </IonButton>
            <IonButton 
              fill="clear" 
              onClick={(e) => {
                setPopoverEvent(e.nativeEvent);
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
            <IonSegmentButton value="users">
              <IonLabel style={{ fontWeight: '600' }}>Users</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="analytics">
              <IonLabel style={{ fontWeight: '600' }}>Analytics</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Overview Section */}
        {activeSegment === 'overview' && (
          <div style={{ padding: '20px', paddingBottom: '90px' }}>
            {/* Stats Cards Grid */}
            <IonGrid>
              <IonRow>
                {[
                  { title: 'Total Reports', value: dashboardStats.totalReports, icon: documentsOutline, color: '#3b82f6', bgColor: '#dbeafe' },
                  { title: 'Pending Review', value: dashboardStats.pendingReports, icon: timeOutline, color: '#f59e0b', bgColor: '#fef3c7' },
                  { title: 'Active Incidents', value: dashboardStats.activeReports, icon: alertCircleOutline, color: '#8b5cf6', bgColor: '#e9d5ff' },
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
          </div>
        )}

        {/* Reports Section */}
        {activeSegment === 'reports' && (
          <div style={{ padding: '20px', paddingBottom: '90px' }}>
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
                        <IonSelectOption value="active">Active</IonSelectOption>
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
                    onClick={() => {
                      setSelectedReport(report);
                      setShowReportModal(true);
                    }}
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
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <IonButton 
                          size="small" 
                          fill="clear" 
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                            setShowReportModal(true);
                          }}
                        >
                          <IonIcon icon={eyeOutline} slot="icon-only" />
                        </IonButton>
                        <IonButton 
                          size="small" 
                          fill="clear" 
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingReport(report);
                            setShowEditModal(true);
                          }}
                        >
                          <IonIcon icon={createOutline} slot="icon-only" />
                        </IonButton>
                        <IonButton 
                          size="small" 
                          fill="clear" 
                          color="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report);
                            setShowActionSheet(true);
                          }}
                        >
                          <IonIcon icon={trashOutline} slot="icon-only" />
                        </IonButton>
                      </div>
                    </div>
                  </IonItem>
                ))}
              </IonList>
            </IonCard>
          </div>
        )}

        {/* Users Management Section */}
        {activeSegment === 'users' && (
          <div style={{ padding: '20px', paddingBottom: '90px' }}>
            <IonCard style={{
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(226,232,240,0.8)'
            }}>
              <IonCardHeader style={{ padding: '24px 24px 16px' }}>
                <IonCardTitle style={{ color: '#1f2937', fontSize: '18px' }}>
                  User Management ({users.length} users)
                </IonCardTitle>
              </IonCardHeader>
              <IonList>
                {users.map((user) => (
                  <IonItem key={user.id}>
                    <IonLabel>
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                      <p>Status: {user.status} • Warnings: {user.warnings}</p>
                    </IonLabel>
                    <div slot="end" style={{ display: 'flex', gap: '8px' }}>
                      <IonButton 
                        size="small" 
                        fill="outline"
                        onClick={() => handleUserAction(user.id, 'warn')}
                        disabled={user.status === 'banned'}
                      >
                        Warn
                      </IonButton>
                      <IonButton 
                        size="small" 
                        fill="outline"
                        color="warning"
                        onClick={() => handleUserAction(user.id, 'suspend')}
                        disabled={user.status === 'banned'}
                      >
                        Suspend
                      </IonButton>
                      <IonButton 
                        size="small" 
                        fill="outline"
                        color="danger"
                        onClick={() => handleUserAction(user.id, 'ban')}
                      >
                        Ban
                      </IonButton>
                    </div>
                  </IonItem>
                ))}
              </IonList>
            </IonCard>
          </div>
        )}

        {/* Analytics Section */}
        {activeSegment === 'analytics' && (
          <div style={{ padding: '20px', paddingBottom: '90px' }}>
            <IonCard style={{
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid rgba(226,232,240,0.8)',
              marginBottom: '20px'
            }}>
              <IonCardHeader style={{ padding: '24px 24px 16px' }}>
                <IonCardTitle style={{ color: '#1f2937', fontSize: '18px' }}>
                  Generate Reports
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent style={{ padding: '0 24px 24px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <IonButton 
                    fill="outline"
                    onClick={() => generateReport('monthly')}
                  >
                    Monthly Report
                  </IonButton>
                  <IonButton 
                    fill="outline"
                    onClick={() => generateReport('quarterly')}
                  >
                    Quarterly Report
                  </IonButton>
                  <IonButton 
                    fill="outline"
                    onClick={() => generateReport('yearly')}
                  >
                    Yearly Report
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>

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
                }}>Detailed analytics charts and insights coming soon</p>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Report Detail Modal */}
        <IonModal isOpen={showReportModal} onDidDismiss={() => setShowReportModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Report Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowReportModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedReport && (
              <div style={{ padding: '20px' }}>
                <IonCard>
                  <IonCardContent>
                    <h2>{selectedReport.title}</h2>
                    <p><strong>Description:</strong> {selectedReport.description}</p>
                    <p><strong>Location:</strong> {selectedReport.location}</p>
                    <p><strong>Barangay:</strong> {selectedReport.barangay}</p>
                    <p><strong>Incident Type:</strong> {selectedReport.category}</p>
                    <p><strong>Priority:</strong> {selectedReport.priority}</p>
                    <p><strong>Status:</strong> {selectedReport.status}</p>
                    <p><strong>Reported:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
                    
                    <h3>Reporter Information</h3>
                    <p><strong>Name:</strong> {selectedReport.reporter_name}</p>
                    <p><strong>Address:</strong> {selectedReport.reporter_address}</p>
                    <p><strong>Contact:</strong> {selectedReport.reporter_contact}</p>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <IonButton 
                        fill="outline"
                        onClick={() => {
                          setEditingReport(selectedReport);
                          setShowEditModal(true);
                          setShowReportModal(false);
                        }}
                      >
                        Edit Report
                      </IonButton>
                      <IonButton 
                        fill="outline"
                        color="primary"
                        onClick={() => {
                          navigation.push('./admin-map', 'forward', 'push');
                          setShowReportModal(false);
                        }}
                      >
                        <IonIcon icon={navigateOutline} slot="start" />
                        View on Map
                      </IonButton>
                      <IonButton 
                        fill="outline"
                        color="success"
                        onClick={() => setShowFeedbackModal(true)}
                      >
                        <IonIcon icon={sendOutline} slot="start" />
                        Notify User
                      </IonButton>
                      <IonButton 
                        fill="outline"
                        color="danger"
                        onClick={() => handleDeleteReport(selectedReport.id)}
                      >
                        Delete Report
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Edit Report Modal */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Report</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>Cancel</IonButton>
                <IonButton onClick={handleUpdateReport}>Save</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {editingReport && (
              <div style={{ padding: '20px' }}>
                <IonCard>
                  <IonCardContent>
                    <IonItem>
                      <IonLabel position="stacked">Title</IonLabel>
                      <IonInput
                        value={editingReport.title}
                        onIonInput={e => setEditingReport({...editingReport, title: e.detail.value!})}
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Description</IonLabel>
                      <IonTextarea
                        value={editingReport.description}
                        onIonInput={e => setEditingReport({...editingReport, description: e.detail.value!})}
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Status</IonLabel>
                      <IonSelect
                        value={editingReport.status}
                        onIonChange={e => setEditingReport({...editingReport, status: e.detail.value})}
                      >
                        <IonSelectOption value="pending">Pending</IonSelectOption>
                        <IonSelectOption value="active">Active</IonSelectOption>
                        <IonSelectOption value="resolved">Resolved</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Priority</IonLabel>
                      <IonSelect
                        value={editingReport.priority}
                        onIonChange={e => setEditingReport({...editingReport, priority: e.detail.value})}
                      >
                        <IonSelectOption value="low">Low</IonSelectOption>
                        <IonSelectOption value="medium">Medium</IonSelectOption>
                        <IonSelectOption value="high">High</IonSelectOption>
                        <IonSelectOption value="critical">Critical</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Admin Notes</IonLabel>
                      <IonTextarea
                        value={editingReport.admin_response || ''}
                        onIonInput={e => setEditingReport({...editingReport, admin_response: e.detail.value!})}
                        placeholder="Add internal notes or observations..."
                      />
                    </IonItem>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* User Notification Modal */}
        <IonModal isOpen={showFeedbackModal} onDidDismiss={() => setShowFeedbackModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Notify User</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowFeedbackModal(false)}>Cancel</IonButton>
                <IonButton onClick={sendUserNotification}>Send</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px' }}>
              <IonCard>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="stacked">Message to User</IonLabel>
                    <IonTextarea
                      value={feedbackMessage}
                      onIonInput={e => setFeedbackMessage(e.detail.value!)}
                      placeholder="Update the user about their report status, investigation progress, or resolution..."
                      rows={4}
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Estimated Resolution Time</IonLabel>
                    <IonDatetime
                      value={estimatedTime}
                      onIonChange={e => setEstimatedTime(e.detail.value as string)}
                    />
                  </IonItem>
                </IonCardContent>
              </IonCard>
            </div>
          </IonContent>
        </IonModal>

        {/* Action Sheet for Report Actions */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: 'Delete Report',
              role: 'destructive',
              data: { action: 'delete' },
            },
            {
              text: 'Cancel',
              role: 'cancel',
              data: { action: 'cancel' },
            },
          ]}
          onWillDismiss={(ev) => {
            if (ev.detail.data?.action === 'delete' && selectedReport) {
              handleDeleteReport(selectedReport.id);
            }
          }}
        />

        {/* Profile Popover */}
        <IonPopover
          isOpen={showProfilePopover}
          event={popoverEvent}
          onDidDismiss={() => setShowProfilePopover(false)}
        >
          <IonContent>
            <IonList>
              <IonItem>
                <IonLabel>
                  <h3>LDRRMO Admin</h3>
                  <p>{userEmail}</p>
                </IonLabel>
              </IonItem>
              <IonItem button onClick={() => setShowLogoutAlert(true)}>
                <IonIcon icon={logOutOutline} slot="start" />
                <IonLabel>Logout</IonLabel>
              </IonItem>
            </IonList>
          </IonContent>
        </IonPopover>

        {/* Notifications Popover */}
        <IonPopover
          isOpen={showNotifications}
          onDidDismiss={() => setShowNotifications(false)}
        >
          <IonContent>
            <IonList>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <IonItem key={notification.id}>
                    <IonLabel>
                      <h3>{notification.title}</h3>
                      <p>{notification.message}</p>
                      <p>{new Date(notification.created_at).toLocaleString()}</p>
                    </IonLabel>
                  </IonItem>
                ))
              ) : (
                <IonItem>
                  <IonLabel>No notifications</IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonContent>
        </IonPopover>

        {/* Logout Alert */}
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header={'Logout'}
          message={'Are you sure you want to logout?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Logout',
              role: 'confirm',
              handler: async () => {
                await supabase.auth.signOut();
                navigation.push('/it35-lab2', 'root', 'replace');
              },
            },
          ]}
        />

        {/* Toast for messages */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>

      {/* Footer with Quick Actions */}
      <IonFooter style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.1)' }}>
        <IonToolbar style={{
          '--background': 'white',
          '--padding-top': '8px',
          '--padding-bottom': '8px'
        } as any}>
          <IonGrid>
            <IonRow>
              <IonCol size="3">
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => navigation.push('/it35-lab2/admin/map', 'forward', 'push')}
                  style={{
                    '--color': '#3b82f6',
                    height: '60px',
                    flexDirection: 'column',
                    fontSize: '10px'
                  } as any}
                >
                  <IonIcon icon={mapOutline} style={{ fontSize: '24px', marginBottom: '4px' }} />
                  Map
                </IonButton>
              </IonCol>
              <IonCol size="3">
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => generateReport('monthly')}
                  style={{
                    '--color': '#10b981',
                    height: '60px',
                    flexDirection: 'column',
                    fontSize: '10px'
                  } as any}
                >
                  <IonIcon icon={downloadOutline} style={{ fontSize: '24px', marginBottom: '4px' }} />
                  Reports
                </IonButton>
              </IonCol>
              <IonCol size="3">
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => setActiveSegment('analytics')}
                  style={{
                    '--color': '#8b5cf6',
                    height: '60px',
                    flexDirection: 'column',
                    fontSize: '10px'
                  } as any}
                >
                  <IonIcon icon={analyticsOutline} style={{ fontSize: '24px', marginBottom: '4px' }} />
                  Analytics
                </IonButton>
              </IonCol>
              <IonCol size="3">
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => setActiveSegment('users')}
                  style={{
                    '--color': '#f59e0b',
                    height: '60px',
                    flexDirection: 'column',
                    fontSize: '10px'
                  } as any}
                >
                  <IonIcon icon={peopleOutline} style={{ fontSize: '24px', marginBottom: '4px' }} />
                  Users
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default AdminDashboard;