// src/pages/admin-tabs/AdminIncidents.tsx - Fixed version
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
  IonLabel,
  useIonViewWillEnter
} from '@ionic/react';
import {
  logOutOutline,
  notificationsOutline,
  locationOutline,
  closeOutline,
  sendOutline,
  statsChartOutline,
  alertCircleOutline,
  peopleOutline,
  documentTextOutline,
  timeOutline,
  checkmarkCircleOutline,
  carOutline,
  calendarOutline,
  desktopOutline,
  mapOutline,
  navigateOutline,
  chevronBackOutline,
  chevronForwardOutline
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
  resolved_at?: string | null;
  resolved_photo_url?: string | null;
  appeal?: {
    report_id: string;
    user_email: string;
    username: string;
    message: string;
    created_at?: string;
    status?: string;
    admin_read?: boolean;
    reviewed_at?: string;
    reviewed_by?: string;
    appeal_type?: string;
  };
  admin_appeal?: {
    status?: string;
    message?: string;
    reviewed_by?: string;
    reviewed_at?: string;
  };
}

const getResolvedPhotoPublicUrl = (input?: string | null): string | null => {
  if (!input) return null;

  try {
    if (input.startsWith('http') && input.includes('/object/public/')) {
      return input;
    }

    let filePath = input;

    if (input.startsWith('http')) {
      const marker = '/resolved-photos/';
      const markerIndex = input.indexOf(marker);
      if (markerIndex !== -1) {
        filePath = input.substring(markerIndex + marker.length);
        const queryIndex = filePath.indexOf('?');
        if (queryIndex !== -1) {
          filePath = filePath.substring(0, queryIndex);
        }
      } else {
        return input;
      }
    }

    if (!filePath) return null;

    const { data } = supabase.storage.from('resolved-photos').getPublicUrl(filePath);
    return data?.publicUrl || input;
  } catch (error) {
    console.error('Error normalizing resolved photo url:', error);
    return input;
  }
};

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
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [statusChangeType, setStatusChangeType] = useState<'pending-to-active' | 'active-to-resolved' | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const [showNewNotificationToast, setShowNewNotificationToast] = useState(false);
  const [resolvedPhoto, setResolvedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedReportFeedback, setSelectedReportFeedback] = useState<{ overall_rating: number; comments: string | null } | null>(null);
  const [showPrankModal, setShowPrankModal] = useState(false);
  const [prankMessage, setPrankMessage] = useState("Your report has been verified as prank and your account has been suspended. Please refrain doing this kind of pranks for the safety of the responders and the community of Manolo Fortich.");

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: reports } = await supabase
        .from('incident_reports')
        .select('id')
        .eq('read', false);
      const { data: feedback } = await supabase
        .from('feedback')
        .select('id')
        .eq('read', false);
      const newCount = (reports?.length || 0) + (feedback?.length || 0);
      if (newCount > prevUnreadCount && prevUnreadCount > 0) {
        setToastMessage('You have new notifications');
        setShowNewNotificationToast(true);
      }
      setPrevUnreadCount(newCount);
      setUnreadCount(newCount);
    };

    fetchUnreadCount();

    const reportsChannel = supabase
      .channel('incidents_unread_count')
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
  }, [prevUnreadCount]);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };

    checkDevice();
  }, []);

  // Refresh data when page becomes active
  useIonViewWillEnter(() => {
    fetchReports();
  });

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
      if (data) {
        const normalized = data.map(report => ({
          ...report,
          resolved_photo_url: getResolvedPhotoPublicUrl(report.resolved_photo_url)
        }));
        setReports(normalized);
      }
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
        async (payload) => {
          console.log('Real-time incident update:', payload);
          
          // Handle new incident reports
          if (payload.eventType === 'INSERT') {
            const newReport = payload.new as IncidentReport;
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
            
            // Update unread count
            setUnreadCount(prev => prev + 1);
          }
          
          // Handle status updates
          if (payload.eventType === 'UPDATE') {
            const updatedReport = payload.new as IncidentReport;
            const oldReport = payload.old as IncidentReport;
            
            // Show toast for status changes
            if (updatedReport.status !== oldReport.status) {
              const statusEmojis: { [key: string]: string } = {
                'pending': '⏳',
                'active': '🔍',
                'resolved': '✅'
              };
              const emoji = statusEmojis[updatedReport.status] || '📋';
              setToastMessage(`${emoji} Report "${updatedReport.title}" status changed to ${updatedReport.status}`);
              setShowToast(true);
            }
          }
          
          // Refresh the reports list
          await fetchReports();
        }
      )
      .subscribe();

    // Feedback channel for new feedback
    const feedbackChannel = supabase
      .channel('incidents_feedback_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newFeedback = payload.new as any;
            setToastMessage(`💬 New feedback submitted for a report: ${newFeedback.overall_rating}/5 stars`);
            setShowToast(true);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      feedbackChannel.unsubscribe();
    };
  };

  // Load latest feedback for selected report
  useEffect(() => {
    const loadFeedback = async () => {
      if (!selectedReport || selectedReport.status !== 'resolved') {
        setSelectedReportFeedback(null);
        return;
      }
      const { data } = await supabase
        .from('feedback')
        .select('overall_rating, comments')
        .eq('report_id', selectedReport.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSelectedReportFeedback({ overall_rating: data.overall_rating, comments: data.comments || null });
      } else {
        setSelectedReportFeedback(null);
      }
    };
    loadFeedback();
  }, [selectedReport]);

  const handleStatusBadgeClick = (report: IncidentReport, e: React.MouseEvent) => {
    e.stopPropagation();

    if (report.status === 'pending') {
      setStatusChangeType('pending-to-active');
      setNotificationMessage('Your report will be addressed by the responders of LDRRMO. Thank you for being patient and stay safe.');
      setSelectedReport(report);
      setShowStatusChangeModal(true);
    } else if (report.status === 'active') {
      setStatusChangeType('active-to-resolved');
      setNotificationMessage('Your report has been resolved successfully by the responders of LDRRMO. Thank you for reporting this incident. Your help is much appreciated, GODBLESS!');
      setSelectedReport(report);
      setShowStatusChangeModal(true);
    }
    // Resolved status is not clickable
  };

  const handleStatusChange = async () => {
    if (!selectedReport || !estimatedTime) {
      setToastMessage('Please fill in all required fields');
      setShowToast(true);
      return;
    }

    // Additional validation for resolved status
    if (statusChangeType === 'active-to-resolved' && !resolvedPhoto) {
      setToastMessage('Proof of resolution photo is required');
      setShowToast(true);
      return;
    }

    try {
      let newStatus: 'pending' | 'active' | 'resolved' = selectedReport.status;
      let updateData: any = {
        updated_at: new Date().toISOString()
      };

      const formattedTime = new Date(estimatedTime).toISOString();

      if (statusChangeType === 'pending-to-active') {
        newStatus = 'active';
        updateData.status = 'active';
        updateData.scheduled_response_time = formattedTime;
        updateData.resolved_at = null;
      } else if (statusChangeType === 'active-to-resolved') {
        newStatus = 'resolved';
        updateData.status = 'resolved';
        updateData.resolved_at = new Date().toISOString();

        // Upload resolved photo
        if (resolvedPhoto) {
          const photoUrl = await uploadResolvedPhoto(resolvedPhoto, selectedReport.id);
          updateData.resolved_photo_url = photoUrl;
        }

      }

      const defaultMessage = statusChangeType === 'pending-to-active'
        ? 'Your report will be addressed by the responders of LDRRMO. Thank you for being patient and stay safe.'
        : 'Your report has been resolved successfully by the responders of LDRRMO. Thank you for reporting this incident. Your help is much appreciated, GODBLESS!';

      const baseMessage = notificationMessage.trim() || defaultMessage;
      const timeLabel = statusChangeType === 'pending-to-active' ? 'Estimated Response Time' : 'Resolved At';
      const finalMessage = `${baseMessage}\n\n${timeLabel}: ${new Date(estimatedTime).toLocaleString()}`;
      updateData.admin_response = finalMessage;

      // Update the incident report
      const { error: updateError } = await supabase
        .from('incident_reports')
        .update(updateData)
        .eq('id', selectedReport.id);

      if (updateError) throw updateError;

      // Send notification (automated)
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_email: selectedReport.reporter_email,
          title: `Status Update: ${selectedReport.title}`,
          message: finalMessage,
          related_report_id: selectedReport.id,
          type: 'update',
          is_automated: true
        });

      if (notificationError) throw notificationError;

      // System logs for status update + notification
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await supabase.from('system_logs').insert([
          {
            admin_email: user.email,
            activity_type: 'update_report',
            activity_description: `Report status updated to ${newStatus}`,
            target_user_email: selectedReport.reporter_email,
            target_report_id: selectedReport.id,
            details: { report_title: selectedReport.title, new_status: newStatus, at: new Date().toISOString() }
          },
          {
            admin_email: user.email,
            activity_type: 'notify',
            activity_description: `Automated notification sent for status change`,
            target_user_email: selectedReport.reporter_email,
            target_report_id: selectedReport.id,
            details: { report_title: selectedReport.title, message: finalMessage }
          }
        ]);
      }

      setToastMessage(`Status updated to ${newStatus} successfully`);
      setShowToast(true);

      // Close the modal and reset state
      setShowStatusChangeModal(false);
      setNotificationMessage('');
      setEstimatedTime('');
      setResolvedPhoto(null);
      setPhotoPreview(null);
      setSelectedReport(null);
      setStatusChangeType(null);
      setShowReportModal(false); // Close the incident details modal

      // Force refresh reports to show updated status
      await fetchReports();

    } catch (error) {
      console.error('Error updating status:', error);
      setToastMessage('Error updating status. Please try again.');
      setShowToast(true);
      setShowStatusChangeModal(false);
    }
  };

  const handleNotifyUser = async () => {
    if (!selectedReport || !notificationMessage.trim()) return;

    try {
      // Store the estimated time in the incident report if provided
      const updateFields: any = {
        admin_response: notificationMessage,
        updated_at: new Date().toISOString()
      };
      if (estimatedTime) {
        updateFields.estimated_arrival_time = estimatedTime;
      }
      await supabase
        .from('incident_reports')
        .update(updateFields)
        .eq('id', selectedReport.id);

      // Send notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_email: selectedReport.reporter_email,
          title: `Update: ${selectedReport.title}`,
          message: estimatedTime
            ? `${notificationMessage}\n\nEstimated resolution: ${new Date(estimatedTime).toLocaleString()}`
            : notificationMessage,
          related_report_id: selectedReport.id,
          type: 'update',
          is_automated: false
        });

      if (error) throw error;

      // System logs for manual notification
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await supabase.from('system_logs').insert({
          admin_email: user.email,
          activity_type: 'notify',
          activity_description: `User notified for report update`,
          target_user_email: selectedReport.reporter_email,
          target_report_id: selectedReport.id,
          details: { report_title: selectedReport.title, message: notificationMessage, estimated_time: estimatedTime || null }
        });
      }

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

  const handleViewInMap = () => {
    if (selectedReport) {
      setShowReportModal(false);
      navigation.push('/iAMUMAta/admin-dashboard', 'forward', 'push');
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setToastMessage('Please upload an image file');
        setShowToast(true);
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage('Image size must be less than 5MB');
        setShowToast(true);
        return;
      }

      setResolvedPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadResolvedPhoto = async (file: File, reportId: string): Promise<string> => {
    try {
      const fileName = `resolved-proof-${Date.now()}.png`;
      const filePath = `${reportId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('resolved-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        if (error.message.includes('Bucket not found')) {
          console.error('Storage bucket not found. Please create "resolved-photos" bucket in Supabase.');
          throw new Error('Storage configuration error. Please contact administrator.');
        }
        throw error;
      }

      const { data: publicData } = supabase.storage
        .from('resolved-photos')
        .getPublicUrl(filePath);

      return publicData?.publicUrl || data?.path || filePath;
    } catch (error) {
      console.error('Error uploading resolved photo:', error);
      throw new Error('Failed to upload photo');
    }
  };

  // NEW: Flag report as prank - updates priority and resolves
  const flagReportAsPrank = async (report: IncidentReport, message: string) => {
    try {
      const updateData: any = {
        priority: 'prank',
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        admin_response: message
      };

      const { error } = await supabase
        .from('incident_reports')
        .update(updateData)
        .eq('id', report.id);

      if (error) throw error;

      // Notify reporter with timestamp
      const timestamp = new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      await supabase.from('notifications').insert({
        user_email: report.reporter_email,
        title: 'Report Flagged as Prank',
        message: `${message}\n\nFlagged on: ${timestamp}`,
        related_report_id: report.id,
        type: 'warning',
        is_automated: true
      });

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('system_logs').insert({
        admin_email: user?.email || 'unknown',
        activity_type: 'update_report',
        activity_description: 'Report flagged as prank and resolved',
        target_user_email: report.reporter_email,
        target_report_id: report.id,
        details: { report_title: report.title }
      });

      // Suspend user instead of warning
      try {
        const suspensionDate = new Date().toISOString();
        await supabase
          .from('users')
          .update({
            status: 'suspended',
            suspension_date: suspensionDate
          })
          .eq('user_email', report.reporter_email);
      } catch (suspendErr) {
        console.warn('Failed to suspend user:', suspendErr);
      }

      // Activity log entry
      try {
        await supabase.from('activity_logs').insert({
          user_email: report.reporter_email,
          activity_type: 'system',
          activity_description: 'Report flagged as prank and resolved',
          details: {
            report_id: report.id,
            report_title: report.title
          }
        });
      } catch (activityErr) {
        console.warn('Failed to log activity for prank:', activityErr);
      }

      setToastMessage('Report flagged as prank and resolved.');
      setShowToast(true);
      setShowPrankModal(false);
      await fetchReports();
    } catch (error) {
      console.error('Error flagging prank:', error);
      setToastMessage('Error flagging as prank');
      setShowToast(true);
    }
  };

  // Function to get signed URL when displaying the image
  const getResolvedPhotoUrl = async (filePath: string): Promise<string> => {
    const { data } = await supabase.storage
      .from('resolved-photos')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return data?.signedUrl || '';
  };

const handleDeleteReport = async (report: IncidentReport) => {
  try {
    const { error } = await supabase
      .from('incident_reports')
      .delete()
      .eq('id', report.id);

    if (error) throw error;

    // Log the deletion
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.from('system_logs').insert({
        admin_email: user.email,
        activity_type: 'update_report',
        activity_description: `Deleted incident report: ${report.title}`,
        target_user_email: report.reporter_email,
        target_report_id: report.id,
        details: { report_title: report.title }
      });
    }

    setToastMessage('Report deleted successfully');
    setShowToast(true);
    setShowReportModal(false);
    await fetchReports();
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
          <IonToolbar style={{ '--background': 'var(--gradient-primary)', '--color': 'white' } as any}>
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
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                  <IonSkeletonText animated style={{ width: '80%', height: '16px', margin: '0 auto' }} />
                </div>
              ))}
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': 'var(--bg-secondary)' } as any}>
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
              onClick={() => navigation.push('/iAMUMAta')}
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
        <IonToolbar style={{ '--background': 'var(--gradient-primary)', '--color': 'white' } as any}>
          <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta - Report Management</IonTitle>
          <IonButtons slot="end">
            <IonButton  
              fill="clear"
              onClick={() => navigation.push("/iAMUMAta/admin/notifications", "forward", "push")}
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
          <IonToast
            isOpen={showNewNotificationToast}
            onDidDismiss={() => setShowNewNotificationToast(false)}
            message={toastMessage}
            duration={3000}
            position="top"
          />
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
                      details: { source: 'AdminIncidents' }
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

        <IonToolbar style={{ '--background': 'white' } as any}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: statsChartOutline, route: '/iAMUMAta/admin-dashboard' },
              { id: 'incidents', label: 'Incidents', icon: alertCircleOutline, route: '/iAMUMAta/admin/incidents' },
              { id: 'users', label: 'Users', icon: peopleOutline, route: '/iAMUMAta/admin/users' },
              { id: 'analytics', label: 'Analytics', icon: documentTextOutline, route: '/iAMUMAta/admin/analytics' },
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

      <IonContent style={{ '--background': 'var(--bg-secondary)' } as any}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Total', value: stats.total, color: 'var(--text-secondary)', icon: documentTextOutline, status: 'all' },
              { label: 'Pending', value: stats.pending, color: 'var(--warning-color)', icon: timeOutline, status: 'pending' },
              { label: 'Active', value: stats.active, color: 'var(--primary-color)', icon: alertCircleOutline, status: 'active' },
              { label: 'Resolved', value: stats.resolved, color: 'var(--success-color)', icon: checkmarkCircleOutline, status: 'resolved' }
            ].map((stat, idx) => (
              <div
                key={idx}
                onClick={() => handleStatusFilterClick(stat.status as any)}
                style={{
                  background: statusFilter === stat.status ? stat.color + '20' : 'var(--bg-primary)',
                  border: `1px solid ${statusFilter === stat.status ? stat.color : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
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
                    { label: 'Low', value: 'low', color: '#10b981' },
                    { label: 'Prank', value: 'prank', color: '#6b7280' }
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
                            onClick={(e) => handleStatusBadgeClick(report, e)}
                            style={{
                              fontSize: '10px',
                              '--background': getStatusColor(report.status),
                              '--color': 'white',
                              cursor: report.status !== 'resolved' ? 'pointer' : 'default',
                              opacity: report.status !== 'resolved' ? 1 : 0.7
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                              setPrankMessage("Your report has been verified as prank and your account has been suspended. Please refrain doing this kind of pranks for the safety of the responders and the community of Manolo Fortich.");
                              setShowPrankModal(true);
                            }}
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

        {/* Incident Details Modal */}
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
                    handleViewInMap();
                  }}
                  style={{ "--background": "#dc2626", "--color": "white" } as any}
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
                    <h1 style={{ margin: 0, marginBottom: '16px' }}>{selectedReport.title}</h1>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <IonBadge
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusBadgeClick(selectedReport, e);
                        }}
                        style={{
                          '--background': getStatusColor(selectedReport.status),
                          cursor: selectedReport.status !== 'resolved' ? 'pointer' : 'default',
                          opacity: selectedReport.status !== 'resolved' ? 1 : 0.7
                        } as any}
                      >
                        {selectedReport.status}
                      </IonBadge>
                      <IonBadge 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(selectedReport);
                          setPrankMessage("Your report has been verified as prank and your account has been suspended. Please refrain doing this kind of pranks for the safety of the responders and the community of Manolo Fortich.");
                          setShowPrankModal(true);
                        }}
                        style={{ 
                          '--background': getPriorityColor(selectedReport.priority),
                          cursor: 'pointer'
                        } as any}
                      >
                        {selectedReport.priority}
                      </IonBadge>
                    </div>

                    {/* Conditional scheduling/ETA/resolution summary by status */}
                    {selectedReport.status === 'pending' && (
                      <>
                        {selectedReport.estimated_arrival_time && (
                          <div style={{
                            background: 'rgba(59, 130, 246, 0.05)',
                            border: '1px solid #93c5fd',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '12px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <IonIcon icon={carOutline} style={{ color: '#3b82f6', fontSize: '18px' }} />
                              <strong style={{ color: '#1e40af', fontSize: '14px' }}>Estimated Arrival</strong>
                            </div>
                            <IonText style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500', marginLeft: '26px' }}>
                              {new Date(selectedReport.estimated_arrival_time).toLocaleString()}
                            </IonText>
                          </div>
                        )}
                      </>
                    )}

                    {selectedReport.status === 'active' && (
                      <>
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

                        {(selectedReport.current_eta_minutes) && (
                          <div style={{
                            background: 'rgba(59, 130, 246, 0.05)',
                            border: '1px solid #93c5fd',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '12px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <IonIcon icon={carOutline} style={{ color: '#3b82f6', fontSize: '18px' }} />
                              <strong style={{ color: '#1e40af', fontSize: '14px' }}>Estimated Arrival</strong>
                            </div>
                            <IonText style={{ fontSize: '16px', color: '#1e293b', fontWeight: '500', marginLeft: '26px' }}>
                              {selectedReport.current_eta_minutes ? `${selectedReport.current_eta_minutes} minutes to arrive` : ''}
                            </IonText>
                          </div>
                        )}
                      </>
                    )}

                    {selectedReport.status === 'resolved' && selectedReport.resolved_at && (
                      <div style={{
                        background: '#ecfdf5',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <IonIcon icon={checkmarkCircleOutline} style={{ color: '#10b981', fontSize: '18px' }} />
                          <strong style={{ color: '#065f46', fontSize: '14px' }}>Resolved</strong>
                        </div>
                        <IonText style={{ fontSize: '14px', color: '#065f46', fontWeight: '500', marginLeft: '26px' }}>
                          {new Date(selectedReport.resolved_at).toLocaleString()}
                        </IonText>

                        {selectedReport.resolved_photo_url && (
                          <div style={{ marginTop: '12px', marginLeft: '12px' }}>
                            <strong style={{ color: '#065f46' }}>Proof of Resolution:</strong>
                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <img
                                src={selectedReport.resolved_photo_url}
                                alt="Proof of resolution"
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  borderRadius: '8px',
                                  objectFit: 'cover',
                                  border: '2px solid #10b981',
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  setSelectedImages([selectedReport.resolved_photo_url!]);
                                  setSelectedImageIndex(0);
                                  setShowImageModal(true);
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div style={{
                          marginTop: '12px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '8px',
                          padding: '12px'
                        }}>
                          <strong style={{ color: '#1d4ed8' }}>Admin Response</strong>
                          <p style={{ margin: '6px 0 0 0', color: '#1e3a8a', whiteSpace: 'pre-wrap' }}>
                            {selectedReport.admin_response?.trim() || 'No admin response recorded yet.'}
                          </p>
                        </div>

                        <div style={{
                          marginTop: '12px',
                          background: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          borderRadius: '8px',
                          padding: '12px'
                        }}>
                          <strong style={{ color: '#5b21b6' }}>User Feedback</strong>
                          {selectedReportFeedback ? (
                            <>
                              <div style={{ marginTop: '6px', color: '#5b21b6' }}>
                                Overall Rating: {selectedReportFeedback.overall_rating}/5
                              </div>
                              {selectedReportFeedback.comments && (
                                <div style={{ marginTop: '4px', color: '#5b21b6' }}>
                                  {selectedReportFeedback.comments}
                                </div>
                              )}
                            </>
                          ) : (
                            <p style={{ marginTop: '6px', color: '#6b21b6' }}>
                              No user feedback submitted yet.
                            </p>
                          )}
                        </div>
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
                        <IonCol size="12">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Description:</strong>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.description}</p>
                          </div>
                          {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <strong>Attached Images:</strong>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                          {selectedReport.image_urls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Report image ${index + 1}`}
                              style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                border: '2px solid transparent',
                                transition: 'border-color 0.2s ease'
                              }}
                              onClick={() => {
                                setSelectedImages(selectedReport.image_urls || []);
                                setSelectedImageIndex(index);
                                setShowImageModal(true);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#3b82f6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'transparent';
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                        </IonCol>
                      </IonRow>
                    </IonGrid>                   

                    {/* Admin Response/User feedback handled in resolved status block */}
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

                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
                      <IonButton
                        expand="block"
                        color="primary"
                        onClick={() => {
                          setShowReportModal(false);
                          setShowStatusChangeModal(false);
                          setStatusChangeType(null);
                          setNotificationMessage('');
                          setEstimatedTime('');
                          // Open a separate notify modal
                          setTimeout(() => {
                            setShowNotifyModal(true);
                          }, 100);
                        }}
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

        {/* Status Change Modal */}
        <IonModal isOpen={showStatusChangeModal} onDidDismiss={() => {
          setShowStatusChangeModal(false);
          setNotificationMessage('');
          setEstimatedTime('');
          setResolvedPhoto(null);
          setPhotoPreview(null);
        }}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => {
                  setShowStatusChangeModal(false);
                  setNotificationMessage('');
                  setEstimatedTime('');
                  setResolvedPhoto(null);
                  setPhotoPreview(null);
                }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Update Status</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={handleStatusChange}
                  strong
                  disabled={!notificationMessage.trim() || !estimatedTime || (statusChangeType === 'active-to-resolved' && !resolvedPhoto)}
                  color="primary"
                >
                  <IonIcon icon={sendOutline} slot="start" />
                  Update
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonCard>
                <IonCardContent>
                  {/* Status Change Info */}
                  <div style={{
                    background: statusChangeType === 'pending-to-active' ? '#eff6ff' : '#ecfdf5',
                    border: `1px solid ${statusChangeType === 'pending-to-active' ? '#93c5fd' : '#6ee7b7'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <strong style={{ color: statusChangeType === 'pending-to-active' ? '#1e40af' : '#065f46', fontSize: '16px' }}>
                        Status Change
                      </strong>
                    </div>
                    <p style={{ margin: 0, color: statusChangeType === 'pending-to-active' ? '#1e40af' : '#065f46', fontSize: '14px' }}>
                      {statusChangeType === 'pending-to-active' ? 'Pending → Active' : 'Active → Resolved'}
                    </p>
                  </div>

                  {/* Message Input */}
                  <IonItem>
                    <IonLabel position="stacked" color="primary">
                      Message to User *
                    </IonLabel>
                    <IonTextarea
                      value={notificationMessage}
                      onIonInput={e => setNotificationMessage(e.detail.value!)}
                      placeholder={statusChangeType === 'pending-to-active'
                        ? 'Enter message about response activation...'
                        : 'Enter message about incident resolution...'}
                      rows={4}
                      autoGrow
                      counter
                      maxlength={500}
                    />
                  </IonItem>

                  {/* Date/Time Input */}
                  <IonItem>
                    <IonLabel position="stacked" color="primary">
                      {statusChangeType === 'pending-to-active'
                        ? 'Estimated Response Time *'
                        : 'Resolved Date & Time *'}
                    </IonLabel>
                    <IonDatetime
                      value={estimatedTime}
                      onIonChange={e => setEstimatedTime(e.detail.value as string)}
                      presentation="date-time"
                      min={new Date().toISOString()}
                    />
                  </IonItem>

                  {/* Proof of Photo - Only for Active to Resolved */}
                  {statusChangeType === 'active-to-resolved' && (
                    <div style={{ marginTop: '16px' }}>
                      <IonItem>
                        <IonLabel position="stacked" color="primary">
                          Proof of Resolution Photo *
                          <IonText style={{ fontSize: '12px', color: '#6b7280' }}>
                            {' '}(Required for resolution)
                          </IonText>
                        </IonLabel>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoUpload}
                          style={{ marginTop: '8px' }}
                        />
                      </IonItem>

                      {photoPreview && (
                        <div style={{ marginTop: '12px', textAlign: 'center' }}>
                          <IonText style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                            Photo Preview:
                          </IonText>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <IonImg
                              src={photoPreview}
                              style={{
                                maxWidth: '200px',
                                maxHeight: '200px',
                                borderRadius: '8px',
                                border: '2px solid #e5e7eb'
                              }}
                            />
                            <IonButton
                              size="small"
                              color="danger"
                              fill="clear"
                              onClick={() => {
                                setResolvedPhoto(null);
                                setPhotoPreview(null);
                              }}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                '--background': 'rgba(0,0,0,0.5)',
                                '--color': 'white',
                                borderRadius: '50%'
                              } as any}
                            >
                              <IonIcon icon={closeOutline} slot="icon-only" />
                            </IonButton>
                          </div>
                        </div>
                      )}

                      {!photoPreview && (
                        <div style={{
                          background: '#fef3cd',
                          border: '1px solid #f59e0b',
                          borderRadius: '8px',
                          padding: '12px',
                          marginTop: '12px',
                          fontSize: '14px',
                          color: '#92400e'
                        }}>
                          <strong>Photo Requirement:</strong> A photo is required to mark this incident as resolved.
                          This serves as proof that the issue has been addressed.
                        </div>
                      )}
                    </div>
                  )}

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
                      <strong>
                        {statusChangeType === 'pending-to-active'
                          ? 'Response scheduled for:'
                          : 'Report will be marked as resolved at:'}
                      </strong><br />
                      {new Date(estimatedTime).toLocaleString()}
                    </div>
                  )}
                </IonCardContent>
              </IonCard>

              {/* Preview */}
              {selectedReport && (
                <IonCard style={{ marginTop: '16px' }}>
                  <IonCardContent>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      <strong>Report:</strong> {selectedReport.title}<br />
                      <strong>Notifying:</strong> {selectedReport.reporter_name} ({selectedReport.reporter_email})
                    </div>
                  </IonCardContent>
                </IonCard>
              )}
            </div>
          </IonContent>
        </IonModal>

        {/* Notify User Modal (Separate from Status Change) */}
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

        {/* Prank Modal */}
        <IonModal isOpen={showPrankModal} onDidDismiss={() => setShowPrankModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowPrankModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Flag as Prank Report</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => {
                    if (selectedReport) {
                      flagReportAsPrank(selectedReport, prankMessage);
                    }
                  }}
                  strong
                  color="danger"
                >
                  Flag & Resolve
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              {selectedReport && (
                <>
                  <IonCard style={{ marginBottom: '16px' }}>
                    <IonCardContent>
                      <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px', fontWeight: 'bold' }}>
                        Report Information
                      </h3>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Title:</strong> {selectedReport.title}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Reporter Name:</strong> {selectedReport.reporter_name}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Reporter Email:</strong> {selectedReport.reporter_email}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Reporter Contact:</strong> {selectedReport.reporter_contact || 'N/A'}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Reporter Address:</strong> {selectedReport.reporter_address || 'N/A'}
                      </div>
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '8px', 
                        background: '#fef3cd', 
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#92400e'
                      }}>
                        <strong>Flagged on:</strong> {new Date().toLocaleString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                    </IonCardContent>
                  </IonCard>
                  <IonCard>
                    <IonCardContent>
                      <IonItem>
                        <IonLabel position="stacked" color="primary">Message to User</IonLabel>
                        <IonTextarea
                          value={prankMessage}
                          onIonInput={(e) => setPrankMessage(e.detail.value!)}
                          rows={5}
                          autoGrow
                        />
                      </IonItem>
                    </IonCardContent>
                  </IonCard>
                </>
              )}
            </div>
          </IonContent>
        </IonModal>

        {/* Image Gallery Modal */}
        <IonModal
          isOpen={showImageModal}
          onDidDismiss={() => setShowImageModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowImageModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Image Gallery</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              {selectedImages.length > 0 && (
                <IonCard>
                  <IonCardContent>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '400px',
                      position: 'relative',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <img
                        src={selectedImages[selectedImageIndex]}
                        alt={`Gallery image ${selectedImageIndex + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                      />

                      {/* Navigation arrows */}
                      {selectedImages.length > 1 && (
                        <>
                          <IonButton
                            fill="clear"
                            onClick={() => setSelectedImageIndex(prev => 
                              prev === 0 ? selectedImages.length - 1 : prev - 1
                            )}
                            style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              '--color': '#374151',
                              '--background': 'rgba(255,255,255,0.9)',
                              '--border-radius': '50%',
                              width: '40px',
                              height: '40px',
                              '--box-shadow': '0 2px 8px rgba(0,0,0,0.1)'
                            } as any}
                          >
                            <IonIcon icon={chevronBackOutline} />
                          </IonButton>

                          <IonButton
                            fill="clear"
                            onClick={() => setSelectedImageIndex(prev => 
                              prev === selectedImages.length - 1 ? 0 : prev + 1
                            )}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              '--color': '#374151',
                              '--background': 'rgba(255,255,255,0.9)',
                              '--border-radius': '50%',
                              width: '40px',
                              height: '40px',
                              '--box-shadow': '0 2px 8px rgba(0,0,0,0.1)'
                            } as any}
                          >
                            <IonIcon icon={chevronForwardOutline} />
                          </IonButton>
                        </>
                      )}

                      {/* Image counter */}
                      {selectedImages.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {selectedImageIndex + 1} / {selectedImages.length}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {selectedImages.length > 1 && (
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '8px',
                        justifyContent: 'center'
                      }}>
                        {selectedImages.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Thumbnail ${index + 1}`}
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: selectedImageIndex === index ? '2px solid #3b82f6' : '2px solid transparent',
                              opacity: selectedImageIndex === index ? 1 : 0.7,
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => setSelectedImageIndex(index)}
                          />
                        ))}
                      </div>
                    )}
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
    case 'pending': return 'var(--warning-color)';
    case 'active': return 'var(--primary-color)';
    case 'resolved': return 'var(--success-color)';
    case 'prank': return '#6b7280';
    default: return 'var(--text-secondary)';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low': return 'var(--success-color)';
    case 'medium': return 'var(--warning-color)';
    case 'high': return 'var(--warning-dark)';
    case 'critical': return 'var(--danger-color)';
    case 'prank': return '#6b7280';
    default: return 'var(--text-secondary)';
  }
};

export default AdminIncidents;