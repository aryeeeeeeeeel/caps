// src/pages/Register.tsx - WITH SKELETON LOADING
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
    IonAlert,
    IonHeader,
    IonToolbar,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonSkeletonText
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';
import { personAddOutline, mailOutline, lockClosedOutline, personOutline, checkmarkCircleOutline, arrowBackOutline, schoolOutline, callOutline, locationOutline } from 'ionicons/icons';

const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
    return (
        <IonAlert
            isOpen={isOpen}
            onDidDismiss={onClose}
            header="Registration Notice"
            message={message}
            buttons={['OK']}
        />
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
        if (!username.trim()) {
            setAlertMessage("Please enter a username.");
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
            setAlertMessage("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special symbol.");
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
            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                throw new Error("Account creation failed: " + error.message);
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const { error: insertError } = await supabase.from("users").insert([
                {
                    username,
                    user_email: email,
                    user_firstname: firstName,
                    user_lastname: lastName,
                    user_address: address,
                    user_contact_number: contactNumber,
                    user_password: hashedPassword,
                },
            ]);

            if (insertError) {
                throw new Error("Failed to save user data: " + insertError.message);
            }

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
                        routerLink="/it35-lab2"
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

                            <IonButton
                                onClick={handleOpenVerificationModal}
                                expand="block"
                                size="large"
                                disabled={isRegistering}
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
                                routerLink="/it35-lab2/user-login"
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
                <IonModal isOpen={showVerificationModal} onDidDismiss={() => setShowVerificationModal(false)}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)'
                    }}>
                        <IonCard style={{
                            width: '90%',
                            maxWidth: '450px',
                            borderRadius: '20px',
                            boxShadow: '0 20px 64px rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                            margin: '0'
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
                                }}>Confirm Registration</h2>
                                <p style={{
                                    fontSize: '14px',
                                    color: 'rgba(255,255,255,0.9)',
                                    margin: 0
                                }}>Please verify your information</p>
                            </div>

                            <IonCardContent style={{ padding: '32px 24px' }}>
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
                                    onClick={doRegister}
                                    expand="block"
                                    size="large"
                                    disabled={isRegistering}
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
                                    {isRegistering ? 'Creating Account...' : 'CONFIRM & CREATE'}
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
                            }}>Welcome to iAMUMA ta!</h1>

                            <p style={{
                                fontSize: '16px',
                                color: '#047857',
                                lineHeight: '1.6',
                                margin: '0 0 30px 0'
                            }}>Your account has been created successfully. Please check your email for verification instructions.</p>

                            <IonButton
                                routerLink="/it35-lab2/user-login"
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
            </IonContent>
        </IonPage>
    );
};

export default Register;