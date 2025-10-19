// src/pages/user-tabs/GiveFeedback.tsx - UPDATED: Consistent with History.tsx
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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonRadioGroup,
  IonRadio,
  IonCheckbox,
  IonList,
  IonAlert,
  IonToast,
  IonModal,
  IonSkeletonText,
  IonChip,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  chatbubbleOutline,
  starOutline,
  star,
  sendOutline,
  checkmarkCircleOutline,
  thumbsUpOutline,
  thumbsDownOutline,
  refreshOutline,
  timeOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';

interface FeedbackData {
  report_id: string;
  overall_rating: number;
  response_time_rating: number;
  communication_rating: number;
  resolution_satisfaction: number;
  categories: string[];
  comments: string;
  would_recommend: boolean | null;
  contact_method: string;
}

interface UserReport {
  id: string;
  title: string;
  status: string;
  created_at: string;
  category: string;
  description: string;
}

const GiveFeedback: React.FC = () => {
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    report_id: '',
    overall_rating: 0,
    response_time_rating: 0,
    communication_rating: 0,
    resolution_satisfaction: 0,
    categories: [],
    comments: '',
    would_recommend: null,
    contact_method: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  const feedbackCategories = [
    'Response Speed',
    'Staff Courtesy',
    'Problem Resolution',
    'Communication Quality',
    'Follow-up Service',
    'Overall Experience'
  ];

  const contactMethods = [
    'Phone Call',
    'Email',
    'Text Message',
    'In-Person Visit',
    'Mobile App Notification'
  ];

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchUserReports();
      } catch (error) {
        console.error('Error initializing data:', error);
        setIsLoading(false);
      }
    };
    initializeData();
  }, []);

  const fetchUserReports = async () => {
    setIsReportsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('incident_reports')
        .select('id, title, status, created_at, category, description')
        .eq('reporter_email', user.email)
        .eq('status', 'resolved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserReports(data || []);
    } catch (error) {
      console.error('Error fetching user reports:', error);
      setToastMessage('Failed to load your reports');
      setShowToast(true);
    } finally {
      setIsReportsLoading(false);
      setIsLoading(false);
    }
  };

  const handleRatingChange = (field: keyof FeedbackData, value: number) => {
    setFeedbackData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    setFeedbackData(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category)
    }));
  };

  const handleSubmit = async () => {
    if (!selectedReport) {
      setAlertMessage('Please select a report to provide feedback for.');
      setShowAlert(true);
      return;
    }

    if (feedbackData.overall_rating === 0) {
      setAlertMessage('Please provide an overall rating.');
      setShowAlert(true);
      return;
    }

    setIsSubmitting(true);
    setIsFeedbackLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update incident_reports table (same as History.tsx)
      const { error: reportError } = await supabase
        .from('incident_reports')
        .update({
          feedback_rating: feedbackData.overall_rating,
          feedback_comment: feedbackData.comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReport);

      if (reportError) throw reportError;

      setShowSuccessModal(true);
      resetForm();
      fetchUserReports(); // Refresh the list
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      setAlertMessage('Failed to submit feedback. Please try again.');
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
      setIsFeedbackLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedReport('');
    setFeedbackData({
      report_id: '',
      overall_rating: 0,
      response_time_rating: 0,
      communication_rating: 0,
      resolution_satisfaction: 0,
      categories: [],
      comments: '',
      would_recommend: null,
      contact_method: ''
    });
  };

  const StarRating: React.FC<{
    rating: number;
    onRatingChange: (rating: number) => void;
    label: string;
  }> = ({ rating, onRatingChange, label }) => (
    <div style={{ marginBottom: '20px' }}>
      <p style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '8px'
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((starNumber) => (
          <button
            key={starNumber}
            type="button"
            onClick={() => onRatingChange(starNumber)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '24px',
              color: starNumber <= rating ? '#fbbf24' : '#d1d5db',
              transition: 'color 0.2s'
            }}
          >
            {starNumber <= rating ? '★' : '☆'}
          </button>
        ))}
        <span style={{
          fontSize: '14px',
          color: '#6b7280',
          marginLeft: '8px'
        }}>
          {rating > 0 ? `${rating}/5` : 'No rating'}
        </span>
      </div>
    </div>
  );

  const SatisfactionRating: React.FC<{
    rating: number;
    onRatingChange: (rating: number) => void;
    label: string;
  }> = ({ rating, onRatingChange, label }) => (
    <div style={{ marginBottom: '20px' }}>
      <p style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '8px'
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => onRatingChange(1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: rating === 1 ? '#ef4444' : '#6b7280',
            backgroundColor: rating === 1 ? '#fef2f2' : 'transparent'
          }}
        >
          <IonIcon icon={thumbsDownOutline} style={{ fontSize: '20px' }} />
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Poor</span>
        </button>
        <button
          type="button"
          onClick={() => onRatingChange(2)}
          style={{
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: rating === 2 ? '#f59e0b' : '#6b7280',
            backgroundColor: rating === 2 ? '#fffbeb' : 'transparent'
          }}
        >
          <IonIcon icon={timeOutline} style={{ fontSize: '20px' }} />
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Fair</span>
        </button>
        <button
          type="button"
          onClick={() => onRatingChange(3)}
          style={{
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: rating === 3 ? '#10b981' : '#6b7280',
            background: rating === 3 ? '#f0fdf4' : 'transparent'
          }}
        >
          <IonIcon icon={thumbsUpOutline} style={{ fontSize: '20px' }} />
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Good</span>
        </button>
      </div>
    </div>
  );

  // Skeleton Components
  const ReportSkeletonItem: React.FC = () => (
    <IonItem style={{ '--background': 'transparent' } as any}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '12px 0'
      }}>
        <IonSkeletonText animated style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          marginRight: '12px'
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <IonSkeletonText animated style={{ width: '70%', height: '16px', marginBottom: '8px' }} />
          <IonSkeletonText animated style={{ width: '50%', height: '12px', marginBottom: '8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IonSkeletonText animated style={{ width: '40px', height: '20px', borderRadius: '10px' }} />
            <IonSkeletonText animated style={{ width: '30px', height: '12px' }} />
          </div>
        </div>
      </div>
    </IonItem>
  );

  const RatingSkeleton: React.FC = () => (
    <div style={{ marginBottom: '20px' }}>
      <IonSkeletonText animated style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IonSkeletonText
            key={star}
            animated
            style={{ width: '24px', height: '24px', borderRadius: '4px' }}
          />
        ))}
      </div>
    </div>
  );

  const CategorySkeleton: React.FC = () => (
    <div style={{ marginBottom: '20px' }}>
      <IonSkeletonText animated style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[1, 2, 3, 4].map((item) => (
          <IonSkeletonText
            key={item}
            animated
            style={{ width: '100%', height: '36px', borderRadius: '8px' }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <IonContent style={{ '--background': '#f8fafc' } as any}>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <IonIcon icon={chatbubbleOutline} style={{ fontSize: '28px', color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Give Feedback
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Share your experience with our response services
          </p>
        </div>

        {/* Main Content Card */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Select Report to Review
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {isReportsLoading ? (
              <div>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <IonProgressBar type="indeterminate" />
                </div>
                <IonList style={{ background: 'transparent' }}>
                  {[1, 2, 3].map((item) => (
                    <ReportSkeletonItem key={item} />
                  ))}
                </IonList>
              </div>
            ) : userReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
                <p style={{ color: '#9ca3af', marginTop: '16px' }}>
                  No resolved reports available for feedback
                </p>
                <IonButton
                  fill="outline"
                  size="small"
                  routerLink="/it35-lab2/app/history"
                >
                  View Report History
                </IonButton>
              </div>
            ) : (
              <div>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '16px'
                }}>
                  Select a resolved report to provide feedback:
                </p>
                <IonList style={{ background: 'transparent' }}>
                  {userReports.map((report) => (
                    <IonItem
                      key={report.id}
                      button
                      onClick={() => setSelectedReport(report.id)}
                      style={{
                        '--background': selectedReport === report.id ? '#f3f4f6' : 'transparent',
                        '--border-color': '#f1f5f9',
                        '--border-radius': '12px',
                        marginBottom: '8px'
                      } as any}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '12px 0'
                      }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#10b981',
                          marginRight: '12px',
                          flexShrink: 0
                        }}></div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: '0 0 4px 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {report.title}
                          </h3>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 4px 0'
                          }}>
                            {report.category}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IonChip
                              style={{
                                '--background': '#10b98120',
                                '--color': '#10b981',
                                height: '20px',
                                fontSize: '10px',
                                fontWeight: '600'
                              } as any}
                            >
                              RESOLVED
                            </IonChip>
                            <span style={{
                              fontSize: '10px',
                              color: '#9ca3af'
                            }}>
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <IonRadio
                          value={report.id}
                          aria-checked={selectedReport === report.id}
                          style={{ marginLeft: '8px' }}
                        />
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Feedback Form - Only show if report is selected */}
        {selectedReport && (
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardHeader>
              <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                Your Feedback
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {isFeedbackLoading ? (
                <div>
                  {/* Overall Rating Skeleton */}
                  <RatingSkeleton />

                  {/* Additional Ratings Skeleton */}
                  <RatingSkeleton />
                  <RatingSkeleton />
                  <RatingSkeleton />

                  {/* Categories Skeleton */}
                  <CategorySkeleton />

                  {/* Comments Skeleton */}
                  <div style={{ marginBottom: '20px' }}>
                    <IonSkeletonText animated style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
                    <IonSkeletonText animated style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
                  </div>

                  {/* Submit Button Skeleton */}
                  <IonSkeletonText animated style={{ width: '100%', height: '44px', borderRadius: '12px' }} />
                </div>
              ) : (
                <div>
                  {/* Overall Rating */}
                  <StarRating
                    rating={feedbackData.overall_rating}
                    onRatingChange={(rating) => handleRatingChange('overall_rating', rating)}
                    label="Overall Rating*"
                  />

                  {/* Additional Ratings */}
                  <StarRating
                    rating={feedbackData.response_time_rating}
                    onRatingChange={(rating) => handleRatingChange('response_time_rating', rating)}
                    label="Response Time"
                  />
                  <StarRating
                    rating={feedbackData.communication_rating}
                    onRatingChange={(rating) => handleRatingChange('communication_rating', rating)}
                    label="Communication Quality"
                  />
                  <StarRating
                    rating={feedbackData.resolution_satisfaction}
                    onRatingChange={(rating) => handleRatingChange('resolution_satisfaction', rating)}
                    label="Resolution Satisfaction"
                  />

                  {/* Feedback Categories */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      What aspects would you like to comment on?
                    </p>
                    <IonGrid style={{ padding: 0 }}>
                      <IonRow>
                        {feedbackCategories.map((category) => (
                          <IonCol size="6" key={category}>
                            <IonItem style={{
                              '--background': 'transparent',
                              '--padding-start': '0',
                              '--inner-padding-end': '0'
                            } as any}>
                              <IonCheckbox
                                checked={feedbackData.categories.includes(category)}
                                onIonChange={(e) => handleCategoryToggle(category, e.detail.checked)}
                                style={{
                                  '--size': '18px',
                                  '--checkbox-background-checked': '#10b981',
                                  '--border-color-checked': '#10b981'
                                } as any}
                              />
                              <IonLabel style={{
                                fontSize: '12px',
                                marginLeft: '8px'
                              }}>
                                {category}
                              </IonLabel>
                            </IonItem>
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                  </div>

                  {/* Would Recommend */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Would you recommend our service?
                    </p>
                    <IonRadioGroup
                      value={feedbackData.would_recommend}
                      onIonChange={(e) => setFeedbackData(prev => ({ ...prev, would_recommend: e.detail.value }))}
                    >
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <IonItem style={{ '--background': 'transparent' } as any}>
                          <IonRadio value={true} style={{ marginRight: '8px' }} />
                          <IonLabel style={{ fontSize: '14px' }}>Yes</IonLabel>
                        </IonItem>
                        <IonItem style={{ '--background': 'transparent' } as any}>
                          <IonRadio value={false} style={{ marginRight: '8px' }} />
                          <IonLabel style={{ fontSize: '14px' }}>No</IonLabel>
                        </IonItem>
                      </div>
                    </IonRadioGroup>
                  </div>

                  {/* Preferred Contact Method */}
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Preferred contact method for updates?
                    </p>
                    <IonSelect
                      value={feedbackData.contact_method}
                      placeholder="Select method"
                      onIonChange={(e) => setFeedbackData(prev => ({ ...prev, contact_method: e.detail.value }))}
                      style={{
                        width: '100%',
                        '--placeholder-color': '#9ca3af'
                      } as any}
                    >
                      {contactMethods.map((method) => (
                        <IonSelectOption key={method} value={method}>
                          {method}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </div>

                  {/* Additional Comments */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Additional Comments
                    </p>
                    <IonTextarea
                      placeholder="Share your experience or suggestions for improvement..."
                      value={feedbackData.comments}
                      onIonInput={(e) => setFeedbackData(prev => ({ ...prev, comments: e.detail.value || '' }))}
                      rows={4}
                      style={{
                        '--background': '#f9fafb',
                        '--border-radius': '8px',
                        '--padding-start': '12px',
                        '--padding-end': '12px',
                        '--padding-top': '12px',
                        '--padding-bottom': '12px',
                        fontSize: '14px'
                      } as any}
                    />
                  </div>

                  {/* Submit Button */}
                  <IonButton
                    expand="block"
                    onClick={handleSubmit}
                    disabled={isSubmitting || feedbackData.overall_rating === 0}
                    style={{
                      '--border-radius': '12px',
                      '--background': feedbackData.overall_rating === 0 ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      height: '44px',
                      fontWeight: '600'
                    } as any}
                  >
                    {isSubmitting ? (
                      <>
                        <IonIcon icon={refreshOutline} slot="start" style={{ animation: 'spin 1s linear infinite' }} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={sendOutline} slot="start" />
                        Submit Feedback
                      </>
                    )}
                  </IonButton>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}
      </div>

      {/* Success Modal */}
      <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
        <div style={{ padding: '40px 20px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '36px', color: 'white' }} />
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 16px 0'
          }}>
            Thank You!
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0 0 32px 0',
            lineHeight: '1.5'
          }}>
            Your feedback has been submitted successfully. We appreciate your input and will use it to improve our services.
          </p>
          <IonButton
            expand="block"
            onClick={() => setShowSuccessModal(false)}
            style={{
              '--border-radius': '12px',
              '--background': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              maxWidth: '200px',
              margin: '0 auto'
            } as any}
          >
            Close
          </IonButton>
        </div>
      </IonModal>

      {/* Alert */}
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Missing Information"
        message={alertMessage}
        buttons={['OK']}
      />

      {/* Toast */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />
    </IonContent>
  );
};

export default GiveFeedback;