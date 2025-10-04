// src/pages/user-tabs/GiveFeedback.tsx
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
  IonModal 
} from '@ionic/react';
import {
  chatbubbleOutline,
  starOutline,
  star,
  sendOutline,
  checkmarkCircleOutline,
  closeCircle,
  thumbsUpOutline,
  thumbsDownOutline,
  refreshOutline
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
  would_recommend: boolean;
  contact_method: string;
}

interface UserReport {
  id: string;
  title: string;
  status: string;
  created_at: string;
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
    would_recommend: false,
    contact_method: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
    fetchUserReports();
  }, []);

  const fetchUserReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch resolved or investigated reports for feedback - removed resolved_at column
      const { data, error } = await supabase
        .from('incident_reports')
        .select('id, title, status, created_at')
        .eq('reporter_email', user.email)
        .in('status', ['resolved', 'investigating'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserReports(data || []);
    } catch (error) {
      console.error('Error fetching user reports:', error);
      setToastMessage('Failed to load your reports');
      setShowToast(true);
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

  const renderStarRating = (
    rating: number, 
    onChange: (rating: number) => void,
    label: string
  ) => {
    return (
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
            <IonButton
              key={starNumber}
              fill="clear"
              size="small"
              onClick={() => onChange(starNumber)}
              style={{ 
                '--color': starNumber <= rating ? '#fbbf24' : '#d1d5db',
                margin: 0,
                minHeight: '36px',
                minWidth: '36px'
              }}
            >
              <IonIcon icon={starNumber <= rating ? star : starOutline} />
            </IonButton>
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
  };

  const submitFeedback = async () => {
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('feedback')
        .insert({
          report_id: selectedReport,
          user_email: user.email,
          overall_rating: feedbackData.overall_rating,
          response_time_rating: feedbackData.response_time_rating,
          communication_rating: feedbackData.communication_rating,
          resolution_satisfaction: feedbackData.resolution_satisfaction,
          categories: feedbackData.categories,
          comments: feedbackData.comments,
          would_recommend: feedbackData.would_recommend,
          contact_method: feedbackData.contact_method,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Reset form
      setFeedbackData({
        report_id: '',
        overall_rating: 0,
        response_time_rating: 0,
        communication_rating: 0,
        resolution_satisfaction: 0,
        categories: [],
        comments: '',
        would_recommend: false,
        contact_method: ''
      });
      setSelectedReport('');

      setShowSuccessModal(true);

    } catch (error: any) {
      setAlertMessage(error.message || 'Failed to submit feedback. Please try again.');
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <IonCard style={{
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          <IonCardHeader>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px'
              }}>
                <IonIcon icon={chatbubbleOutline} style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <div>
                <IonCardTitle style={{ color: '#1f2937', fontSize: '20px', margin: '0 0 4px 0' }}>
                  Give Feedback
                </IonCardTitle>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  Help us improve our response services
                </p>
              </div>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Report Selection */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Select Report
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {userReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
                  No reports available for feedback
                </p>
                <IonButton 
                  fill="outline" 
                  onClick={fetchUserReports}
                >
                  <IonIcon icon={refreshOutline} slot="start" />
                  Refresh
                </IonButton>
              </div>
            ) : (
              <IonSelect
                value={selectedReport}
                onIonChange={e => setSelectedReport(e.detail.value)}
                interface="popover"
                placeholder="Choose a report to provide feedback for"
              >
                {userReports.map(report => (
                  <IonSelectOption key={report.id} value={report.id}>
                    {report.title} - {report.status} 
                    ({new Date(report.created_at).toLocaleDateString()})
                  </IonSelectOption>
                ))}
              </IonSelect>
            )}
          </IonCardContent>
        </IonCard>

        {/* Feedback Form */}
        {selectedReport && (
          <>
            {/* Rating Section */}
            <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                  Service Ratings
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {renderStarRating(
                  feedbackData.overall_rating,
                  (rating) => handleRatingChange('overall_rating', rating),
                  'Overall Experience'
                )}

                {renderStarRating(
                  feedbackData.response_time_rating,
                  (rating) => handleRatingChange('response_time_rating', rating),
                  'Response Time'
                )}

                {renderStarRating(
                  feedbackData.communication_rating,
                  (rating) => handleRatingChange('communication_rating', rating),
                  'Communication Quality'
                )}

                {renderStarRating(
                  feedbackData.resolution_satisfaction,
                  (rating) => handleRatingChange('resolution_satisfaction', rating),
                  'Problem Resolution'
                )}
              </IonCardContent>
            </IonCard>

            {/* Categories */}
            <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                  What went well?
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList style={{ background: 'transparent' }}>
                  {feedbackCategories.map(category => (
                    <IonItem 
                      key={category}
                      style={{ '--padding-start': '0', '--inner-padding-end': '0' } as any}
                    >
                      <IonCheckbox
                        checked={feedbackData.categories.includes(category)}
                        onIonChange={e => handleCategoryToggle(category, e.detail.checked)}
                        style={{ marginRight: '12px' }}
                      />
                      <IonLabel>{category}</IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* Comments */}
            <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                  Additional Comments
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem style={{ '--border-radius': '12px' } as any}>
                  <IonLabel position="stacked">Your feedback and suggestions</IonLabel>
                  <IonTextarea
                    value={feedbackData.comments}
                    onIonChange={e => setFeedbackData(prev => ({...prev, comments: e.detail.value!}))}
                    placeholder="Tell us about your experience, what could be improved, or any suggestions you have..."
                    rows={5}
                    maxlength={500}
                  />
                </IonItem>
              </IonCardContent>
            </IonCard>

            {/* Recommendation */}
            <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                  Recommendation
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Would you recommend our incident reporting service to others?
                </p>
                <IonRadioGroup
                  value={feedbackData.would_recommend}
                  onIonChange={e => setFeedbackData(prev => ({...prev, would_recommend: e.detail.value}))}
                >
                  <IonItem style={{ '--padding-start': '0' } as any}>
                    <IonRadio slot="start" value={true} />
                    <IonIcon icon={thumbsUpOutline} style={{ color: '#10b981', marginRight: '12px' }} />
                    <IonLabel>Yes, I would recommend</IonLabel>
                  </IonItem>
                  <IonItem style={{ '--padding-start': '0' } as any}>
                    <IonRadio slot="start" value={false} />
                    <IonIcon icon={thumbsDownOutline} style={{ color: '#ef4444', marginRight: '12px' }} />
                    <IonLabel>No, I would not recommend</IonLabel>
                  </IonItem>
                </IonRadioGroup>
              </IonCardContent>
            </IonCard>

            {/* Preferred Contact Method */}
            <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                  Preferred Contact Method
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonSelect
                  value={feedbackData.contact_method}
                  onIonChange={e => setFeedbackData(prev => ({...prev, contact_method: e.detail.value}))}
                  interface="popover"
                  placeholder="How do you prefer to be contacted about your reports?"
                >
                  {contactMethods.map(method => (
                    <IonSelectOption key={method} value={method}>{method}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonCardContent>
            </IonCard>

            {/* Submit Button */}
            <IonCard style={{ borderRadius: '16px' }}>
              <IonCardContent>
                <IonButton 
                  expand="block"
                  size="large"
                  onClick={submitFeedback}
                  disabled={isSubmitting}
                  style={{
                    '--border-radius': '12px',
                    '--padding-top': '16px',
                    '--padding-bottom': '16px',
                    fontWeight: '600',
                    fontSize: '16px',
                    '--background': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '--color': 'white'
                  } as any}
                >
                  <IonIcon icon={sendOutline} slot="start" />
                  {isSubmitting ? 'Submitting Feedback...' : 'SUBMIT FEEDBACK'}
                </IonButton>

                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '16px'
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#075985',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    Your feedback helps LDRRMO improve emergency response services for the community.
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
          </>
        )}
      </div>

      {/* Success Modal */}
      <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
        <IonContent>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '50px', color: 'white' }} />
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#065f46',
              margin: '0 0 12px 0'
            }}>Thank You!</h2>

            <p style={{
              fontSize: '16px',
              color: '#047857',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}>
              Your feedback has been submitted successfully. LDRRMO values your input 
              and will use it to improve emergency response services.
            </p>

            <IonButton 
              routerLink="/it35-lab2/app/home/dashboard"
              expand="block"
              size="large"
              onClick={() => setShowSuccessModal(false)}
              style={{
                '--border-radius': '12px',
                '--background': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                '--color': 'white',
                marginBottom: '12px'
              } as any}
            >
              Back to Dashboard
            </IonButton>

            <IonButton 
              fill="clear"
              expand="block"
              onClick={() => {
                setShowSuccessModal(false);
                fetchUserReports();
              }}
              style={{ '--color': '#6b7280' }}
            >
              Give More Feedback
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Alert */}
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Notice"
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
        color="danger"
      />
    </IonContent>
  );
};

export default GiveFeedback;