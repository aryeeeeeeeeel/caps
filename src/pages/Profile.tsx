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
    IonAlert
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
            setIsLoading(true);
            try {
                // Get current user
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;
                
                if (!user) {
                    history.push('/login');
                    return;
                }
                setUser(user);
                console.log("Auth user:", user);

                // Get profile data
                await ensureProfileExists(user);
                
            } catch (error: any) {
                console.error('Error fetching user data:', error);
                setToastMessage('Failed to load profile. Please try again.');
                setShowToast(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [history]);

    const ensureProfileExists = async (authUser: any) => {
        try {
            console.log("Looking for user with auth_uuid:", authUser.id);
            
            // FIRST: Try to get data from the 'users' table using auth_uuid
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('auth_uuid', authUser.id)
                .maybeSingle();

            console.log("User data by auth_uuid:", userData, "Error:", userError);

            // If we get a 406 error, it might mean auth_uuid column doesn't exist
            if (userError && userError.code === '406') {
                console.log('auth_uuid column might not exist or RLS policy blocking access');
                // Skip to email lookup
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

            // SECOND: Find by user_email
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
                    
                    // Update the auth_uuid if it's missing
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

            // If we reach here, the user doesn't exist in our database
            console.error('USER NOT FOUND IN DATABASE');
            setToastMessage('Profile not found. Please contact support.');
            setShowToast(true);
            
            // Use basic info from auth user as fallback
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
        
        // Validate file size (max 5MB)
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
            // Try different bucket names
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

            // Store the new avatar URL temporarily instead of updating immediately
            setPendingAvatarUrl(publicUrl);
            setIsAvatarChanged(true);
            
            // Show preview of new avatar
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

        // Check if there are any changes
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
            // Send OTP to user's email for verification
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
            // Verify the OTP
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

            // OTP verified successfully, now update the profile
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

            // Only include avatar if it was changed
            if (isAvatarChanged && pendingAvatarUrl) {
                updateData.user_avatar_url = pendingAvatarUrl;
            }

            // Update using user_id
            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('user_id', profile.user_id);

            if (error) {
                console.error('Update error:', error);
                throw error;
            }

            // Reset states
            setIsAvatarChanged(false);
            setPendingAvatarUrl('');
            setOtp('');
            setIsOtpSent(false);
            
            // Show success
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
                            {/* ... (rest of the form inputs remain the same) ... */}
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
                <IonModal isOpen={showVerificationModal} onDidDismiss={() => setShowVerificationModal(false)}>
                    <IonContent style={{
                        '--background': 'linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%)',
                    } as any}>
                        <div style={{
                            minHeight: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}>
                            <IonCard style={{
                                maxWidth: '450px',
                                width: '100%',
                                borderRadius: '20px',
                                boxShadow: '0 20px 64px rgba(0,0,0,0.15)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    padding: '30px 24px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        margin: '0 auto 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <IonIcon icon={checkmarkCircleOutline} style={{ 
                                            fontSize: '28px',
                                            color: 'white'
                                        }} />
                                    </div>
                                    <h2 style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        margin: '0 0 8px 0'
                                    }}>Confirm Changes</h2>
                                    <p style={{
                                        fontSize: '14px',
                                        color: 'rgba(255,255,255,0.9)',
                                        margin: 0
                                    }}>Please verify your updated information</p>
                                </div>

                                <IonCardContent style={{ padding: '32px 24px' }}>
                                    {/* Show avatar preview if changed */}
                                    {isAvatarChanged && (
                                        <div style={{ 
                                            marginBottom: '20px',
                                            textAlign: 'center'
                                        }}>
                                            <p style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#4a5568',
                                                marginBottom: '12px'
                                            }}>New Profile Picture</p>
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
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

                                    <div style={{ marginBottom: '20px' }}>
                                        <p style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#4a5568',
                                            marginBottom: '4px'
                                        }}>Full Name</p>
                                        <p style={{
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: '#2d3748',
                                            margin: 0
                                        }}>{firstName} {lastName}</p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <p style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#4a5568',
                                            marginBottom: '4px'
                                        }}>Username</p>
                                        <p style={{
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: '#2d3748',
                                            margin: 0
                                        }}>{username}</p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <p style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#4a5568',
                                            marginBottom: '4px'
                                        }}>Email Address</p>
                                        <p style={{
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: '#2d3748',
                                            margin: 0
                                        }}>{email}</p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <p style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#4a5568',
                                            marginBottom: '4px'
                                        }}>Address</p>
                                        <p style={{
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: '#2d3748',
                                            margin: 0
                                        }}>{address}</p>
                                    </div>

                                    <div style={{ marginBottom: '32px' }}>
                                        <p style={{
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#4a5568',
                                            marginBottom: '4px'
                                        }}>Contact Number</p>
                                        <p style={{
                                            fontSize: '16px',
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
                                            '--border-radius': '12px',
                                            '--padding-top': '16px',
                                            '--padding-bottom': '16px',
                                            fontWeight: '600',
                                            fontSize: '16px',
                                            height: '52px',
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
                                            fontWeight: '500'
                                        }}
                                    >
                                        Back to Edit
                                    </IonButton>
                                </IonCardContent>
                            </IonCard>
                        </div>
                    </IonContent>
                </IonModal>

                {/* OTP Verification Modal */}
                <IonModal isOpen={showOtpModal} onDidDismiss={() => setShowOtpModal(false)}>
                    <IonContent style={{
                        '--background': 'linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%)',
                    } as any}>
                        <div style={{
                            minHeight: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}>
                            <IonCard style={{
                                maxWidth: '400px',
                                width: '100%',
                                borderRadius: '20px',
                                boxShadow: '0 20px 64px rgba(0,0,0,0.15)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    padding: '30px 24px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        margin: '0 auto 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <IonIcon icon={keyOutline} style={{ 
                                            fontSize: '28px',
                                            color: 'white'
                                        }} />
                                    </div>
                                    <h2 style={{
                                        fontSize: '22px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        margin: '0 0 8px 0'
                                    }}>Enter Verification Code</h2>
                                    <p style={{
                                        fontSize: '14px',
                                        color: 'rgba(255,255,255,0.9)',
                                        margin: 0
                                    }}>Check your email for the verification code</p>
                                </div>

                                <IonCardContent style={{ padding: '32px 24px' }}>
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginBottom: '8px'
                                        }}>
                                            <IonIcon icon={keyOutline} style={{
                                                fontSize: '16px',
                                                color: '#4a5568',
                                                marginRight: '6px'
                                            }} />
                                            <label style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#2d3748'
                                            }}>Verification Code</label>
                                        </div>
                                        <IonInput
                                            fill="outline"
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            value={otp}
                                            onIonChange={e => setOtp(e.detail.value!)}
                                            style={{
                                                '--border-radius': '10px',
                                                '--border-color': '#e2e8f0',
                                                '--padding-start': '12px',
                                                '--padding-end': '12px',
                                                fontSize: '16px',
                                                textAlign: 'center'
                                            } as any}
                                        />
                                    </div>

                                    <IonButton 
                                        onClick={handleVerifyOtp}
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
                                            marginBottom: '12px'
                                        } as any}
                                    >
                                        {isLoading ? 'Verifying...' : 'VERIFY & UPDATE PROFILE'}
                                    </IonButton>
                                    
                                    <IonButton 
                                        expand="block"
                                        fill="clear"
                                        onClick={() => {
                                            setShowOtpModal(false);
                                            setShowVerificationModal(true);
                                        }}
                                        style={{
                                            color: '#718096',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Back to Changes
                                    </IonButton>

                                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
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
                                </IonCardContent>
                            </IonCard>
                        </div>
                    </IonContent>
                </IonModal>

                {/* Success Modal */}
                <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
                    <IonContent style={{
                        '--background': 'linear-gradient(180deg, #f0fff4 0%, #dcfce7 100%)',
                    } as any}>
                        <div style={{
                            minHeight: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                maxWidth: '400px'
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
                    </IonContent>
                </IonModal>

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={3000}
                />

                <IonLoading isOpen={isLoading} message="Please wait..." />
            </IonContent>
        </IonPage>
    );
};

export default Profile;