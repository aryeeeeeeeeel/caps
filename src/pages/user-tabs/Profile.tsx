// src/pages/user-tabs/Profile.tsx - FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonAvatar,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonBackButton,
    IonButtons,
    IonToast,
    IonLoading,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonModal,
    IonSkeletonText,
    IonPopover,
    IonBadge,
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonRouterOutlet
} from '@ionic/react';
import { supabase } from '../../utils/supabaseClient';
import { logUserProfileUpdate, logUserLogout } from '../../utils/activityLogger';
import { useHistory } from 'react-router-dom';
import { personOutline, mailOutline, locationOutline, callOutline, cameraOutline, checkmarkCircleOutline, arrowBackOutline, keyOutline, personCircle, notificationsOutline, logOutOutline, chatbubbleOutline, documentTextOutline, homeOutline, addCircleOutline, timeOutline, mapOutline } from 'ionicons/icons';

const Profile: React.FC = () => {
    const history = useHistory();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [pendingAvatarUrl, setPendingAvatarUrl] = useState('');
    const [isAvatarChanged, setIsAvatarChanged] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Header-related state variables
    const [userProfile, setUserProfile] = useState<any>(null);
    const [showProfilePopover, setShowProfilePopover] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [prevUnreadCount, setPrevUnreadCount] = useState(0);
    const [userReports, setUserReports] = useState<any[]>([]);
    const [latestNotificationType, setLatestNotificationType] = useState<'pending' | 'resolved' | null>(null);

    // Tab configuration
    const tabs = [
        { name: 'Dashboard', tab: 'dashboard', url: '/it35-lab2/app/dashboard', icon: homeOutline },
        { name: 'Report an Incident', tab: 'submit', url: '/it35-lab2/app/submit', icon: addCircleOutline },
        { name: 'My Reports', tab: 'map', url: '/it35-lab2/app/map', icon: mapOutline },
        { name: 'History', tab: 'reports', url: '/it35-lab2/app/history', icon: timeOutline },
    ];

    // Default avatar as an icon (like Facebook)
    const DefaultAvatarIcon = () => (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f4f5f8',
            borderRadius: '50%'
        }}>
            <IonIcon
                icon={personOutline}
                style={{
                    fontSize: '48px',
                    color: '#666'
                }}
            />
        </div>
    );

    useEffect(() => {
        const fetchUserData = async () => {
            setIsPageLoading(true);
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;

                if (!user) {
                    history.push('/login');
                    return;
                }
                setUser(user);
                console.log("Auth user:", user);

                // Fetch user profile data for header
                if (user.email) {
                    await fetchUserProfile(user.email);
                    await fetchUserReports(user.email);
                    await fetchNotifications(user.email);
                }

                await ensureProfileExists(user);

            } catch (error: any) {
                console.error('Error fetching user data:', error);
                setToastMessage('Failed to load profile. Please try again.');
                setShowToast(true);
            } finally {
                setTimeout(() => {
                    setIsPageLoading(false);
                }, 800);
            }
        };

        fetchUserData();
    }, [history]);

    const ensureProfileExists = async (authUser: any) => {
        try {
            console.log("Looking for user with auth_uuid:", authUser.id);

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('auth_uuid', authUser.id)
                .maybeSingle();

            console.log("User data by auth_uuid:", userData, "Error:", userError);

            if (userError && userError.code === '406') {
                console.log('auth_uuid column might not exist or RLS policy blocking access');
            } else if (userData && !userError) {
                console.log("Found user in 'users' table:", userData);
                setProfile(userData);
                setFirstName(userData.user_firstname || '');
                setLastName(userData.user_lastname || '');
                setUsername(userData.username || '');
                setEmail(userData.user_email || authUser?.email || '');
                setAddress(userData.user_address || '');
                setContactNumber(userData.user_contact_number || '');
                setAvatarUrl(userData.user_avatar_url || '');
                return;
            }

            if (authUser.email) {
                console.log("Looking for user by email:", authUser.email);
                const { data: userByEmail, error: emailError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('user_email', authUser.email)
                    .single();

                console.log("User data by email:", userByEmail, "Error:", emailError);

                if (userByEmail && !emailError) {
                    console.log("Found user by email in 'users' table:", userByEmail);

                    try {
                        if (!userByEmail.auth_uuid) {
                            const { error: updateError } = await supabase
                                .from('users')
                                .update({ auth_uuid: authUser.id })
                                .eq('user_id', userByEmail.user_id);

                            if (updateError) {
                                console.log('Cannot update auth_uuid, column might not exist:', updateError);
                            } else {
                                console.log('Successfully updated auth_uuid');
                            }
                        }
                    } catch (updateError) {
                        console.log('Error updating auth_uuid:', updateError);
                    }

                    setProfile(userByEmail);
                    setFirstName(userByEmail.user_firstname || '');
                    setLastName(userByEmail.user_lastname || '');
                    setUsername(userByEmail.username || '');
                    setEmail(userByEmail.user_email || '');
                    setAddress(userByEmail.user_address || '');
                    setContactNumber(userByEmail.user_contact_number || '');
                    setAvatarUrl(userByEmail.user_avatar_url || '');
                    return;
                }
            }

            console.error('USER NOT FOUND IN DATABASE');
            setToastMessage('Profile not found. Please contact support.');
            setShowToast(true);

            setFirstName(authUser?.user_metadata?.first_name || '');
            setLastName(authUser?.user_metadata?.last_name || '');
            setUsername(authUser?.user_metadata?.username || authUser?.email?.split('@')[0] || '');
            setEmail(authUser?.email || '');
            setAddress(authUser?.user_metadata?.address || '');
            setContactNumber(authUser?.user_metadata?.contact_number || '');

        } catch (error) {
            console.error('Error fetching profile:', error);
            setToastMessage('Failed to load profile data.');
            setShowToast(true);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!user) return;

        setIsLoading(true);
        const file = e.target.files[0];

        if (file.size > 5 * 1024 * 1024) {
            setToastMessage('File size too large. Please select an image under 5MB.');
            setShowToast(true);
            setIsLoading(false);
            return;
        }

        if (!file.type.startsWith('image/')) {
            setToastMessage('Please select a valid image file.');
            setShowToast(true);
            setIsLoading(false);
            return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        try {
            const bucketNames = ['user-avatars', 'avatars'];
            let uploadSuccess = false;
            let publicUrl = '';

            for (const bucketName of bucketNames) {
                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from(bucketName)
                        .getPublicUrl(filePath);
                    publicUrl = urlData.publicUrl;
                    uploadSuccess = true;
                    break;
                }
            }

            if (!uploadSuccess) {
                setToastMessage('Failed to upload image. Storage not configured.');
                return;
            }

            setPendingAvatarUrl(publicUrl);
            setIsAvatarChanged(true);
            setAvatarUrl(publicUrl);

            setToastMessage('Profile picture selected. Please verify changes to save.');
            setShowToast(true);
        } catch (error: any) {
            console.error('Upload error:', error);
            setToastMessage('Failed to upload image. Please try again.');
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenVerificationModal = () => {
        if (!firstName.trim() || !lastName.trim()) {
            setToastMessage("Please enter your first and last name.");
            setShowToast(true);
            return;
        }

        if (!username.trim()) {
            setToastMessage("Please enter a username.");
            setShowToast(true);
            return;
        }

        if (!email.trim()) {
            setToastMessage("Please enter your email address.");
            setShowToast(true);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setToastMessage("Please enter a valid email address.");
            setShowToast(true);
            return;
        }

        if (!contactNumber.trim()) {
            setToastMessage("Please enter your contact number.");
            setShowToast(true);
            return;
        }

        const hasChanges =
            firstName !== profile?.user_firstname ||
            lastName !== profile?.user_lastname ||
            username !== profile?.username ||
            email !== profile?.user_email ||
            address !== profile?.user_address ||
            contactNumber !== profile?.user_contact_number ||
            isAvatarChanged;

        if (!hasChanges) {
            setToastMessage("No changes detected.");
            setShowToast(true);
            return;
        }

        setShowVerificationModal(true);
    };

    const handleSendOtp = async () => {
        setIsLoading(true);
        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: user.email,
                options: {
                    shouldCreateUser: false,
                }
            });

            if (otpError) {
                console.error('OTP send error:', otpError);
                setToastMessage('Failed to send verification code. Please try again.');
                setShowToast(true);
                return;
            }

            setIsOtpSent(true);
            setShowVerificationModal(false);
            setShowOtpModal(true);
            setToastMessage('Verification code sent to your email!');
            setShowToast(true);

        } catch (error: any) {
            console.error('OTP send error:', error);
            setToastMessage('Failed to send verification code. Please try again.');
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) {
            setToastMessage("Please enter the verification code.");
            setShowToast(true);
            return;
        }

        setIsLoading(true);
        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: user.email,
                token: otp,
                type: 'email'
            });

            if (verifyError) {
                console.error('OTP verification error:', verifyError);
                setToastMessage('Invalid verification code. Please try again.');
                setShowToast(true);
                return;
            }

            await updateProfile();

        } catch (error: any) {
            console.error('OTP verification error:', error);
            setToastMessage('Failed to verify code. Please try again.');
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async () => {
        if (!user || !profile) return;

        try {
            const updateData: any = {
                user_firstname: firstName,
                user_lastname: lastName,
                username: username,
                user_email: email,
                user_address: address,
                user_contact_number: contactNumber
            };

            if (isAvatarChanged && pendingAvatarUrl) {
                updateData.user_avatar_url = pendingAvatarUrl;
            }

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('user_id', profile.user_id);

            if (error) {
                console.error('Update error:', error);
                throw error;
            }

            setIsAvatarChanged(false);
            setPendingAvatarUrl('');
            setOtp('');
            setIsOtpSent(false);

            // Log user profile update activity
            const updatedFields = [];
            if (firstName !== profile?.user_firstname) updatedFields.push('first_name');
            if (lastName !== profile?.user_lastname) updatedFields.push('last_name');
            if (username !== profile?.username) updatedFields.push('username');
            if (email !== profile?.user_email) updatedFields.push('email');
            if (address !== profile?.user_address) updatedFields.push('address');
            if (contactNumber !== profile?.user_contact_number) updatedFields.push('contact_number');
            if (isAvatarChanged) updatedFields.push('avatar');

            await logUserProfileUpdate(updatedFields, user.email);

            setShowOtpModal(false);
            setShowSuccessModal(true);

        } catch (error: any) {
            console.error('Update error:', error);
            setToastMessage('Failed to update profile. Please try again.');
            setShowToast(true);
        }
    };

    const handleBack = () => {
        history.goBack();
    };

    // Header-related functions
    const fetchUserProfile = async (userEmail: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('user_email', userEmail)
                .single();

            if (!error && data) {
                setUserProfile(data);
            } else if (error) {
                console.error('Error fetching user profile:', error);
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
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
            console.log('Fetching notifications...');
            // Fetch from notifications table
            const { data: notificationsData, error: notificationsError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_email', email)
                .eq('read', false);

            if (notificationsError) {
                console.error('Notifications error:', notificationsError);
            }

            // Fetch from incident_reports table with status information
            const { data: incidentUpdates, error: reportsError } = await supabase
                .from('incident_reports')
                .select('id, title, admin_response, updated_at, read, status')
                .eq('reporter_email', email)
                .not('admin_response', 'is', null)
                .eq('read', false)
                .order('updated_at', { ascending: false });

            if (reportsError) {
                console.error('Reports error:', reportsError);
            }

            // Calculate total unread count
            const unreadCount = (notificationsData?.length || 0) + (incidentUpdates?.length || 0);
            console.log('New unread count:', unreadCount, 'Previous:', prevUnreadCount);
            setUnreadNotifications(unreadCount);

            // Show toast if new notifications arrive and determine the type
            if (unreadCount > prevUnreadCount) {
                console.log('Showing toast for new notifications');

                // Determine the type of latest notification
                let notificationType: 'pending' | 'resolved' | null = null;

                // Check if there are new incident updates
                if (incidentUpdates && incidentUpdates.length > 0) {
                    // Get the most recent update
                    const latestUpdate = incidentUpdates[0];
                    if (latestUpdate.status === 'resolved') {
                        notificationType = 'resolved';
                    } else if (latestUpdate.status === 'active') {
                        notificationType = 'pending';
                    }
                }

                // If no incident updates, check notifications table
                if (!notificationType && notificationsData && notificationsData.length > 0) {
                    // For general notifications, we'll assume they're about pending reports
                    // unless we can determine otherwise from the notification content
                    notificationType = 'pending';
                }

                setLatestNotificationType(notificationType);
                setShowToast(true);
            }
            setPrevUnreadCount(unreadCount);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const refreshNotificationCount = async () => {
        if (user?.email) {
            await fetchNotifications(user.email);
        }
    };

    const handleSignOut = async () => {
        // Log user logout activity before signing out
        await logUserLogout(user?.email);
        await supabase.auth.signOut();
        setShowProfilePopover(false);
        history.push('/it35-lab2');
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

    const handleOtpChange = (e: CustomEvent) => {
        const value = e.detail.value!;
        const numericValue = value.replace(/\D/g, '').slice(0, 6);
        setOtp(numericValue);
    };

    // Skeleton Loading Component - UPDATED TO MATCH CONTENT
    const SkeletonLoader = () => (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <IonCard style={{
                maxWidth: '500px',
                width: '100%',
                borderRadius: '20px',
                boxShadow: '0 20px 64px rgba(0,0,0,0.12)',
                border: '1px solid rgba(226,232,240,0.8)',
                overflow: 'hidden'
            }}>
                {/* Header Skeleton - Updated to match actual header */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '40px 32px 30px',
                    textAlign: 'center',
                    position: 'relative'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* Avatar Skeleton */}
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            margin: '0 auto 20px',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <IonSkeletonText
                                animated
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%'
                                }}
                            />
                        </div>

                        {/* Title Skeleton */}
                        <IonSkeletonText
                            animated
                            style={{
                                width: '60%',
                                height: '28px',
                                borderRadius: '4px',
                                margin: '0 auto 12px'
                            }}
                        />

                        {/* Subtitle Skeleton */}
                        <IonSkeletonText
                            animated
                            style={{
                                width: '80%',
                                height: '14px',
                                borderRadius: '4px',
                                margin: '0 auto'
                            }}
                        />
                    </div>
                </div>

                <IonCardContent style={{ padding: '40px 32px' }}>
                    {/* Name Fields Skeleton */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <IonSkeletonText
                                animated
                                style={{
                                    width: '40%',
                                    height: '14px',
                                    borderRadius: '4px',
                                    marginBottom: '8px'
                                }}
                            />
                            <IonSkeletonText
                                animated
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    borderRadius: '10px'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <IonSkeletonText
                                animated
                                style={{
                                    width: '40%',
                                    height: '14px',
                                    borderRadius: '4px',
                                    marginBottom: '8px'
                                }}
                            />
                            <IonSkeletonText
                                animated
                                style={{
                                    width: '100%',
                                    height: '48px',
                                    borderRadius: '10px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Username Field Skeleton */}
                    <div style={{ marginBottom: '20px' }}>
                        <IonSkeletonText
                            animated
                            style={{
                                width: '30%',
                                height: '14px',
                                borderRadius: '4px',
                                marginBottom: '8px'
                            }}
                        />
                        <IonSkeletonText
                            animated
                            style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '10px'
                            }}
                        />
                    </div>

                    {/* Email Field Skeleton */}
                    <div style={{ marginBottom: '20px' }}>
                        <IonSkeletonText
                            animated
                            style={{
                                width: '35%',
                                height: '14px',
                                borderRadius: '4px',
                                marginBottom: '8px'
                            }}
                        />
                        <IonSkeletonText
                            animated
                            style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '10px'
                            }}
                        />
                    </div>

                    {/* Address Field Skeleton */}
                    <div style={{ marginBottom: '20px' }}>
                        <IonSkeletonText
                            animated
                            style={{
                                width: '25%',
                                height: '14px',
                                borderRadius: '4px',
                                marginBottom: '8px'
                            }}
                        />
                        <IonSkeletonText
                            animated
                            style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '10px'
                            }}
                        />
                    </div>

                    {/* Contact Number Field Skeleton */}
                    <div style={{ marginBottom: '20px' }}>
                        <IonSkeletonText
                            animated
                            style={{
                                width: '40%',
                                height: '14px',
                                borderRadius: '4px',
                                marginBottom: '8px'
                            }}
                        />
                        <IonSkeletonText
                            animated
                            style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '10px'
                            }}
                        />
                    </div>

                    {/* Button Skeleton */}
                    <IonSkeletonText
                        animated
                        style={{
                            width: '100%',
                            height: '52px',
                            borderRadius: '12px',
                            marginTop: '20px'
                        }}
                    />
                </IonCardContent>
            </IonCard>
        </div>
    );

    if (isPageLoading) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar style={{
                        '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '--color': 'white'
                    } as any}>
                        <IonButtons slot="start" />
                        <IonTitle style={{
                            fontWeight: 'bold',
                            fontSize: '20px'
                        }}>iAMUMA ta</IonTitle>
                        <IonButtons slot="end">
                            <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px' }} />
                            <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent style={{
                    '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
                } as any} scrollY={true}>
                    <SkeletonLoader />
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

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar style={{
                    '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '--color': 'white'
                } as any}>
                    <IonButtons slot="start">
                        {/* Back button removed */}
                    </IonButtons>

                    <IonTitle style={{
                        fontWeight: 'bold',
                        fontSize: '20px'
                    }}>iAMUMA ta</IonTitle>

                    <IonButtons slot="end">
                        {/* Notifications Button */}
                        <IonButton
                            fill="clear"
                            onClick={() => handlePopoverNavigation('/it35-lab2/app/notifications')}
                            style={{
                                color: 'white',
                                position: 'relative'
                            }}
                        >
                            <IonIcon icon={notificationsOutline} slot="icon-only" />
                            {unreadNotifications > 0 && (
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
                                    {unreadNotifications}
                                </IonBadge>
                            )}
                        </IonButton>

                        {/* Profile Button */}
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

            {/* Profile Popover */}
            <IonPopover
                isOpen={showProfilePopover}
                event={popoverEvent}
                onDidDismiss={() => setShowProfilePopover(false)}
            >
                <IonContent>
                    <div style={{ padding: '0', minWidth: '280px' }}>
                        {user && (
                            <>
                                {/* Profile Header */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    padding: '24px 20px',
                                    textAlign: 'center',
                                    color: 'white'
                                }}>
                                    {userProfile?.user_avatar_url ? (
                                        <IonAvatar style={{
                                            width: '60px',
                                            height: '60px',
                                            margin: '0 auto 12px',
                                            border: '3px solid rgba(255,255,255,0.3)'
                                        }}>
                                            <img src={userProfile.user_avatar_url} alt="Profile" />
                                        </IonAvatar>
                                    ) : (
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
                                            <IonIcon icon={personCircle} style={{ fontSize: '40px' }} />
                                        </div>
                                    )}

                                    <h3 style={{
                                        margin: '0 0 4px 0',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                    }}>
                                        {userProfile?.user_firstname && userProfile?.user_lastname
                                            ? `${userProfile.user_firstname} ${userProfile.user_lastname}`
                                            : 'Community Member'}
                                    </h3>
                                    <p style={{
                                        margin: '0 0 8px 0',
                                        fontSize: '14px',
                                        opacity: 0.9,
                                        textAlign: 'center'
                                    }}>
                                        {user.email}
                                    </p>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        borderRadius: '12px',
                                        padding: '6px 12px',
                                        display: 'inline-block'
                                    }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                            {userReports.length} Reports Submitted
                                        </span>
                                    </div>
                                </div>

                                {/* Profile Menu Items */}
                                <div style={{ padding: '12px 0' }}>
                                    <IonItem
                                        button
                                        onClick={() => handlePopoverNavigation('/it35-lab2/app/profile')}
                                        style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                                    >
                                        <IonIcon icon={personCircle} slot="start" color="primary" />
                                        <IonLabel>
                                            <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>View Profile</h3>
                                            <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Manage account settings</p>
                                        </IonLabel>
                                    </IonItem>

                                    <IonItem
                                        button
                                        onClick={() => handlePopoverNavigation('/it35-lab2/app/feedback')}
                                        style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                                    >
                                        <IonIcon icon={chatbubbleOutline} slot="start" color="success" />
                                        <IonLabel>
                                            <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Give Feedback</h3>
                                            <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Rate our response service</p>
                                        </IonLabel>
                                    </IonItem>

                                    <IonItem
                                        button
                                        onClick={() => handlePopoverNavigation('/it35-lab2/app/activity-logs')}
                                        style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                                    >
                                        <IonIcon icon={documentTextOutline} slot="start" color="primary" />
                                        <IonLabel>
                                            <h3 style={{ margin: '8px 0', fontSize: '15px', fontWeight: '500' }}>Activity Logs</h3>
                                            <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>View your account activities</p>
                                        </IonLabel>
                                    </IonItem>

                                    <IonItem
                                        button
                                        onClick={handleSignOut}
                                        style={{ '--padding-start': '20px', '--inner-padding-end': '20px' }}
                                    >
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

            {/* MAIN CONTENT - FIXED SCROLLING ISSUE */}
            <IonContent scrollY={true} style={{
                '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
            } as any}>
                <div style={{
                    minHeight: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <IonCard style={{
                        maxWidth: '500px',
                        width: '100%',
                        borderRadius: '20px',
                        boxShadow: '0 20px 64px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(226,232,240,0.8)',
                        overflow: 'hidden'
                    }}>
                        {/* Header Section */}
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '40px 32px 30px',
                            textAlign: 'center',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
                                pointerEvents: 'none'
                            }}></div>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                {/* Profile Picture */}
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '50%',
                                    margin: '0 auto 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(10px)',
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'pointer'
                                }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Profile"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <DefaultAvatarIcon />
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: '5px',
                                            right: '5px',
                                            background: 'rgba(255,255,255,0.9)',
                                            borderRadius: '50%',
                                            width: '30px',
                                            height: '30px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        <IonIcon icon={cameraOutline} style={{
                                            fontSize: '16px',
                                            color: '#667eea'
                                        }} />
                                    </div>
                                </div>

                                <h1 style={{
                                    fontSize: '28px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    margin: '0 0 8px 0',
                                    letterSpacing: '0.5px'
                                }}>Manage Account</h1>

                                <p style={{
                                    fontSize: '14px',
                                    color: 'rgba(255,255,255,0.9)',
                                    margin: 0
                                }}>Update your personal information</p>
                            </div>
                        </div>

                        <IonCardContent style={{ padding: '40px 32px' }}>
                            <IonGrid>
                                <IonRow>
                                    <IonCol size="6">
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                <IonIcon icon={personOutline} style={{
                                                    fontSize: '16px',
                                                    color: '#4a5568',
                                                    marginRight: '6px'
                                                }} />
                                                <label style={{
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#2d3748'
                                                }}>First Name</label>
                                            </div>
                                            <IonInput
                                                fill="outline"
                                                type="text"
                                                placeholder="John"
                                                value={firstName}
                                                onIonChange={e => setFirstName(e.detail.value!)}
                                                style={{
                                                    '--border-radius': '10px',
                                                    '--border-color': '#e2e8f0',
                                                    '--padding-start': '12px',
                                                    '--padding-end': '12px',
                                                    fontSize: '15px'
                                                } as any}
                                            />
                                        </div>
                                    </IonCol>
                                    <IonCol size="6">
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                <IonIcon icon={personOutline} style={{
                                                    fontSize: '16px',
                                                    color: '#4a5568',
                                                    marginRight: '6px'
                                                }} />
                                                <label style={{
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#2d3748'
                                                }}>Last Name</label>
                                            </div>
                                            <IonInput
                                                fill="outline"
                                                type="text"
                                                placeholder="Doe"
                                                value={lastName}
                                                onIonChange={e => setLastName(e.detail.value!)}
                                                style={{
                                                    '--border-radius': '10px',
                                                    '--border-color': '#e2e8f0',
                                                    '--padding-start': '12px',
                                                    '--padding-end': '12px',
                                                    fontSize: '15px'
                                                } as any}
                                            />
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonGrid>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '8px'
                                }}>
                                    <IonIcon icon={personOutline} style={{
                                        fontSize: '16px',
                                        color: '#4a5568',
                                        marginRight: '6px'
                                    }} />
                                    <label style={{
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: '#2d3748'
                                    }}>Username</label>
                                </div>
                                <IonInput
                                    fill="outline"
                                    type="text"
                                    placeholder="Choose a unique username"
                                    value={username}
                                    onIonChange={e => setUsername(e.detail.value!)}
                                    style={{
                                        '--border-radius': '10px',
                                        '--border-color': '#e2e8f0',
                                        '--padding-start': '12px',
                                        '--padding-end': '12px',
                                        fontSize: '15px'
                                    } as any}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '8px'
                                }}>
                                    <IonIcon icon={mailOutline} style={{
                                        fontSize: '16px',
                                        color: '#4a5568',
                                        marginRight: '6px'
                                    }} />
                                    <label style={{
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: '#2d3748'
                                    }}>Email Address</label>
                                </div>
                                <IonInput
                                    fill="outline"
                                    type="email"
                                    placeholder="your.name@example.com"
                                    value={email}
                                    onIonChange={e => setEmail(e.detail.value!)}
                                    style={{
                                        '--border-radius': '10px',
                                        '--border-color': '#e2e8f0',
                                        '--padding-start': '12px',
                                        '--padding-end': '12px',
                                        fontSize: '15px'
                                    } as any}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '8px'
                                }}>
                                    <IonIcon icon={locationOutline} style={{
                                        fontSize: '16px',
                                        color: '#4a5568',
                                        marginRight: '6px'
                                    }} />
                                    <label style={{
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: '#2d3748'
                                    }}>Address</label>
                                </div>
                                <IonInput
                                    fill="outline"
                                    type="text"
                                    placeholder="Your full address"
                                    value={address}
                                    onIonChange={e => setAddress(e.detail.value!)}
                                    style={{
                                        '--border-radius': '10px',
                                        '--border-color': '#e2e8f0',
                                        '--padding-start': '12px',
                                        '--padding-end': '12px',
                                        fontSize: '15px'
                                    } as any}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '8px'
                                }}>
                                    <IonIcon icon={callOutline} style={{
                                        fontSize: '16px',
                                        color: '#4a5568',
                                        marginRight: '6px'
                                    }} />
                                    <label style={{
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: '#2d3748'
                                    }}>Contact Number</label>
                                </div>
                                <IonInput
                                    fill="outline"
                                    type="tel"
                                    placeholder="e.g., +639123456789"
                                    value={contactNumber}
                                    onIonChange={e => setContactNumber(e.detail.value!)}
                                    style={{
                                        '--border-radius': '10px',
                                        '--border-color': '#e2e8f0',
                                        '--padding-start': '12px',
                                        '--padding-end': '12px',
                                        fontSize: '15px'
                                    } as any}
                                />
                            </div>

                            <IonButton
                                onClick={handleOpenVerificationModal}
                                expand="block"
                                size="large"
                                disabled={isLoading}
                                style={{
                                    '--border-radius': '12px',
                                    '--padding-top': '16px',
                                    '--padding-bottom': '16px',
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    height: '52px',
                                    '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '--color': 'white',
                                    marginBottom: '20px'
                                } as any}
                            >
                                UPDATE PROFILE
                            </IonButton>
                        </IonCardContent>
                    </IonCard>
                </div>

                {/* Verification Modal */}
                <IonModal
                    isOpen={showVerificationModal}
                    onDidDismiss={() => setShowVerificationModal(false)}
                    style={{
                        '--height': 'auto',
                        '--width': '90%',
                        '--max-width': '450px',
                        '--border-radius': '20px'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)'
                    }}>
                        <IonCard style={{
                            width: '100%',
                            borderRadius: '20px',
                            boxShadow: '0 20px 64px rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                            margin: '0'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                padding: '24px 20px',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '50%',
                                    margin: '0 auto 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <IonIcon icon={checkmarkCircleOutline} style={{
                                        fontSize: '24px',
                                        color: 'white'
                                    }} />
                                </div>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    margin: '0 0 6px 0'
                                }}>Confirm Changes</h2>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.9)',
                                    margin: 0
                                }}>Please verify your updated information</p>
                            </div>

                            <IonCardContent style={{ padding: '24px 20px' }}>
                                {isAvatarChanged && (
                                    <div style={{
                                        marginBottom: '16px',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#4a5568',
                                            marginBottom: '8px'
                                        }}>New Profile Picture</p>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%',
                                            margin: '0 auto',
                                            overflow: 'hidden',
                                            border: '2px solid #e2e8f0'
                                        }}>
                                            <img
                                                src={pendingAvatarUrl}
                                                alt="New Profile"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginBottom: '16px' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#4a5568',
                                        marginBottom: '4px'
                                    }}>Full Name</p>
                                    <p style={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: '#2d3748',
                                        margin: 0
                                    }}>{firstName} {lastName}</p>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#4a5568',
                                        marginBottom: '4px'
                                    }}>Username</p>
                                    <p style={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: '#2d3748',
                                        margin: 0
                                    }}>{username}</p>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#4a5568',
                                        marginBottom: '4px'
                                    }}>Email Address</p>
                                    <p style={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: '#2d3748',
                                        margin: 0
                                    }}>{email}</p>
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#4a5568',
                                        marginBottom: '4px'
                                    }}>Address</p>
                                    <p style={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: '#2d3748',
                                        margin: 0
                                    }}>{address}</p>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#4a5568',
                                        marginBottom: '4px'
                                    }}>Contact Number</p>
                                    <p style={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: '#2d3748',
                                        margin: 0
                                    }}>{contactNumber}</p>
                                </div>

                                <IonButton
                                    onClick={handleSendOtp}
                                    expand="block"
                                    size="large"
                                    disabled={isLoading}
                                    style={{
                                        '--border-radius': '10px',
                                        '--padding-top': '14px',
                                        '--padding-bottom': '14px',
                                        fontWeight: '600',
                                        fontSize: '15px',
                                        height: '48px',
                                        '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        '--color': 'white',
                                        marginBottom: '12px'
                                    } as any}
                                >
                                    {isLoading ? 'Sending Code...' : 'SEND VERIFICATION CODE'}
                                </IonButton>

                                <IonButton
                                    expand="block"
                                    fill="clear"
                                    onClick={() => setShowVerificationModal(false)}
                                    style={{
                                        color: '#718096',
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}
                                >
                                    Back to Edit
                                </IonButton>
                            </IonCardContent>
                        </IonCard>
                    </div>
                </IonModal>

                {/* OTP Verification Modal */}
                <IonModal
                    isOpen={showOtpModal}
                    onDidDismiss={() => setShowOtpModal(false)}
                    style={{
                        '--height': 'auto',
                        '--width': '90%',
                        '--max-width': '400px',
                        '--border-radius': '20px'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)'
                    }}>
                        <IonCard style={{
                            width: '100%',
                            borderRadius: '20px',
                            boxShadow: '0 20px 64px rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                            margin: '0'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #3182ce 0%, #2c5282 100%)',
                                padding: '24px 20px',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '50%',
                                    margin: '0 auto 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <IonIcon icon={checkmarkCircleOutline} style={{
                                        fontSize: '24px',
                                        color: 'white'
                                    }} />
                                </div>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    margin: '0 0 6px 0'
                                }}>Security Verification</h2>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.9)',
                                    margin: 0
                                }}>We've sent a 6-digit code to</p>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'white',
                                    fontWeight: '600',
                                    margin: '2px 0 0 0'
                                }}>{user?.email}</p>
                            </div>

                            <IonCardContent style={{ padding: '24px 20px' }}>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleVerifyOtp();
                                    }}
                                >
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#2d3748',
                                            display: 'block',
                                            marginBottom: '10px'
                                        }}>Verification Code</label>
                                        <IonInput
                                            fill="outline"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxlength={6}
                                            placeholder="000000"
                                            value={otp}
                                            onIonChange={handleOtpChange}
                                            onKeyPress={(e: React.KeyboardEvent) => {
                                                // Allow only numbers and control keys
                                                if (!/^\d$/.test(e.key) &&
                                                    e.key !== 'Backspace' &&
                                                    e.key !== 'Delete' &&
                                                    e.key !== 'Tab' &&
                                                    e.key !== 'Enter' &&
                                                    e.key !== 'ArrowLeft' &&
                                                    e.key !== 'ArrowRight' &&
                                                    e.key !== 'Home' &&
                                                    e.key !== 'End') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            style={{
                                                '--border-radius': '10px',
                                                '--border-color': '#e2e8f0',
                                                '--padding-start': '16px',
                                                '--padding-end': '16px',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                textAlign: 'center',
                                                letterSpacing: '3px'
                                            } as any}
                                        />
                                    </div>

                                    <IonButton
                                        type="submit"
                                        expand="block"
                                        size="large"
                                        disabled={isLoading || otp.length < 6}
                                        style={{
                                            '--border-radius': '10px',
                                            '--padding-top': '14px',
                                            '--padding-bottom': '14px',
                                            fontWeight: '600',
                                            fontSize: '15px',
                                            height: '48px',
                                            '--background': 'linear-gradient(135deg, #3182ce 0%, #2c5282 100%)',
                                            '--color': 'white',
                                            marginBottom: '12px'
                                        } as any}
                                    >
                                        <IonIcon icon={keyOutline} slot="start" />
                                        {isLoading ? 'Verifying...' : 'VERIFY & UPDATE PROFILE'}
                                    </IonButton>
                                </form>

                                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#718096',
                                        margin: 0
                                    }}>
                                        Didn't receive the code?{' '}
                                        <span
                                            style={{
                                                color: '#667eea',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                            onClick={handleSendOtp}
                                        >
                                            Resend
                                        </span>
                                    </p>
                                </div>

                                <IonButton
                                    expand="block"
                                    fill="clear"
                                    onClick={() => {
                                        setShowOtpModal(false);
                                        setShowVerificationModal(true);
                                    }}
                                    style={{
                                        color: '#718096',
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}
                                >
                                    Back to Changes
                                </IonButton>
                            </IonCardContent>
                        </IonCard>
                    </div>
                </IonModal>

                {/* Success Modal */}
                <IonModal
                    isOpen={showSuccessModal}
                    onDidDismiss={() => setShowSuccessModal(false)}
                    style={{
                        '--height': 'auto',
                        '--width': '90%',
                        '--max-width': '400px',
                        '--border-radius': '20px'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            maxWidth: '400px',
                            width: '100%',
                            background: 'white',
                            borderRadius: '20px',
                            padding: '30px 24px',
                            boxShadow: '0 20px 64px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                borderRadius: '50%',
                                margin: '0 auto 30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <IonIcon icon={checkmarkCircleOutline} style={{
                                    fontSize: '50px',
                                    color: 'white'
                                }} />
                            </div>

                            <h1 style={{
                                fontSize: '32px',
                                fontWeight: 'bold',
                                color: '#065f46',
                                margin: '0 0 16px 0'
                            }}>Profile Updated!</h1>

                            <p style={{
                                fontSize: '16px',
                                color: '#047857',
                                lineHeight: '1.6',
                                margin: '0 0 30px 0'
                            }}>Your account information has been successfully updated.</p>

                            <IonButton
                                expand="block"
                                size="large"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    handleBack();
                                }}
                                style={{
                                    '--border-radius': '12px',
                                    '--padding-top': '16px',
                                    '--padding-bottom': '16px',
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    height: '52px',
                                    '--background': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    '--color': 'white'
                                } as any}
                            >
                                BACK TO PROFILE
                            </IonButton>
                        </div>
                    </div>
                </IonModal>

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={`You have ${unreadNotifications} unread notifications`}
                    duration={3000}
                    position="top"
                    color="primary"
                />

                <IonLoading isOpen={isLoading} message="Please wait..." />
            </IonContent>

            {/* Bottom Tab Bar */}
            <IonTabBar
                slot="bottom"
                style={{
                    '--background': 'white',
                    '--border': '1px solid #e2e8f0',
                    height: '70px',
                    paddingTop: '8px',
                    paddingBottom: '8px'
                } as any}
            >
                {tabs.map((item, index) => (
                    <IonTabButton
                        key={index}
                        tab={item.tab}
                        onClick={() => history.push(item.url)}
                        style={{
                            '--color': '#94a3b8',
                            '--color-selected': '#667eea'
                        } as any}
                    >
                        <IonIcon
                            icon={item.icon}
                            style={{
                                marginBottom: '4px',
                                fontSize: '22px'
                            }}
                        />
                        <IonLabel style={{
                            fontSize: '11px',
                            fontWeight: '600'
                        }}>
                            {item.name}
                        </IonLabel>
                    </IonTabButton>
                ))}
            </IonTabBar>
        </IonPage>
    );
};

export default Profile;