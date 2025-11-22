// src/pages/user-tabs/Dashboard.tsx - UPDATED: Fixed skeleton loading and removed View All
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
  IonPage,
  IonToast,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonTabBar,
  IonTabButton,
  IonPopover,
  IonAvatar,
  IonBadge,
  useIonViewWillEnter,
  IonModal,
  IonTextarea,
  IonRadioGroup,
  IonRadio,
  IonCheckbox,
} from '@ionic/react';
import {
  homeOutline,
  addCircleOutline,
  locationOutline,
  eyeOutline,
  mapOutline,
  notificationsOutline,
  timeOutline,
  callOutline,
  personCircle,
  documentTextOutline,
  logOutOutline,
  chatbubbleOutline,
  
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { logUserLogout } from '../../utils/activityLogger';

interface DashboardStats {
  pendingReports: number;
  activeReports: number;
  resolvedReports: number;
  myReports: number;
}

const WARNING_LOCK_DURATION_MS = 60 * 60 * 1000;
const SUSPENSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const formatRemainingTime = (target: Date) => {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return '';
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minuteMs = 60 * 1000;
  const days = Math.floor(diff / dayMs);
  const hours = Math.floor((diff % dayMs) / hourMs);
  const minutes = Math.floor((diff % hourMs) / minuteMs);
  const seconds = Math.floor((diff % minuteMs) / 1000);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours.toString().padStart(2, '0')}h`);
  parts.push(`${minutes.toString().padStart(2, '0')}m`);
  parts.push(`${seconds.toString().padStart(2, '0')}s`);
  return parts.join(' ');
};

// Skeleton Components
const SkeletonStatsCard: React.FC = () => (
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
        <IonSkeletonText animated style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          marginRight: '16px'
        }} />
        <div style={{ flex: 1 }}>
          <IonSkeletonText animated style={{ width: '60%', height: '24px', marginBottom: '8px' }} />
          <IonSkeletonText animated style={{ width: '40%', height: '12px' }} />
        </div>
      </IonCardContent>
    </IonCard>
  </IonCol>
);

const SkeletonMiniStatsCard: React.FC = () => (
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
        <IonSkeletonText animated style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          marginBottom: '8px'
        }} />
        <IonSkeletonText animated style={{ width: '20px', height: '16px', marginBottom: '4px' }} />
        <IonSkeletonText animated style={{ width: '30px', height: '10px' }} />
      </IonCardContent>
    </IonCard>
  </IonCol>
);

const SkeletonRecentReportItem: React.FC = () => (
  <IonItem style={{ '--background': 'transparent' } as any}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      padding: '12px 0'
    }}>
      <IonSkeletonText animated style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        marginRight: '12px'
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <IonSkeletonText animated style={{ width: '70%', height: '16px', marginBottom: '8px' }} />
        <IonSkeletonText animated style={{ width: '50%', height: '12px', marginBottom: '8px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IonSkeletonText animated style={{ width: '40px', height: '20px', borderRadius: '10px' }} />
          <IonSkeletonText animated style={{ width: '30px', height: '12px' }} />
        </div>
      </div>
    </div>
  </IonItem>
);

const Dashboard: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    pendingReports: 0,
    activeReports: 0,
    resolvedReports: 0,
    myReports: 0
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [prankReports, setPrankReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [appealMessage, setAppealMessage] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [suspensionLiftDate, setSuspensionLiftDate] = useState<string | null>(null);
  const [warningLockEndsAt, setWarningLockEndsAt] = useState<string | null>(null);
  const [warningCountdown, setWarningCountdown] = useState<string>('');
  const [suspensionCountdown, setSuspensionCountdown] = useState<string>('');
  const [appealType, setAppealType] = useState<'banned' | 'suspended' | 'warned'>('suspended');

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_email', user.email)
          .single();

        if (!error && profile) {
          const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
          let updatedProfile = { ...profile };

          if (profile.status === 'suspended' && profile.suspension_date) {
            const suspensionStart = new Date(profile.suspension_date);
            const liftDate = new Date(suspensionStart.getTime() + oneWeekMs);
            if (Date.now() >= liftDate.getTime()) {
              await supabase
                .from('users')
                .update({ status: 'active', suspension_date: null })
                .eq('user_email', profile.user_email);
              updatedProfile = { ...profile, status: 'active', suspension_date: null };
              setSuspensionLiftDate(null);
            } else {
              setSuspensionLiftDate(liftDate.toISOString());
            }
          } else {
            setSuspensionLiftDate(null);
          }

          setUserProfile(updatedProfile);

          // Auto-logout if banned
          if (updatedProfile.status === 'banned') {
            setToastMessage('Your account was banned. You have been signed out.');
            setShowToast(true);
            await supabase.auth.signOut();
            history.push('/iAMUMAta');
            return;
          }
        }

        if (user.email) {
          fetchUserReports(user.email);
          fetchNotifications(user.email);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleSignOut = async () => {
    await logUserLogout(user?.email);
    await supabase.auth.signOut();
    setShowProfilePopover(false);
    history.push('/iAMUMAta');
  };

  const openProfilePopover = (e: any) => {
    setPopoverEvent(e);
    setShowProfilePopover(true);
  };

  const handlePopoverNavigation = (route: string) => {
    setShowProfilePopover(false);
    setTimeout(() => {
      history.push(route);
    }, 100);
  };

  const submitAppeal = async () => {
    if (!selectedReportId || !userProfile) {
      setToastMessage('Please select a report to appeal');
      setShowToast(true);
      return;
    }

    setIsSubmittingAppeal(true);
    try {
      const selectedReport = prankReports.find(r => r.id === selectedReportId);
      const username = userProfile.username || userProfile.user_email?.split('@')[0] || 'User';
      const email = userProfile.user_email || user?.email || '';
      
      const appealText = appealMessage.trim() || `Good day Admin,

I am writing to formally appeal the suspension of my account (Username: ${username} / Email: ${email} and Report Title: ${selectedReport?.title || 'N/A'} and other information).

I have reviewed the Terms and Conditions and would like to request a review of this decision. Please let me know what steps I need to take or what information you require from me.

Thank you for your consideration.`;

    const appealPayload = {
        report_id: selectedReportId,
        user_email: email,
        username: username,
        message: appealText,
        created_at: new Date().toISOString(),
        status: 'pending',
      admin_read: false,
      appeal_type: appealType
      };

      // Save appeal to users.user_appeal column
      const { error: userError } = await supabase
        .from('users')
        .update({ user_appeal: appealPayload })
        .eq('user_email', email);

      if (userError) throw userError;

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      await supabase.from('system_logs').insert({
        admin_email: currentUser?.email || email,
        activity_type: 'user_action',
        activity_description: 'User submitted appeal',
        target_user_email: email,
        target_report_id: selectedReportId,
        details: { message: appealText }
      });

      setToastMessage('Appeal submitted successfully. Admin will review your request.');
      setShowToast(true);
      setShowAppealModal(false);
      setSelectedReportId('');
      setAppealMessage('');
      setAppealType('suspended');
    } catch (error: any) {
      console.error('Error submitting appeal:', error);
      setToastMessage('Failed to submit appeal. Please try again.');
      setShowToast(true);
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const fetchUserReports = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('incident_reports')
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
      // Fetch from notifications table
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', email)
        .eq('read', false);

      // Fetch from incident_reports table (unread reports with admin responses)
      const { data: incidentUpdates, error: reportsError } = await supabase
        .from('incident_reports')
        .select('id')
        .eq('reporter_email', email)
        .not('admin_response', 'is', null)
        .eq('read', false);

      // Calculate total unread count (notifications + admin responses)
      const unreadFromNotifications = notificationsData?.length || 0;
      const unreadFromReports = incidentUpdates?.length || 0;
      const newCount = unreadFromNotifications + unreadFromReports;

      // Show a toast if unread increases (dashboard-only per requirements)
      if (newCount > prevUnreadCount && prevUnreadCount > 0) {
        setToastMessage('You have new notifications');
        setShowToast(true);
      }
      
      setUnreadNotifications(newCount);
      setPrevUnreadCount(newCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats({
          pendingReports: 0,
          activeReports: 0,
          resolvedReports: 0,
          myReports: 0
        });
        setRecentReports([]);
        setIsLoading(false);
        return;
      }

      // Fetch ONLY user's reports
      const { data: userReports, error: userReportsError } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('reporter_email', user.email)
        .order('created_at', { ascending: false });

      if (userReportsError) {
        console.error('Error fetching reports:', userReportsError);
        setStats({
          pendingReports: 0,
          activeReports: 0,
          resolvedReports: 0,
          myReports: 0
        });
        setRecentReports([]);
        setIsLoading(false);
        return;
      }

      // Process user's reports only
      const pending = userReports?.filter(r => r.status === 'pending').length || 0;
      const active = userReports?.filter(r => r.status === 'active').length || 0;
      const resolved = userReports?.filter(r => r.status === 'resolved').length || 0;

      setStats({
        pendingReports: pending,
        activeReports: active,
        resolvedReports: resolved,
        myReports: userReports?.length || 0
      });

      // Set recent reports (last 3)
      setRecentReports(userReports?.slice(0, 3) || []);

    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setStats({
        pendingReports: 0,
        activeReports: 0,
        resolvedReports: 0,
        myReports: 0
      });
      setRecentReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data when page becomes active
  useIonViewWillEnter(() => {
    const refreshData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          history.replace('/iAMUMAta');
          return;
        }
        await fetchUserData();
        await fetchDashboardData();
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    };
    refreshData();
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          history.replace('/iAMUMAta');
          return;
        }
        await fetchUserData();
        await fetchDashboardData();

        // Realtime: update badge + toast on new notifications/admin updates + auto-refresh dashboard data
        if (user.email) {
          const email = user.email;
          
          // Badge updates for notifications
          const notifChannel = supabase
            .channel('dashboard_badge_notifications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_email=eq.${email}` }, async () => {
              await fetchNotifications(email);
            })
            .subscribe();
          
          // Badge updates and dashboard refresh for reports
          const reportsChannel = supabase
            .channel('dashboard_badge_reports')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_reports', filter: `reporter_email=eq.${email}` }, async (payload) => {
              // Update badge
              await fetchNotifications(email);
              
              // Refresh dashboard data (stats and recent reports)
              await fetchDashboardData();
              
              // Show toast for status changes
              if (payload.eventType === 'UPDATE') {
                const updatedReport = payload.new;
                if (updatedReport.status) {
                  const statusEmojis: { [key: string]: string } = {
                    'pending': '⏳',
                    'active': '🔍',
                    'resolved': '✅'
                  };
                  const emoji = statusEmojis[updatedReport.status] || '📋';
                  setToastMessage(`${emoji} Your report "${updatedReport.title}" status updated to ${updatedReport.status}`);
                  setShowToast(true);
                }
                
                // Show toast for admin responses
                if (updatedReport.admin_response && !updatedReport.read) {
                  setToastMessage(`💬 Admin responded to your report: "${updatedReport.title}"`);
                  setShowToast(true);
                }
              }
            })
            .subscribe();
          
          // Note: channels will be cleaned when app unmounts
        }
      } catch (error) {
        console.error('Error in checkAuth:', error);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (userProfile?.warnings > 0 && userProfile.last_warning_date) {
      const lastWarn = new Date(userProfile.last_warning_date);
      const lockEnd = new Date(lastWarn.getTime() + WARNING_LOCK_DURATION_MS);
      if (lockEnd.getTime() > Date.now()) {
        setWarningLockEndsAt(lockEnd.toISOString());
      } else {
        setWarningLockEndsAt(null);
      }
    } else {
      setWarningLockEndsAt(null);
    }
  }, [userProfile?.warnings, userProfile?.last_warning_date]);

  useEffect(() => {
    const updateTimers = () => {
      if (warningLockEndsAt) {
        const remaining = formatRemainingTime(new Date(warningLockEndsAt));
        setWarningCountdown(remaining);
        if (!remaining) {
          setWarningLockEndsAt(null);
        }
      } else {
        setWarningCountdown('');
      }

      if (userProfile?.status === 'suspended' && suspensionLiftDate) {
        setSuspensionCountdown(formatRemainingTime(new Date(suspensionLiftDate)));
      } else {
        setSuspensionCountdown('');
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [warningLockEndsAt, suspensionLiftDate, userProfile?.status]);

  const handleStatBoxClick = (type: 'pending' | 'active' | 'resolved') => {
    const count = stats[`${type}Reports`];
    
    if (count === 0) {
      setToastMessage(`No ${type} reports found`);
      setShowToast(true);
      return;
    }

    if (type === 'resolved') {
      history.push('/iAMUMAta/app/history');
    } else {
      const statusParam = type === 'pending' ? 'pending' : 'active';
      history.push(`/iAMUMAta/app/map?status=${statusParam}`);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '--color': 'white' } as any}>
            <IonButtons slot="start" />
            <IonTitle style={{ fontWeight: 'bold', fontSize: '20px' }}>iAMUMA ta</IonTitle>
            <IonButtons slot="end">
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px' }} />
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
          <div style={{ padding: '20px' }}>
            {/* Welcome Header Skeleton */}
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

                <IonSkeletonText animated style={{
                  width: '60%',
                  height: '28px',
                  marginBottom: '12px',
                  background: 'rgba(255,255,255,0.8)'
                }} />
                <IonSkeletonText animated style={{
                  width: '80%',
                  height: '16px',
                  marginBottom: '20px',
                  background: 'rgba(255,255,255,0.6)'
                }} />

                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ flex: 1 }}>
                    <IonSkeletonText animated style={{
                      width: '40%',
                      height: '14px',
                      marginBottom: '8px',
                      background: 'rgba(255,255,255,0.8)'
                    }} />
                    <IonSkeletonText animated style={{
                      width: '60%',
                      height: '16px',
                      background: 'rgba(255,255,255,0.8)'
                    }} />
                  </div>
                  <IonSkeletonText animated style={{
                    width: '24px',
                    height: '24px',
                    background: 'rgba(255,255,255,0.8)'
                  }} />
                </div>
              </IonCardContent>
            </IonCard>

            {/* Statistics Cards Skeleton */}
            <IonGrid style={{ padding: 0, marginBottom: '20px' }}>
              <IonRow>
                <IonCol size="12">
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
                      <IonSkeletonText animated style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        marginRight: '16px'
                      }} />
                      <div style={{ flex: 1 }}>
                        <IonSkeletonText animated style={{ width: '60%', height: '24px', marginBottom: '8px' }} />
                        <IonSkeletonText animated style={{ width: '40%', height: '12px' }} />
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              <IonRow>
                {[1, 2, 3].map((item) => (
                  <SkeletonMiniStatsCard key={item} />
                ))}
              </IonRow>
            </IonGrid>

            {/* Recent Reports Skeleton */}
            <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonSkeletonText animated style={{ width: '120px', height: '18px' }} />
                </div>
              </IonCardHeader>
              <IonCardContent style={{ padding: 0 }}>
                <div style={{ padding: '20px' }}>
                  <IonProgressBar type="indeterminate" />
                </div>
                <IonList style={{ background: 'transparent' }}>
                  {[1, 2, 3].map((item) => (
                    <SkeletonRecentReportItem key={item} />
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Safety Tips Skeleton */}
            <IonCard style={{ borderRadius: '16px' }}>
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonSkeletonText animated style={{ width: '100px', height: '18px' }} />
                  <IonSkeletonText animated style={{ width: '100px', height: '32px', borderRadius: '20px' }} />
                </div>
              </IonCardHeader>
              <IonCardContent>
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  {[1, 2, 3, 4].map((item) => (
                    <IonSkeletonText
                      key={item}
                      animated
                      style={{
                        width: item % 2 === 0 ? '90%' : '80%',
                        height: '12px',
                        marginBottom: '8px'
                      }}
                    />
                  ))}
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
        <IonTabBar
          slot="bottom"
          style={{ '--background': 'white', '--border': '1px solid #e2e8f0', height: '70px', paddingTop: '8px', paddingBottom: '8px' } as any}
        >
          {[1, 2, 3, 4].map((item) => (
            <IonTabButton key={item} style={{ '--color': '#94a3b8' } as any}>
              <IonSkeletonText animated style={{ width: '24px', height: '24px', borderRadius: '4px', marginBottom: '4px' }} />
              <IonSkeletonText animated style={{ width: '60px', height: '12px', borderRadius: '4px' }} />
            </IonTabButton>
          ))}
        </IonTabBar>
      </IonPage>
    );
  }

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

  const handleDialLDRRMO = () => {
    const ldrrmoNumber = '09518078207';
    window.open(`tel:${ldrrmoNumber}`, '_self');
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchDashboardData();
    event.detail.complete();
  };

  // Bottom tabs standardized like Profile.tsx
  const tabs = [
    { name: 'Dashboard', tab: 'dashboard', url: '/iAMUMAta/app/dashboard', icon: homeOutline },
    { name: 'Report an Incident', tab: 'submit', url: '/iAMUMAta/app/submit', icon: addCircleOutline },
    { name: 'My Reports', tab: 'map', url: '/iAMUMAta/app/map', icon: mapOutline },
    { name: 'History', tab: 'reports', url: '/iAMUMAta/app/history', icon: timeOutline }
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '--color': 'white' } as any}>
          <IonButtons slot="start" />
          <IonTitle style={{ fontWeight: 'bold', fontSize: '20px' }}>iAMUMA ta</IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              onClick={() => handlePopoverNavigation('/iAMUMAta/app/notifications')}
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
              <IonButton onClick={() => history.push('/iAMUMAta/user-login')} fill="clear" style={{ color: 'white' }}>
                Login
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonPopover
        isOpen={showProfilePopover}
        event={popoverEvent}
        onDidDismiss={() => setShowProfilePopover(false)}
      >
        <IonContent>
          <div style={{ padding: '0', minWidth: '280px' }}>
            {user && (
              <>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '24px 20px',
                  textAlign: 'center',
                  color: 'white'
                }}>
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
                    {userProfile?.user_firstname && userProfile?.user_lastname
                      ? `${userProfile.user_firstname} ${userProfile.user_lastname}`
                      : 'Community Member'}
                  </h3>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9, textAlign: 'center' }}>
                    {user?.email}
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '6px 12px', display: 'inline-block' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>
                      {userReports.length} Reports Submitted
                    </span>
                  </div>
                </div>

                <div style={{ padding: '12px 0' }}>
                  <IonItem button onClick={() => handlePopoverNavigation('/iAMUMAta/app/profile')} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                    <IonIcon icon={personCircle} slot="start" color="primary" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>View Profile</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Manage account settings</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem button onClick={() => handlePopoverNavigation('/iAMUMAta/app/feedback')} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
                    <IonIcon icon={chatbubbleOutline} slot="start" color="success" />
                    <IonLabel>
                      <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Give Feedback</h3>
                      <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Rate our response service</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem button onClick={() => handlePopoverNavigation('/iAMUMAta/app/activity-logs')} style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}>
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
              {/* Account status indicators */}
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
                Help keep Manolo Fortich safe by reporting incidents in your community
              </p>

              {userProfile && (
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ fontSize: '14px', margin: 0, opacity: 0.8 }}>Welcome back</p>
                    <p style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      {userProfile.username || 'User'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {userProfile.warnings > 0 && (
                        <div style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.45)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                          ⚠️ Account Warned ({userProfile.warnings})
                          {warningLockEndsAt && (
                            <div style={{ fontSize: '10px', color: '#fde68a', marginTop: '2px' }}>
                              Cannot submit reports for {warningCountdown || 'less than a minute'} (until {new Date(warningLockEndsAt).toLocaleString()})
                            </div>
                          )}
                        </div>
                      )}
                      {userProfile.status === 'suspended' && (
                        <div 
                          onClick={async () => {
                            // Fetch prank reports for this user
                            const { data: reports } = await supabase
                              .from('incident_reports')
                              .select('id, title, created_at, admin_response, appeal')
                              .eq('reporter_email', userProfile.user_email)
                              .eq('priority', 'prank')
                              .order('created_at', { ascending: false });
                            setPrankReports(reports || []);
                            setShowAppealModal(true);
                          }}
                          style={{ 
                            background: 'rgba(249,115,22,0.2)', 
                            border: '1px solid rgba(249,115,22,0.5)', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            fontSize: '11px', 
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ⛔ Account Suspended — submitting reports is disabled (Click to Appeal)
                          {suspensionLiftDate && (
                            <div style={{ color: '#fed7aa', fontSize: '10px', marginTop: '2px' }}>
                              Access returns on {new Date(suspensionLiftDate).toLocaleString()} ({suspensionCountdown || 'less than a minute'} remaining)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <IonIcon icon={homeOutline} style={{ fontSize: '24px', opacity: 0.8 }} />
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Statistics Cards */}
          <IonGrid style={{ padding: 0, marginBottom: '20px' }}>
            <IonRow>
              <IonCol size="12">
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
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>My Total Reports</p>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            <IonRow>
              {/* Pending Reports Box - Clickable */}
              <IonCol size="4">
                <IonCard 
                  button
                  onClick={() => handleStatBoxClick('pending')}
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '80px',
                    cursor: 'pointer'
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

              {/* Active Reports Box - Clickable */}
              <IonCol size="4">
                <IonCard
                  button
                  onClick={() => handleStatBoxClick('active')}
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '80px',
                    cursor: 'pointer'
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
                        {stats.activeReports}
                      </h3>
                    )}
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: 0, textAlign: 'center' }}>Active</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Resolved Reports Box - Clickable */}
              <IonCol size="4">
                <IonCard
                  button
                  onClick={() => handleStatBoxClick('resolved')}
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '80px',
                    cursor: 'pointer'
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
                  My Recent Reports
                </IonCardTitle>
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
                  <p style={{ color: '#9ca3af', marginTop: '16px' }}>No reports found</p>
                  <IonButton
                    routerLink="/iAMUMAta/app/submit"
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
                      routerLink="/iAMUMAta/app/map"
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

          {/* Safety Tips with Dial LDRRMO */}
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <IonCardTitle style={{ fontSize: '18px', color: '#1f2937', display: 'flex', alignItems: 'center' }}>
                  <IonIcon icon={callOutline} style={{ marginRight: '8px', color: '#10b981' }} />
                  Safety Tips
                </IonCardTitle>
                <IonButton
                  fill="solid"
                  size="small"
                  color="danger"
                  onClick={handleDialLDRRMO}
                  style={{
                    '--border-radius': '20px',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    height: '32px',
                    fontWeight: '600',
                    fontSize: '12px'
                  } as any}
                >
                  <IonIcon icon={callOutline} slot="start" style={{ fontSize: '14px' }} />
                  Dial LDRRMO
                </IonButton>
              </div>
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
                  <li>Always prioritize your safety when reporting incidents</li>
                  <li>Take clear photos from a safe distance</li>
                  <li>Provide accurate location information</li>
                  <li>Report critical incidents immediately by calling emergency services</li>
                </ul>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Toast for empty stat boxes */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
          color="warning"
        />

        {/* Appeal Modal */}
        <IonModal isOpen={showAppealModal} onDidDismiss={() => {
          setShowAppealModal(false);
          setSelectedReportId('');
          setAppealMessage('');
          setAppealType('suspended');
        }}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Appeal Account Suspension</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => {
                  setShowAppealModal(false);
                  setSelectedReportId('');
                  setAppealMessage('');
                setAppealType('suspended');
                }}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonCard style={{ marginBottom: '16px' }}>
                <IonCardContent>
                  <IonLabel position="stacked" style={{ marginBottom: '12px', display: 'block' }}>Appeal Type</IonLabel>
                  <IonRadioGroup
                    value={appealType}
                    onIonChange={e => setAppealType(e.detail.value as 'banned' | 'suspended' | 'warned')}
                  >
                    <IonItem>
                      <IonRadio slot="start" value="banned" />
                      <IonLabel>Appeal Account Banned</IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonRadio slot="start" value="suspended" />
                      <IonLabel>Appeal Account Suspended</IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonRadio slot="start" value="warned" />
                      <IonLabel>Appeal Account Warned</IonLabel>
                    </IonItem>
                  </IonRadioGroup>
                </IonCardContent>
              </IonCard>
              <IonCard>
                <IonCardContent>
                  <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Select Report to Appeal</h3>
                  {prankReports.length === 0 ? (
                    <p style={{ color: '#6b7280' }}>No prank reports found.</p>
                  ) : (
                    <IonList>
                      <IonRadioGroup value={selectedReportId} onIonChange={e => setSelectedReportId(e.detail.value)}>
                        {prankReports.map((report) => (
                          <IonItem key={report.id}>
                            <IonRadio slot="start" value={report.id} />
                            <IonLabel>
                              <h3>{report.title}</h3>
                              <p>{new Date(report.created_at).toLocaleDateString()}</p>
                            </IonLabel>
                          </IonItem>
                        ))}
                      </IonRadioGroup>
                    </IonList>
                  )}
                </IonCardContent>
              </IonCard>

              {(selectedReportId && (appealType === 'banned' || appealType === 'suspended' || appealType === 'warned')) && (
                <IonCard style={{ marginTop: '16px' }}>
                  <IonCardContent>
                    <IonItem>
                      <IonLabel position="stacked">Message to Admin (Optional - will use default if empty)</IonLabel>
                      <IonTextarea
                        value={appealMessage}
                        onIonInput={e => setAppealMessage(e.detail.value!)}
                        rows={6}
                        placeholder="Enter your appeal message..."
                      />
                    </IonItem>
                  </IonCardContent>
                </IonCard>
              )}

              <IonButton
                expand="block"
                onClick={submitAppeal}
                disabled={!selectedReportId || isSubmittingAppeal}
                style={{ marginTop: '16px' }}
              >
                {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
      <IonTabBar
        slot="bottom"
        style={{ '--background': 'white', '--border': '1px solid #e2e8f0', height: '70px', paddingTop: '8px', paddingBottom: '8px' } as any}
      >
        {tabs.map((item, index) => {
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

export default Dashboard;