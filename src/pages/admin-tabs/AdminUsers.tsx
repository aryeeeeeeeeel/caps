// src/pages/admin-tabs/AdminUsers.tsx - Updated with skeleton loading screen
import React, { useState, useEffect } from 'react';
import { desktopOutline } from 'ionicons/icons';
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
  IonSkeletonText
} from '@ionic/react';
import {
  logOutOutline,
  notificationsOutline,
  arrowBackOutline,
  peopleOutline,
  warningOutline,
  banOutline,
  pauseCircleOutline,
  checkmarkCircleOutline,
  filterOutline,
  statsChartOutline,
  alertCircleOutline,
  documentTextOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';

interface User {
  id: string;
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  status: 'active' | 'suspended' | 'banned';
  warnings: number;
  last_warning_date?: string;
  created_at: string;
  user_contact_number?: string;
  user_address?: string;
}

// Skeleton Components
const SkeletonStatsCard: React.FC = () => (
  <div style={{
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center'
  }}>
    <IonSkeletonText animated style={{ width: '40px', height: '28px', margin: '0 auto 8px' }} />
    <IonSkeletonText animated style={{ width: '60px', height: '12px', margin: '0 auto' }} />
  </div>
);

const SkeletonUserItem: React.FC = () => (
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
          <IonSkeletonText animated style={{ width: '60%', height: '16px', marginBottom: '8px' }} />
          <IonSkeletonText animated style={{ width: '50%', height: '14px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <IonSkeletonText animated style={{ width: '50px', height: '20px', borderRadius: '10px' }} />
        </div>
      </div>

      <IonSkeletonText animated style={{ width: '40%', height: '12px', marginBottom: '12px' }} />

      <div style={{ display: 'flex', gap: '8px' }}>
        <IonSkeletonText animated style={{ width: '70px', height: '28px', borderRadius: '14px' }} />
        <IonSkeletonText animated style={{ width: '80px', height: '28px', borderRadius: '14px' }} />
        <IonSkeletonText animated style={{ width: '60px', height: '28px', borderRadius: '14px' }} />
      </div>
    </div>
  </IonItem>
);

const AdminUsers: React.FC = () => {
  const navigation = useIonRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionAlert, setShowActionAlert] = useState(false);
  const [userAction, setUserAction] = useState<'warn' | 'suspend' | 'ban' | 'activate'>('warn');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [sortAlphabetical, setSortAlphabetical] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

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
  }, [users, searchText, statusFilter, sortAlphabetical]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin');

      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setToastMessage('Error loading users');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('users_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const filterAndSortUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        `${user.user_firstname} ${user.user_lastname}`.toLowerCase().includes(searchText.toLowerCase()) ||
        user.user_email.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
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

  const handleUserAction = async (action: 'warn' | 'suspend' | 'ban' | 'activate') => {
    if (!selectedUser) return;

    try {
      let updates: any = {};
      
      switch (action) {
        case 'warn':
          updates = { 
            warnings: (selectedUser.warnings || 0) + 1,
            last_warning_date: new Date().toISOString()
          };
          break;
        case 'suspend':
          updates = { status: 'suspended' };
          break;
        case 'ban':
          updates = { status: 'banned' };
          break;
        case 'activate':
          updates = { status: 'active' };
          break;
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', selectedUser.id);

      if (error) throw error;

      setToastMessage(`User ${action}ed successfully`);
      setShowToast(true);
      setShowActionAlert(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setToastMessage('Error updating user');
      setShowToast(true);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    banned: users.filter(u => u.status === 'banned').length
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#6b7280';
    
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#f59e0b';
      case 'banned': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusDisplay = (status: string | undefined) => {
    if (!status) return 'UNKNOWN';
    return status.toUpperCase();
  };

  // Show skeleton loading
  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', '--color': 'white' } as any}>
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
            {/* Stats Cards Skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
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

  // Show mobile restriction message
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
                This admin page is only accessible by an admin.
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', '--color': 'white' } as any}>
          <IonButtons slot="start">
            <IonButton onClick={() => navigation.push('/it35-lab2/admin-dashboard', 'back', 'pop')}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta - User Management</IonTitle>
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
              { id: 'users', label: 'Users', icon: peopleOutline },
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
                  '--color': menu.id === 'users' ? '#3b82f6' : '#6b7280',
                  '--background': 'transparent',
                  '--border-radius': '0',
                  borderBottom: menu.id === 'users' ? '2px solid #3b82f6' : '2px solid transparent',
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
              { label: 'Total Users', value: stats.total, color: '#6b7280', status: 'all' },
              { label: 'Active', value: stats.active, color: '#10b981', status: 'active' },
              { label: 'Suspended', value: stats.suspended, color: '#f59e0b', status: 'suspended' },
              { label: 'Banned', value: stats.banned, color: '#dc2626', status: 'banned' }
            ].map((stat, idx) => (
              <div 
                key={idx}
                onClick={() => setStatusFilter(stat.status as any)}
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
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Search and Filter */}
          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardContent>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <IonSearchbar
                  value={searchText}
                  onIonInput={e => setSearchText(e.detail.value!)}
                  placeholder="Search users by name or email..."
                  style={{ 
                    flex: 1,
                    '--background': '#f8fafc',
                    '--border-radius': '8px',
                    '--box-shadow': 'none',
                    fontSize: '14px'
                  } as any}
                />
                <IonButton
                  fill={sortAlphabetical ? 'solid' : 'outline'}
                  onClick={() => setSortAlphabetical(!sortAlphabetical)}
                  style={{ '--border-radius': '12px' } as any}
                >
                  <IonIcon icon={filterOutline} slot="icon-only" />
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Users List */}
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Users ({filteredUsers.length})
                </h3>
                <IonChip color={sortAlphabetical ? 'primary' : 'medium'}>
                  <IonIcon icon={filterOutline} style={{ marginRight: '4px' }} />
                  A-Z
                </IonChip>
              </div>

              <IonList style={{ background: 'transparent' }}>
                {filteredUsers.map(user => (
                  <IonItem
                    key={user.id}
                    style={{
                      '--background': 'white',
                      '--border-radius': '8px',
                      marginBottom: '12px'
                    } as any}
                  >
                    <div style={{ width: '100%', padding: '16px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                            {user.user_firstname} {user.user_lastname}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {user.user_email}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <IonBadge
                            style={{
                              fontSize: '10px',
                              '--background': getStatusColor(user.status),
                              '--color': 'white'
                            } as any}
                          >
                            {getStatusDisplay(user.status)}
                          </IonBadge>
                          {user.warnings > 0 && (
                            <IonBadge color="warning" style={{ fontSize: '10px' }}>
                              {user.warnings} ⚠️
                            </IonBadge>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <IonButton
                          size="small"
                          fill="outline"
                          color="warning"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserAction('warn');
                            setShowActionAlert(true);
                          }}
                          disabled={user.status === 'banned'}
                        >
                          <IonIcon icon={warningOutline} slot="start" />
                          Warn
                        </IonButton>
                        
                        <IonButton
                          size="small"
                          fill="outline"
                          color="medium"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserAction(user.status === 'suspended' ? 'activate' : 'suspend');
                            setShowActionAlert(true);
                          }}
                          disabled={user.status === 'banned'}
                        >
                          <IonIcon icon={user.status === 'suspended' ? checkmarkCircleOutline : pauseCircleOutline} slot="start" />
                          {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </IonButton>
                        
                        <IonButton
                          size="small"
                          fill="outline"
                          color="danger"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserAction('ban');
                            setShowActionAlert(true);
                          }}
                          disabled={user.status === 'banned'}
                        >
                          <IonIcon icon={banOutline} slot="start" />
                          Ban
                        </IonButton>
                      </div>
                    </div>
                  </IonItem>
                ))}
              </IonList>

              {filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <IonIcon icon={peopleOutline} style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No users found</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    {searchText ? 'Try adjusting your search terms' : 'No users match the current filters'}
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        {/* Action Confirmation Alert */}
        <IonAlert
          isOpen={showActionAlert}
          onDidDismiss={() => setShowActionAlert(false)}
          header={'User Action'}
          message={`Are you sure you want to ${userAction} ${selectedUser?.user_firstname} ${selectedUser?.user_lastname}?`}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { 
              text: 'Confirm', 
              role: 'confirm', 
              handler: () => handleUserAction(userAction)
            }
          ]}
        />

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

export default AdminUsers;