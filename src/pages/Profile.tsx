// src/pages/Profile.tsx - WITH SKELETON LOADING
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
    IonAlert,
    IonSkeletonText
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';
import { useHistory } from 'react-router-dom';
import { personOutline, mailOutline, locationOutline, callOutline, cameraOutline, checkmarkCircleOutline, arrowBackOutline, keyOutline } from 'ionicons/icons';

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

    // Skeleton Loading Component
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
                {/* Header Skeleton */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '40px 32px 30px',
                    textAlign: 'center',
                    position: 'relative'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <IonSkeletonText
                            animated
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                margin: '0 auto 20px'
                            }}
                        />
                        <IonSkeletonText
                            animated
                            style={{
                                width: '60%',
                                height: '28px',
                                borderRadius: '4px',
                                margin: '0 auto 8px'
                            }}
                        />
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

                    {/* Other Fields Skeleton */}
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} style={{ marginBottom: '20px' }}>
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
                    ))}

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

    const handleOtpChange = (e: CustomEvent) => {
        const value = e.detail.value!;
        const numericValue = value.replace(/\D/g, '').slice(0, 6);
        setOtp(numericValue);

        // Auto-verify when 6 digits are entered
        if (numericValue.length === 6) {
            handleVerifyOtp();
        }
    };

    if (isPageLoading) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar style={{
                        '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '--color': 'white'
                    } as any}>
                        <IonSkeletonText
                            animated
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                marginLeft: '16px'
                            }}
                        />
                        <IonSkeletonText
                            animated
                            style={{
                                width: '150px',
                                height: '20px',
                                borderRadius: '4px',
                                margin: '0 auto'
                            }}
                        />
                    </IonToolbar>
                </IonHeader>

                <IonContent style={{
                    '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
                } as any}>
                    <SkeletonLoader />
                </IonContent>
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
                    <IonButton
                        slot="start"
                        fill="clear"
                        onClick={handleBack}
                        style={{ color: 'white' }}
                    >
                        <IonIcon icon={arrowBackOutline} />
                    </IonButton>
                    <IonTitle style={{ fontWeight: 'bold' }}>Account Management</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent style={{
                '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
            } as any}>
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
                                        onClick={handleVerifyOtp}
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
                <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
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
                            width: '90%',
                            background: 'white',
                            borderRadius: '20px',
                            padding: '40px 32px',
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
                    message={toastMessage}
                    duration={3000}
                />

                <IonLoading isOpen={isLoading} message="Please wait..." />
            </IonContent >
        </IonPage >
    );
};

export default Profile;