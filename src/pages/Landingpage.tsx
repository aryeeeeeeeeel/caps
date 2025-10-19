// src/pages/LandingPage.tsx
import {
  IonPage,
  IonContent,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSkeletonText
} from "@ionic/react";
import { shield, logIn, locationOutline, cameraOutline, notificationsOutline, mapOutline, peopleOutline, checkmarkCircleOutline } from "ionicons/icons";
import { useEffect, useState } from "react";

const LandingPage: React.FC = () => {
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Device detection logic
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    setIsMobileDevice(isMobile);

    // Handle loading and animations
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    const animationTimer = setTimeout(() => {
      const elements = document.querySelectorAll('.fade-in');
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('visible');
        }, index * 150);
      });
    }, 900);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(animationTimer);
    };
  }, []);

  // Skeleton Loading Component
  if (isLoading) {
    return (
      <IonPage>
        <IonHeader translucent={true}>
          <IonToolbar style={{
            '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '--border-width': '0',
            padding: '0 20px'
          } as any}>
            <div slot="start">
              <IonSkeletonText
                animated
                style={{
                  width: '120px',
                  height: '22px',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div slot="end">
              <IonSkeletonText
                animated
                style={{
                  width: '100px',
                  height: '32px',
                  borderRadius: '20px'
                }}
              />
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{
          '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        } as any}>
          {/* Hero Section Skeleton */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '60px 20px 80px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
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
                  width: '200px',
                  height: '32px',
                  borderRadius: '4px',
                  margin: '0 auto 12px'
                }}
              />
              <IonSkeletonText
                animated
                style={{
                  width: '300px',
                  height: '18px',
                  borderRadius: '4px',
                  margin: '0 auto 8px'
                }}
              />
              <IonSkeletonText
                animated
                style={{
                  width: '280px',
                  height: '18px',
                  borderRadius: '4px',
                  margin: '0 auto 8px'
                }}
              />
              <IonSkeletonText
                animated
                style={{
                  width: '500px',
                  height: '16px',
                  borderRadius: '4px',
                  margin: '30px auto 0',
                  maxWidth: '90%'
                }}
              />
            </div>
          </div>

          {/* Features Section Skeleton */}
          <div style={{ padding: '40px 20px' }}>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <IonSkeletonText
                      animated
                      style={{
                        width: '280px',
                        height: '28px',
                        borderRadius: '4px',
                        margin: '0 auto 12px',
                        maxWidth: '90%'
                      }}
                    />
                    <IonSkeletonText
                      animated
                      style={{
                        width: '400px',
                        height: '16px',
                        borderRadius: '4px',
                        margin: '0 auto',
                        maxWidth: '90%'
                      }}
                    />
                  </div>
                </IonCol>
              </IonRow>

              <IonRow>
                {[1, 2, 3].map((index) => (
                  <IonCol key={index} size="12" sizeMd="4">
                    <IonCard style={{
                      borderRadius: '16px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(226,232,240,0.8)',
                      background: 'white',
                      height: '100%'
                    }}>
                      <IonCardContent style={{ padding: '30px 24px', textAlign: 'center' }}>
                        <IonSkeletonText
                          animated
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            margin: '0 auto 20px'
                          }}
                        />
                        <IonSkeletonText
                          animated
                          style={{
                            width: '120px',
                            height: '20px',
                            borderRadius: '4px',
                            margin: '0 auto 12px'
                          }}
                        />
                        <IonSkeletonText
                          animated
                          style={{
                            width: '100%',
                            height: '14px',
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
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </div>

          {/* Stats Section Skeleton */}
          <div style={{
            background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
            padding: '50px 20px',
            margin: '20px 0'
          }}>
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <IonSkeletonText
                      animated
                      style={{
                        width: '220px',
                        height: '28px',
                        borderRadius: '4px',
                        margin: '0 auto 12px',
                        maxWidth: '90%'
                      }}
                    />
                    <IonSkeletonText
                      animated
                      style={{
                        width: '300px',
                        height: '16px',
                        borderRadius: '4px',
                        margin: '0 auto',
                        maxWidth: '90%'
                      }}
                    />
                  </div>
                </IonCol>
              </IonRow>

              <IonRow>
                {[1, 2, 3].map((index) => (
                  <IonCol key={index} size="12" sizeMd="4">
                    <div style={{ textAlign: 'center' }}>
                      <IonSkeletonText
                        animated
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '4px',
                          margin: '0 auto 16px'
                        }}
                      />
                      <IonSkeletonText
                        animated
                        style={{
                          width: '80px',
                          height: '36px',
                          borderRadius: '4px',
                          margin: '0 auto 8px'
                        }}
                      />
                      <IonSkeletonText
                        animated
                        style={{
                          width: '180px',
                          height: '14px',
                          borderRadius: '4px',
                          margin: '0 auto',
                          maxWidth: '90%'
                        }}
                      />
                    </div>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </div>

          {/* CTA Section Skeleton */}
          <div style={{
            padding: '40px 20px 60px',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <IonCard style={{
              borderRadius: '20px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
              background: 'white',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '30px 24px 20px',
                textAlign: 'center'
              }}>
                <IonSkeletonText
                  animated
                  style={{
                    width: '180px',
                    height: '24px',
                    borderRadius: '4px',
                    margin: '0 auto 8px',
                    maxWidth: '90%'
                  }}
                />
                <IonSkeletonText
                  animated
                  style={{
                    width: '220px',
                    height: '14px',
                    borderRadius: '4px',
                    margin: '0 auto',
                    maxWidth: '90%'
                  }}
                />
              </div>

              <IonCardContent style={{ padding: '30px 24px' }}>
                <IonSkeletonText
                  animated
                  style={{
                    width: '100%',
                    height: '52px',
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}
                />

                <div style={{
                  textAlign: 'center',
                  paddingTop: '20px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <IonSkeletonText
                    animated
                    style={{
                      width: '120px',
                      height: '14px',
                      borderRadius: '4px',
                      margin: '0 auto 16px'
                    }}
                  />
                  <IonSkeletonText
                    animated
                    style={{
                      width: '100px',
                      height: '32px',
                      borderRadius: '4px',
                      margin: '0 auto'
                    }}
                  />
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Footer Skeleton */}
          <div style={{
            background: '#2d3748',
            color: 'white',
            padding: '30px 20px',
            textAlign: 'center'
          }}>
            <IonSkeletonText
              animated
              style={{
                width: '200px',
                height: '14px',
                borderRadius: '4px',
                margin: '0 auto 8px',
                maxWidth: '90%'
              }}
            />
            <IonSkeletonText
              animated
              style={{
                width: '250px',
                height: '12px',
                borderRadius: '4px',
                margin: '0 auto',
                maxWidth: '90%'
              }}
            />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar style={{
          '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '--border-width': '0',
          padding: '0 20px'
        } as any}>
          <IonTitle style={{
            fontWeight: 'bold',
            color: 'white',
            fontSize: '22px',
            letterSpacing: '1px'
          }}>iAMUMA ta</IonTitle>

          {/* Only show admin portal button on desktop devices */}
          {!isMobileDevice && (
            <div slot="end">
              <IonButton
                routerLink="/it35-lab2/admin-login"
                size="small"
                style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  '--border-radius': '20px',
                  '--background': 'primary',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '20px'
                }}
              >
                <IonIcon icon={shield} slot="start" style={{ color: 'primary' }} />
                Admin Portal
              </IonButton>
            </div>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent style={{
        '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      } as any}>
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '60px 20px 80px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            pointerEvents: 'none'
          }}></div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="fade-in" style={{
              opacity: 0,
              transform: 'translateY(30px)',
              transition: 'all 0.8s ease'
            }}>
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
                <IonIcon icon={locationOutline} style={{
                  fontSize: '40px',
                  color: 'white'
                }} />
              </div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 12px 0',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>iAMUMA ta</h1>
              <p style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: '1.6',
                margin: '0 0 8px 0',
                fontWeight: '500'
              }}>Intelligent Alert Mapping Update</p>
              <p style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: '1.6',
                margin: '0 0 30px 0',
                fontWeight: '500'
              }}>Monitoring Areas</p>
              <p style={{
                fontSize: '16px',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: '1.5',
                maxWidth: '600px',
                margin: '0 auto'
              }}>Empowering communities through geo-intelligent incident reporting for enhanced public safety response and monitoring</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ padding: '40px 20px' }}>
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                <div className="fade-in" style={{
                  opacity: 0,
                  transform: 'translateY(30px)',
                  transition: 'all 0.8s ease',
                  textAlign: 'center',
                  marginBottom: '40px'
                }}>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#2d3748',
                    margin: '0 0 12px 0'
                  }}>Why Choose iAMUMA ta?</h2>
                  <p style={{
                    fontSize: '16px',
                    color: '#718096',
                    maxWidth: '500px',
                    margin: '0 auto'
                  }}>Advanced technology meets community safety in one powerful platform</p>
                </div>
              </IonCol>
            </IonRow>

            <IonRow>
              {[
                {
                  icon: cameraOutline,
                  title: 'Photo Reporting',
                  desc: 'Capture incidents with automatic GPS location tagging using EXIF data'
                },
                {
                  icon: mapOutline,
                  title: 'Real-time Mapping',
                  desc: 'Interactive GIS-powered maps for precise incident location tracking'
                },
                {
                  icon: notificationsOutline,
                  title: 'Instant Alerts',
                  desc: 'Immediate notifications to LDRRMO for rapid response coordination'
                }
              ].map((feature, index) => (
                <IonCol key={index} size="12" sizeMd="4">
                  <div className="fade-in" style={{
                    opacity: 0,
                    transform: 'translateY(30px)',
                    transition: 'all 0.8s ease',
                    transitionDelay: `${index * 200}ms`
                  }}>
                    <IonCard style={{
                      borderRadius: '16px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(226,232,240,0.8)',
                      background: 'white',
                      height: '100%',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                    }} className="feature-card">
                      <IonCardContent style={{ padding: '30px 24px', textAlign: 'center' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '50%',
                          margin: '0 auto 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <IonIcon icon={feature.icon} style={{
                            fontSize: '28px',
                            color: 'white'
                          }} />
                        </div>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#2d3748',
                          margin: '0 0 12px 0'
                        }}>{feature.title}</h3>
                        <p style={{
                          fontSize: '14px',
                          color: '#718096',
                          lineHeight: '1.6',
                          margin: 0
                        }}>{feature.desc}</p>
                      </IonCardContent>
                    </IonCard>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>

        {/* Stats Section */}
        <div style={{
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
          padding: '50px 20px',
          margin: '20px 0'
        }}>
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                <div className="fade-in" style={{
                  opacity: 0,
                  transform: 'translateY(30px)',
                  transition: 'all 0.8s ease',
                  textAlign: 'center',
                  marginBottom: '40px'
                }}>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#2d3748',
                    margin: '0 0 12px 0'
                  }}>Serving Manolo Fortich</h2>
                  <p style={{
                    fontSize: '16px',
                    color: '#718096'
                  }}>Supporting LDRRMO operations with community-driven safety reporting</p>
                </div>
              </IonCol>
            </IonRow>

            <IonRow>
              {[
                { number: '238', label: 'Cases Reported in Damilag (2021)', icon: checkmarkCircleOutline },
                { number: '30%', label: 'Incident Events Formally Reported', icon: peopleOutline },
                { number: '24/7', label: 'Community Safety Monitoring', icon: shield }
              ].map((stat, index) => (
                <IonCol key={index} size="12" sizeMd="4">
                  <div className="fade-in" style={{
                    opacity: 0,
                    transform: 'translateY(30px)',
                    transition: 'all 0.8s ease',
                    transitionDelay: `${index * 150}ms`,
                    textAlign: 'center'
                  }}>
                    <IonIcon icon={stat.icon} style={{
                      fontSize: '32px',
                      color: '#667eea',
                      marginBottom: '16px'
                    }} />
                    <h3 style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#2d3748',
                      margin: '0 0 8px 0'
                    }}>{stat.number}</h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#718096',
                      margin: 0
                    }}>{stat.label}</p>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>

        {/* CTA Section */}
        <div style={{
          padding: '40px 20px 60px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <IonCard className="fade-in" style={{
            borderRadius: '20px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
            background: 'white',
            opacity: 0,
            transform: 'translateY(30px)',
            transition: 'all 0.8s ease',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '30px 24px 20px',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 8px 0'
              }}>Get Started Today</h3>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.9)',
                margin: 0
              }}>Join the community safety network</p>
            </div>

            <IonCardContent style={{ padding: '30px 24px' }}>
              <IonButton
                expand="block"
                routerLink="/it35-lab2/user-login"
                size="large"
                style={{
                  '--border-radius': '12px',
                  '--padding-top': '16px',
                  '--padding-bottom': '16px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  height: '52px',
                  fontSize: '16px',
                  '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '--color': 'white'
                } as any}
              >
                <IonIcon icon={logIn} slot="start" />
                LOGIN TO REPORT
              </IonButton>

              <div style={{
                textAlign: 'center',
                paddingTop: '20px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <IonText>
                  <p style={{
                    color: '#718096',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>New to the platform?</p>
                </IonText>
                <IonButton
                  routerLink="/it35-lab2/register"
                  fill="clear"
                  style={{
                    color: '#667eea',
                    fontWeight: '600',
                    fontSize: '14px',
                    margin: 0,
                    textDecoration: 'underline'
                  }}
                >
                  CREATE ACCOUNT
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Footer */}
        <div style={{
          background: '#2d3748',
          color: 'white',
          padding: '30px 20px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#a0aec0',
            margin: '0 0 8px 0'
          }}>Powered by Northern Bukidnon State College</p>
          <p style={{
            fontSize: '12px',
            color: '#718096',
            margin: 0
          }}>© 2025 iAMUMA ta. Supporting community safety through technology.</p>
        </div>

        {/* Custom Styles */}
        <style>{`
          .fade-in.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
          
          .feature-card:hover {
            transform: translateY(-8px) !important;
            box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default LandingPage;