// src/pages/Register.tsx
import React, { useState } from 'react';
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
    IonCol
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';
import { personAddOutline, mailOutline, lockClosedOutline, personOutline, checkmarkCircleOutline, arrowBackOutline, schoolOutline } from 'ionicons/icons';

// Reusable Alert Component
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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

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

        if (!email.endsWith("@nbsc.edu.ph")) {
            setAlertMessage("Only @nbsc.edu.ph institutional emails are allowed to register for community safety reporting.");
            setShowAlert(true);
            return;
        }

        if (password.length < 6) {
            setAlertMessage("Password must be at least 6 characters long.");
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
            // Sign up in Supabase authentication
            const { data, error } = await supabase.auth.signUp({ email, password });
    
            if (error) {
                throw new Error("Account creation failed: " + error.message);
            }
    
            // Hash password before storing in the database
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
    
            // Insert user data into 'users' table
            const { error: insertError } = await supabase.from("users").insert([
                {
                    username,
                    user_email: email,
                    user_firstname: firstName,
                    user_lastname: lastName,
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
                                    }}>NBSC Email Address</label>
                                </div>
                                <IonInput
                                    fill="outline"
                                    type="email"
                                    placeholder="your.name@nbsc.edu.ph"
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
                                                placeholder="Min. 6 characters"
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
                                                placeholder="Repeat password"
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

                            {/* NBSC Notice */}
                            <div style={{
                                background: 'linear-gradient(135deg, #fef5e7 0%, #fed7aa 100%)',
                                border: '1px solid #fbbf24',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                marginBottom: '24px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <IonIcon icon={schoolOutline} style={{
                                        fontSize: '16px',
                                        color: '#d69e2e',
                                        marginRight: '8px'
                                    }} />
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#744210',
                                        margin: 0,
                                        fontWeight: '600'
                                    }}>NBSC Community Access Only</p>
                                </div>
                                <p style={{
                                    fontSize: '11px',
                                    color: '#975a16',
                                    margin: '4px 0 0 24px',
                                    lineHeight: '1.4'
                                }}>Registration is restricted to Northern Bukidnon State College institutional email addresses to ensure community authenticity.</p>
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

                            {/* Sign In Link */}
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

                {/* Enhanced Verification Modal */}
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

                                    <div style={{ marginBottom: '32px' }}>
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
                    </IonContent>
                </IonModal>

                {/* Enhanced Success Modal */}
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
                    </IonContent>
                </IonModal>

                <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />
            </IonContent>
        </IonPage>
    );
};

export default Register;