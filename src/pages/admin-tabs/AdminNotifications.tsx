// src/pages/AdminNotifications.tsx - Complete rewrite
import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonText,
  IonChip,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonToast,
  useIonRouter,
  IonModal,
  useIonViewWillEnter
} from '@ionic/react';
import {
  alertCircleOutline,
  documentTextOutline,
  peopleOutline,
  timeOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  warningOutline,
  notificationsOutline,
  logOutOutline,
  statsChartOutline,
  mailOutline,
  trashOutline,
  chatbubbleOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';

interface AdminNotification {
  id: string;
  type: 'incident_report' | 'feedback' | 'system' | 'appeal';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  read: boolean;
  related_id?: string;
  user_email?: string;
  user_name?: string;
  appealStatus?: string;
  appealData?: any;
}

const AdminNotifications: React.FC = () => {
  const navigation = useIonRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'reports' | 'feedback' | 'appeals'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);

  // Refresh data when page becomes active
  useIonViewWillEnter(() => {
    fetchAdminNotifications();
  });

  useEffect(() => {
    fetchAdminNotifications();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
  if (unreadCount > prevUnreadCount) {
    // Check last notification type to show appropriate message
    const lastNotification = notifications[0];
    if (lastNotification) {
      setToastMessage(
        lastNotification.type === 'incident_report' 
          ? "A new incident report was submitted. Check it out!"
          : "A new feedback was submitted. Check it out!"
      );
      setShowToast(true);
    }
  }
  setPrevUnreadCount(unreadCount);
}, [unreadCount, notifications]);

  const fetchAdminNotifications = async () => {
    try {
      setIsLoading(true);

      // Fetch recent incident reports
      const { data: recentReports } = await supabase
        .from('incident_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch user feedback
      // Fetch feedback from both feedback table and incident_reports table
      const { data: userFeedback } = await supabase
        .from('feedback')
        .select(`
          id,
          user_email,
          created_at,
          report_id,
          overall_rating,
          response_time_rating,
          communication_rating,
          resolution_satisfaction,
          categories,
          would_recommend,
          comments,
          read
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch user appeals from users table
      const { data: userAppealsData } = await supabase
        .from('users')
        .select('user_email, username, user_appeal')
        .not('user_appeal', 'is', null)
        .limit(50);

      // Also fetch old appeals from incident_reports (for backward compatibility)
      const { data: appealData } = await supabase
        .from('incident_reports')
        .select('id, title, reporter_email, reporter_name, created_at, appeal')
        .not('appeal', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      // Convert to notification format
      const reportNotifications: AdminNotification[] = (recentReports || []).map(report => ({
        id: `report-${report.id}`,
        type: 'incident_report',
        title: `Incident Report: ${report.title}`,
        message: report.description?.substring(0, 100) + (report.description && report.description.length > 100 ? '...' : '') || 'No description',
        priority: report.priority as 'low' | 'medium' | 'high' | 'critical',
        created_at: report.created_at,
        read: report.read || false,
        related_id: report.id,
        user_email: report.reporter_email,
        user_name: report.reporter_name
      }));

      const feedbackNotifications: AdminNotification[] = (userFeedback || []).map(feedback => ({
        id: `feedback-${feedback.id}`,
        type: 'feedback',
        title: `User Feedback: ${feedback.overall_rating}/5 rating`,
        message: feedback.comments ||
          `Overall: ${feedback.overall_rating}/5 | Response Time: ${feedback.response_time_rating || 'N/A'}/5 | Communication: ${feedback.communication_rating || 'N/A'}/5 | Resolution: ${feedback.resolution_satisfaction || 'N/A'}/5`,
        priority: 'medium',
        created_at: feedback.created_at,
        read: feedback.read || false,
        related_id: feedback.id,
        user_email: feedback.user_email,
        user_name: feedback.user_email.split('@')[0] // Add username derived from email
      }));

      // Convert user appeals from users table to notifications
      const userAppealNotifications: AdminNotification[] = (userAppealsData || [])
        .filter(user => !!user.user_appeal)
        .map(user => ({
          id: `user-appeal-${user.user_email}`,
          type: 'appeal',
          title: `Account Appeal: ${user.user_appeal.appeal_type || 'Appeal'}`,
          message: user.user_appeal.message || 'Appeal submitted',
          priority: 'medium',
          created_at: user.user_appeal.created_at || new Date().toISOString(),
          read: !!user.user_appeal.admin_read,
          related_id: user.user_appeal.report_id,
          user_email: user.user_email,
          user_name: user.user_appeal.username || user.username || user.user_email.split('@')[0],
          appealStatus: user.user_appeal.status,
          appealData: user.user_appeal
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Convert old appeals from incident_reports (for backward compatibility)
      const appealNotifications: AdminNotification[] = (appealData || [])
        .filter(report => !!report.appeal)
        .map(report => ({
          id: `appeal-${report.id}`,
          type: 'appeal',
          title: `Appeal: ${report.title}`,
          message: report.appeal.message || 'Appeal submitted',
          priority: 'medium',
          created_at: report.appeal.created_at || report.created_at,
          read: !!report.appeal.admin_read,
          related_id: report.id,
          user_email: report.reporter_email,
          user_name: report.reporter_name,
          appealStatus: report.appeal.status,
          appealData: report.appeal
        }));

      // Combine all notifications
      const allNotifications = [
        ...reportNotifications,
        ...feedbackNotifications,
        ...userAppealNotifications,
        ...appealNotifications,
      ].sort((a, b) => {
        // Sort feedback notifications by their timestamp (newest first)
        if (a.type === 'feedback' && b.type === 'feedback') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // Keep original sorting for other types
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setNotifications(allNotifications);
      const unreadTotal = allNotifications.filter(n => !n.read).length;
      setUnreadCount(unreadTotal);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      setToastMessage('Error loading notifications');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const reportsChannel = supabase
      .channel('admin_reports_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_reports' },
        async (payload) => {
          console.log('Real-time report update in notifications:', payload);
          
          // Handle new incident reports
          if (payload.eventType === 'INSERT') {
            const newReport = payload.new;
            console.log('New incident reported:', newReport.title);
            
            // Show immediate notification
            const priorityEmojis = {
              'critical': '🚨',
              'high': '⚠️',
              'medium': '📋',
              'low': 'ℹ️'
            } as const;
            const priorityEmoji = priorityEmojis[newReport.priority as keyof typeof priorityEmojis] || '📋';
            
            setToastMessage(`${priorityEmoji} New ${newReport.priority} priority incident: ${newReport.title} in ${newReport.barangay}`);
            setShowToast(true);
          }
          
          await fetchAdminNotifications();
        }
      )
      .subscribe();

    const feedbackChannel = supabase
      .channel('admin_feedback_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        async (payload) => {
          console.log('Real-time feedback update:', payload);
          
          // Handle new feedback
          if (payload.eventType === 'INSERT') {
            const newFeedback = payload.new;
            console.log('New feedback submitted:', newFeedback.overall_rating);
            
            setToastMessage(`💬 New feedback received: ${newFeedback.overall_rating}/5 rating`);
            setShowToast(true);
          }
          
          await fetchAdminNotifications();
        }
      )
      .subscribe();

    return () => {
      reportsChannel.unsubscribe();
      feedbackChannel.unsubscribe();
    };
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchText.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchText.toLowerCase()) ||
      (notification.user_name && notification.user_name.toLowerCase().includes(searchText.toLowerCase()));

    const matchesFilter =
      filter === 'all' ? true :
        filter === 'unread' ? !notification.read :
          filter === 'read' ? notification.read :
            filter === 'reports' ? notification.type === 'incident_report' :
              filter === 'feedback' ? notification.type === 'feedback' :
                filter === 'appeals' ? notification.type === 'appeal' : true;

    return matchesSearch && matchesFilter;
  });

  const handleNotificationClick = async (notification: AdminNotification) => {
    // Update read status in database
    if (notification.type === 'incident_report') {
      await supabase
        .from('incident_reports')
        .update({ read: true })
        .eq('id', notification.related_id);
    } else if (notification.type === 'feedback') {
      // Handle feedback from feedback table
      await supabase
        .from('feedback')
        .update({ read: true })
        .eq('id', notification.related_id);
    } else if (notification.type === 'appeal' && notification.appealData) {
      // Check if it's a user appeal (from users table) or old appeal (from incident_reports)
      if (notification.id.startsWith('user-appeal-')) {
        // Update user_appeal in users table
        const updatedAppeal = {
          ...notification.appealData,
          admin_read: true
        };
        await supabase
          .from('users')
          .update({ user_appeal: updatedAppeal })
          .eq('user_email', notification.user_email);
      } else {
        // Old appeal from incident_reports
        const updatedAppeal = {
          ...notification.appealData,
          admin_read: true
        };
        await supabase
          .from('incident_reports')
          .update({ appeal: updatedAppeal })
          .eq('id', notification.related_id);
      }
    }

    // Mark as read and show modal
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'incident_report': return alertCircleOutline;
      case 'feedback': return chatbubbleOutline; // Changed to chatbubble icon
      case 'system': return notificationsOutline;
      case 'appeal': return mailOutline;
      default: return alertCircleOutline;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'incident_report': return 'var(--danger-color)';
      case 'feedback': return 'var(--secondary-color)'; // Purple color for feedback
      case 'system': return 'var(--success-color)';
      case 'appeal': return '#8b5cf6';
      default: return 'var(--text-secondary)';
    }
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length,
    reports: notifications.filter(n => n.type === 'incident_report').length,
    feedback: notifications.filter(n => n.type === 'feedback').length,
    appeals: notifications.filter(n => n.type === 'appeal').length
  };

  // Check if all notifications are read
  const allRead = stats.unread === 0 && stats.total > 0;

  // Mark all as read function
  const markAllAsRead = async () => {
    try {
      // Get all unread incident reports and feedback
      const unreadReports = notifications
        .filter(n => n.type === 'incident_report' && !n.read)
        .map(n => n.related_id);

      const unreadFeedback = notifications
        .filter(n => n.type === 'feedback' && !n.read)
        .map(n => n.related_id);

      // Update incident reports
      if (unreadReports.length > 0) {
        await supabase
          .from('incident_reports')
          .update({ read: true })
          .in('id', unreadReports);
      }

      // Note: Feedback is only stored in the feedback table, not in incident_reports

      // Update feedback table
      if (unreadFeedback.length > 0) {
        await supabase
          .from('feedback')
          .update({ read: true })
          .in('id', unreadFeedback);
      }

      // Handle user appeals from users table
      const unreadUserAppeals = notifications
        .filter(n => n.type === 'appeal' && !n.read && n.id.startsWith('user-appeal-') && n.user_email && n.appealData)
        .map(n => ({ email: n.user_email as string, appeal: n.appealData }));
      if (unreadUserAppeals.length > 0) {
        await Promise.all(
          unreadUserAppeals.map(item =>
            supabase
              .from('users')
              .update({ user_appeal: { ...item.appeal, admin_read: true } })
              .eq('user_email', item.email)
          )
        );
      }

      // Handle old appeals from incident_reports
      const unreadAppeals = notifications
        .filter(n => n.type === 'appeal' && !n.read && !n.id.startsWith('user-appeal-') && n.related_id && n.appealData)
        .map(n => ({ id: n.related_id as string, appeal: n.appealData }));
      if (unreadAppeals.length > 0) {
        await Promise.all(
          unreadAppeals.map(item =>
            supabase
              .from('incident_reports')
              .update({ appeal: { ...item.appeal, admin_read: true } })
              .eq('id', item.id)
          )
        );
      }

      await fetchAdminNotifications();

      setToastMessage('All notifications marked as read');
      setShowToast(true);
    } catch (error) {
      console.error('Error marking all as read:', error);
      setToastMessage('Error marking notifications as read');
      setShowToast(true);
    }
  };

  // Mark all as unread function
  const markAllAsUnread = async () => {
  try {
    // Get all read incident reports and feedback
    const readReports = notifications
      .filter(n => n.type === 'incident_report' && n.read)
      .map(n => n.related_id);

    const readFeedback = notifications
      .filter(n => n.type === 'feedback' && n.read)
      .map(n => n.related_id);

    // Update incident reports
    if (readReports.length > 0) {
      await supabase
        .from('incident_reports')
        .update({ read: false })
        .in('id', readReports);
    }

    // Note: Feedback is only stored in the feedback table, not in incident_reports

    // Update feedback table
    if (readFeedback.length > 0) {
      await supabase
        .from('feedback')
        .update({ read: false })
        .in('id', readFeedback);
    }

    // Handle user appeals from users table
    const readUserAppeals = notifications
      .filter(n => n.type === 'appeal' && n.read && n.id.startsWith('user-appeal-') && n.user_email && n.appealData)
      .map(n => ({ email: n.user_email as string, appeal: n.appealData }));
    if (readUserAppeals.length > 0) {
      await Promise.all(
        readUserAppeals.map(item =>
          supabase
            .from('users')
            .update({ user_appeal: { ...item.appeal, admin_read: false } })
            .eq('user_email', item.email)
        )
      );
    }

    // Handle old appeals from incident_reports
    const readAppeals = notifications
      .filter(n => n.type === 'appeal' && n.read && !n.id.startsWith('user-appeal-') && n.related_id && n.appealData)
      .map(n => ({ id: n.related_id as string, appeal: n.appealData }));
    if (readAppeals.length > 0) {
      await Promise.all(
        readAppeals.map(item =>
          supabase
            .from('incident_reports')
            .update({ appeal: { ...item.appeal, admin_read: false } })
            .eq('id', item.id)
        )
      );
    }

    await fetchAdminNotifications();

    setToastMessage('All notifications marked as unread');
    setShowToast(true);
  } catch (error) {
    console.error('Error marking all as unread:', error);
    setToastMessage('Error marking notifications as unread');
    setShowToast(true);
  }
};

  const handleMarkUnread = async (notification: AdminNotification) => {
  try {
    // Update read status in database
    if (notification.type === 'incident_report') {
      await supabase
        .from('incident_reports')
        .update({ read: false })
        .eq('id', notification.related_id);
    } else if (notification.type === 'feedback') {
      // Handle feedback from feedback table
      await supabase
        .from('feedback')
        .update({ read: false })
        .eq('id', notification.related_id);
    } else if (notification.type === 'appeal' && notification.appealData) {
      // Check if it's a user appeal (from users table) or old appeal (from incident_reports)
      if (notification.id.startsWith('user-appeal-')) {
        // Update user_appeal in users table
        const updatedAppeal = {
          ...notification.appealData,
          admin_read: false
        };
        await supabase
          .from('users')
          .update({ user_appeal: updatedAppeal })
          .eq('user_email', notification.user_email);
      } else {
        // Old appeal from incident_reports
        const updatedAppeal = {
          ...notification.appealData,
          admin_read: false
        };
        await supabase
          .from('incident_reports')
          .update({ appeal: updatedAppeal })
          .eq('id', notification.related_id);
      }
    }

    // Update unread count

    // Update local state
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: false } : n)
    );

    setToastMessage('Notification marked as unread');
    setShowToast(true);
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    setToastMessage('Error updating notification');
    setShowToast(true);
  }
};

  // Delete notification function
  const deleteNotification = async (notificationId: string) => {
    try {
      if (notificationId.startsWith('appeal-')) {
        setToastMessage('Appeal notifications cannot be deleted');
        setShowToast(true);
        return;
      }
      // Remove from local state only (since these are virtual notifications)
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      setToastMessage('Notification deleted');
      setShowToast(true);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setToastMessage('Error deleting notification');
      setShowToast(true);
    }
  };

  // Replace the entire isLoading return section with this fixed version
if (isLoading) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--gradient-primary)', '--color': 'white' } as any}>
          <IonTitle style={{ fontWeight: 'bold' }}>
            <IonSkeletonText animated style={{ width: '250px', height: '24px', margin: '0 auto' }} />
          </IonTitle>
          <IonButtons slot="end">
            <IonSkeletonText animated style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              marginRight: '8px' 
            }} />
            <IonSkeletonText animated style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%' 
            }} />
          </IonButtons>
        </IonToolbar>
        
        {/* Skeleton for menu bar */}
        <IonToolbar style={{ '--background': 'var(--bg-primary)' } as any}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ flex: 1, padding: '8px', display: 'flex', justifyContent: 'center' }}>
                <IonSkeletonText 
                  animated 
                  style={{ 
                    width: '80%',
                    height: '20px',
                  }} 
                />
              </div>
            ))}
          </div>
        </IonToolbar>
      </IonHeader>
      
      <IonContent style={{ '--background': 'var(--bg-secondary)' } as any}>
        <div style={{ padding: '20px' }}>
          {/* Skeleton for stats cards - matches the 4-column grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                background: 'var(--bg-primary)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <IonSkeletonText animated style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                  <IonSkeletonText animated style={{ width: '40px', height: '12px' }} />
                </div>
                <IonSkeletonText animated style={{ width: '60%', height: '28px', margin: '0 auto' }} />
              </div>
            ))}
          </div>
          
          {/* Skeleton for search bar card */}
          <div style={{ borderRadius: '16px', marginBottom: '20px', overflow: 'hidden' }}>
            <IonSkeletonText 
              animated 
              style={{ 
                width: '100%', 
                height: '60px'
              }} 
            />
          </div>

          {/* Skeleton for notifications card */}
          <div style={{ padding: '0 20px 20px 20px' }}>
            <div style={{ 
              background: 'var(--bg-primary)', 
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              {/* Card header skeleton */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px' 
              }}>
                <IonSkeletonText animated style={{ width: '180px', height: '18px' }} />
                <IonSkeletonText animated style={{ width: '120px', height: '32px', borderRadius: '16px' }} />
              </div>
              
              {/* Skeleton for notifications list */}
              <div style={{ background: 'transparent' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ 
                    background: i % 2 === 0 ? 'var(--primary-color)20' : 'transparent',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      {/* Notification icon skeleton */}
                      <IonSkeletonText 
                        animated 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '12px',
                          flexShrink: 0
                        }} 
                      />
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Notification header skeleton */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start', 
                          marginBottom: '8px' 
                        }}>
                          <IonSkeletonText animated style={{ width: '70%', height: '16px' }} />
                          <IonSkeletonText animated style={{ width: '40px', height: '20px', borderRadius: '10px' }} />
                        </div>
                        
                        {/* Message skeleton */}
                        <IonSkeletonText animated style={{ width: '90%', height: '14px', marginBottom: '8px' }} />
                        <IonSkeletonText animated style={{ width: '80%', height: '14px', marginBottom: '8px' }} />
                        
                        {/* Footer skeleton */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IonSkeletonText animated style={{ width: '60px', height: '24px', borderRadius: '12px' }} />
                            <IonSkeletonText animated style={{ width: '80px', height: '12px' }} />
                          </div>
                          <IonSkeletonText animated style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

  return (
    <IonPage>
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--gradient-primary)', '--color': 'white' } as any}>
          <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta - Admin Notifications</IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              onClick={() => navigation.push('/iAMUMAta/admin/notifications', 'forward', 'push')}
              style={{
                color: 'white',
                position: 'relative',
                borderBottom: '2px solid white'
              }}
            >
              <IonIcon icon={notificationsOutline} />
              {unreadCount > 0 && (
                <IonBadge
                  color="danger"
                  style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
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
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user?.email) {
                    await supabase.from('system_logs').insert({
                      admin_email: user.email,
                      activity_type: 'logout',
                      activity_description: 'Admin logged out',
                      details: { source: 'AdminNotifications' }
                    });
                  }
                } finally {
                  await supabase.auth.signOut();
                  navigation.push('/iAMUMAta', 'root', 'replace');
                }
              }}
              style={{ color: 'white' }}
            >
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        {/* Menu Bar */}
        <IonToolbar style={{ '--background': 'var(--bg-primary)' } as any}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: statsChartOutline, route: '/iAMUMAta/admin-dashboard' },
              { id: 'incidents', label: 'Incidents', icon: alertCircleOutline, route: '/iAMUMAta/admin/incidents' },
              { id: 'users', label: 'Users', icon: peopleOutline, route: '/iAMUMAta/admin/users' },
              { id: 'analytics', label: 'Analytics', icon: statsChartOutline, route: '/iAMUMAta/admin/analytics' },
              { id: 'systemlogs', label: 'System Logs', icon: documentTextOutline, route: '/iAMUMAta/admin/system-logs' }
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
                  '--color': '#6b7280',
                  '--background': 'transparent',
                  '--border-radius': '0',
                  borderBottom: '2px solid transparent',
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

      <IonContent style={{ '--background': 'var(--bg-secondary)' } as any}>
        <div style={{ padding: '20px' }}>
          {/* Stats Overview - UPDATED arrangement: Unread, Read, Reports, Feedback */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
            marginBottom: '20px',
            position: 'sticky',
            top: '0',
            zIndex: '100',
            background: 'var(--bg-secondary)',
            padding: '10px 0'
          }}>
            {[
              { label: 'Unread', value: stats.unread, color: 'var(--primary-color)', icon: alertCircleOutline, filter: 'unread' },
              { label: 'Read', value: stats.read, color: 'var(--success-color)', icon: checkmarkDoneOutline, filter: 'read' },
              { label: 'Reports', value: stats.reports, color: 'var(--danger-color)', icon: documentTextOutline, filter: 'reports' },
              { label: 'Feedback', value: stats.feedback, color: 'var(--secondary-color)', icon: chatbubbleOutline, filter: 'feedback' },
              { label: 'Appeals', value: stats.appeals, color: '#8b5cf6', icon: mailOutline, filter: 'appeals' }
            ].map((stat, idx) => (
              <div
                key={idx}
                onClick={() => stat.filter && setFilter(stat.filter as any)}
                style={{
                  background: filter === stat.filter ? stat.color + '20' : 'var(--bg-primary)',
                  border: `1px solid ${filter === stat.filter ? stat.color : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: stat.filter ? 'pointer' : 'default'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <IonIcon icon={stat.icon} style={{ color: stat.color, fontSize: '20px' }} />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{stat.label}</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardContent>
              <IonSearchbar
                value={searchText}
                onIonInput={e => setSearchText(e.detail.value!)}
                placeholder="Search notifications..."
                style={{
                  '--background': 'var(--bg-secondary)',
                  '--border-radius': '8px',
                  '--box-shadow': 'none'
                } as any}
              />
            </IonCardContent>
          </IonCard>

          {/* Notifications List */}
          <div style={{ padding: '0 20px 20px 20px' }}>
            <IonCard style={{ borderRadius: '16px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {filter === 'all' ? 'All Notifications' :
                    filter === 'unread' ? 'Unread Notifications' :
                      filter === 'read' ? 'Read Notifications' :
                        filter === 'reports' ? 'Incident Reports' :
                          filter === 'feedback' ? 'Feedback' :
                            'Appeals'} ({filteredNotifications.length})
                  {stats.total > 0 && (
                    allRead ? (
                      <IonButton
                        shape="round"
                        fill="clear"
                        onClick={markAllAsUnread}
                        style={{ '--padding-start': '12px', '--padding-end': '12px' }}
                      >
                        <IonIcon icon={mailOutline} slot="start" style={{ marginRight: '6px' }} />
                        Mark All Unread
                      </IonButton>
                    ) : (
                      <IonButton
                        shape="round"
                        fill="clear"
                        onClick={markAllAsRead}
                        style={{ '--padding-start': '12px', '--padding-end': '12px' }}
                      >
                        <IonIcon icon={checkmarkDoneOutline} slot="start" style={{ marginRight: '6px' }} />
                        Mark All Read
                      </IonButton>
                    )
                  )}
                </h3>

                <IonList style={{ background: 'transparent' }}>
                  {filteredNotifications.map(notification => (
                    <IonItem
                      key={notification.id}
                      button
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        '--background': notification.read ? 'transparent' : 'var(--primary-color)20',
                        '--border-radius': '8px',
                        marginBottom: '12px'
                      } as any}
                    >
                      <div style={{ width: '100%', padding: '12px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{
                            position: 'relative',
                            width: '40px',
                            height: '40px',
                            background: getNotificationColor(notification.type) + '20',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <IonIcon
                              icon={getNotificationIcon(notification.type)}
                              style={{
                                fontSize: '20px',
                                color: getNotificationColor(notification.type)
                              }}
                            />

                            {/* New badge positioned properly */}
                            {!notification.read && (
                              <div style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                background: '#3b82f6',
                                color: 'white',
                                borderRadius: '6px',
                                minWidth: '12px',
                                height: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                border: '1px solid white',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                zIndex: 5
                              }}></div>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <h4 style={{
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: notification.read ? '500' : '600',
                                color: notification.read ? 'var(--text-secondary)' : 'var(--text-primary)'
                              }}>
                                {notification.title}
                              </h4>
                              {notification.read ? (
                                <IonButton
                                  fill="clear"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkUnread(notification);
                                  }}
                                >
                                  <IonIcon icon={mailOutline} />
                                </IonButton>
                              ) : (
                                <IonBadge color="primary" style={{ fontSize: '10px' }}>
                                  New
                                </IonBadge>
                              )}
                            </div>

                            <p style={{
                              margin: '0 0 8px 0',
                              fontSize: '14px',
                              color: 'var(--text-secondary)',
                              lineHeight: '1.4'
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
                                    fontSize: '10px',
                                    fontWeight: '600'
                                  } as any}
                                >
                                  {notification.type.replace('_', ' ').toUpperCase()}
                                </IonChip>
                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <IonIcon icon={timeOutline} style={{ fontSize: '12px' }} />
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              {!notification.id.startsWith('report-') && !notification.id.startsWith('appeal-') && !notification.id.startsWith('user-appeal-') && (
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
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </IonItem>
                  ))}
                </IonList>

                {filteredNotifications.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <IonIcon icon={notificationsOutline} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                    <div style={{ fontSize: '16px', fontWeight: '500' }}>No notifications found</div>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                      {filter === 'unread' ? 'All caught up!' :
                        filter === 'read' ? 'No read notifications yet' :
                          filter === 'reports' ? 'No incident reports found' :
                            filter === 'feedback' ? 'No feedback found' :
                              'You have no notifications'}
                    </div>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>
      <IonModal isOpen={showDetailsModal} onDidDismiss={() => setShowDetailsModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Notification Details</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowDetailsModal(false)}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {selectedNotification && (
            <>
              <h2>{selectedNotification.title}</h2>
              <div style={{ marginBottom: '16px' }}>
                <strong>User Information:</strong>
                <p style={{ margin: '4px 0' }}>
                  <strong>Name:</strong> {selectedNotification.user_name || 'N/A'}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Email:</strong> {selectedNotification.user_email || 'N/A'}
                </p>
              </div>
              {selectedNotification.type === 'appeal' && selectedNotification.appealData && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f3f4f6', borderRadius: '8px' }}>
                  <strong>Appeal Type:</strong> {selectedNotification.appealData.appeal_type || 'N/A'}
                  <br />
                  <strong>Status:</strong> {selectedNotification.appealStatus || 'pending'}
                  <br />
                  <strong>Report ID:</strong> {selectedNotification.appealData.report_id || 'N/A'}
                </div>
              )}
              <div style={{ marginBottom: '16px' }}>
                <strong>Message:</strong>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: '8px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  {selectedNotification.message}
                </p>
              </div>
              <p><strong>Type:</strong> {selectedNotification.type.replace('_', ' ')}</p>
              <p><strong>Priority:</strong> {selectedNotification.priority}</p>
              <p><strong>Date:</strong> {new Date(selectedNotification.created_at).toLocaleString()}</p>
            </>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default AdminNotifications;