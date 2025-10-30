// src/pages/user-tabs/GiveFeedback.tsx - UPDATED
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonRadioGroup,
  IonRadio,
  IonCheckbox,
  IonList,
  IonAlert,
  IonToast,
  IonModal,
  IonSkeletonText,
  IonChip,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonTabBar,
  IonTabButton,
  IonPopover,
  IonAvatar,
  IonBadge
} from '@ionic/react';
import {
  chatbubbleOutline,
  starOutline,
  star,
  sendOutline,
  checkmarkCircleOutline,
  thumbsUpOutline,
  thumbsDownOutline,
  refreshOutline,
  closeOutline,
  notificationsOutline,
  addCircleOutline,
  mapOutline,
  timeOutline,
  homeOutline,
  warningOutline,
  personCircle,
  documentTextOutline,
  logOutOutline,
  personOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import { logUserFeedbackSubmission, logUserLogout } from '../../utils/activityLogger';
import { useHistory, useLocation } from 'react-router-dom';

interface FeedbackData {
  report_id: string;
  overall_rating: number;
  response_time_rating: number;
  communication_rating: number;
  resolution_satisfaction: number;
  categories: string[];
  comments: string;
  would_recommend: boolean | null;

}

interface UserReport {
  id: string;
  title: string;
  status: string;
  created_at: string;
  category: string;
  description: string;
  has_feedback?: boolean;
  existing_feedback?: {
    overall_rating: number;
    comments: string;
    created_at: string;
  } | null;
}

const GiveFeedback: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const [latestNotificationType, setLatestNotificationType] = useState<'pending' | 'resolved' | null>(null);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    report_id: '',
    overall_rating: 0,
    response_time_rating: 0,
    communication_rating: 0,
    resolution_satisfaction: 0,
    categories: [],
    comments: '',
    would_recommend: null,
  
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Replaced alerts with toasts
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [showExistingFeedback, setShowExistingFeedback] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'feedbacked' | 'not'>('all');

  const feedbackCategories = [
    'Response Speed',
    'Staff Courtesy',
    'Problem Resolution',
    'Communication Quality',
    'Follow-up Service',
    'Overall Experience'
  ];

  useEffect(() => {
    const initializeData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('user_email', user.email)
            .single();
          if (profile) setUserProfile(profile);
          if (user.email) {
            await fetchNotifications(user.email);
          }
        }
        await fetchUserReports();
      } catch (error) {
        console.error('Error initializing data:', error);
        setIsLoading(false);
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const email = user.email;
        const notifChannel = supabase
          .channel('give_feedback_badge_notifications')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_email=eq.${email}` }, async () => {
            await fetchNotifications(email);
          })
          .subscribe();
        const reportsChannel = supabase
          .channel('give_feedback_badge_reports')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_reports', filter: `reporter_email=eq.${email}` }, async () => {
            await fetchNotifications(email);
          })
          .subscribe();
        // Cleanup on unmount
        return () => {
          notifChannel.unsubscribe();
          reportsChannel.unsubscribe();
        };
      }
    })();
  }, []);

  const openProfilePopover = (e: any) => {
    setPopoverEvent(e);
    setShowProfilePopover(true);
  };
  const handlePopoverNavigation = (route: string) => {
    setShowProfilePopover(false);
    setTimeout(() => history.push(route), 100);
  };
  const handleSignOut = async () => {
    await logUserLogout(user?.email);
    await supabase.auth.signOut();
    setShowProfilePopover(false);
    history.push('/it35-lab2');
  };

  const fetchNotifications = async (email: string) => {
    try {
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', email)
        .eq('read', false);

      const { data: incidentUpdates } = await supabase
        .from('incident_reports')
        .select('id, title, admin_response, updated_at, read, status')
        .eq('reporter_email', email)
        .not('admin_response', 'is', null)
        .eq('read', false)
        .order('updated_at', { ascending: false });

      const unreadCount = (notificationsData?.length || 0) + (incidentUpdates?.length || 0);
      setUnreadNotifications(unreadCount);

      if (unreadCount > prevUnreadCount) {
        let notificationType: 'pending' | 'resolved' | null = null;
        if (incidentUpdates && incidentUpdates.length > 0) {
          const latestUpdate = incidentUpdates[0];
          if (latestUpdate.status === 'resolved') notificationType = 'resolved';
          else if (latestUpdate.status === 'active') notificationType = 'pending';
        }
        if (!notificationType && notificationsData && notificationsData.length > 0) {
          notificationType = 'pending';
        }
        setLatestNotificationType(notificationType);
      }
      setPrevUnreadCount(unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchUserReports = async () => {
    setIsReportsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('incident_reports')
        .select('id, title, status, created_at, category, description')
        .eq('reporter_email', user.email)
        .eq('status', 'resolved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check for existing feedback for each report
      const reportsWithFeedback = await Promise.all(
        (data || []).map(async (report) => {
          try {
            const { data: feedbackData } = await supabase
              .from('feedback')
              .select('overall_rating, comments, created_at')
              .eq('report_id', report.id)
              .eq('user_email', user.email)
              .maybeSingle();

            return {
              ...report,
              has_feedback: !!feedbackData,
              existing_feedback: feedbackData ? {
                overall_rating: feedbackData.overall_rating as number,
                comments: feedbackData.comments as string,
                created_at: feedbackData.created_at as string
              } : null
            };
          } catch (feedbackError) {
            // If no feedback found, that's fine
            return {
              ...report,
              has_feedback: false,
              existing_feedback: null
            };
          }
        })
      );

      setUserReports(reportsWithFeedback);
    } catch (error) {
      console.error('Error fetching user reports:', error);
      setToastMessage('Failed to load your reports');
      setShowToast(true);
    } finally {
      setIsReportsLoading(false);
      setIsLoading(false);
    }
  };

  const handleRatingChange = (field: keyof FeedbackData, value: number) => {
    setFeedbackData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    setFeedbackData(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category)
    }));
  };

  const handleSubmit = async () => {
    if (!selectedReport) {
      setToastMessage('Please select a report to provide feedback for.');
      setShowToast(true);
      return;
    }

    // Check if report already has feedback
    const selectedReportData = userReports.find(r => r.id === selectedReport);
    if (selectedReportData?.has_feedback) {
      setToastMessage('This report already has feedback submitted. You cannot submit feedback twice for the same report.');
      setShowToast(true);
      return;
    }

    if (feedbackData.overall_rating === 0) {
      setToastMessage('Please provide an overall rating.');
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);
    setIsFeedbackLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert into feedback table with timestamp
      const { error: feedbackError } = await supabase
        .from('feedback')
        .insert({
          report_id: selectedReport,
          user_email: user.email,
          overall_rating: feedbackData.overall_rating,
          response_time_rating: feedbackData.response_time_rating,
          communication_rating: feedbackData.communication_rating,
          resolution_satisfaction: feedbackData.resolution_satisfaction,
          categories: feedbackData.categories,
          comments: feedbackData.comments,
          would_recommend: feedbackData.would_recommend,
          created_at: new Date().toISOString()
        });

      if (feedbackError) throw feedbackError;

      // Log user feedback submission activity
      await logUserFeedbackSubmission(selectedReport, feedbackData.overall_rating, user.email);

      setShowSuccessModal(true);
      resetForm();
      fetchUserReports(); // Refresh the list
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      setToastMessage('Failed to submit feedback. Please try again.');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
      setIsFeedbackLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedReport('');
    setFeedbackData({
      report_id: '',
      overall_rating: 0,
      response_time_rating: 0,
      communication_rating: 0,
      resolution_satisfaction: 0,
      categories: [],
      comments: '',
      would_recommend: null,
    });
  };

  const StarRating: React.FC<{
    rating: number;
    onRatingChange: (rating: number) => void;
    label: string;
  }> = ({ rating, onRatingChange, label }) => (
    <div style={{ marginBottom: '20px' }}>
      <p style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '12px'
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((starNumber) => (
          <button
            key={starNumber}
            type="button"
            onClick={() => onRatingChange(starNumber)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              fontSize: '32px',
              color: starNumber <= rating ? '#fbbf24' : '#d1d5db',
              transition: 'color 0.2s',
              lineHeight: 1
            }}
          >
            {starNumber <= rating ? '★' : '☆'}
          </button>
        ))}
        <span style={{
          fontSize: '16px',
          color: '#6b7280',
          marginLeft: '12px',
          fontWeight: '500'
        }}>
          {rating > 0 ? `${rating}/5` : 'No rating'}
        </span>
      </div>
    </div>
  );

  // Skeleton Components
  const ReportSkeletonItem: React.FC = () => (
    <IonItem style={{ '--background': 'transparent' } as any}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '12px 0',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <IonSkeletonText animated style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            marginRight: '12px',
            flexShrink: 0
          }} />

          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <IonSkeletonText animated style={{ width: '70%', height: '16px', marginBottom: '8px' }} />
            <IonSkeletonText animated style={{ width: '50%', height: '12px', marginBottom: '8px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonSkeletonText animated style={{ width: '60px', height: '20px', borderRadius: '10px' }} />
              <IonSkeletonText animated style={{ width: '80px', height: '20px', borderRadius: '10px' }} />
              <IonSkeletonText animated style={{ width: '30px', height: '12px' }} />
            </div>
          </div>
        </div>
        <IonSkeletonText animated style={{ width: '20px', height: '20px', borderRadius: '50%', marginLeft: '16px' }} />
      </div>
    </IonItem>
  );

  const RatingSkeleton: React.FC = () => (
    <div style={{ marginBottom: '20px' }}>
      <IonSkeletonText animated style={{ width: '120px', height: '14px', marginBottom: '12px' }} />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IonSkeletonText
            key={star}
            animated
            style={{ width: '32px', height: '32px', borderRadius: '4px' }}
          />
        ))}
        <IonSkeletonText animated style={{ width: '60px', height: '16px', marginLeft: '12px' }} />
      </div>
    </div>
  );

  const CategorySkeleton: React.FC = () => (
    <div style={{ marginBottom: '20px' }}>
      <IonSkeletonText animated style={{ width: '200px', height: '14px', marginBottom: '8px' }} />
      <IonGrid style={{ padding: 0 }}>
        <IonRow>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <IonCol size="6" key={item}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                <IonSkeletonText animated style={{ width: '18px', height: '18px', borderRadius: '4px', marginRight: '8px' }} />
                <IonSkeletonText animated style={{ width: '80%', height: '14px' }} />
              </div>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>
    </div>
  );

  const RecommendationSkeleton: React.FC = () => (
    <div style={{ marginBottom: '20px' }}>
      <IonSkeletonText animated style={{ width: '200px', height: '14px', marginBottom: '8px' }} />
      <div style={{ display: 'flex', gap: '16px' }}>
        {[1, 2].map((item) => (
          <div key={item} style={{ display: 'flex', alignItems: 'center' }}>
            <IonSkeletonText animated style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '8px' }} />
            <IonSkeletonText animated style={{ width: '40px', height: '14px' }} />
          </div>
        ))}
      </div>
    </div>
  );

  const CommentsSkeleton: React.FC = () => (
    <div style={{ marginBottom: '20px' }}>
      <IonSkeletonText animated style={{ width: '150px', height: '14px', marginBottom: '8px' }} />
      <IonSkeletonText animated style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
    </div>
  );

  // Filter reports based on selection
  const baseReports = selectedReport
    ? userReports.filter(report => report.id === selectedReport)
    : userReports;

  const displayReports = baseReports.filter(r => {
    if (feedbackFilter === 'all') return true;
    if (feedbackFilter === 'feedbacked') return !!r.has_feedback;
    if (feedbackFilter === 'not') return !r.has_feedback;
    return true;
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '--color': 'white' } as any}>
          <IonButtons slot="start">{/* Back button removed */}</IonButtons>
          <IonTitle style={{ fontWeight: 'bold', fontSize: '20px' }}>iAMUMA ta</IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              onClick={() => handlePopoverNavigation('/it35-lab2/app/notifications')}
              style={{ color: 'white', position: 'relative' }}
            >
              <IonIcon icon={notificationsOutline} slot="icon-only" />
              {unreadNotifications > 0 && (
                <IonBadge color="danger" style={{ position: 'absolute', top: '0', right: '0', fontSize: '10px', transform: 'translate(25%, -25%)' }}>
                  {unreadNotifications}
                </IonBadge>
              )}
            </IonButton>
            {user ? (
              <IonButton fill="clear" onClick={openProfilePopover} style={{ color: 'white' }}>
                {userProfile?.user_avatar_url ? (
                  <IonAvatar slot="icon-only" style={{ width: '32px', height: '32px' }}>
                    <img src={userProfile.user_avatar_url} alt="Profile" />
                  </IonAvatar>
                ) : (
                  <IonIcon icon={personCircle} slot="icon-only" size="large" />
                )}
              </IonButton>
            ) : (
              <IonButton onClick={() => history.push('/it35-lab2/user-login')} fill="clear" style={{ color: 'white' }}>
                Login
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonPopover isOpen={showProfilePopover} event={popoverEvent} onDidDismiss={() => setShowProfilePopover(false)}>
        <IonContent>
          <div style={{ padding: '0', minWidth: '280px' }}>
            {user && (
              <>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px 20px', textAlign: 'center', color: 'white' }}>
                  {userProfile?.user_avatar_url ? (
                    <IonAvatar style={{ width: '60px', height: '60px', margin: '0 auto 12px', border: '3px solid rgba(255,255,255,0.3)' }}>
                      <img src={userProfile.user_avatar_url} alt="Profile" />
                    </IonAvatar>
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IonIcon icon={personCircle} style={{ fontSize: '40px' }} />
                    </div>
                  )}
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
                    {userProfile?.user_firstname && userProfile?.user_lastname ? `${userProfile.user_firstname} ${userProfile.user_lastname}` : 'Community Member'}
                  </h3>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9, textAlign: 'center' }}>{user.email}</p>
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '6px 12px', display: 'inline-block' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>{userReports.length} Reports Submitted</span>
                  </div>
                </div>
                <div style={{ padding: '12px 0' }}>
                  <IonItem button onClick={() => handlePopoverNavigation('/it35-lab2/app/profile')} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                    <IonIcon icon={personCircle} slot="start" color="primary" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>View Profile</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Manage account settings</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem button onClick={() => handlePopoverNavigation('/it35-lab2/app/feedback')} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                    <IonIcon icon={chatbubbleOutline} slot="start" color="success" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Give Feedback</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Rate our response service</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem button onClick={() => handlePopoverNavigation('/it35-lab2/app/activity-logs')} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                    <IonIcon icon={documentTextOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Activity Logs</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>View your account activities</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem button onClick={handleSignOut} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                    <IonIcon icon={logOutOutline} slot="start" color="danger" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Sign Out</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Logout from account</p>
                    </IonLabel>
                  </IonItem>
                </div>
              </>
            )}
          </div>
        </IonContent>
      </IonPopover>
      <IonContent style={{ '--background': '#f8fafc' } as any}>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <IonIcon icon={chatbubbleOutline} style={{ fontSize: '28px', color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Give Feedback
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Share your experience with our response services
          </p>
        </div>

        {/* Main Content Card */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader style={{ position: 'relative' }}>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Select Report to Review
            </IonCardTitle>
            {/* Feedback filter */}
            <div style={{ position: 'absolute', right: '16px', top: '12px', display: 'flex', gap: '6px' }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'feedbacked', label: 'Feedbacked' },
                { key: 'not', label: 'Not Yet' }
              ].map((f: any) => (
                <button
                  key={f.key}
                  onClick={() => setFeedbackFilter(f.key)}
                  style={{
                    background: feedbackFilter === f.key ? '#6366f1' : 'transparent',
                    color: feedbackFilter === f.key ? 'white' : '#6366f1',
                    border: '1px solid #6366f1',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {selectedReport && (
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setSelectedReport('')}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '16px',
                  '--padding-start': '8px',
                  '--padding-end': '8px'
                } as any}
              >
                <IonIcon icon={closeOutline} slot="icon-only" />
              </IonButton>
            )}
          </IonCardHeader>
          <IonCardContent>
            {isReportsLoading ? (
              <div>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <IonProgressBar type="indeterminate" />
                </div>
                <IonList style={{ background: 'transparent' }}>
                  {[1, 2, 3].map((item) => (
                    <ReportSkeletonItem key={item} />
                  ))}
                </IonList>
              </div>
            ) : userReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
                <p style={{ color: '#9ca3af', marginTop: '16px' }}>
                  No resolved reports available for feedback
                </p>
                <IonButton
                  fill="outline"
                  size="small"
                  routerLink="/it35-lab2/app/history"
                >
                  View Report History
                </IonButton>
              </div>
            ) : (
              <div>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '16px'
                }}>
                  {selectedReport
                    ? 'Selected report for feedback:'
                    : 'Select a resolved report to provide feedback:'}
                </p>
                <IonList style={{ background: 'transparent' }}>
                  {displayReports.map((report) => (
                    <IonItem
                      key={report.id}
                      button
                      onClick={() => !report.has_feedback && setSelectedReport(report.id)}
                      disabled={report.has_feedback}
                      style={{
                        '--background': selectedReport === report.id ? '#f3f4f6' : report.has_feedback ? '#f9fafb' : 'transparent',
                        '--border-color': '#f1f5f9',
                        '--border-radius': '12px',
                        marginBottom: '8px',
                        opacity: report.has_feedback ? 0.6 : 1
                      } as any}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '12px 0',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#10b981',
                            marginRight: '12px',
                            flexShrink: 0
                          }}></div>

                          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
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
                              margin: '0 0 4px 0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {report.category}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <IonChip
                                style={{
                                  '--background': '#10b98120',
                                  '--color': '#10b981',
                                  height: '20px',
                                  fontSize: '10px',
                                  fontWeight: '600'
                                } as any}
                              >
                                RESOLVED
                              </IonChip>
                              {report.has_feedback && (
                                <IonChip
                                  style={{
                                    '--background': '#8b5cf620',
                                    '--color': '#8b5cf6',
                                    height: '20px',
                                    fontSize: '10px',
                                    fontWeight: '600'
                                  } as any}
                                >
                                  FEEDBACK GIVEN
                                </IonChip>
                              )}
                              <span style={{
                                fontSize: '10px',
                                color: '#9ca3af'
                              }}>
                                {new Date(report.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <IonRadio
                          value={report.id}
                          aria-checked={selectedReport === report.id}
                          disabled={report.has_feedback}
                          style={{
                            marginLeft: 'auto',
                            flexShrink: 0,
                            '--inner-border-radius': '50%',
                            '--border-radius': '50%',
                            '--border-width': '2px',
                            '--border-color': report.has_feedback ? '#d1d5db' : '#d1d5db',
                            '--color': report.has_feedback ? '#9ca3af' : '#10b981',
                            '--color-checked': report.has_feedback ? '#9ca3af' : '#10b981'
                          } as any}
                        />
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Feedback Form - Only show if report is selected */}
        {selectedReport && (
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardHeader>
              <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                Your Feedback
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {isFeedbackLoading ? (
                <div>
                  {/* Overall Rating Skeleton */}
                  <RatingSkeleton />

                  {/* Additional Ratings Skeleton */}
                  <RatingSkeleton />
                  <RatingSkeleton />
                  <RatingSkeleton />

                  {/* Categories Skeleton */}
                  <CategorySkeleton />

                  {/* Recommendation Skeleton */}
                  <RecommendationSkeleton />

                  {/* Comments Skeleton */}
                  <CommentsSkeleton />

                  {/* Submit Button Skeleton */}
                  <IonSkeletonText animated style={{ width: '100%', height: '44px', borderRadius: '12px' }} />
                </div>
              ) : (
                <div>
                  {/* Overall Rating */}
                  <StarRating
                    rating={feedbackData.overall_rating}
                    onRatingChange={(rating) => handleRatingChange('overall_rating', rating)}
                    label="Overall Rating*"
                  />

                  {/* Additional Ratings */}
                  <StarRating
                    rating={feedbackData.response_time_rating}
                    onRatingChange={(rating) => handleRatingChange('response_time_rating', rating)}
                    label="Response Time"
                  />
                  <StarRating
                    rating={feedbackData.communication_rating}
                    onRatingChange={(rating) => handleRatingChange('communication_rating', rating)}
                    label="Communication Quality"
                  />
                  <StarRating
                    rating={feedbackData.resolution_satisfaction}
                    onRatingChange={(rating) => handleRatingChange('resolution_satisfaction', rating)}
                    label="Resolution Satisfaction"
                  />

                  {/* Feedback Categories */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      What aspects would you like to comment on?
                    </p>
                    <IonGrid style={{ padding: 0 }}>
                      <IonRow>
                        {feedbackCategories.map((category) => (
                          <IonCol size="6" key={category}>
                            <IonItem style={{
                              '--background': 'transparent',
                              '--padding-start': '0',
                              '--inner-padding-end': '0'
                            } as any}>
                              <IonCheckbox
                                checked={feedbackData.categories.includes(category)}
                                onIonChange={(e) => handleCategoryToggle(category, e.detail.checked)}
                                style={{
                                  '--size': '18px',
                                  '--checkbox-background-checked': '#10b981',
                                  '--border-color-checked': '#10b981'
                                } as any}
                              />
                              <IonLabel style={{
                                fontSize: '12px',
                                marginLeft: '8px'
                              }}>
                                {category}
                              </IonLabel>
                            </IonItem>
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                  </div>

                  {/* Would Recommend */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Would you recommend our service?
                    </p>
                    <IonRadioGroup
                      value={feedbackData.would_recommend}
                      onIonChange={(e) => setFeedbackData(prev => ({ ...prev, would_recommend: e.detail.value }))}
                    >
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <IonItem style={{
                          '--background': 'transparent',
                          '--padding-start': '0',
                          '--inner-padding-end': '0'
                        } as any}>
                          <IonRadio
                            value={true}
                            style={{
                              marginRight: '8px',
                              '--inner-border-radius': '50%',
                              '--border-radius': '50%',
                              '--border-width': '2px',
                              '--border-color': '#d1d5db',
                              '--color': '#10b981',
                              '--color-checked': '#10b981'
                            } as any}
                          />
                          <IonLabel style={{ fontSize: '14px' }}>Yes</IonLabel>
                        </IonItem>
                        <IonItem style={{
                          '--background': 'transparent',
                          '--padding-start': '0',
                          '--inner-padding-end': '0'
                        } as any}>
                          <IonRadio
                            value={false}
                            style={{
                              marginRight: '8px',
                              '--inner-border-radius': '50%',
                              '--border-radius': '50%',
                              '--border-width': '2px',
                              '--border-color': '#d1d5db',
                              '--color': '#10b981',
                              '--color-checked': '#10b981'
                            } as any}
                          />
                          <IonLabel style={{ fontSize: '14px' }}>No</IonLabel>
                        </IonItem>
                      </div>
                    </IonRadioGroup>
                  </div>

                  {/* Additional Comments */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Additional Comments
                    </p>
                    <IonTextarea
                      placeholder="Share your experience or suggestions for improvement..."
                      value={feedbackData.comments}
                      onIonInput={(e) => setFeedbackData(prev => ({ ...prev, comments: e.detail.value || '' }))}
                      rows={4}
                      style={{
                        '--background': '#f9fafb',
                        '--border-radius': '8px',
                        '--padding-start': '12px',
                        '--padding-end': '12px',
                        '--padding-top': '12px',
                        '--padding-bottom': '12px',
                        fontSize: '14px'
                      } as any}
                    />
                  </div>

                  {/* Submit Button */}
                  <IonButton
                    expand="block"
                    onClick={handleSubmit}
                    disabled={isSubmitting || feedbackData.overall_rating === 0}
                    style={{
                      '--border-radius': '12px',
                      '--background': feedbackData.overall_rating === 0 ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      height: '44px',
                      fontWeight: '600'
                    } as any}
                  >
                    {isSubmitting ? (
                      <>
                        <IonIcon icon={refreshOutline} slot="start" style={{ animation: 'spin 1s linear infinite' }} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={sendOutline} slot="start" />
                        Submit Feedback
                      </>
                    )}
                  </IonButton>

                  {/* Existing Feedback Section */}
                  {selectedReport && (() => {
                    const selectedReportData = userReports.find(r => r.id === selectedReport);
                    if (selectedReportData?.has_feedback && selectedReportData.existing_feedback) {
                      return (
                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#1f2937',
                              margin: 0
                            }}>
                              Your Feedback
                            </h3>
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={() => setShowExistingFeedback(!showExistingFeedback)}
                              style={{
                                '--padding-start': '8px',
                                '--padding-end': '8px',
                                fontSize: '12px',
                                color: '#6b7280'
                              } as any}
                            >
                              {showExistingFeedback ? 'Hide' : 'Show'}
                            </IonButton>
                          </div>
                          
                          {showExistingFeedback && (
                            <div style={{
                              background: '#f8fafc',
                              borderRadius: '12px',
                              padding: '16px',
                              border: '1px solid #e5e7eb'
                            }}>
                              {/* Overall Rating Display */}
                              <div style={{ marginBottom: '16px' }}>
                                <p style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#374151',
                                  marginBottom: '8px'
                                }}>
                                  Overall Rating
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {[1, 2, 3, 4, 5].map((starNumber) => (
                                    <span
                                      key={starNumber}
                                      style={{
                                        fontSize: '24px',
                                        color: starNumber <= selectedReportData.existing_feedback!.overall_rating ? '#fbbf24' : '#d1d5db'
                                      }}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    marginLeft: '8px',
                                    fontWeight: '500'
                                  }}>
                                    {selectedReportData.existing_feedback!.overall_rating}/5
                                  </span>
                                </div>
                              </div>

                              {/* Comments Display */}
                              {selectedReportData.existing_feedback!.comments && (
                                <div style={{ marginBottom: '12px' }}>
                                  <p style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: '8px'
                                  }}>
                                    Additional Comments
                                  </p>
                                  <p style={{
                                    fontSize: '14px',
                                    color: '#4b5563',
                                    lineHeight: '1.5',
                                    background: 'white',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                  }}>
                                    {selectedReportData.existing_feedback!.comments}
                                  </p>
                                </div>
                              )}

                              {/* Submission Date */}
                              <p style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                margin: 0,
                                textAlign: 'right'
                              }}>
                                Submitted on {new Date(selectedReportData.existing_feedback!.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}
      </div>

      {/* Success Modal */}
      <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)} style={{ '--border-radius': '0px' }}>
        <div style={{ padding: '40px 20px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: 0 }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '36px', color: 'white' }} />
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 16px 0'
          }}>
            Thank You!
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0 0 32px 0',
            lineHeight: '1.5'
          }}>
            Your feedback has been submitted successfully. We appreciate your input and will use it to improve our services.
          </p>
          <IonButton
            expand="block"
            onClick={() => setShowSuccessModal(false)}
            style={{
              '--border-radius': '12px',
              '--background': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              maxWidth: '200px',
              margin: '0 auto'
            } as any}
          >
            Close
          </IonButton>
        </div>
      </IonModal>

      {/* Alerts removed; using toasts only */}

      {/* Toast */}
      <IonToast
        isOpen={false}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />
      </IonContent>
      <IonTabBar
        slot="bottom"
        style={{ '--background': 'white', '--border': '1px solid #e2e8f0', height: '70px', paddingTop: '8px', paddingBottom: '8px' } as any}
      >
        {[
          { name: 'Dashboard', tab: 'dashboard', url: '/it35-lab2/app/dashboard', icon: homeOutline },
          { name: 'Report an Incident', tab: 'submit', url: '/it35-lab2/app/submit', icon: addCircleOutline },
          { name: 'My Reports', tab: 'map', url: '/it35-lab2/app/map', icon: mapOutline },
          { name: 'History', tab: 'reports', url: '/it35-lab2/app/history', icon: timeOutline },
        ].map((item, index) => {
          const isActive = location.pathname.startsWith(item.url);
          return (
            <IonTabButton
              key={index}
              tab={item.tab}
              onClick={() => history.push(item.url)}
              style={{
                '--color': isActive ? '#667eea' : '#94a3b8',
                '--color-selected': '#667eea',
                borderTop: isActive ? '2px solid #667eea' : '2px solid transparent'
              } as any}
            >
              <IonIcon icon={item.icon} style={{ marginBottom: '4px', fontSize: '22px' }} />
              <IonLabel style={{ fontSize: '11px', fontWeight: '600' }}>{item.name}</IonLabel>
            </IonTabButton>
          );
        })}
      </IonTabBar>
    </IonPage>
  );
};

export default GiveFeedback;