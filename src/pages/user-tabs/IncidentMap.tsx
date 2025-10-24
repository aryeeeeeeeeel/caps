// src/pages/user-tabs/IncidentMap.tsx - Updated Version
import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonChip,
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonTextarea,
  IonAlert,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
  IonSkeletonText
} from '@ionic/react';
import {
  mapOutline,
  addOutline,
  eyeOutline,
  timeOutline,
  locationOutline,
  refreshOutline,
  closeCircleOutline,
  warningOutline,
  checkmarkCircleOutline,
  removeCircleOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import L from 'leaflet';

interface UserReport {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'resolved';
  location: string;
  barangay: string;
  coordinates: { lat: number; lng: number };
  image_urls: string[];
  created_at: string;
  updated_at: string;
  admin_response?: string;
  resolved_at?: string;
  reporter_email?: string | null;
}

// Skeleton Components
const SkeletonIncidentMap: React.FC = () => (
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

const SkeletonReportItem: React.FC = () => (
  <IonCard style={{
    borderRadius: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  }}>
    <IonCardContent style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
            <IonSkeletonText animated style={{ width: '80px', height: '28px', borderRadius: '14px' }} />
            <IonSkeletonText animated style={{ width: '60px', height: '28px', borderRadius: '14px' }} />
          </div>
          <IonSkeletonText animated style={{ width: '80%', height: '18px', marginBottom: '12px' }} />
          <div style={{ marginBottom: '12px' }}>
            <IonSkeletonText animated style={{ width: '70%', height: '14px', marginBottom: '8px' }} />
            <IonSkeletonText animated style={{ width: '50%', height: '12px' }} />
          </div>
          <IonSkeletonText animated style={{ width: '100px', height: '32px', borderRadius: '8px' }} />
        </div>
        <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
      </div>
    </IonCardContent>
  </IonCard>
);

const IncidentMap: React.FC = () => {
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  const fetchActiveReports = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .neq('status', 'resolved')
        .or(`reporter_email.eq.${user.email},reporter_email.is.null`)
        .not('coordinates', 'is', null)
        .order('created_at', { ascending: false });

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
      console.error('Error fetching active reports:', error);
      setToastMessage('Failed to load incident reports');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchActiveReports();
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
        console.log('Initializing Leaflet Map for Incident Map...');

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

        console.log('Incident map initialized successfully');

      } catch (error) {
        console.error('Error initializing incident map:', error);
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
  }, [reports, mapLoaded, statusFilter, priorityFilter]);

  const updateMapMarkers = () => {
    console.log('Updating incident map markers with', reports.length, 'reports');

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

    const filteredReports = reports.filter(report => {
      const statusMatch = statusFilter === 'all' || report.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || report.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });

    filteredReports.forEach((report) => {
      if (!report.coordinates) return;

      try {
        const getMarkerColor = () => {
          switch (report.priority) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#d97706';
            case 'low': return '#65a30d';
            default: return '#6b7280';
          }
        };

        const markerIcon = L.divIcon({
          className: 'modern-marker',
          html: `<div style="
            width: 32px;
            height: 32px;
            position: relative;
            cursor: pointer;
          ">
            <!-- Modern Circular Marker -->
            <div style="
              width: 32px;
              height: 32px;
              background: ${getMarkerColor()};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 
                0 4px 12px rgba(0,0,0,0.3),
                0 2px 4px rgba(0,0,0,0.2);
              position: relative;
              z-index: 2;
            ">
              <!-- Inner circle for depth -->
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
              "></div>
              
              <!-- Location Icon -->
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-weight: bold;
                font-size: 14px;
                z-index: 3;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
            </div>
            
            <!-- Pulse animation ring -->
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              border: 2px solid ${getMarkerColor()};
              border-radius: 50%;
              opacity: 0.6;
              animation: pulse 2s infinite;
              z-index: 1;
            "></div>
          </div>
          
          <style>
            @keyframes pulse {
              0% {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0.6;
              }
              50% {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 0.3;
              }
              100% {
                transform: translate(-50%, -50%) scale(1.4);
                opacity: 0;
              }
            }
          </style>`,
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
              background: ${getStatusColor(report.status)};
              color: white;
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
            ">
              ${report.status.toUpperCase()}
            </span>
            <span style="
              background: ${getMarkerColor()};
              color: white;
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
            ">
              ${report.priority.toUpperCase()}
            </span>
          </div>
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
            Reported: ${new Date(report.created_at).toLocaleString()}
          </p>
          <button id="viewDetails-${report.id}" style="
            margin: 0;
            background: #3b82f6;
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
          const button = document.getElementById(`viewDetails-${report.id}`);
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
        console.error(`Error creating marker for report ${report.id}:`, error);
      }
    });

    console.log(`Created ${markersRef.current.length} incident report markers successfully`);

    if (markersRef.current.length > 1) {
      try {
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      } catch (error) {
        console.warn('Error fitting bounds:', error);
      }
    } else if (markersRef.current.length === 1) {
      const report = filteredReports[0];
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
      
      // Find and open the marker's popup
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'active': return '#3b82f6';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchActiveReports();
    event.detail.complete();
  };

  const filteredReports = reports.filter(report => {
    const statusMatch = statusFilter === 'all' || report.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || report.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

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

          <SkeletonIncidentMap />

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
                    <SkeletonReportItem key={item} />
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
                    Incident Map
                  </IonCardTitle>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {reports.length} active reports
                  </p>
                </div>
              </div>
              <IonButton fill="clear" onClick={fetchActiveReports}>
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

            {/* Filters Container - Bottom Left */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              zIndex: 1000,
              background: 'transparent',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(8px)',
              maxWidth: 'calc(100% - 32px)',
              overflowX: 'auto'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
                alignItems: 'center',
                flexWrap: 'nowrap'
              }}>
                {/* Status Filter */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  minWidth: 'fit-content'
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    whiteSpace: 'nowrap'
                  }}>
                    Status:
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { value: 'all', label: 'All', color: '#6b7280' },
                      { value: 'pending', label: 'Pending', color: '#f59e0b' },
                      { value: 'active', label: 'Active', color: '#3b82f6' }
                    ].map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setStatusFilter(status.value as any)}
                        style={{
                          background: statusFilter === status.value ? status.color : 'transparent',
                          color: statusFilter === status.value ? 'white' : status.color,
                          border: `1px solid ${status.color}`,
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          minWidth: 'fit-content'
                        }}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  minWidth: 'fit-content'
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    whiteSpace: 'nowrap'
                  }}>
                    Priority:
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { value: 'all', label: 'All', color: '#6b7280' },
                      { value: 'low', label: 'Low', color: '#65a30d' },
                      { value: 'medium', label: 'Medium', color: '#d97706' },
                      { value: 'high', label: 'High', color: '#ea580c' },
                      { value: 'critical', label: 'Critical', color: '#dc2626' }
                    ].map((priority) => (
                      <button
                        key={priority.value}
                        onClick={() => setPriorityFilter(priority.value as any)}
                        style={{
                          background: priorityFilter === priority.value ? priority.color : 'transparent',
                          color: priorityFilter === priority.value ? 'white' : priority.color,
                          border: `1px solid ${priority.color}`,
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          minWidth: 'fit-content'
                        }}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
                <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>Shown Reports</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {filteredReports.length}
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
                  Recent Reports ({filteredReports.length})
                </IonCardTitle>
              </div>
            </IonCardHeader>
            <IonCardContent style={{ padding: 0 }}>
              {reports.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center'
                }}>
                  <IonIcon icon={warningOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
                  <h3 style={{ color: '#9ca3af', marginTop: '16px', fontSize: '18px' }}>
                    No incident reports found
                  </h3>
                  <p style={{ color: '#d1d5db', fontSize: '14px', margin: '8px 0 20px 0' }}>
                    No active incident reports in your area.
                  </p>
                  {!isLoading && (
                    <IonButton
                      fill="outline"
                      onClick={fetchActiveReports}
                      style={{ marginRight: '8px' }}
                    >
                      <IonIcon icon={refreshOutline} slot="start" />
                      Refresh
                    </IonButton>
                  )}
                </div>
              ) : (
                <IonList style={{ background: 'transparent' }}>
                  {filteredReports.slice(0, 10).map((report) => (
                    <IonCard key={report.id} style={{
                      borderRadius: '16px',
                      margin: '0 0 16px 0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      <IonCardContent style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
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
                                {report.status === 'pending' && <IonIcon icon={timeOutline} style={{ marginRight: '4px' }} />}
                                {report.status === 'active' && <IonIcon icon={eyeOutline} style={{ marginRight: '4px' }} />}
                                {report.status.toUpperCase()}
                              </IonChip>
                              <IonChip
                                style={{
                                  '--background': getPriorityColor(report.priority) + '20',
                                  '--color': getPriorityColor(report.priority),
                                  height: '28px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                } as any}
                              >
                                {report.priority.toUpperCase()}
                              </IonChip>
                            </div>

                            <h3 style={{
                              fontSize: '18px',
                              fontWeight: '700',
                              color: '#1f2937',
                              margin: '0 0 8px 0',
                              cursor: 'pointer'
                            }}
                              onClick={() => {
                                centerMapOnReport(report);
                                viewReport(report);
                              }}>
                              {report.category}
                            </h3>

                            <div style={{ marginBottom: '12px' }}>
                              <p style={{
                                fontSize: '14px',
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
                                fontSize: '12px',
                                color: '#9ca3af',
                                margin: 0
                              }}>
                                <IonIcon icon={timeOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                                Reported: {new Date(report.created_at).toLocaleString()}
                              </p>
                            </div>

                            <IonButton
                              size="small"
                              fill="outline"
                              style={{
                                '--border-radius': '8px'
                              } as any}
                              onClick={() => {
                                centerMapOnReport(report);
                                viewReport(report);
                              }}
                            >
                              <IonIcon icon={eyeOutline} slot="start" />
                              View Details
                            </IonButton>
                          </div>

                          <IonButton
                            fill="clear"
                            onClick={() => {
                              centerMapOnReport(report);
                              viewReport(report);
                            }}
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
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <IonChip
                    style={{
                      '--background': getStatusColor(selectedReport.status) + '20',
                      '--color': getStatusColor(selectedReport.status),
                      height: '28px',
                      fontSize: '12px',
                      fontWeight: '600'
                    } as any}
                  >
                    {selectedReport.status.toUpperCase()}
                  </IonChip>
                  <IonChip
                    style={{
                      '--background': getPriorityColor(selectedReport.priority) + '20',
                      '--color': getPriorityColor(selectedReport.priority),
                      height: '28px',
                      fontSize: '12px',
                      fontWeight: '600'
                    } as any}
                  >
                    {selectedReport.priority.toUpperCase()}
                  </IonChip>
                </div>

                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  <IonIcon icon={locationOutline} style={{ marginRight: '4px' }} />
                  {selectedReport.location}, {selectedReport.barangay}
                </p>

                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  <strong>Description:</strong> {selectedReport.description}
                </p>

                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  <strong>Reported:</strong> {new Date(selectedReport.created_at).toLocaleString()}
                </p>

                {selectedReport.admin_response && (
                  <div style={{
                    background: '#f0f9ff',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <p style={{ color: '#0369a1', margin: '0' }}>
                      <strong>Admin Response:</strong> {selectedReport.admin_response}
                    </p>
                  </div>
                )}

                {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                      <strong>Images:</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                      {selectedReport.image_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Report image ${index + 1}`}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            border: '2px solid transparent',
                            transition: 'border-color 0.2s ease'
                          }}
                          onClick={() => {
                            setSelectedImages(selectedReport.image_urls || []);
                            setSelectedImageIndex(index);
                            setShowImageModal(true);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </IonCard>
          </div>
        )}
      </IonModal>

      {/* Image Gallery Modal */}
      <IonModal
        isOpen={showImageModal}
        onDidDismiss={() => setShowImageModal(false)}
        style={{ '--border-radius': '20px' } as any}
      >
        <div style={{
          padding: '0',
          height: '100%',
          background: 'black',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Close Button */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000
          }}>
            <IonButton
              fill="clear"
              onClick={() => setShowImageModal(false)}
              style={{ 
                '--padding-start': '8px', 
                '--padding-end': '8px',
                '--background': 'rgba(0,0,0,0.5)',
                '--color': 'white'
              } as any}
            >
              <IonIcon icon={closeCircleOutline} style={{ fontSize: '24px' }} />
            </IonButton>
          </div>

          {/* Image Counter */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {selectedImageIndex + 1} / {selectedImages.length}
          </div>

          {/* Main Image */}
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px 100px 20px'
          }}>
            <img
              src={selectedImages[selectedImageIndex]}
              alt={`Image ${selectedImageIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Navigation Arrows */}
          {selectedImages.length > 1 && (
            <>
              {/* Previous Button */}
              {selectedImageIndex > 0 && (
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1000
                }}>
                  <IonButton
                    fill="clear"
                    onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                    style={{ 
                      '--padding-start': '12px', 
                      '--padding-end': '12px',
                      '--background': 'rgba(0,0,0,0.5)',
                      '--color': 'white'
                    } as any}
                  >
                    <IonIcon icon={arrowBackOutline} style={{ fontSize: '24px' }} />
                  </IonButton>
                </div>
              )}

              {/* Next Button */}
              {selectedImageIndex < selectedImages.length - 1 && (
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1000
                }}>
                  <IonButton
                    fill="clear"
                    onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                    style={{ 
                      '--padding-start': '12px', 
                      '--padding-end': '12px',
                      '--background': 'rgba(0,0,0,0.5)',
                      '--color': 'white'
                    } as any}
                  >
                    <IonIcon icon={refreshOutline} style={{ fontSize: '24px', transform: 'rotate(180deg)' }} />
                  </IonButton>
                </div>
              )}
            </>
          )}

          {/* Thumbnail Strip */}
          {selectedImages.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px'
            }}>
              {selectedImages.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '6px',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: selectedImageIndex === index ? '2px solid #3b82f6' : '2px solid transparent',
                    opacity: selectedImageIndex === index ? 1 : 0.7,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setSelectedImageIndex(index)}
                />
              ))}
            </div>
          )}
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

export default IncidentMap;