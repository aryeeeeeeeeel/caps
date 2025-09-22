// src/pages/home-tabs/History.tsx
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
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonAvatar,
  IonSpinner
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

  useEffect(() => {
    fetchResolvedReports();
  }, []);

  // Map initialization useEffect
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current) return;

      try {
        console.log('Initializing Leaflet Map for History...');

        // Clear any existing map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Initialize the map
        const map = L.map(mapRef.current, {
          center: [8.3693, 124.8564], // Manolo Fortich center
          zoom: 13,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true
        });

        // Add tile layer
        const tileLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }
        );

        tileLayer.addTo(map);
        mapInstanceRef.current = map;
        setMapLoaded(true);

        console.log('History map initialized successfully');

      } catch (error) {
        console.error('Error initializing history map:', error);
      }
    };

    const timer = setTimeout(initializeMap, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when reports change
  useEffect(() => {
    if (mapLoaded && reports.length > 0) {
      const timer = setTimeout(updateMapMarkers, 200);
      return () => clearTimeout(timer);
    }
  }, [reports, mapLoaded]);

  const updateMapMarkers = () => {
    console.log('Updating resolved reports map markers with', reports.length, 'reports');

    if (!mapInstanceRef.current || !mapLoaded) {
      console.warn('Map not ready for markers');
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try {
        mapInstanceRef.current?.removeLayer(marker);
      } catch (error) {
        console.warn('Error clearing marker:', error);
      }
    });
    markersRef.current = [];

    // Add new markers for resolved reports
    reports.forEach((report) => {
      if (!report.coordinates) return;

      try {
        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
          background-color: #10b981;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(
          [report.coordinates.lat, report.coordinates.lng],
          { icon: markerIcon }
        ).addTo(mapInstanceRef.current!);

        const popupContent = `
        <div style="padding: 12px; max-width: 250px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; line-height: 1.3;">${report.title}</h4>
          <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px;">
            <strong>Location:</strong> ${report.location}
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
            Resolved: ${report.resolved_at && new Date(report.resolved_at).toLocaleDateString()}
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

        // Add event listener for the button
        marker.on('popupopen', () => {
          const button = document.getElementById(`viewResolvedDetails-${report.id}`);
          if (button) {
            button.addEventListener('click', () => {
              // Zoom to the specific report location
              if (mapInstanceRef.current && report.coordinates) {
                mapInstanceRef.current.setView([report.coordinates.lat, report.coordinates.lng], 18);
              }
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

    // Fit map to show all markers
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
        .not('coordinates', 'is', null) // Add this line
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

        {/* Map Container for Resolved Reports */}
        <div style={{ height: '400px', margin: '0 20px 20px' }}>
          <IonCard style={{
            borderRadius: '16px',
            height: '100%',
            overflow: 'hidden',
            position: 'relative'
          }}>
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
      `}
            </style>

            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '100%',
                background: '#f8fafc'
              }}
            >
              {!mapLoaded && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  flexDirection: 'column'
                }}>
                  <IonSpinner name="circular" style={{ '--color': '#10b981' }} />
                  <h3 style={{ color: '#6b7280', marginTop: '16px' }}>
                    Loading resolved reports map...
                  </h3>
                </div>
              )}
            </div>

            {/* Map Legend for Resolved Reports */}
            {mapLoaded && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                background: 'white',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                fontSize: '12px',
                zIndex: 1000
              }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1f2937' }}>Resolved Reports</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                  <span>Successfully Resolved ({reports.length})</span>
                </div>
              </div>
            )}

            {/* Map Info */}
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