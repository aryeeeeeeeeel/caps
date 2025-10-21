// src/pages/user-tabs/History.tsx - Updated for Consistency
import React, { useState, useEffect, useRef } from 'react';
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
  IonProgressBar,
  IonCheckbox,
  IonRadioGroup,
  IonRadio,
  IonSelect,
  IonSelectOption,
  IonSkeletonText
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
  closeCircleOutline,
  mapOutline,
  thumbsUpOutline,
  thumbsDownOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import L from 'leaflet';

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

// Skeleton Components
const SkeletonHistoryMap: React.FC = () => (
  <div style={{ height: '450px', margin: '0 0px 0px' }}>
    <IonCard style={{
      borderRadius: '16px',
      height: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <IonSkeletonText animated style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          marginBottom: '16px'
        }} />
        <IonSkeletonText animated style={{ width: '200px', height: '16px', marginBottom: '8px' }} />
        <IonSkeletonText animated style={{ width: '150px', height: '12px' }} />
      </div>
    </IonCard>
  </div>
);

const SkeletonHistoryItem: React.FC = () => (
  <IonCard style={{
    borderRadius: '16px',
    marginBottom: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  }}>
    <IonCardContent style={{ padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
            <IonSkeletonText animated style={{ width: '70px', height: '24px', borderRadius: '12px' }} />
          </div>
          <IonSkeletonText animated style={{ width: '80%', height: '16px', marginBottom: '8px' }} />
          <div style={{ marginBottom: '8px' }}>
            <IonSkeletonText animated style={{ width: '70%', height: '12px', marginBottom: '4px' }} />
            <IonSkeletonText animated style={{ width: '50%', height: '12px' }} />
          </div>
          <IonSkeletonText animated style={{ width: '100%', height: '50px', borderRadius: '6px', marginTop: '8px' }} />
          <IonSkeletonText animated style={{ width: '80px', height: '28px', borderRadius: '6px', marginTop: '8px' }} />
        </div>
        <IonSkeletonText animated style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
      </div>
    </IonCardContent>
  </IonCard>
);

const History: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [reports, setReports] = useState<UserReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [responseTimeRating, setResponseTimeRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [resolutionSatisfaction, setResolutionSatisfaction] = useState(0);
  const [feedbackCategories, setFeedbackCategories] = useState<string[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [contactMethod, setContactMethod] = useState('');

  const categoryOptions = [
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

  const fetchResolvedReports = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('status', 'resolved')
        .or(`reporter_email.eq.${user.email},reporter_email.is.null`)
        .not('coordinates', 'is', null)
        .order('resolved_at', { ascending: false });

      if (error) throw error;

      const processedReports = data?.map(report => {
        let coordinates = null;
        if (report.coordinates) {
          try {
            if (typeof report.coordinates === 'string') {
              coordinates = JSON.parse(report.coordinates);
            } else if (typeof report.coordinates === 'object' &&
              report.coordinates.lat && report.coordinates.lng) {
              coordinates = report.coordinates;
            }
          } catch (e) {
            console.warn(`Failed to parse coordinates for report ${report.id}:`, e);
          }
        }
        return { ...report, coordinates };
      }) || [];

      setReports(processedReports);
    } catch (error) {
      console.error('Error fetching resolved reports:', error);
      setToastMessage('Failed to load resolved reports');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchResolvedReports();
      } catch (error) {
        console.error('Error initializing data:', error);
        setIsLoading(false);
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const initializeMap = () => {
      if (!mapRef.current) return;

      try {
        console.log('Initializing Leaflet Map for History...');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapRef.current, {
          center: [8.3693, 124.8564],
          zoom: 13,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true
        });

        const tileLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }
        );

        tileLayer.addTo(map);
        mapInstanceRef.current = map;

        setTimeout(() => {
          map.invalidateSize();
          setMapLoaded(true);
        }, 100);

        console.log('History map initialized successfully');

      } catch (error) {
        console.error('Error initializing history map:', error);
      }
    };

    const timer = setTimeout(initializeMap, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoading]);

  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }
  }, [mapLoaded]);

  useEffect(() => {
    if (mapLoaded && reports.length > 0) {
      const timer = setTimeout(updateMapMarkers, 300);
      return () => clearTimeout(timer);
    }
  }, [reports, mapLoaded]);

  const updateMapMarkers = () => {
    console.log('Updating resolved reports map markers with', reports.length, 'reports');

    if (!mapInstanceRef.current || !mapLoaded) {
      console.warn('Map not ready for markers');
      return;
    }

    markersRef.current.forEach(marker => {
      try {
        mapInstanceRef.current?.removeLayer(marker);
      } catch (error) {
        console.warn('Error clearing marker:', error);
      }
    });
    markersRef.current = [];

    reports.forEach((report) => {
      if (!report.coordinates) return;

      try {
        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: #10b981;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(
          [report.coordinates.lat, report.coordinates.lng],
          { icon: markerIcon }
        ).addTo(mapInstanceRef.current!);

        const popupContent = `
        <div style="padding: 12px; max-width: 250px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; line-height: 1.3; font-weight: 700;">${report.title}</h4>
          <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px;">
            <strong>Description:</strong> ${report.description}
          </p>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
            <strong>Barangay:</strong> ${report.barangay}
          </p>
          <div style="display: flex; gap: 6px; margin-bottom: 10px;">
            <span style="
              background: #10b981;
              color: white;
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
            ">
              RESOLVED
            </span>
          </div>
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
            Resolved: ${report.resolved_at && new Date(report.resolved_at).toLocaleString()}
          </p>
          <button id="viewResolvedDetails-${report.id}" style="
            margin: 0;
            background: #10b981;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            width: 100%;
            font-weight: 600;
          ">
            View Details
          </button>
        </div>
      `;

        const popup = L.popup().setContent(popupContent);
        marker.bindPopup(popup);

        marker.on('popupopen', () => {
          const button = document.getElementById(`viewResolvedDetails-${report.id}`);
          if (button) {
            button.addEventListener('click', () => {
              centerMapOnReport(report);
              viewReport(report);
              marker.closePopup();
            });
          }
        });

        markersRef.current.push(marker);

      } catch (error) {
        console.error(`Error creating marker for resolved report ${report.id}:`, error);
      }
    });

    console.log(`Created ${markersRef.current.length} resolved report markers successfully`);

    if (markersRef.current.length > 1) {
      try {
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      } catch (error) {
        console.warn('Error fitting bounds:', error);
      }
    } else if (markersRef.current.length === 1) {
      const report = reports[0];
      if (report?.coordinates) {
        mapInstanceRef.current.setView([report.coordinates.lat, report.coordinates.lng], 15);
      }
    }
  };

  const viewReport = (report: UserReport) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const centerMapOnReport = (report: UserReport) => {
    if (mapInstanceRef.current && report.coordinates) {
      mapInstanceRef.current.setView([report.coordinates.lat, report.coordinates.lng], 18);
      
      const marker = markersRef.current.find(m => {
        const latLng = m.getLatLng();
        return latLng.lat === report.coordinates.lat && latLng.lng === report.coordinates.lng;
      });
      
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 500);
      }
    }
  };

  const openFeedbackModal = (report: UserReport) => {
    setSelectedReport(report);
    setFeedbackRating(report.feedback_rating || 0);
    setFeedbackComment(report.feedback_comment || '');
    setResponseTimeRating(0);
    setCommunicationRating(0);
    setResolutionSatisfaction(0);
    setFeedbackCategories([]);
    setWouldRecommend(null);
    setContactMethod('');
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
  if (!selectedReport) return;

  if (feedbackRating === 0) {
    setToastMessage('Please provide an overall rating');
    setShowToast(true);
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
  
    // Insert into feedback table
    const { error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        report_id: selectedReport.id,
        user_email: user.email,
        overall_rating: feedbackRating,
        response_time_rating: responseTimeRating,
        communication_rating: communicationRating,
        resolution_satisfaction: resolutionSatisfaction,
        categories: feedbackCategories,
        comments: feedbackComment,
        would_recommend: wouldRecommend
        // Removed contact_method
      });

    if (feedbackError) throw feedbackError;

    // Also update incident_reports for backward compatibility
    const { error: reportError } = await supabase
      .from('incident_reports')
      .update({
        feedback_rating: feedbackRating,
        feedback_comment: feedbackComment,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedReport.id);

    if (reportError) throw reportError;
    
    setToastMessage('Feedback submitted successfully');
    setShowToast(true);
    setShowFeedbackModal(false);
    
    // Reset form
    setFeedbackRating(0);
    setFeedbackComment('');
    setResponseTimeRating(0);
    setCommunicationRating(0);
    setResolutionSatisfaction(0);
    setFeedbackCategories([]);
    setWouldRecommend(null);
    
    fetchResolvedReports();
  } catch (error) {
    console.error('Error submitting feedback:', error);
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
        {[1, 2, 3, 4, 5].map((starNum) => (
          <IonIcon
            key={starNum}
            icon={starNum <= rating ? star : starOutline}
            color={starNum <= rating ? 'warning' : 'medium'}
            style={{ fontSize: '20px' }}
          />
        ))}
      </div>
    );
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
        marginBottom: '12px'
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((starNumber) => (
          <button
            key={starNumber}
            type="button"
            onClick={() => onChange(starNumber)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              fontSize: '32px',
              color: starNumber <= rating ? '#fbbf24' : '#d1d5db',
              transition: 'color 0.2s',
              lineHeight: 1
            }}
          >
            {starNumber <= rating ? '★' : '☆'}
          </button>
        ))}
        <span style={{
          fontSize: '16px',
          color: '#6b7280',
          marginLeft: '12px',
          fontWeight: '500'
        }}>
          {rating > 0 ? `${rating}/5` : 'No rating'}
        </span>
      </div>
    </div>
  );
};

  const handleCategoryToggle = (category: string, checked: boolean) => {
    setFeedbackCategories(prev =>
      checked
        ? [...prev, category]
        : prev.filter(c => c !== category)
    );
  };

  if (isLoading) {
    return (
      <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
        <div style={{ padding: '20px 20px 0' }}>
          <IonCard style={{
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            marginBottom: '20px'
          }}>
            <IonCardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IonSkeletonText animated style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    marginRight: '16px'
                  }} />
                  <div>
                    <IonSkeletonText animated style={{ width: '180px', height: '20px', marginBottom: '4px' }} />
                    <IonSkeletonText animated style={{ width: '120px', height: '14px' }} />
                  </div>
                </div>
                <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              </div>
            </IonCardHeader>
          </IonCard>

          <SkeletonHistoryMap />

          <div style={{ padding: '0 0px 0px' }}>
            <IonCard style={{ borderRadius: '16px' }}>
              <IonCardHeader>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <IonSkeletonText animated style={{ width: '140px', height: '18px' }} />
                </div>
              </IonCardHeader>
              <IonCardContent style={{ padding: 0 }}>
                <IonList style={{ background: 'transparent' }}>
                  {[1, 2, 3, 4].map((item) => (
                    <SkeletonHistoryItem key={item} />
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>
          </div>
        </div>
      </IonContent>
    );
  }

  return (
    <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <div style={{ padding: '20px 20px 0' }}>
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
                    Resolved Reports
                  </IonCardTitle>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {reports.length} reports
                  </p>
                </div>
              </div>
              <IonButton fill="clear" onClick={fetchResolvedReports}>
                <IonIcon icon={refreshOutline} color="primary" />
              </IonButton>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Map Container */}
        <div style={{ height: '450px', margin: '0 0px 0px' }}>
          <IonCard style={{
            borderRadius: '16px',
            height: '100%',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {isLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'rgba(255,255,255,0.9)',
                padding: '8px'
              }}>
                <IonProgressBar type="indeterminate" />
              </div>
            )}

            <style>
              {`
                @import url('https://unpkg.com/leaflet@1.7.1/dist/leaflet.css');
                .leaflet-container {
                  height: 100%;
                  width: 100%;
                  background: #f8fafc;
                }
                .custom-marker {
                  background: transparent;
                  border: none;
                }
                .leaflet-popup-content-wrapper {
                  border-radius: 12px;
                }
                .leaflet-popup-tip {
                  background: white;
                }
              `}
            </style>

            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '100%',
                background: '#f8fafc',
                position: 'relative',
                zIndex: 1
              }}
            />

            {!mapLoaded && !isLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                padding: '20px',
                background: '#f8fafc',
                zIndex: 10
              }}>
                <IonIcon icon={mapOutline} style={{ fontSize: '64px', color: '#d1d5db' }} />
                <h3 style={{ color: '#9ca3af', marginTop: '16px', marginBottom: '8px' }}>
                  Map loading...
                </h3>
              </div>
            )}

            {mapLoaded && (
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                fontSize: '12px',
                zIndex: 1000,
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>Resolved Reports</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                  {reports.length}
                </p>
              </div>
            )}
          </IonCard>
        </div>

        {/* Reports List */}
        <div style={{ padding: '0 0px 0px' }}>
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                  Reports ({reports.length})
                </IonCardTitle>
              </div>
            </IonCardHeader>
            <IonCardContent style={{ padding: 0 }}>
              {reports.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center'
                }}>
                  <IonIcon icon={listOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
                  <h3 style={{ color: '#9ca3af', marginTop: '16px', fontSize: '18px' }}>
                    No resolved reports
                  </h3>
                  <p style={{ color: '#d1d5db', fontSize: '14px', margin: '8px 0 20px 0' }}>
                    Resolved incident reports will appear here.
                  </p>
                  {!isLoading && (
                    <IonButton
                      fill="outline"
                      onClick={fetchResolvedReports}
                      style={{ marginRight: '8px' }}
                    >
                      <IonIcon icon={refreshOutline} slot="start" />
                      Refresh
                    </IonButton>
                  )}
                </div>
              ) : (
                <IonList style={{ background: 'transparent' }}>
                  {reports.map((report) => (
                    <IonCard key={report.id} style={{
                      borderRadius: '16px',
                      margin: '0 16px 12px 16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      <IonCardContent style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
                              <IonChip
                                style={{
                                  '--background': getStatusColor(report.status) + '20',
                                  '--color': getStatusColor(report.status),
                                  height: '24px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  margin: 0
                                } as any}
                              >
                                <IonIcon icon={checkmarkCircleOutline} style={{ marginRight: '2px', fontSize: '12px' }} />
                                RESOLVED
                              </IonChip>
                            </div>

                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#1f2937',
                              margin: '0 0 6px 0',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                              onClick={() => {
                                centerMapOnReport(report);
                                viewReport(report);
                              }}>
                              {report.category}
                            </h3>

                            <div style={{ marginBottom: '8px' }}>
                              <p style={{
                                fontSize: '13px',
                                color: '#6b7280',
                                margin: '0 0 4px 0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {report.description}
                              </p>
                              <p style={{
                                fontSize: '11px',
                                color: '#9ca3af',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '11px' }} />
                                Resolved: {report.resolved_at && new Date(report.resolved_at).toLocaleString()}
                              </p>
                            </div>

                            {report.admin_response && (
                              <div style={{
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: '6px',
                                padding: '8px',
                                marginTop: '8px',
                                marginBottom: '8px'
                              }}>
                                <p style={{
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: '#075985',
                                  margin: '0 0 2px 0'
                                }}>LDRRMO Response:</p>
                                <p style={{
                                  fontSize: '12px',
                                  color: '#0c4a6e',
                                  margin: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}>{report.admin_response}</p>
                              </div>
                            )}

                            {report.feedback_rating ? (
                              <div style={{
                                background: '#f5f3ff',
                                border: '1px solid #ddd6fe',
                                borderRadius: '6px',
                                padding: '8px',
                                marginTop: '8px'
                              }}>
                                <p style={{
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: '#5b21b6',
                                  margin: '0 0 4px 0'
                                }}>Your Feedback:</p>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {[1, 2, 3, 4, 5].map((starNum) => (
                                    <IonIcon
                                      key={starNum}
                                      icon={starNum <= (report.feedback_rating ?? 0) ? star : starOutline}
                                      color={starNum <= (report.feedback_rating ?? 0) ? 'warning' : 'medium'}
                                      style={{ fontSize: '14px' }}
                                    />
                                  ))}
                                </div>
                                {report.feedback_comment && (
                                  <p style={{
                                    fontSize: '11px',
                                    color: '#5b21b6',
                                    margin: '4px 0 0 0',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical'
                                  }}>{report.feedback_comment}</p>
                                )}
                              </div>
                            ) : (
                              <IonButton
                                size="small"
                                fill="outline"
                                style={{
                                  marginTop: '8px',
                                  '--border-radius': '6px',
                                  height: '28px',
                                  fontSize: '12px'
                                } as any}
                                onClick={() => openFeedbackModal(report)}
                              >
                                Rate Response
                              </IonButton>
                            )}
                          </div>

                          <IonButton
                            fill="clear"
                            onClick={() => {
                              centerMapOnReport(report);
                              viewReport(report);
                            }}
                            style={{
                              '--padding-start': '4px',
                              '--padding-end': '4px',
                              minWidth: 'auto'
                            } as any}
                          >
                            <IonIcon icon={eyeOutline} color="primary" style={{ fontSize: '18px' }} />
                          </IonButton>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </IonList>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </div>

      {/* View Report Modal */}
      <IonModal
        isOpen={showViewModal}
        onDidDismiss={() => setShowViewModal(false)}
        style={{ '--border-radius': '20px' } as any}
      >
        {selectedReport && (
          <div style={{
            padding: '0',
            height: '100%',
            background: 'white',
            borderRadius: '20px',
            overflow: 'hidden'
          }}>
            <IonCard style={{
              margin: '0',
              height: '100%',
              borderRadius: '0',
              boxShadow: 'none'
            }}>
              <IonCardHeader style={{ paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonCardTitle style={{ fontSize: '20px', margin: '0', fontWeight: '700' }}>{selectedReport.title}</IonCardTitle>
                  <IonButton
                    fill="clear"
                    onClick={() => setShowViewModal(false)}
                    style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                  >
                    <IonIcon icon={closeCircleOutline} />
                  </IonButton>
                </div>
              </IonCardHeader>

              <div style={{
                height: 'calc(100% - 80px)',
                overflowY: 'auto',
                padding: '0 16px 16px'
              }}>
                <p style={{ color: '#6b7280', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IonIcon icon={locationOutline} style={{ fontSize: '16px' }} />
                  {selectedReport.location}, {selectedReport.barangay}
                </p>

                <p style={{ color: '#6b7280', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IonIcon icon={timeOutline} style={{ fontSize: '16px' }} />
                  Reported: {new Date(selectedReport.created_at).toLocaleString()}
                </p>

                {selectedReport.resolved_at && (
                  <p style={{ color: '#6b7280', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '16px' }} />
                    Resolved: {new Date(selectedReport.resolved_at).toLocaleString()}
                  </p>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ color: '#1f2937', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>Description</h4>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '13px' }}>{selectedReport.description}</p>
                </div>

                {selectedReport.admin_response && (
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{
                      color: '#075985',
                      marginBottom: '6px',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      LDRRMO Response
                    </h4>
                    <p style={{ color: '#0c4a6e', margin: 0, fontSize: '13px' }}>{selectedReport.admin_response}</p>
                  </div>
                )}

                {selectedReport.feedback_rating ? (
                  <div style={{
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{
                      color: '#5b21b6',
                      marginBottom: '6px',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      Your Feedback
                    </h4>
                    {renderStars(selectedReport.feedback_rating)}
                    {selectedReport.feedback_comment && (
                      <p style={{ color: '#5b21b6', margin: '6px 0 0 0', fontSize: '13px' }}>
                        {selectedReport.feedback_comment}
                      </p>
                    )}
                  </div>
                ) : (
                  <IonButton
                    expand="block"
                    style={{
                      '--border-radius': '10px',
                      marginBottom: '12px'
                    } as any}
                    onClick={() => {
                      setShowViewModal(false);
                      setTimeout(() => openFeedbackModal(selectedReport), 300);
                    }}
                  >
                    Rate Response
                  </IonButton>
                )}

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => {
                    centerMapOnReport(selectedReport);
                    setShowViewModal(false);
                  }}
                  style={{ '--border-radius': '10px' } as any}
                >
                  <IonIcon icon={locationOutline} slot="start" />
                  View on Map
                </IonButton>
              </div>
            </IonCard>
          </div>
        )}
      </IonModal>

      {/* Feedback Modal */}
      <IonModal
        isOpen={showFeedbackModal}
        onDidDismiss={() => setShowFeedbackModal(false)}
        style={{ '--border-radius': '0px' } as any}
      >
        <div style={{
          padding: '0',
          height: '100%',
          background: 'white',
          borderRadius: '20px',
          overflow: 'hidden'
        }}>
          <IonCard style={{
            margin: '0',
            height: '100%',
            borderRadius: '0',
            boxShadow: 'none'
          }}>
            <IonCardHeader style={{ paddingBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <IonCardTitle style={{ fontSize: '20px', margin: '0', fontWeight: '700' }}>
                  Rate Response
                </IonCardTitle>
                <IonButton
                  fill="clear"
                  onClick={() => setShowFeedbackModal(false)}
                  style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                >
                  <IonIcon icon={closeCircleOutline} />
                </IonButton>
              </div>
            </IonCardHeader>

            <div style={{
              height: 'calc(100% - 80px)',
              overflowY: 'auto',
              padding: '0 16px 16px'
            }}>
              {selectedReport && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '6px'
                    }}>
                      {selectedReport.category}
                    </h4>
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {selectedReport.description}
                    </p>
                  </div>

                  {/* Overall Rating */}
                  {renderStarRating(feedbackRating, setFeedbackRating, 'Overall Rating*')}

                  {/* Detailed Ratings */}
                  {renderStarRating(responseTimeRating, setResponseTimeRating, 'Response Time')}
                  {renderStarRating(communicationRating, setCommunicationRating, 'Communication Quality')}
                  {renderStarRating(resolutionSatisfaction, setResolutionSatisfaction, 'Resolution Satisfaction')}

                  {/* Categories - UPDATED to match GiveFeedback.tsx */}
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
                        {categoryOptions.map((category) => (
                          <IonCol size="6" key={category}>
                            <IonItem style={{
                              '--background': 'transparent',
                              '--padding-start': '0',
                              '--inner-padding-end': '0'
                            } as any}>
                              <IonCheckbox
                                checked={feedbackCategories.includes(category)}
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
                    <IonRadioGroup value={wouldRecommend} onIonChange={e => setWouldRecommend(e.detail.value)}>
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

                  {/* Comments */}
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
                      value={feedbackComment}
                      placeholder="Share your experience or suggestions for improvement..."
                      onIonInput={(e) => setFeedbackComment(e.detail.value!)}
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

                  <IonButton
                    expand="block"
                    onClick={submitFeedback}
                    disabled={feedbackRating === 0}
                    style={{
                      '--border-radius': '10px',
                      '--background': feedbackRating === 0 ? '#9ca3af' : '#10b981'
                    } as any}
                  >
                    Submit Feedback
                  </IonButton>
                </>
              )}
            </div>
          </IonCard>
        </div>
      </IonModal>

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

export default History;