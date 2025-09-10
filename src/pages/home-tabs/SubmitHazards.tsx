// src/pages/user-tabs/SubmitHazards.tsx
import React, { useState, useRef } from 'react';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonIcon,
  IonAlert,
  IonToast,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonCheckbox
} from '@ionic/react';
import {
  cameraOutline,
  locationOutline,
  warningOutline,
  checkmarkCircleOutline,
  closeCircle,
  informationCircleOutline,
  addOutline,
  mapOutline,
  timeOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '../../utils/supabaseClient';
// @ts-ignore
import ExifReader from 'exifreader';

interface HazardReport {
  title: string;
  description: string;
  category: string;
  priority: string;
  location: string;
  barangay: string;
  coordinates: { lat: number; lng: number } | null;
  images: File[];
  reporter_email: string;
  reporter_name: string;
  anonymous: boolean;
}

const SubmitHazards: React.FC = () => {
  const [formData, setFormData] = useState<HazardReport>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: '',
    barangay: '',
    coordinates: null,
    images: [],
    reporter_email: '',
    reporter_name: '',
    anonymous: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hazardCategories = [
    'Road Hazards',
    'Utility Issues', 
    'Natural Disasters',
    'Infrastructure Problems',
    'Public Safety',
    'Environmental Issues',
    'Others'
  ];

  const barangayList = [
    'Damilag', 'Lindaban', 'Alae', 'Maluko', 'Daliring', 
    'Poblacion', 'San Miguel', 'Tankulan', 'Agusan Canyon'
  ];

  // Get current location using device GPS
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const { latitude, longitude } = coordinates.coords;
      setFormData(prev => ({
        ...prev,
        coordinates: { lat: latitude, lng: longitude }
      }));
      
      // Reverse geocoding to get address (you can integrate with mapping service)
      setToastMessage('Location captured successfully!');
      setShowToast(true);
      
    } catch (error) {
      setAlertMessage('Failed to get location. Please enable GPS and try again.');
      setShowAlert(true);
    } finally {
      setLocationLoading(false);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 80,
        allowEditing: false
      });

      if (image.webPath) {
        // Extract EXIF data for GPS coordinates
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const tags = await ExifReader.load(arrayBuffer);
          
          if (tags.GPSLatitude?.description && tags.GPSLongitude?.description && 
              tags.GPSLatitudeRef?.value && tags.GPSLongitudeRef?.value &&
              typeof tags.GPSLatitudeRef.value === 'string' && 
              typeof tags.GPSLongitudeRef.value === 'string') {
            const lat = convertDMSToDD(tags.GPSLatitude.description, tags.GPSLatitudeRef.value);
            const lng = convertDMSToDD(tags.GPSLongitude.description, tags.GPSLongitudeRef.value);
            
            setFormData(prev => ({
              ...prev,
              coordinates: { lat, lng }
            }));
            
            setToastMessage('Photo location extracted from EXIF data!');
            setShowToast(true);
          }
        } catch (exifError) {
          console.log('No EXIF GPS data found');
        }

        // Convert to File for upload
        const file = new File([blob], `hazard-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, file]
        }));
        setImagePreview(prev => [...prev, image.webPath!]);
      }
    } catch (error) {
      setAlertMessage('Failed to capture photo. Please try again.');
      setShowAlert(true);
    }
  };

  // Upload from gallery
  const selectFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 80
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        
        // Check for EXIF GPS data
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const tags = await ExifReader.load(arrayBuffer);
          if (tags.GPSLatitude?.description && tags.GPSLongitude?.description && tags.GPSLatitudeRef?.value && tags.GPSLongitudeRef?.value) {
            const latRef = typeof tags.GPSLatitudeRef.value === 'string' ? tags.GPSLatitudeRef.value : 'N';
            const lngRef = typeof tags.GPSLongitudeRef.value === 'string' ? tags.GPSLongitudeRef.value : 'E';
            const lat = convertDMSToDD(tags.GPSLatitude.description, latRef);
            const lng = convertDMSToDD(tags.GPSLongitude.description, lngRef);
            
            setFormData(prev => ({
              ...prev,
              coordinates: { lat, lng }
            }));
            
            setToastMessage('GPS location found in image metadata!');
            setShowToast(true);
          }
        } catch (exifError) {
          console.log('No EXIF GPS data found in selected image');
        }

        const file = new File([blob], `hazard-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, file]
        }));
        setImagePreview(prev => [...prev, image.webPath!]);
      }
    } catch (error) {
      setAlertMessage('Failed to select image. Please try again.');
      setShowAlert(true);
    }
  };

  // Convert DMS coordinates to Decimal Degrees
  const convertDMSToDD = (dms: string, ref: string) => {
    const parts = dms.match(/(\d+)°\s*(\d+)'\s*([\d.]+)"/);
    if (!parts) return 0;
    
    let dd = parseInt(parts[1]) + parseInt(parts[2])/60 + parseFloat(parts[3])/3600;
    if (ref === 'S' || ref === 'W') dd = dd * -1;
    return dd;
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  // Submit hazard report
  const submitReport = async () => {
    if (!formData.title || !formData.description || !formData.category) {
      setAlertMessage('Please fill in all required fields.');
      setShowAlert(true);
      return;
    }

    if (formData.images.length === 0) {
      setAlertMessage('Please add at least one photo of the hazard.');
      setShowAlert(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload images to Supabase storage
      const imageUrls: string[] = [];
      for (const image of formData.images) {
        const fileName = `hazard-reports/${Date.now()}-${Math.random()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('hazard-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('hazard-images')
          .getPublicUrl(fileName);
        
        imageUrls.push(publicUrl);
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('user_firstname, user_lastname')
        .eq('user_email', user.email)
        .single();

      // Insert hazard report
      const { error: insertError } = await supabase
        .from('hazard_reports')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          location: formData.location,
          barangay: formData.barangay,
          coordinates: formData.coordinates,
          image_urls: imageUrls,
          reporter_email: formData.anonymous ? null : user.email,
          reporter_name: formData.anonymous ? 'Anonymous' : `${profile?.user_firstname} ${profile?.user_lastname}`,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        location: '',
        barangay: '',
        coordinates: null,
        images: [],
        reporter_email: '',
        reporter_name: '',
        anonymous: false
      });
      setImagePreview([]);
      
      setShowSuccessModal(true);

    } catch (error: any) {
      setAlertMessage(error.message || 'Failed to submit report. Please try again.');
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
      <div style={{ padding: '20px' }}>
        {/* Header Card */}
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
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px'
              }}>
                <IonIcon icon={warningOutline} style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <div>
                <IonCardTitle style={{ color: '#1f2937', fontSize: '20px', margin: '0 0 4px 0' }}>
                  Report Hazard
                </IonCardTitle>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  Help keep your community safe by reporting incidents
                </p>
              </div>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Photo Section */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Add Photos <span style={{ color: '#ef4444' }}>*</span>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonButton 
                    expand="block" 
                    fill="outline" 
                    onClick={takePhoto}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#3b82f6',
                      '--color': '#3b82f6',
                      height: '60px'
                    } as any}
                  >
                    <IonIcon icon={cameraOutline} slot="start" />
                    Take Photo
                  </IonButton>
                </IonCol>
                <IonCol size="6">
                  <IonButton 
                    expand="block" 
                    fill="outline" 
                    onClick={selectFromGallery}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#10b981',
                      '--color': '#10b981',
                      height: '60px'
                    } as any}
                  >
                    <IonIcon icon={addOutline} slot="start" />
                    From Gallery
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

            {/* Image Preview */}
            {imagePreview.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                  Uploaded Photos ({imagePreview.length})
                </p>
                <IonGrid>
                  <IonRow>
                    {imagePreview.map((image, index) => (
                      <IonCol key={index} size="4">
                        <div style={{ 
                          position: 'relative',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid #e5e7eb'
                        }}>
                          <img 
                            src={image} 
                            alt={`Hazard ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '80px',
                              objectFit: 'cover'
                            }}
                          />
                          <IonButton
                            fill="clear"
                            size="small"
                            onClick={() => removeImage(index)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              '--color': 'white',
                              '--background': 'rgba(0,0,0,0.5)',
                              '--border-radius': '50%',
                              width: '24px',
                              height: '24px'
                            } as any}
                          >
                            <IonIcon icon={closeCircle} style={{ fontSize: '16px' }} />
                          </IonButton>
                        </div>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Location Section */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Location Information
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton 
              expand="block" 
              fill="outline"
              onClick={getCurrentLocation}
              disabled={locationLoading}
              style={{
                '--border-radius': '12px',
                '--border-color': '#667eea',
                '--color': '#667eea',
                marginBottom: '16px'
              } as any}
            >
              <IonIcon icon={locationOutline} slot="start" />
              {locationLoading ? 'Getting Location...' : 'Use Current Location'}
            </IonButton>
            
            {formData.coordinates && (
              <div style={{
                background: '#f0fff4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#166534', 
                  margin: '0 0 4px 0',
                  fontWeight: '600' 
                }}>
                  GPS Coordinates Captured
                </p>
                <p style={{ fontSize: '11px', color: '#15803d', margin: 0 }}>
                  Lat: {formData.coordinates.lat.toFixed(6)}, Lng: {formData.coordinates.lng.toFixed(6)}
                </p>
              </div>
            )}

            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">Barangay <span style={{ color: '#ef4444' }}>*</span></IonLabel>
              <IonSelect
                value={formData.barangay}
                onIonChange={e => setFormData(prev => ({...prev, barangay: e.detail.value}))}
                interface="popover"
                placeholder="Select Barangay"
              >
                {barangayList.map(barangay => (
                  <IonSelectOption key={barangay} value={barangay}>{barangay}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem style={{ '--border-radius': '12px' } as any}>
              <IonLabel position="stacked">Specific Location/Address</IonLabel>
              <IonInput
                value={formData.location}
                onIonChange={e => setFormData(prev => ({...prev, location: e.detail.value!}))}
                placeholder="e.g., Main Street near the school"
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Report Details */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Hazard Details
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">Hazard Category <span style={{ color: '#ef4444' }}>*</span></IonLabel>
              <IonSelect
                value={formData.category}
                onIonChange={e => setFormData(prev => ({...prev, category: e.detail.value}))}
                interface="popover"
                placeholder="Select Category"
              >
                {hazardCategories.map(category => (
                  <IonSelectOption key={category} value={category}>{category}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">Priority Level</IonLabel>
              <IonSelect
                value={formData.priority}
                onIonChange={e => setFormData(prev => ({...prev, priority: e.detail.value}))}
                interface="popover"
              >
                <IonSelectOption value="low">Low - Minor issue</IonSelectOption>
                <IonSelectOption value="medium">Medium - Moderate concern</IonSelectOption>
                <IonSelectOption value="high">High - Serious hazard</IonSelectOption>
                <IonSelectOption value="critical">Critical - Immediate danger</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
              <IonLabel position="stacked">Title/Summary <span style={{ color: '#ef4444' }}>*</span></IonLabel>
              <IonInput
                value={formData.title}
                onIonChange={e => setFormData(prev => ({...prev, title: e.detail.value!}))}
                placeholder="Brief description of the hazard"
                maxlength={100}
              />
            </IonItem>

            <IonItem style={{ '--border-radius': '12px', marginBottom: '16px' } as any}>
              <IonLabel position="stacked">Detailed Description <span style={{ color: '#ef4444' }}>*</span></IonLabel>
              <IonTextarea
                value={formData.description}
                onIonChange={e => setFormData(prev => ({...prev, description: e.detail.value!}))}
                placeholder="Provide detailed information about the hazard, its potential impact, and any immediate actions taken..."
                rows={4}
                maxlength={500}
              />
            </IonItem>

            <IonItem style={{ '--padding-start': '0' } as any}>
              <IonCheckbox
                checked={formData.anonymous}
                onIonChange={e => setFormData(prev => ({...prev, anonymous: e.detail.checked}))}
                style={{ marginRight: '12px' }}
              />
              <IonLabel>
                <h3>Submit Anonymously</h3>
                <p>Your name and email will not be shared with the report</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Submit Button */}
        <IonCard style={{ borderRadius: '16px' }}>
          <IonCardContent>
            {isSubmitting && <IonProgressBar type="indeterminate" />}
            
            <IonButton 
              expand="block"
              size="large"
              onClick={submitReport}
              disabled={isSubmitting}
              style={{
                '--border-radius': '12px',
                '--padding-top': '16px',
                '--padding-bottom': '16px',
                fontWeight: '600',
                fontSize: '16px',
                '--background': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                '--color': 'white',
                marginTop: '16px'
              } as any}
            >
              <IonIcon icon={warningOutline} slot="start" />
              {isSubmitting ? 'Submitting Report...' : 'SUBMIT HAZARD REPORT'}
            </IonButton>

            <div style={{
              background: '#fffbeb',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '16px'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#92400e',
                margin: 0,
                lineHeight: '1.4'
              }}>
                <IonIcon icon={informationCircleOutline} style={{ marginRight: '4px' }} />
                Reports are reviewed by LDRRMO personnel. Response time varies based on priority level.
              </p>
            </div>
          </IonCardContent>
        </IonCard>
      </div>

      {/* Success Modal */}
      <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
        <IonHeader>
          <IonToolbar style={{
            '--background': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            '--color': 'white'
          } as any}>
            <IonTitle>Report Submitted</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={() => setShowSuccessModal(false)}>
                <IonIcon icon={closeCircle} style={{ color: 'white' }} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
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
            }}>Report Submitted Successfully!</h2>

            <p style={{
              fontSize: '16px',
              color: '#047857',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}>
              Your hazard report has been received by LDRRMO Manolo Fortich. 
              You will receive updates on the status through notifications.
            </p>

            <IonButton 
              routerLink="/it35-lab2/app/home/reports"
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
              View My Reports
            </IonButton>

            <IonButton 
              fill="clear"
              expand="block"
              routerLink="/it35-lab2/app/home/dashboard"
              onClick={() => setShowSuccessModal(false)}
              style={{ '--color': '#6b7280' }}
            >
              Back to Dashboard
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
        color="success"
      />
    </IonContent>
  );
};

export default SubmitHazards;