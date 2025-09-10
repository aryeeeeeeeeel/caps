// src/pages/user-tabs/ViewHazardMap.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonChip,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSearchbar,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail
} from '@ionic/react';
import {
  mapOutline,
  locationOutline,
  filterOutline,
  alertCircleOutline,
  warningOutline,
  checkmarkCircleOutline,
  timeOutline,
  closeCircle,
  eyeOutline,
  refreshOutline,
  layersOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface HazardReport {
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
  reporter_name: string;
}

const ViewHazardMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<HazardReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [mapView, setMapView] = useState<'satellite' | 'roadmap' | 'terrain'>('roadmap');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterBarangay, setFilterBarangay] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const barangayList = [
    'Damilag', 'Lindaban', 'Alae', 'Maluko', 'Daliring', 
    'Poblacion', 'San Miguel', 'Tankulan', 'Agusan Canyon'
  ];

  useEffect(() => {
    fetchReports();
    initializeMap();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filterStatus, filterPriority, filterBarangay, searchText]);

  useEffect(() => {
    if (mapInstance) {
      updateMapMarkers();
    }
  }, [filteredReports, mapInstance]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hazard_reports')
        .select('*')
        .not('coordinates', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    if (!window.google || !mapRef.current) {
      // Load Google Maps API
      loadGoogleMapsAPI();
      return;
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 8.3830, lng: 124.8500 }, // Manolo Fortich center
      zoom: 12,
      mapTypeId: mapView,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMapInstance(map);
  };

  const loadGoogleMapsAPI = () => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    (window as any).initMap = () => {
      initializeMap();
    };
  };

  const updateMapMarkers = () => {
    if (!mapInstance) return;

    // Clear existing markers
    // In a real implementation, you'd track markers and clear them

    filteredReports.forEach(report => {
      if (!report.coordinates) return;

      const marker = new window.google.maps.Marker({
        position: { lat: report.coordinates.lat, lng: report.coordinates.lng },
        map: mapInstance,
        title: report.title,
        icon: {
          url: getMarkerIcon(report.priority, report.status),
          scaledSize: new window.google.maps.Size(30, 30)
        }
      });

      marker.addListener('click', () => {
        setSelectedReport(report);
        setShowReportModal(true);
      });
    });
  };

  const getMarkerIcon = (priority: string, status: string) => {
    // Return appropriate marker icon based on priority and status
    const baseUrl = 'data:image/svg+xml;base64,';
    let color = '#6b7280';
    
    if (status === 'resolved') color = '#10b981';
    else if (status === 'investigating') color = '#3b82f6';
    else if (priority === 'critical') color = '#ef4444';
    else if (priority === 'high') color = '#f97316';
    else if (priority === 'medium') color = '#f59e0b';
    else color = '#10b981';

    const svg = `
      <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="15" cy="15" r="6" fill="white"/>
      </svg>
    `;
    
    return baseUrl + btoa(svg);
  };

  const applyFilters = () => {
    let filtered = reports;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(report => report.priority === filterPriority);
    }

    if (filterBarangay !== 'all') {
      filtered = filtered.filter(report => report.barangay === filterBarangay);
    }

    if (searchText) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchText.toLowerCase()) ||
        report.location.toLowerCase().includes(searchText.toLowerCase()) ||
        report.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#10b981';
      case 'investigating': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchReports();
    event.detail.complete();
  };

  const centerMapOnReport = (report: HazardReport) => {
    if (mapInstance && report.coordinates) {
      mapInstance.setCenter({
        lat: report.coordinates.lat,
        lng: report.coordinates.lng
      });
      mapInstance.setZoom(16);
      setSelectedReport(report);
      setShowReportModal(true);
    }
  };

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
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px'
                }}>
                  <IonIcon icon={mapOutline} style={{ fontSize: '24px', color: 'white' }} />
                </div>
                <div>
                  <IonCardTitle style={{ color: '#1f2937', fontSize: '20px', margin: '0 0 4px 0' }}>
                    Hazard Map
                  </IonCardTitle>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {filteredReports.length} incidents shown
                  </p>
                </div>
              </div>
              <IonButton fill="clear" onClick={fetchReports}>
                <IonIcon icon={refreshOutline} color="primary" />
              </IonButton>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Map View Selector */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardContent style={{ padding: '16px' }}>
            <IonSegment 
              value={mapView} 
              onIonChange={e => {
                setMapView(e.detail.value as any);
                if (mapInstance) {
                  mapInstance.setMapTypeId(e.detail.value);
                }
              }}
            >
              <IonSegmentButton value="roadmap">
                <IonLabel>Street</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="satellite">
                <IonLabel>Satellite</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="terrain">
                <IonLabel>Terrain</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonCardContent>
        </IonCard>

        {/* Filters */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardContent>
            <IonSearchbar
              value={searchText}
              onIonInput={e => setSearchText(e.detail.value!)}
              placeholder="Search reports..."
              style={{ '--background': '#f8fafc', '--border-radius': '12px', marginBottom: '12px' } as any}
            />
            
            <IonGrid>
              <IonRow>
                <IonCol size="4">
                  <IonSelect
                    value={filterStatus}
                    onIonChange={e => setFilterStatus(e.detail.value)}
                    interface="popover"
                    placeholder="Status"
                  >
                    <IonSelectOption value="all">All Status</IonSelectOption>
                    <IonSelectOption value="pending">Pending</IonSelectOption>
                    <IonSelectOption value="investigating">Investigating</IonSelectOption>
                    <IonSelectOption value="resolved">Resolved</IonSelectOption>
                  </IonSelect>
                </IonCol>
                <IonCol size="4">
                  <IonSelect
                    value={filterPriority}
                    onIonChange={e => setFilterPriority(e.detail.value)}
                    interface="popover"
                    placeholder="Priority"
                  >
                    <IonSelectOption value="all">All Priority</IonSelectOption>
                    <IonSelectOption value="critical">Critical</IonSelectOption>
                    <IonSelectOption value="high">High</IonSelectOption>
                    <IonSelectOption value="medium">Medium</IonSelectOption>
                    <IonSelectOption value="low">Low</IonSelectOption>
                  </IonSelect>
                </IonCol>
                <IonCol size="4">
                  <IonSelect
                    value={filterBarangay}
                    onIonChange={e => setFilterBarangay(e.detail.value)}
                    interface="popover"
                    placeholder="Barangay"
                  >
                    <IonSelectOption value="all">All Barangays</IonSelectOption>
                    {barangayList.map(barangay => (
                      <IonSelectOption key={barangay} value={barangay}>{barangay}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </div>

      {/* Map Container */}
      <div style={{ height: '400px', margin: '0 20px 20px' }}>
        <IonCard style={{ 
          borderRadius: '16px', 
          height: '100%',
          overflow: 'hidden'
        }}>
          <div 
            ref={mapRef} 
            style={{ 
              width: '100%', 
              height: '100%',
              background: '#f1f5f9'
            }}
          >
            {/* Fallback content if Google Maps doesn't load */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column'
            }}>
              <IonIcon icon={mapOutline} style={{ fontSize: '64px', color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading map...</p>
            </div>
          </div>
        </IonCard>
      </div>

      {/* Reports List */}
      <div style={{ padding: '0 20px 20px' }}>
        <IonCard style={{ borderRadius: '16px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
              Recent Reports ({filteredReports.length})
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent style={{ padding: 0 }}>
            {filteredReports.length === 0 ? (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center'
              }}>
                <IonIcon icon={mapOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
                <p style={{ color: '#9ca3af', marginTop: '16px' }}>
                  {isLoading ? 'Loading reports...' : 'No reports match your filters'}
                </p>
              </div>
            ) : (
              <IonList style={{ background: 'transparent' }}>
                {filteredReports.map((report) => (
                  <IonItem 
                    key={report.id}
                    button
                    onClick={() => centerMapOnReport(report)}
                    style={{
                      '--padding-start': '16px',
                      '--inner-padding-end': '16px',
                      '--border-color': '#f1f5f9',
                      '--background': 'transparent'
                    } as any}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%',
                      padding: '12px 0'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: getPriorityColor(report.priority),
                        marginRight: '12px',
                        flexShrink: 0
                      }}></div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontSize: '16px',
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
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: '0 0 8px 0'
                        }}>
                          <IonIcon icon={locationOutline} style={{ fontSize: '14px', marginRight: '4px' }} />
                          {report.location}, {report.barangay}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <IonChip 
                            style={{
                              '--background': getStatusColor(report.status) + '20',
                              '--color': getStatusColor(report.status),
                              height: '24px',
                              fontSize: '11px',
                              fontWeight: '600'
                            } as any}
                          >
                            {report.status.toUpperCase()}
                          </IonChip>
                          <span style={{
                            fontSize: '12px',
                            color: '#9ca3af'
                          }}>
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                        <IonButton size="small" fill="clear" color="primary">
                          <IonIcon icon={eyeOutline} slot="icon-only" />
                        </IonButton>
                      </div>
                    </div>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </div>

      {/* Report Detail Modal */}
      <IonModal isOpen={showReportModal} onDidDismiss={() => setShowReportModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Report Details</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={() => setShowReportModal(false)}>
                <IonIcon icon={closeCircle} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {selectedReport && (
            <div style={{ padding: '20px' }}>
              {/* Report Header */}
              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: getPriorityColor(selectedReport.priority),
                      marginRight: '12px'
                    }}></div>
                    <IonChip 
                      style={{
                        '--background': getStatusColor(selectedReport.status) + '20',
                        '--color': getStatusColor(selectedReport.status),
                        fontWeight: '600'
                      } as any}
                    >
                      {selectedReport.status.toUpperCase()}
                    </IonChip>
                  </div>
                  
                  <h1 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: '0 0 16px 0'
                  }}>
                    {selectedReport.title}
                  </h1>
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <IonIcon icon={locationOutline} style={{ color: '#6b7280', marginRight: '8px' }} />
                    <span style={{ color: '#6b7280' }}>
                      {selectedReport.location}, {selectedReport.barangay}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <IonIcon icon={timeOutline} style={{ color: '#6b7280', marginRight: '8px' }} />
                    <span style={{ color: '#6b7280' }}>
                      Reported on {new Date(selectedReport.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p style={{ color: '#374151', lineHeight: '1.6' }}>
                    {selectedReport.description}
                  </p>
                </IonCardContent>
              </IonCard>

              {/* Images */}
              {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                  <IonCardHeader>
                    <IonCardTitle>Photos</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        {selectedReport.image_urls.map((url, index) => (
                          <IonCol key={index} size="6">
                            <img 
                              src={url} 
                              alt={`Report image ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                              }}
                            />
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Report Info */}
              <IonCard style={{ borderRadius: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle>Report Information</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Category</p>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          {selectedReport.category}
                        </p>
                      </IonCol>
                      <IonCol size="6">
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Priority</p>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: getPriorityColor(selectedReport.priority), margin: 0 }}>
                          {selectedReport.priority.toUpperCase()}
                        </p>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size="6">
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '16px 0 4px 0' }}>Reporter</p>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                          {selectedReport.reporter_name}
                        </p>
                      </IonCol>
                      <IonCol size="6">
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '16px 0 4px 0' }}>Coordinates</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                          {selectedReport.coordinates.lat.toFixed(6)}, {selectedReport.coordinates.lng.toFixed(6)}
                        </p>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </IonContent>
      </IonModal>
    </IonContent>
  );
};

export default ViewHazardMap;