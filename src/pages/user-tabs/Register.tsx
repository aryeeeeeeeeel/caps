// src/pages/Register.tsx - WITH SKELETON LOADING & is_authenticated COLUMN
import React, { useState, useEffect } from 'react';
import {
    IonButton,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonPage,
    IonTitle,
    IonModal,
    IonText,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonToast,
    IonHeader,
    IonToolbar,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonSkeletonText
} from '@ionic/react';
import { supabase } from '../../utils/supabaseClient';
import { logUserRegistration } from '../../utils/activityLogger';
import bcrypt from 'bcryptjs';
import { personAddOutline, mailOutline, lockClosedOutline, personOutline, checkmarkCircleOutline, arrowBackOutline, schoolOutline, callOutline, locationOutline } from 'ionicons/icons';

const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
    return (
        <IonToast isOpen={isOpen} onDidDismiss={onClose} message={message} duration={3000} position="top" />
    );
};

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsRead, setTermsRead] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, []);

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
                                width: '80px',
                                height: '80px',
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
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
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
                                    height: '44px',
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
                                    height: '44px',
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
                                    height: '44px',
                                    borderRadius: '10px'
                                }}
                            />
                        </div>
                    ))}

                    {/* Password Fields Skeleton */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
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
                                    height: '44px',
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
                                    height: '44px',
                                    borderRadius: '10px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Info Box Skeleton */}
                    <IonSkeletonText
                        animated
                        style={{
                            width: '100%',
                            height: '60px',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}
                    />

                    {/* Button Skeleton */}
                    <IonSkeletonText
                        animated
                        style={{
                            width: '100%',
                            height: '52px',
                            borderRadius: '12px',
                            marginBottom: '20px'
                        }}
                    />

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '20px 0'
                    }}>
                        <IonSkeletonText
                            animated
                            style={{
                                flex: 1,
                                height: '1px'
                            }}
                        />
                        <IonSkeletonText
                            animated
                            style={{
                                width: '100px',
                                height: '14px',
                                borderRadius: '4px',
                                margin: '0 16px'
                            }}
                        />
                        <IonSkeletonText
                            animated
                            style={{
                                flex: 1,
                                height: '1px'
                            }}
                        />
                    </div>

                    {/* Sign In Button Skeleton */}
                    <IonSkeletonText
                        animated
                        style={{
                            width: '100%',
                            height: '44px',
                            borderRadius: '12px'
                        }}
                    />
                </IonCardContent>
            </IonCard>
        </div>
    );

    const handleOpenVerificationModal = () => {
        if (!username.trim() || !firstName.trim() || !lastName.trim() || !address.trim() || !contactNumber.trim() || !email.trim()) {
            setAlertMessage("Please fill in all required fields.");
            setShowAlert(true);
            return;
        }

        if (!firstName.trim() || !lastName.trim()) {
            setAlertMessage("Please enter your first and last name.");
            setShowAlert(true);
            return;
        }

        if (!address.trim()) {
            setAlertMessage("Please enter your address.");
            setShowAlert(true);
            return;
        }

        if (!contactNumber.trim()) {
            setAlertMessage("Please enter your contact number.");
            setShowAlert(true);
            return;
        }

        if (!email.trim()) {
            setAlertMessage("Please enter your email address.");
            setShowAlert(true);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setAlertMessage("Please enter a valid email address.");
            setShowAlert(true);
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~])[A-Za-z\d!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]{8,}$/;
        if (!passwordRegex.test(password)) {
            setAlertMessage("Password must be at least 8 characters long and include at least has one uppercase letter, one lowercase letter, one number, and one special symbol.");
            setShowAlert(true);
            return;
        }

        if (password !== confirmPassword) {
            setAlertMessage("Passwords do not match. Please check and try again.");
            setShowAlert(true);
            return;
        }

        setShowVerificationModal(true);
    };

    const doRegister = async () => {
    setShowVerificationModal(false);
    setIsRegistering(true);

    try {
        // Create Supabase Auth user first
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    username: username,
                    first_name: firstName,
                    last_name: lastName
                }
            }
        });

        if (authError) {
            throw new Error("Account creation failed: " + authError.message);
        }

        if (!authData.user) {
            throw new Error("No user data returned from authentication.");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Use the RPC function for atomic registration
        const { data: result, error: rpcError } = await supabase.rpc('register_user', {
            p_username: username,
            p_email: email,
            p_first_name: firstName,
            p_last_name: lastName,
            p_address: address,
            p_contact_number: contactNumber,
            p_password: hashedPassword,
            p_auth_uuid: authData.user.id
        });

        if (rpcError) {
            throw new Error("Registration failed: " + rpcError.message);
        }

        if (!result.success) {
            throw new Error(result.error || "Registration failed");
        }

        // Log user registration activity
        await logUserRegistration(email, firstName, lastName);

        setShowSuccessModal(true);
    } catch (err) {
        if (err instanceof Error) {
            setAlertMessage(err.message);
        } else {
            setAlertMessage("An unknown error occurred during registration.");
        }
        setShowAlert(true);
    } finally {
        setIsRegistering(false);
    }
};

    // Handler Logic
    const handleShowTerms = () => setShowTermsModal(true);
    const handleCloseTermsModal = () => {
      setShowTermsModal(false);
      setTermsRead(true);
    };
    const handleTermsCheckbox = () => {
      if (!termsRead) {
        setAlertMessage('Please read the Terms and Conditions first.');
        setShowAlert(true);
        return;
      }
      setTermsChecked(!termsChecked);
    };

    // Calculate disabled state for Create button
    const canCreateAccount = termsChecked;

    if (isLoading) {
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
                                width: '120px',
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
                        routerLink="/iAMUMAta"
                        style={{ color: 'white' }}
                    >
                        <IonIcon icon={arrowBackOutline} />
                    </IonButton>
                    <IonTitle style={{ fontWeight: 'bold' }}>Join iAMUMA ta</IonTitle>
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
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '50%',
                                    margin: '0 auto 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(10px)',
                                    border: '2px solid rgba(255,255,255,0.3)'
                                }}>
                                    <IonIcon icon={personAddOutline} style={{
                                        fontSize: '36px',
                                        color: 'white'
                                    }} />
                                </div>

                                <h1 style={{
                                    fontSize: '28px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    margin: '0 0 8px 0',
                                    letterSpacing: '0.5px'
                                }}>Create Account</h1>

                                <p style={{
                                    fontSize: '14px',
                                    color: 'rgba(255,255,255,0.9)',
                                    margin: 0
                                }}>Join the community safety network</p>
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

                            <IonGrid>
                                <IonRow>
                                    <IonCol size="6">
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                <IonIcon icon={lockClosedOutline} style={{
                                                    fontSize: '16px',
                                                    color: '#4a5568',
                                                    marginRight: '6px'
                                                }} />
                                                <label style={{
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#2d3748'
                                                }}>Password</label>
                                            </div>
                                            <IonInput
                                                fill="outline"
                                                type="password"
                                                placeholder="Create a password"
                                                value={password}
                                                onIonChange={e => setPassword(e.detail.value!)}
                                                style={{
                                                    '--border-radius': '10px',
                                                    '--border-color': '#e2e8f0',
                                                    '--padding-start': '12px',
                                                    '--padding-end': '12px',
                                                    fontSize: '15px'
                                                } as any}
                                            >
                                                <IonInputPasswordToggle slot="end" />
                                            </IonInput>
                                        </div>
                                    </IonCol>
                                    <IonCol size="6">
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                <IonIcon icon={lockClosedOutline} style={{
                                                    fontSize: '16px',
                                                    color: '#4a5568',
                                                    marginRight: '6px'
                                                }} />
                                                <label style={{
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#2d3748'
                                                }}>Confirm</label>
                                            </div>
                                            <IonInput
                                                fill="outline"
                                                type="password"
                                                placeholder="Confirm your password"
                                                value={confirmPassword}
                                                onIonChange={e => setConfirmPassword(e.detail.value!)}
                                                style={{
                                                    '--border-radius': '10px',
                                                    '--border-color': '#e2e8f0',
                                                    '--padding-start': '12px',
                                                    '--padding-end': '12px',
                                                    fontSize: '15px'
                                                } as any}
                                            >
                                                <IonInputPasswordToggle slot="end" />
                                            </IonInput>
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonGrid>

                            <div style={{
                                fontSize: '12px',
                                color: '#3182ce',
                                marginBottom: '20px',
                                padding: '12px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '8px',
                                border: '1px solid #bfdbfe'
                            }}>
                                Password must be at least 8 characters and include: uppercase letter, lowercase letter, number, and special symbol (!@#$%^&*)
                            </div>

                            <div style={{ background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bee3f8', padding: '16px', marginBottom: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 13 }}>
                                    <input
                                        type="checkbox"
                                        checked={termsChecked}
                                        onChange={handleTermsCheckbox}
                                        style={{ marginRight: 8 }}
                                    />
                                    I have read and agree to the <span style={{ color: '#3182ce', cursor: 'pointer', marginLeft: 4 }} onClick={handleShowTerms}>iAMUMA ta Terms and Conditions</span>.
                                </label>
                            </div>

                            <IonButton
                                onClick={handleOpenVerificationModal}
                                expand="block"
                                size="large"
                                disabled={isRegistering || !canCreateAccount}
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
                                <IonIcon icon={personAddOutline} slot="start" />
                                CREATE ACCOUNT
                            </IonButton>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                margin: '20px 0',
                                color: '#a0aec0',
                                fontSize: '14px'
                            }}>
                                <div style={{
                                    flex: 1,
                                    height: '1px',
                                    background: '#e2e8f0'
                                }}></div>
                                <span style={{ padding: '0 16px' }}>Already a member?</span>
                                <div style={{
                                    flex: 1,
                                    height: '1px',
                                    background: '#e2e8f0'
                                }}></div>
                            </div>

                            <IonButton
                                routerLink="/iAMUMAta/user-login"
                                expand="block"
                                fill="outline"
                                style={{
                                    '--border-radius': '12px',
                                    '--padding-top': '14px',
                                    '--padding-bottom': '14px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    '--border-color': '#667eea',
                                    '--color': '#667eea'
                                } as any}
                            >
                                SIGN IN TO ACCOUNT
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
                                }}>Confirm Registration</h2>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.9)',
                                    margin: 0
                                }}>Please verify your information</p>
                            </div>

                            <IonCardContent style={{ padding: '24px 20px' }}>
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
                                    onClick={doRegister}
                                    expand="block"
                                    size="large"
                                    disabled={isRegistering}
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
                                    {isRegistering ? 'Creating Account...' : 'CONFIRM & CREATE'}
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

                {/* Success Modal - UPDATED */}
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
                            }}>Check Your Email!</h1>

                            <p style={{
                                fontSize: '16px',
                                color: '#047857',
                                lineHeight: '1.6',
                                margin: '0 0 20px 0'
                            }}>
                                Your account has been created successfully. 
                                <strong> Please check your email and click the confirmation link</strong> to activate your account.
                            </p>

                            <div style={{
                                backgroundColor: '#f0f9ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '20px'
                            }}>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#1e40af',
                                    margin: '0',
                                    fontWeight: '600'
                                }}>
                                    📧 Important: Check your spam folder if you don't see the email!
                                </p>
                            </div>

                            <IonButton
                                routerLink="/iAMUMAta/user-login"
                                expand="block"
                                size="large"
                                onClick={() => setShowSuccessModal(false)}
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
                                CONTINUE TO LOGIN
                            </IonButton>
                        </div>
                    </div>
                </IonModal>
                <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />

                <IonModal isOpen={showTermsModal} onDidDismiss={handleCloseTermsModal}>
  <div style={{
    minHeight: '100vh',
    maxWidth: 620,
    margin: '0 auto',
    fontFamily: `"Inter", "Segoe UI", "Roboto", "Arial", sans-serif`,
    background: '#f8fafc',
    borderRadius: 0,
    width: '100vw',
    height: '100vh',
    boxSizing: 'border-box',
  }}>
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '28px 24px 16px',
      width: '100%',
      position: 'sticky',
      top: 0,
      zIndex: 1,
      borderRadius: 0,
      boxShadow: 'rgba(30,41,59,0.09) 0 2px 6px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5, color: '#fff', margin: 0, lineHeight: '1.2', textShadow: '0 2px 12px rgba(28,28,44,0.06)' }}>iAMUMA ta Terms and Conditions</span>
        <IonButton fill="clear" color="light" size="large" style={{ borderRadius: '50%', height: 38, width: 38, fontSize: 23, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', transition: 'background .18s', margin: 0 }} onClick={handleCloseTermsModal}>
          <span style={{fontWeight:800,display:"block"}}>×</span>
        </IonButton>
      </div>
      <div style={{ fontSize: 13, opacity: 0.93, letterSpacing: 0.1 }}>Last Updated: October 30, 2025</div>
    </div>
    <div
      style={{
        padding: '28px 18px 60px',
        fontSize: 15.5,
        background: '#fff',
        color: '#252e3e',
        textAlign: 'justify',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: '0 auto',
        wordBreak: 'break-word',
        boxSizing: 'border-box',
        borderRadius: 0,
        boxShadow: 'none',
      }}>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>1</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2, marginBottom: 0 }}>Acceptance of Terms</span>
        </div>
        <div>By accessing and using the system ('iAMUMA ta'), a geo-intelligent incident reporting progressive web application developed by researchers from Northern Bukidnon State College for the Local Disaster Risk Reduction and Management Office (LDRRMO) of Manolo Fortich, you agree to be bound by these Terms and Conditions.
          <span style={{ color: '#dc2626', fontWeight: 700 }}> If you do not agree with any part of these terms, you must discontinue use of the System immediately.</span>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>2</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>Description of Service</span>
        </div>
        <div>iAMUMA ta is a cross-platform application that allows users to report public safety incidents (e.g., road damage, fallen trees, utility issues) by submitting photographs and related information. The System utilizes Geographic Information System (GIS) technology and Global Positioning System (GPS) data, including metadata from images (EXIF data), to map and monitor the location of reported incidents. This service is provided for the primary benefit of the LDRRMO Manolo Fortich to enhance public safety response and monitoring.</div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>3</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>User Responsibilities and Account Registration</span>
        </div>
        <div style={{ paddingLeft: 22 }}>
          <div style={{ marginBottom: 4, color: '#2d2f37' }}><b style={{ color: '#475569' }}>• Accurate Information:</b> You agree to provide true, accurate, and complete information during registration and when submitting incident reports.</div>
          <div style={{ marginBottom: 4, color: '#2d2f37' }}><b style={{ color: '#475569' }}>• Account Security:</b> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</div>
          <div style={{ marginBottom: 4, color: '#2d2f37' }}><b style={{ color: '#475569' }}>• Appropriate Use:</b> You agree to use the System only for its intended purpose—reporting legitimate public safety concerns within the Municipality of Manolo Fortich.</div>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>4</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>Incident Reporting and Data Submission</span>
        </div>
        <div style={{ paddingLeft: 22 }}>
          <div style={{ marginBottom: 4 }}><b style={{ color: '#475569' }}>• Accuracy of Reports:</b> You must exercise best efforts to provide an accurate and truthful description of the incident. Do not knowingly submit false, misleading, or malicious reports.</div>
          <div style={{ marginBottom: 4 }}><b style={{ color: '#475569' }}>• Location Data (GIS/GPS):</b> By submitting a photograph, you consent to the System extracting and using the embedded GPS coordinates (EXIF data) to pinpoint the incident's location on the map. You acknowledge that the accuracy of this location data depends on your device's capabilities and settings.</div>
          <div style={{ marginBottom: 4 }}><b style={{ color: '#475569' }}>• Media Content:</b> You affirm that any photo you submit is your own, taken at the time and location of the reported incident, and does not violate any third-party rights.</div>
          <div style={{ marginBottom: 4 }}><b style={{ color: '#475569' }}>• No Emergency Service:</b><span style={{ color: '#dc2626', fontWeight: 700 }}> iAMUMA ta IS NOT AN EMERGENCY SERVICE. For immediate, life-threatening emergencies, such as fires, active crimes, or serious medical situations, you must CONTACT THE APPROPRIATE EMERGENCY SERVICES DIRECTLY (e.g., call the local police, fire department, or ambulance).</span></div>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>5</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>Privacy and Data Use</span>
        </div>
        <div style={{ paddingLeft: 22 }}>
          <div style={{ marginBottom: 4 }}><b style={{ color: '#475569' }}>• Collection of Data:</b> The System collects personal information you provide (e.g., name, email), incident details, and geolocation data from your reports.</div>
          <div style={{ marginBottom: 4 }}><b style={{ color: '#475569' }}>• Use of Data:</b> This data is used to:</div>
          <div style={{ margin: '4px 0 4px 32px' }}>- Process, map, and verify incident reports.<br/>- Provide the LDRRMO with analytics and data for public safety monitoring and risk reduction planning.<br/>- Improve the functionality of the System.</div>
          <div style={{ marginBottom: 4 }}><b style={{ color: '#475569' }}>• Sharing of Data:</b> Aggregated and anonymized data may be used for academic and research purposes by Northern Bukidnon State College. Personally identifiable information and specific report details will be shared only with authorized personnel of the LDRRMO Manolo Fortich for official response and monitoring purposes.</div>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>6</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>Intellectual Property</span>
        </div>
        <div style={{ paddingLeft: 22 }}>
          <div style={{ marginBottom: 4 }}>The iAMUMA ta application, its design, source code, and all related documentation are the intellectual property of the developers and Northern Bukidnon State College.</div>
          <div style={{ marginBottom: 4 }}>The incident data and associated analytics generated by the system are primarily owned and managed by the LGU Manolo Fortich (LDRRMO) for public safety governance.</div>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>7</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>System Limitations and Disclaimers</span>
        </div>
        <div style={{ paddingLeft: 22 }}>
          <div style={{ marginBottom: 4 }}>• <b style={{ color: '#475569' }}>"As Is" Service:</b> The System is provided on an "as is" and "as available" basis. We do not guarantee that the service will be uninterrupted, timely, secure, or error-free.</div>
          <div style={{ marginBottom: 4 }}>• <b style={{ color: '#475569' }}>Location Accuracy:</b> While the System uses geo-intelligent technology (GIS, GPS, EXIF), the accuracy of the mapped locations is not guaranteed and may be affected by technical limitations.</div>
          <div style={{ marginBottom: 4 }}>• <b style={{ color: '#475569' }}>Response Time:</b> Submitting a report does not guarantee a specific response time or action from the LDRRMO. Response is subject to the office's operational protocols and resource availability.</div>
          <div style={{ marginBottom: 4 }}>• <b style={{ color: '#475569' }}>Internet Dependency:</b> The System requires an active internet connection to submit reports and access most features. It does not support offline functionality.</div>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>8</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>Limitation of Liability</span>
        </div>
        <div style={{ paddingLeft: 22 }}>
          <div style={{ marginBottom: 4 }}>Northern Bukidnon State College, the project researchers, and the LGU Manolo Fortich (LDRRMO) shall not be held liable for any direct, indirect, incidental, special, or consequential damages resulting from:</div>
          <div style={{ marginBottom: 4, paddingLeft:32, color: '#6b7280' }}>• The use or inability to use the System.<br/>• Any delay or failure in responding to a reported incident.<br/>• The inaccuracy of any user-submitted data or location information.<br/>• Any decisions made or actions taken based on the information provided by the System.</div>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>9</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>User Conduct and Prohibited Activities</span>
        </div>
        <div style={{ paddingLeft: 22 }}>
          <div style={{ marginBottom: 4 }}>You agree not to use the System to:</div>
          <div style={{ marginBottom: 4, paddingLeft:32, color: '#6b7280' }}>• Submit false, fraudulent, or harassing reports.<br/>• Infringe on the privacy or rights of others.<br/>• Upload content that is unlawful, obscene, or harmful.<br/>• Attempt to disrupt or compromise the security and functionality of the System.</div>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>10</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>Modification and Termination</span>
        </div>
        <div style={{ paddingLeft: 22 }}>
          <div style={{ marginBottom: 4 }}>We reserve the right to modify, suspend, or discontinue the System, or these Terms and Conditions, at any time without prior notice. We may also terminate or suspend your access to the System for violations of these terms.</div>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>11</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>Governing Law</span>
        </div>
        <div style={{ paddingLeft: 22 }}>
          <div style={{ marginBottom: 4 }}>These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of the Philippines.</div>
        </div>
      </section>
      <section style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#6366f1', borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 16, width: 32, height: 32, lineHeight: '32px', textAlign: 'center' }}>12</span>
          <span style={{ fontWeight: 700, fontSize: 19, color: '#374151', marginTop: 2 }}>Contact Information</span>
        </div>
        <div style={{ paddingLeft: 22, marginBottom: 7 }}>
          <div>For any questions about these Terms and Conditions or the iAMUMA ta system, please contact the project researchers through the College of Computer Studies, Northern Bukidnon State College, or the LDRRMO Manolo Fortich.</div>
        </div>
        <div style={{ marginLeft: 22, marginTop: 14, marginBottom: 0, color: '#2563eb', fontWeight: 700, fontSize: 16, letterSpacing: 0.12 }}>
          By using the iAMUMA ta system, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
        </div>
      </section>
      <IonButton expand="block" style={{ width: '100%', borderRadius: 0, fontWeight: 700, fontSize: window.innerWidth < 480 ? 14 : 16, fontFamily: 'Inter,sans-serif', boxShadow: '0 2px 8px 0 rgba(41,65,104,0.10)', textTransform:'uppercase', letterSpacing:0.4, marginTop: 30 }} onClick={handleCloseTermsModal}>
        I have fully read the Terms and Conditions
      </IonButton>
      <div style={{ height: 110 }} />
    </div>
  </div>
</IonModal>
            </IonContent>
        </IonPage>
    );
};

export default Register;