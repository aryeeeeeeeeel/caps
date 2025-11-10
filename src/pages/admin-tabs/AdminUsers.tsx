// src/pages/admin-tabs/AdminUsers.tsx - Updated with proper status logic
import React, { useState, useEffect, useMemo } from 'react';
import { desktopOutline, notifications } from 'ionicons/icons';
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
  IonAlert,
  IonToast,
  IonBadge,
  useIonRouter,
  IonText,
  IonSkeletonText,
  useIonViewWillEnter
} from '@ionic/react';
import {
  logOutOutline,
  notificationsOutline,
  peopleOutline,
  warningOutline,
  banOutline,
  pauseCircleOutline,
  checkmarkCircleOutline,
  filterOutline,
  statsChartOutline,
  alertCircleOutline,
  documentTextOutline,
  timeOutline,
  trashOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import { logUserWarning, logUserSuspension, logUserBan, logUserActivation } from '../../utils/activityLogger';

interface User {
  id: string;
  user_id: string;
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  status: 'active' | 'inactive' | 'suspended' | 'banned';
  warnings: number;
  last_warning_date?: string;
  date_registered: string;
  last_active_at?: string;
  user_contact_number?: string;
  user_address?: string;
  has_reports?: boolean;
  is_online: boolean;
}

const SkeletonStatsCard: React.FC = () => (
  <div style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
    <IonSkeletonText animated style={{ width: '80%', height: '28px', marginBottom: '8px' }} />
    <IonSkeletonText animated style={{ width: '40%', height: '16px' }} />
  </div>
);

const SkeletonUserItem: React.FC = () => (
  <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
    <IonSkeletonText animated style={{ width: '40%', height: '24px', marginBottom: '8px' }} />
    <IonSkeletonText animated style={{ width: '25%', height: '16px', marginBottom: '16px' }} />
    <div style={{ display: 'flex', gap: '8px' }}>
      <IonSkeletonText animated style={{ width: '60px', height: '32px', borderRadius: '16px' }} />
      <IonSkeletonText animated style={{ width: '60px', height: '32px', borderRadius: '16px' }} />
      <IonSkeletonText animated style={{ width: '60px', height: '32px', borderRadius: '16px' }} />
    </div>
  </div>
);

const AdminUsers: React.FC = () => {
  const navigation = useIonRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'banned'>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionAlert, setShowActionAlert] = useState(false);
  const [userAction, setUserAction] = useState<'warn' | 'suspend' | 'ban' | 'activate'>('warn');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [sortAlphabetical, setSortAlphabetical] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const [showNewNotificationToast, setShowNewNotificationToast] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showActionConfirmAlert, setShowActionConfirmAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState<{type: 'warn' | 'suspend' | 'ban' | 'activate' | 'delete', user: User} | null>(null);

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
        setToastMessage("There's new notification/s! Check it out!");
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
  }, [prevUnreadCount]);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };
    checkDevice();
  }, []);

  useEffect(() => {
    fetchUsers();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchText, statusFilter, activityFilter, sortAlphabetical]);

  // Refresh data when page becomes active
  useIonViewWillEnter(() => {
    fetchUsers();
  });

  useEffect(() => {
    console.log('🔍 AdminUsers component mounted - starting user fetch');
    fetchUsers();
    setupRealtimeSubscription();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Starting to fetch users from Supabase...');

      const { data, error, status } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin');

      console.log('📊 Supabase response:', { data, error, status });

      if (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }

      if (data) {
        console.log(`✅ Successfully fetched ${data.length} users`);

        // Fetch reports for each user to determine if they're truly "active"
        const usersWithReports = await Promise.all(
          data.map(async (user) => {
            const { data: reports, error: reportsError } = await supabase
              .from('incident_reports')
              .select('id')
              .eq('reporter_email', user.user_email)
              .limit(1);

            if (reportsError) {
              console.error(`❌ Error fetching reports for user ${user.user_email}:`, reportsError);
            }

            console.log(`👤 User ${user.user_email} has ${reports?.length || 0} reports`);

            return {
              ...user,
              status: user.status || 'active',
              warnings: user.warnings || 0,
              has_reports: (reports && reports.length > 0) || false
            };
          })
        );

        console.log('🎯 Final users with reports data:', usersWithReports);
        setUsers(usersWithReports);
      } else {
        console.log('⚠️ No data returned from users query');
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error in fetchUsers:', error);
      setToastMessage('Error loading users: ' + (error as any).message);
      setShowToast(true);
    } finally {
      setIsLoading(false);
      console.log('🏁 User fetch completed');
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('📡 Setting up realtime subscription for users');
    const channel = supabase
      .channel('users_channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        async (payload) => {
          console.log('🔄 Realtime update received:', payload);
          
          // Show toast for new user registrations
          if (payload.eventType === 'INSERT') {
            const newUser = payload.new;
            setToastMessage(`👤 New user registered: ${newUser.user_firstname} ${newUser.user_lastname}`);
            setShowToast(true);
          }
          
          // Show toast for user status changes
          if (payload.eventType === 'UPDATE') {
            const updatedUser = payload.new;
            const oldUser = payload.old;
            
            // Status changes
            if (updatedUser.status !== oldUser.status) {
              const statusEmojis: { [key: string]: string } = {
                'active': '✅',
                'inactive': '⏸️',
                'suspended': '⛔',
                'banned': '🚫'
              };
              const emoji = statusEmojis[updatedUser.status] || '📋';
              setToastMessage(`${emoji} User ${updatedUser.user_firstname} ${updatedUser.user_lastname} status changed to ${updatedUser.status}`);
              setShowToast(true);
            }
            
            // Online status changes
            if (updatedUser.is_online !== oldUser.is_online) {
              const statusText = updatedUser.is_online ? 'came online' : 'went offline';
              setToastMessage(`🟢 ${updatedUser.user_firstname} ${updatedUser.user_lastname} ${statusText}`);
              setShowToast(true);
            }
          }
          
          // Refresh users list
          await fetchUsers();
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    // Also listen to reports to update user activity
    const reportsChannel = supabase
      .channel('users_reports_channel')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incident_reports' },
        async () => {
          // Refresh users when new reports are submitted (to update has_reports flag)
          await fetchUsers();
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up realtime subscription');
      channel.unsubscribe();
      reportsChannel.unsubscribe();
    };
  };

  // Active vs Inactive should be based on whether user has submitted at least one report
  const isUserOnline = (user: User): boolean => {
    return user.is_online;
  };

  const filterAndSortUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = `${user.user_firstname} ${user.user_lastname}`.toLowerCase().includes(searchText.toLowerCase()) ||
        user.user_email.toLowerCase().includes(searchText.toLowerCase());

      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'active') {
        // Treat as active only if the user has at least one report
        matchesStatus = user.has_reports === true;
      } else if (statusFilter === 'inactive') {
        // Treat as inactive if user has no reports
        matchesStatus = !user.has_reports;
      } else if (statusFilter === 'suspended') {
        matchesStatus = user.status === 'suspended';
      } else if (statusFilter === 'banned') {
        matchesStatus = user.status === 'banned';
      } else {
        matchesStatus = true; // Default to true for other filters
      }

      const matchesActivity = activityFilter === 'all' ||
        (activityFilter === 'online' && isUserOnline(user)) ||
        (activityFilter === 'offline' && !isUserOnline(user));

      return matchesSearch && matchesStatus && matchesActivity;
    });

    if (sortAlphabetical) {
      filtered = filtered.sort((a, b) => {
        const nameA = `${a.user_firstname} ${a.user_lastname}`.toLowerCase();
        const nameB = `${b.user_firstname} ${b.user_lastname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
    setFilteredUsers(filtered);
  };

  const handleStatusFilterClick = (status: 'all' | 'active' | 'inactive' | 'online' | 'offline' | 'suspended' | 'banned') => {
    if (status === 'online' || status === 'offline') {
      setActivityFilter(status as any);
      setStatusFilter('all');
    } else {
      setStatusFilter(status as any);
      setActivityFilter('all');
    }
  };

  const isBoxHighlighted = (statStatus: string) => {
    // Simple logic: only highlight if the current filter matches the box status
    return statusFilter === statStatus || activityFilter === statStatus;
  };

  const handleUserAction = async (action: 'warn' | 'suspend' | 'ban' | 'activate') => {
    if (!selectedUser) return;
    try {
      let updates: any = {};
      switch (action) {
        case 'warn':
          updates = { warnings: (selectedUser.warnings || 0) + 1, last_warning_date: new Date().toISOString() };
          if (updates.warnings >= 3) updates.status = 'suspended';
          break;
        case 'suspend':
          updates = { status: 'suspended' };
          break;
        case 'ban':
          updates = { status: 'banned' };
          break;
        case 'activate':
          updates = { status: 'active', warnings: 0, last_warning_date: null };
          break;
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Log the user action
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = user?.email;

      switch (action) {
        case 'warn':
          await logUserWarning(selectedUser.user_email, 'Admin warning', adminEmail);
          break;
        case 'suspend':
          await logUserSuspension(selectedUser.user_email, 'Admin suspension', adminEmail);
          break;
        case 'ban':
          await logUserBan(selectedUser.user_email, 'Admin ban', adminEmail);
          break;
        case 'activate':
          await logUserActivation(selectedUser.user_email, adminEmail);
          break;
      }

      const actionMessage = action === 'warn' && updates.warnings >= 3 ? 'User warned and auto-suspended (3 warnings)' : `User ${action}ed successfully`;
      setToastMessage(actionMessage);
      setShowToast(true);
      setShowActionAlert(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setToastMessage('Error updating user');
      setShowToast(true);
    }
  };

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.has_reports).length,
    inactive: users.filter((u) => !u.has_reports).length,
    suspended: users.filter(u => u.status === 'suspended').length,
    banned: users.filter(u => u.status === 'banned').length,
    online: users.filter(u => u.is_online).length,
    offline: users.filter(u => !u.is_online).length,
  }), [users]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'suspended': return '#f59e0b';
      case 'banned': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return 'Invalid Date'; }
  };

  const getLastActiveText = (user: User): string => {
    if (!user.last_active_at) return 'Never';
    const lastActive = new Date(user.last_active_at);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(user.last_active_at);
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', user.user_id);

      if (error) throw error;

      // Log the deletion
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (adminUser?.email) {
        await supabase.from('system_logs').insert({
          admin_email: adminUser.email,
          activity_type: 'user_action',
          activity_description: 'User deleted from system',
          target_user_email: user.user_email,
          details: {
            action: 'delete_user',
            user_name: `${user.user_firstname} ${user.user_lastname}`
          }
        });
      }

      setToastMessage('User deleted successfully');
      setShowToast(true);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setToastMessage('Error deleting user');
      setShowToast(true);
    }
  };

  // Add this to your delete handler after successful user deletion
const deleteAuthUser = async (userId: string) => {
  try {
    // Note: This requires SUPABASE_SERVICE_ROLE_KEY and should be done server-side
    // For client-side, you might want to create an edge function
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) console.warn('Could not delete auth user:', error);
  } catch (error) {
    console.warn('Error deleting auth user:', error);
  }
};

  // Show confirmation dialog for user actions
  const showConfirmationDialog = (user: User, action: 'warn' | 'suspend' | 'ban' | 'activate' | 'delete') => {
    setSelectedUser(user);
    setPendingAction({ type: action, user });
    setShowActionConfirmAlert(true);
  };

  // Execute the confirmed action
  const executeConfirmedAction = async () => {
    if (!pendingAction || !pendingAction.user) return;

    try {
      switch (pendingAction.type) {
        case 'warn':
        case 'suspend':
        case 'ban':
        case 'activate':
          await handleUserAction(pendingAction.type);
          break;
        case 'delete':
          await handleDeleteUser(pendingAction.user);
          break;
      }
    } catch (error) {
      console.error('Error executing action:', error);
      setToastMessage('Error executing action');
      setShowToast(true);
    } finally {
      setPendingAction(null);
      setShowActionConfirmAlert(false);
    }
  };

  // Get confirmation message based on action type
  const getConfirmationMessage = () => {
    if (!pendingAction || !pendingAction.user) return '';
    
    const userName = `${pendingAction.user.user_firstname} ${pendingAction.user.user_lastname}`;
    const userEmail = pendingAction.user.user_email;
    
    switch (pendingAction.type) {
      case 'warn':
        return `Are you sure you want to issue a warning to ${userName} (${userEmail})? This will increment their warning count.`;
      case 'suspend':
        return `Are you sure you want to suspend ${userName} (${userEmail})? They will not be able to access the system.`;
      case 'ban':
        return `Are you sure you want to ban ${userName} (${userEmail})? This action is permanent and cannot be undone.`;
      case 'activate':
        return `Are you sure you want to activate ${userName} (${userEmail})? This will reset their warnings and restore access.`;
      case 'delete':
        return `Are you sure you want to delete ${userName} (${userEmail})? This action is permanent and cannot be undone.`;
      default:
        return 'Are you sure you want to perform this action?';
    }
  };

  // Get confirmation header based on action type
  const getConfirmationHeader = () => {
    if (!pendingAction) return 'Confirm Action';
    
    switch (pendingAction.type) {
      case 'warn': return 'Issue Warning';
      case 'suspend': return 'Suspend User';
      case 'ban': return 'Ban User';
      case 'activate': return 'Activate User';
      case 'delete': return 'Delete User';
      default: return 'Confirm Action';
    }
  };

  // Show skeleton loading
  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': 'var(--gradient-primary)', '--color': 'white' } as any}>
            <IonButtons slot="start">
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </IonButtons>
            <IonTitle style={{ fontWeight: 'bold' }}>
              <IonSkeletonText animated style={{ width: '200px', height: '20px' }} />
            </IonTitle>
            <IonButtons slot="end">
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px' }} />
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </IonButtons>
          </IonToolbar>

          {/* Menu Bar Skeleton */}
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
            {/* Stats Cards Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <SkeletonStatsCard />
              <SkeletonStatsCard />
              <SkeletonStatsCard />
              <SkeletonStatsCard />
              <SkeletonStatsCard />
              <SkeletonStatsCard />
            </div>

            {/* Search and Filter Skeleton */}
            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <IonSkeletonText animated style={{ flex: 1, height: '48px', borderRadius: '8px' }} />
                <IonSkeletonText animated style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
              </div>
            </div>

            {/* Users List Skeleton */}
            <div style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <IonSkeletonText animated style={{ width: '120px', height: '18px' }} />
                <IonSkeletonText animated style={{ width: '60px', height: '24px', borderRadius: '12px' }} />
              </div>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <SkeletonUserItem key={item} />
              ))}
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (isMobileDevice) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ maxWidth: '400px', padding: '40px 20px' }}>
            <IonIcon icon={desktopOutline} style={{ fontSize: '64px', color: '#667eea', marginBottom: '20px' }} />
            <IonText>
              <h2 style={{ color: '#2d3748', marginBottom: '16px' }}>Admin Access Restricted</h2>
              <p style={{ color: '#718096', lineHeight: '1.6' }}>This admin page is only accessible from desktop devices.</p>
            </IonText>
            <IonButton onClick={() => navigation.push('/iAMUMAta')} style={{ marginTop: '20px' }}>Return to Home</IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--gradient-primary)', '--color': 'white' } as any}>
          <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta - User Management</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => navigation.push("/iAMUMAta/admin/notifications", "forward", "push")} style={{ color: 'white' }}>
              <IonIcon icon={notificationsOutline} />
              {unreadCount > 0 && <IonBadge color="danger" style={{ position: 'absolute', top: '0px', right: '0px', fontSize: '10px', transform: 'translate(25%, -25%)' }}>{unreadCount}</IonBadge>}
            </IonButton>
            <IonButton fill="clear" onClick={async () => { try { const { data: { user } } = await supabase.auth.getUser(); if (user?.email) { await supabase.from('system_logs').insert({ admin_email: user.email, activity_type: 'logout', activity_description: 'Admin logged out', details: { source: 'AdminUsers' } }); } } finally { await supabase.auth.signOut(); navigation.push('/iAMUMAta', 'root', 'replace'); } }} style={{ color: 'white' }}>
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
              <IonButton key={menu.id} fill="clear" onClick={() => { if (menu.route) navigation.push(menu.route, 'forward', 'push'); }} style={{ '--color': menu.id === 'users' ? '#3b82f6' : '#6b7280', '--background': 'transparent', '--border-radius': '0', borderBottom: menu.id === 'users' ? '2px solid #3b82f6' : '2px solid transparent', margin: 0, flex: 1 } as any}>
                <IonIcon icon={menu.icon} slot="start" />
                {menu.label}
              </IonButton>
            ))}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': 'var(--bg-secondary)' } as any}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'All Users', value: stats.total, color: 'var(--text-secondary)', status: 'all' },
              { label: 'Active', value: stats.active, color: 'var(--success-color)', status: 'active' },
              { label: 'Inactive', value: stats.inactive, color: 'var(--text-tertiary)', status: 'inactive' },
              { label: 'Online', value: stats.online, color: 'var(--primary-color)', status: 'online' },
              { label: 'Offline', value: stats.offline, color: 'var(--text-secondary)', status: 'offline' },
              { label: 'Suspended', value: stats.suspended, color: 'var(--warning-color)', status: 'suspended' },
              { label: 'Banned', value: stats.banned, color: 'var(--danger-color)', status: 'banned' }
            ].map((stat, idx) => (
              <div key={idx} onClick={() => handleStatusFilterClick(stat.status as any)} style={{ background: isBoxHighlighted(stat.status) ? stat.color + '20' : 'var(--bg-primary)', border: `1px solid ${isBoxHighlighted(stat.status) ? stat.color : 'var(--border-color)'}`, borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardContent>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <IonSearchbar value={searchText} onIonInput={e => setSearchText(e.detail.value!)} placeholder="Search users by name or email..." style={{ flex: 1, '--background': '#f8fafc', '--border-radius': '8px', '--box-shadow': 'none', fontSize: '14px' } as any} />
                <IonButton fill={sortAlphabetical ? 'solid' : 'outline'} onClick={() => setSortAlphabetical(!sortAlphabetical)} style={{ '--border-radius': '12px' } as any}>
                  <IonIcon icon={filterOutline} slot="icon-only" />
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Users ({filteredUsers.length})
                </h3>
              </div>

              <IonList style={{ background: 'transparent' }}>
                {filteredUsers.map((user, index) => (
                  <IonItem key={user.id || `user-${index}`} style={{ '--background': 'white', '--border-radius': '8px', marginBottom: '12px' } as any}>
                    <div style={{ width: '100%', padding: '16px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{user.user_firstname} {user.user_lastname}</div>
                            <div
                              title={isUserOnline(user) ? 'Online' : 'Offline'}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isUserOnline(user) ? '#10b981' : '#9ca3af',
                                boxShadow: isUserOnline(user) ? '0 0 0 2px #d1fae5' : '0 0 0 2px #e5e7eb'
                              }}
                            />
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>{user.user_email}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {/* Show ACTIVE/INACTIVE by report submissions */}
                          <IonBadge
                            style={{
                              fontSize: '10px',
                              '--background': user.has_reports ? '#10b981' : '#6b7280',
                              '--color': 'white'
                            } as any}
                          >
                            {user.has_reports ? 'ACTIVE' : 'INACTIVE'}
                          </IonBadge>
                          {/* Keep administrative status as a secondary hint if not normal */}
                          {(user.status === 'suspended' || user.status === 'banned') && (
                            <IonBadge
                              style={{
                                fontSize: '10px',
                                '--background': getStatusColor(user.status),
                                '--color': 'white'
                              } as any}
                            >
                              {user.status.toUpperCase()}
                            </IonBadge>
                          )}
                          {user.warnings > 0 && <IonBadge color="warning" style={{ fontSize: '10px' }}>{user.warnings} ⚠️</IonBadge>}
                        </div>
                      </div>


                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                        Joined: {formatDate(user.date_registered)} Last Online: {getLastActiveText(user)}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <IonButton size="small" fill="solid" color="warning" onClick={() => showConfirmationDialog(user, 'warn')} disabled={user.status === 'banned'}>
                          <IonIcon icon={warningOutline} slot="start" />
                          Warn
                        </IonButton>
                        <IonButton size="small" fill="solid" color="medium" onClick={() => showConfirmationDialog(user, user.status === 'suspended' ? 'activate' : 'suspend')} disabled={user.status === 'banned'}>
                          <IonIcon icon={user.status === 'suspended' ? checkmarkCircleOutline : pauseCircleOutline} slot="start" />
                          {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </IonButton>
                        <IonButton
                          size="small"
                          fill="solid"
                          color="danger"
                          onClick={() => showConfirmationDialog(user, user.status === 'banned' ? 'activate' : 'ban')}
                        >
                          <IonIcon icon={banOutline} slot="start" />
                          {user.status === 'banned' ? 'Unban' : 'Ban'}
                        </IonButton>
                        <IonButton
                          size="small"
                          fill="outline"
                          color="danger"
                          onClick={() => showConfirmationDialog(user, 'delete')}
                        >
                          <IonIcon icon={trashOutline} slot="start" />
                          Delete
                        </IonButton>
                      </div>
                    </div>
                  </IonItem>
                ))}
              </IonList>

              {filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                  <IonIcon icon={peopleOutline} style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>No users found</div>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        {/* Action Confirmation Alert */}
        <IonAlert
          isOpen={showActionConfirmAlert}
          onDidDismiss={() => {
            setShowActionConfirmAlert(false);
            setPendingAction(null);
          }}
          header={getConfirmationHeader()}
          message={getConfirmationMessage()}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'alert-button-cancel'
            },
            {
              text: 'Confirm',
              role: 'confirm',
              cssClass: pendingAction?.type === 'delete' ? 'alert-button-danger' : 'alert-button-confirm',
              handler: executeConfirmedAction
            }
          ]}
        />

        {/* Toast for notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />

        {/* New Notification Toast */}
        <IonToast
          isOpen={showNewNotificationToast}
          onDidDismiss={() => setShowNewNotificationToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color="primary"
          buttons={[
            {
              text: 'View',
              handler: () => {
                navigation.push("/iAMUMAta/admin/notifications", "forward", "push");
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminUsers;