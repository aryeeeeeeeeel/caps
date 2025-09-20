// src/pages/home-tabs/History.tsx
import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonChip,
  IonModal,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonTextarea,
  IonAlert,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonAvatar
} from '@ionic/react';
import {
  listOutline,
  eyeOutline,
  checkmarkCircleOutline,
  timeOutline,
  locationOutline,
  star,
  starOutline,
  refreshOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';

interface UserReport {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved';
  location: string;
  barangay: string;
  coordinates: { lat: number; lng: number };
  image_urls: string[];
  created_at: string;
  updated_at: string;
  admin_response?: string;
  resolved_at?: string;
  reporter_email?: string | null;
  feedback_rating?: number;
  feedback_comment?: string;
}

const History: React.FC = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    fetchResolvedReports();
  }, []);

  const fetchResolvedReports = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('hazard_reports')
        .select('*')
        .eq('status', 'resolved')
        .or(`reporter_email.eq.${user.email},reporter_email.is.null`)
        .order('resolved_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching resolved reports:', error);
      setToastMessage('Failed to load resolved reports');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const viewReport = (report: UserReport) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const openFeedbackModal = (report: UserReport) => {
    setSelectedReport(report);
    setFeedbackRating(report.feedback_rating || 0);
    setFeedbackComment(report.feedback_comment || '');
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (!selectedReport) return;

    try {
      const { error } = await supabase
        .from('hazard_reports')
        .update({
          feedback_rating: feedbackRating,
          feedback_comment: feedbackComment,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      setToastMessage('Feedback submitted successfully');
      setShowToast(true);
      setShowFeedbackModal(false);
      fetchResolvedReports();
    } catch (error) {
      setToastMessage('Failed to submit feedback');
      setShowToast(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchResolvedReports();
    event.detail.complete();
  };

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IonIcon 
            key={star} 
            icon={star <= rating ? 'star' : 'star-outline'} 
            color={star <= rating ? 'warning' : 'medium'}
          />
        ))}
      </div>
    );
  };

  return (
    <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <div style={{ padding: '20px' }}>
        {/* Header */}
        <IonCard style={{
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          <IonCardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px'
                }}>
                  <IonIcon icon={listOutline} style={{ fontSize: '24px', color: 'white' }} />
                </div>
                <div>
                  <IonCardTitle style={{ color: '#1f2937', fontSize: '20px', margin: '0 0 4px 0' }}>
                    Resolved Reports History
                  </IonCardTitle>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {reports.length} resolved reports
                  </p>
                </div>
              </div>
              <IonButton fill="clear" onClick={fetchResolvedReports}>
                <IonIcon icon={refreshOutline} color="primary" />
              </IonButton>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Reports List */}
        {isLoading ? (
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
              <IonIcon icon={refreshOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading resolved reports...</p>
            </IonCardContent>
          </IonCard>
        ) : reports.length === 0 ? (
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
              <IonIcon icon={listOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', marginTop: '16px', marginBottom: '20px' }}>
                No resolved reports found
              </p>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList style={{ background: 'transparent' }}>
            {reports.map((report) => (
              <IonCard key={report.id} style={{
                borderRadius: '16px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <IonCardContent style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      {/* Status */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                        <IonChip 
                          style={{
                            '--background': getStatusColor(report.status) + '20',
                            '--color': getStatusColor(report.status),
                            height: '28px',
                            fontSize: '12px',
                            fontWeight: '600'
                          } as any}
                        >
                          <IonIcon icon={checkmarkCircleOutline} style={{ marginRight: '4px' }} />
                          RESOLVED
                        </IonChip>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: '0 0 8px 0',
                        cursor: 'pointer'
                      }}
                      onClick={() => viewReport(report)}>
                        {report.title}
                      </h3>

                      {/* Location and Date */}
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: '0 0 4px 0'
                        }}>
                          <IonIcon icon={locationOutline} style={{ fontSize: '14px', marginRight: '4px' }} />
                          {report.location}, {report.barangay}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          margin: 0
                        }}>
                          <IonIcon icon={timeOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                          Resolved {report.resolved_at && new Date(report.resolved_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Admin Response */}
                      {report.admin_response && (
                        <div style={{
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '8px',
                          padding: '12px',
                          marginTop: '12px'
                        }}>
                          <p style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#075985',
                            margin: '0 0 4px 0'
                          }}>LDRRMO Response:</p>
                          <p style={{
                            fontSize: '13px',
                            color: '#0c4a6e',
                            margin: 0
                          }}>{report.admin_response}</p>
                        </div>
                      )}

                      {/* Feedback */}
                      {report.feedback_rating ? (
                        <div style={{
                          background: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          borderRadius: '8px',
                          padding: '12px',
                          marginTop: '12px'
                        }}>
                          <p style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#5b21b6',
                            margin: '0 0 4px 0'
                          }}>Your Feedback:</p>
                          {renderStars(report.feedback_rating)}
                          {report.feedback_comment && (
                            <p style={{
                              fontSize: '13px',
                              color: '#5b21b6',
                              margin: '8px 0 0 0'
                            }}>{report.feedback_comment}</p>
                          )}
                        </div>
                      ) : (
                        <IonButton 
                          size="small" 
                          fill="outline" 
                          style={{
                            marginTop: '12px',
                            '--border-radius': '8px'
                          } as any}
                          onClick={() => openFeedbackModal(report)}
                        >
                          Rate Response
                        </IonButton>
                      )}
                    </div>

                    <IonButton 
                      fill="clear" 
                      onClick={() => viewReport(report)}
                      style={{
                        '--padding-start': '4px',
                        '--padding-end': '4px'
                      } as any}
                    >
                      <IonIcon icon={eyeOutline} color="primary" />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
      </div>

      {/* View Report Modal */}
      <IonModal isOpen={showViewModal} onDidDismiss={() => setShowViewModal(false)}>
        {selectedReport && (
          <IonContent>
            <IonCard style={{ margin: '0', height: '100%' }}>
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonCardTitle>{selectedReport.title}</IonCardTitle>
                  <IonButton fill="clear" onClick={() => setShowViewModal(false)}>
                    <IonIcon icon={closeCircleOutline} />
                  </IonButton>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  <IonIcon icon={locationOutline} style={{ marginRight: '4px' }} />
                  {selectedReport.location}, {selectedReport.barangay}
                </p>
                
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  <IonIcon icon={timeOutline} style={{ marginRight: '4px' }} />
                  Reported: {new Date(selectedReport.created_at).toLocaleString()}
                </p>
                
                {selectedReport.resolved_at && (
                  <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    <IonIcon icon={checkmarkCircleOutline} style={{ marginRight: '4px' }} />
                    Resolved: {new Date(selectedReport.resolved_at).toLocaleString()}
                  </p>
                )}
                
                <h3 style={{ margin: '16px 0 8px 0' }}>Description</h3>
                <p style={{ color: '#4b5563', marginBottom: '16px' }}>{selectedReport.description}</p>
                
                {selectedReport.admin_response && (
                  <>
                    <h3 style={{ margin: '16px 0 8px 0' }}>Response from LDRRMO</h3>
                    <p style={{ 
                      color: '#4b5563', 
                      marginBottom: '16px',
                      background: '#f0f9ff',
                      padding: '12px',
                      borderRadius: '8px'
                    }}>
                      {selectedReport.admin_response}
                    </p>
                  </>
                )}
                
                {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                  <>
                    <h3 style={{ margin: '16px 0 8px 0' }}>Images</h3>
                    <IonGrid>
                      <IonRow>
                        {selectedReport.image_urls.map((url, index) => (
                          <IonCol size="6" key={index}>
                            <img 
                              src={url} 
                              alt={`Report ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '8px'
                              }}
                            />
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>

                    {!selectedReport.feedback_rating && (
                      <IonButton 
                        expand="block" 
                        onClick={() => {
                          setShowViewModal(false);
                          openFeedbackModal(selectedReport);
                        }}
                        style={{ marginTop: '20px' }}
                      >
                        Rate Response
                      </IonButton>
                    )}
                  </>
                )}
              </IonCardContent>
            </IonCard>
          </IonContent>
        )}
      </IonModal>

      {/* Feedback Modal */}
      <IonModal isOpen={showFeedbackModal} onDidDismiss={() => setShowFeedbackModal(false)}>
        <IonContent>
          <IonCard style={{ margin: '0', height: '100%' }}>
            <IonCardHeader>
              <IonCardTitle>Rate Response</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {selectedReport && (
                <>
                  <h3 style={{ marginBottom: '16px' }}>How would you rate the response to:</h3>
                  <p style={{ fontWeight: '600', marginBottom: '24px' }}>{selectedReport.title}</p>
                  
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <p style={{ marginBottom: '12px' }}>Rating:</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IonButton 
                          key={star} 
                          fill="clear" 
                          onClick={() => setFeedbackRating(star)}
                          style={{
                            '--padding-start': '4px',
                            '--padding-end': '4px'
                          } as any}
                        >
                          <IonIcon 
            icon={star <= feedbackRating ? 'star' : 'star-outline'} 
            size="large"
            color={star <= feedbackRating ? 'warning' : 'medium'}
          />
                        </IonButton>
                      ))}
                    </div>
                  </div>
                  
                  <IonTextarea
                    label="Comments (optional)"
                    labelPlacement="floating"
                    placeholder="Share your experience..."
                    value={feedbackComment}
                    onIonChange={(e) => setFeedbackComment(e.detail.value!)}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}
                  />
                  
                  <IonButton 
                    expand="block" 
                    onClick={submitFeedback}
                    disabled={feedbackRating === 0}
                  >
                    Submit Feedback
                  </IonButton>
                </>
              )}
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
      />
    </IonContent>
  );
};

export default History;