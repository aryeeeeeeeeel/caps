// src/pages/user-tabs/IncidentMap.tsx - Updated with Skeleton Screen
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
  IonSearchbar,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonProgressBar,
  IonToast,
  IonSpinner,
  IonBadge,
  IonSkeletonText
} from '@ionic/react';
import {
  mapOutline,
  locationOutline,
  alertCircleOutline,
  warningOutline,
  checkmarkCircleOutline,
  timeOutline,
  closeCircle,
  eyeOutline,
  refreshOutline,
  navigateOutline,
  layersOutline,
  filterOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import L from 'leaflet';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface IncidentReport {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved';
  location: string;
  barangay: string;
  coordinates: { lat: number; lng: number } | null;
  image_urls: string[];
  created_at: string;
  updated_at: string;
  reporter_name: string;
  admin_response?: string;
}

// Skeleton Components
const SkeletonMapCard: React.FC = () => (
  <div style={{ height: '450px', margin: '0 20px 20px' }}>
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
  <IonItem
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
      <IonSkeletonText animated style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        marginRight: '12px'
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <IonSkeletonText animated style={{ width: '70%', height: '16px', marginBottom: '8px' }} />
        <IonSkeletonText animated style={{ width: '50%', height: '14px', marginBottom: '8px' }} />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <IonSkeletonText animated style={{ width: '60px', height: '24px', borderRadius: '12px' }} />
          <IonSkeletonText animated style={{ width: '50px', height: '24px', borderRadius: '12px' }} />
          <IonSkeletonText animated style={{ width: '40px', height: '12px' }} />
        </div>
      </div>

      <div style={{ flexShrink: 0, marginLeft: '12px' }}>
        <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
      </div>
    </div>
  </IonItem>
);

const SkeletonFilterCard: React.FC = () => (
  <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
    <IonCardContent>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <IonSkeletonText animated style={{ width: '18px', height: '18px', marginRight: '8px' }} />
        <IonSkeletonText animated style={{ width: '100px', height: '14px' }} />
      </div>

      <IonSkeletonText animated style={{
        width: '100%',
        height: '48px',
        borderRadius: '8px',
        marginBottom: '16px'
      }} />

      <IonGrid>
        <IonRow>
          <IonCol size="12" sizeMd="4">
            <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px' }} />
          </IonCol>
          <IonCol size="12" sizeMd="4">
            <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px' }} />
          </IonCol>
          <IonCol size="12" sizeMd="4">
            <IonSkeletonText animated style={{ width: '100%', height: '56px', borderRadius: '8px' }} />
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonCardContent>
  </IonCard>
);

const IncidentMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const mapInitializedRef = useRef<boolean>(false);

  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<IncidentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [mapView, setMapView] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('roadmap');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterBarangay, setFilterBarangay] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [tileLayer, setTileLayer] = useState<L.TileLayer | null>(null);

  // Updated barangay list for Manolo Fortich with correct coordinates
  const barangayList = [
    'Agusan Canyon', 'Alae', 'Dahilayan', 'Dalirig', 'Damilag',
    'Dicklum', 'Guilang-guilang', 'Kalugmanan', 'Lindaban', 'Lingion',
    'Lunocan', 'Maluko', 'Mambatangan', 'Mampayag', 'Mantibugao',
    'Minsuro', 'San Miguel', 'Sankanan', 'Santiago', 'Santo Niño',
    'Tankulan', 'Ticala'
  ];

  // Define functions BEFORE useEffect hooks
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching user reports from database...');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setReports([]);
        setToastMessage('Please log in to view your reports');
        setShowToast(true);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('reporter_email', user.email) // Only user's reports
        .in('status', ['pending', 'investigating']) // Only active reports
        .not('coordinates', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Database error:', error.message);
        setReports([]);
        setToastMessage('Error loading your reports');
        setShowToast(true);
      } else {
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
              coordinates = null;
            }
          }

          return {
            ...report,
            coordinates
          };
        }).filter(report => report.coordinates !== null) || [];

        setReports(processedReports);
        console.log(`Successfully loaded ${processedReports.length} reports`);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
      setToastMessage('Error connecting to database');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
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
        report.description.toLowerCase().includes(searchText.toLowerCase()) ||
        report.category.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  };

  const updateMapMarkers = () => {
    console.log('Updating map markers with', filteredReports.length, 'reports');

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

    // Add new markers
    filteredReports.forEach((report) => {
      if (!report.coordinates) return;

      try {
        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: ${getPriorityColor(report.priority)};
            width: ${getMarkerSize(report.priority)}px;
            height: ${getMarkerSize(report.priority)}px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          "></div>`,
          iconSize: [getMarkerSize(report.priority), getMarkerSize(report.priority)],
          iconAnchor: [getMarkerSize(report.priority) / 2, getMarkerSize(report.priority) / 2],
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
            <div style="display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap;">
              <span style="
                background: ${getPriorityColor(report.priority)}20;
                color: ${getPriorityColor(report.priority)};
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: bold;
              ">
                ${report.priority.toUpperCase()}
              </span>
              <span style="
                background: ${getStatusColor(report.status)}20;
                color: ${getStatusColor(report.status)};
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: bold;
              ">
                ${report.status.toUpperCase()}
              </span>
            </div>
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

        // Add event listener for the button after popup opens
        marker.on('popupopen', () => {
          const button = document.getElementById(`viewDetails-${report.id}`);
          if (button) {
            button.addEventListener('click', () => {
              // Zoom to the specific report location
              if (mapInstanceRef.current && report.coordinates) {
                mapInstanceRef.current.setView([report.coordinates.lat, report.coordinates.lng], 18);
              }
              setSelectedReport(report);
              setShowReportModal(true);
              marker.closePopup();
            });
          }
        });

        markersRef.current.push(marker);

      } catch (error) {
        console.error(`Error creating marker for report ${report.id}:`, error);
      }
    });

    console.log(`Created ${markersRef.current.length} markers successfully`);

    // Fit map to show all markers if there are any
    if (markersRef.current.length > 1) {
      try {
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      } catch (error) {
        console.warn('Error fitting bounds:', error);
      }
    } else if (markersRef.current.length === 1) {
      // Center on single marker
      const report = filteredReports[0];
      if (report?.coordinates) {
        mapInstanceRef.current.setView([report.coordinates.lat, report.coordinates.lng], 15);
      }
    }
  };

  const getMarkerSize = (priority: string): number => {
    switch (priority) {
      case 'critical': return 28;
      case 'high': return 24;
      case 'medium': return 20;
      case 'low': return 16;
      default: return 20;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#059669';
      case 'investigating': return '#2563eb';
      case 'pending': return '#d97706';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return checkmarkCircleOutline;
      case 'investigating': return alertCircleOutline;
      case 'pending': return timeOutline;
      default: return warningOutline;
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchReports();
    event.detail.complete();
  };

  const centerMapOnReport = (report: IncidentReport) => {
    if (mapInstanceRef.current && report.coordinates) {
      mapInstanceRef.current.setView(
        [report.coordinates.lat, report.coordinates.lng],
        16
      );
    }
  };

  const getFilterCounts = () => {
    return {
      all: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      investigating: reports.filter(r => r.status === 'investigating').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      critical: reports.filter(r => r.priority === 'critical').length,
      high: reports.filter(r => r.priority === 'high').length
    };
  };

  const changeMapType = (type: string) => {
    if (!mapInstanceRef.current || !tileLayer) return;

    mapInstanceRef.current.removeLayer(tileLayer);

    let newTileLayer: L.TileLayer;

    switch (type) {
      case 'satellite':
        newTileLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
          }
        );
        break;
      case 'terrain':
        newTileLayer = L.tileLayer(
          'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
            maxZoom: 17
          }
        );
        break;
      default:
        newTileLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }
        );
    }

    newTileLayer.addTo(mapInstanceRef.current);
    setTileLayer(newTileLayer);
  };

  // Initialize data first
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchReports();
      } catch (error) {
        console.error('Error initializing data:', error);
        setIsLoading(false);
      }
    };
    initializeData();
  }, []);

  // Map initialization useEffect - SIMPLIFIED VERSION
  useEffect(() => {
    // Only initialize map when data is loaded and component is ready
    if (isLoading || !mapRef.current) return;

    const initializeMap = () => {
      try {
        console.log('Initializing Leaflet Map for IncidentMap...');

        // Clear any existing map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Initialize the map
        const map = L.map(mapRef.current!, {
          center: [8.3693, 124.8564], // Manolo Fortich center
          zoom: 13,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true
        });

        // Add tile layer
        const initialTileLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }
        );

        initialTileLayer.addTo(map);
        mapInstanceRef.current = map;
        setTileLayer(initialTileLayer);
        mapInitializedRef.current = true;

        // Small delay to ensure map renders properly
        setTimeout(() => {
          map.invalidateSize();
          setMapLoaded(true);
          setMapError(false);
        }, 100);

        console.log('IncidentMap initialized successfully');

      } catch (error) {
        console.error('Error initializing incident map:', error);
        setMapError(true);
      }
    };

    const timer = setTimeout(initializeMap, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, [isLoading]); // Only depend on isLoading

  // Update markers when filtered reports change
  useEffect(() => {
    if (mapLoaded && filteredReports.length > 0) {
      const timer = setTimeout(updateMapMarkers, 200);
      return () => clearTimeout(timer);
    }
  }, [filteredReports, mapLoaded]);

  useEffect(() => {
    applyFilters();
  }, [reports, filterStatus, filterPriority, filterBarangay, searchText]);

  useEffect(() => {
    if (mapInstanceRef.current && tileLayer && mapLoaded) {
      changeMapType(mapView);
    }
  }, [mapView, mapLoaded]);

  const counts = getFilterCounts();

  if (isLoading) {
    return (
      <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
        <div style={{ padding: '20px 20px 0' }}>
          {/* Header Skeleton */}
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
                    <IonSkeletonText animated style={{ width: '120px', height: '20px', marginBottom: '4px' }} />
                    <IonSkeletonText animated style={{ width: '150px', height: '14px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                </div>
              </div>
            </IonCardHeader>
          </IonCard>

          {/* Map View Selector Skeleton */}
          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardContent style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <IonSkeletonText animated style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                <IonSkeletonText animated style={{ width: '80px', height: '14px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <IonSkeletonText animated style={{ flex: 1, height: '40px', borderRadius: '8px' }} />
                <IonSkeletonText animated style={{ flex: 1, height: '40px', borderRadius: '8px' }} />
                <IonSkeletonText animated style={{ flex: 1, height: '40px', borderRadius: '8px' }} />
              </div>
            </IonCardContent>
          </IonCard>

          {/* Filters Skeleton */}
          <SkeletonFilterCard />
        </div>

        {/* Map Skeleton */}
        <SkeletonMapCard />

        {/* Reports List Skeleton */}
        <div style={{ padding: '0 20px 20px' }}>
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IonSkeletonText animated style={{ width: '140px', height: '18px' }} />
                <IonSkeletonText animated style={{ width: '60px', height: '32px', borderRadius: '8px' }} />
              </div>
            </IonCardHeader>
            <IonCardContent style={{ padding: 0 }}>
              <IonList style={{ background: 'transparent' }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <SkeletonReportItem key={item} />
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    );
  }

  return (
    <IonContent style={{ '--background': 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' } as any}>
      {/* Inline Leaflet CSS - Load immediately */}
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
                    Incident Map
                  </IonCardTitle>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {filteredReports.length} of {reports.length} incidents shown
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => setShowFilters(!showFilters)}
                  color={showFilters ? 'primary' : 'medium'}
                >
                  <IonIcon icon={filterOutline} />
                  {filteredReports.length !== reports.length && (
                    <IonBadge color="primary" style={{ marginLeft: '4px' }}>
                      {filteredReports.length}
                    </IonBadge>
                  )}
                </IonButton>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={fetchReports}
                  disabled={isLoading}
                >
                  {isLoading ? <IonSpinner name="lines-small" /> : <IonIcon icon={refreshOutline} />}
                </IonButton>
              </div>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Map View Selector */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardContent style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <IonIcon icon={layersOutline} style={{ fontSize: '18px', color: '#6b7280', marginRight: '8px' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>Map View</span>
            </div>
            <IonSegment
              value={mapView}
              onIonChange={e => setMapView(e.detail.value as any)}
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
        {showFilters && (
          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <IonIcon icon={filterOutline} style={{ fontSize: '18px', color: '#6b7280', marginRight: '8px' }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>Filter Reports</span>
              </div>

              <IonSearchbar
                value={searchText}
                onIonInput={e => setSearchText(e.detail.value!)}
                placeholder="Search by title, location, or description..."
                style={{ '--background': '#f8fafc', '--border-radius': '12px', marginBottom: '16px' } as any}
              />

              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="4">
                    <IonItem style={{ '--background': 'transparent', '--padding-start': '0' } as any}>
                      <IonLabel position="stacked">Status ({filteredReports.length})</IonLabel>
                      <IonSelect
                        value={filterStatus}
                        onIonChange={e => setFilterStatus(e.detail.value)}
                        interface="popover"
                        placeholder="All Status"
                      >
                        <IonSelectOption value="all">All Status ({reports.length})</IonSelectOption>
                        <IonSelectOption value="pending">Pending ({counts.pending})</IonSelectOption>
                        <IonSelectOption value="investigating">Investigating ({counts.investigating})</IonSelectOption>
                        <IonSelectOption value="resolved">Resolved ({counts.resolved})</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="4">
                    <IonItem style={{ '--background': 'transparent', '--padding-start': '0' } as any}>
                      <IonLabel position="stacked">Priority</IonLabel>
                      <IonSelect
                        value={filterPriority}
                        onIonChange={e => setFilterPriority(e.detail.value)}
                        interface="popover"
                        placeholder="All Priority"
                      >
                        <IonSelectOption value="all">All Priority</IonSelectOption>
                        <IonSelectOption value="critical">Critical ({counts.critical})</IonSelectOption>
                        <IonSelectOption value="high">High ({counts.high})</IonSelectOption>
                        <IonSelectOption value="medium">Medium</IonSelectOption>
                        <IonSelectOption value="low">Low</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="4">
                    <IonItem style={{ '--background': 'transparent', '--padding-start': '0' } as any}>
                      <IonLabel position="stacked">Barangay</IonLabel>
                      <IonSelect
                        value={filterBarangay}
                        onIonChange={e => setFilterBarangay(e.detail.value)}
                        interface="popover"
                        placeholder="All Barangays"
                      >
                        <IonSelectOption value="all">All Barangays</IonSelectOption>
                        {barangayList.map(barangay => (
                          <IonSelectOption key={barangay} value={barangay}>{barangay}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>

              {(filterStatus !== 'all' || filterPriority !== 'all' || filterBarangay !== 'all' || searchText) && (
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterPriority('all');
                    setFilterBarangay('all');
                    setSearchText('');
                  }}
                  style={{ marginTop: '12px' }}
                >
                  Clear Filters
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>
        )}
      </div>

      {/* Map Container */}
      <div style={{ height: '450px', margin: '0 20px 20px' }}>
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

          {/* Error state only - NO loading spinner */}
          {mapError && (
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
                Map unavailable
              </h3>
              <p style={{ color: '#d1d5db', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
                Map could not be loaded. Please check your internet connection.
              </p>
              <IonButton fill="outline" onClick={() => window.location.reload()}>
                <IonIcon icon={refreshOutline} slot="start" />
                Reload Page
              </IonButton>
            </div>
          )}

          {/* Interactive Priority Legend with Hover Filtering */}
          {mapLoaded && !mapError && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              background: 'white',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontSize: '12px',
              zIndex: 1000,
              minWidth: '160px',
              transition: 'all 0.3s ease'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1f2937' }}>Priority Filter</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: filterPriority === 'all' ? '#e5e7eb' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setFilterPriority('all')}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = filterPriority === 'all' ? '#e5e7eb' : 'transparent'}
                >
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'linear-gradient(45deg, #dc2626, #ea580c, #d97706, #059669)' }}></div>
                  <span style={{ fontWeight: filterPriority === 'all' ? '600' : '400' }}>All ({reports.length})</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: filterPriority === 'critical' ? '#fee2e2' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setFilterPriority('critical')}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = filterPriority === 'critical' ? '#fee2e2' : 'transparent'}
                >
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#dc2626' }}></div>
                  <span style={{ fontWeight: filterPriority === 'critical' ? '600' : '400', color: filterPriority === 'critical' ? '#dc2626' : 'inherit' }}>
                    Critical ({counts.critical})
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: filterPriority === 'high' ? '#fed7aa' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setFilterPriority('high')}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fed7aa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = filterPriority === 'high' ? '#fed7aa' : 'transparent'}
                >
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ea580c' }}></div>
                  <span style={{ fontWeight: filterPriority === 'high' ? '600' : '400', color: filterPriority === 'high' ? '#ea580c' : 'inherit' }}>
                    High ({counts.high})
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: filterPriority === 'medium' ? '#fef3c7' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setFilterPriority('medium')}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fef3c7'}
                  onMouseLeave={(e) => e.currentTarget.style.background = filterPriority === 'medium' ? '#fef3c7' : 'transparent'}
                >
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#d97706' }}></div>
                  <span style={{ fontWeight: filterPriority === 'medium' ? '600' : '400', color: filterPriority === 'medium' ? '#d97706' : 'inherit' }}>
                    Medium ({reports.filter(r => r.priority === 'medium').length})
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: filterPriority === 'low' ? '#d1fae5' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setFilterPriority('low')}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#d1fae5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = filterPriority === 'low' ? '#d1fae5' : 'transparent'}
                >
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669' }}></div>
                  <span style={{ fontWeight: filterPriority === 'low' ? '600' : '400', color: filterPriority === 'low' ? '#059669' : 'inherit' }}>
                    Low ({reports.filter(r => r.priority === 'low').length})
                  </span>
                </div>
              </div>
              <div style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #e5e7eb',
                fontSize: '10px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Click to filter by priority
              </div>
            </div>
          )}

          {/* Map Info */}
          {mapLoaded && !mapError && (
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
              <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>Reports Shown</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                {filteredReports.length}
              </p>
            </div>
          )}
        </IonCard>
      </div>

      {/* Reports List */}
      <div style={{ padding: '0 20px 20px' }}>
        <IonCard style={{ borderRadius: '16px' }}>
          <IonCardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <IonCardTitle style={{ fontSize: '18px', color: '#1f2937' }}>
                Recent Reports ({filteredReports.length})
              </IonCardTitle>
              <IonButton
                fill="clear"
                size="small"
                routerLink="/it35-lab2/app/home/history"
              >
                View All
              </IonButton>
            </div>
          </IonCardHeader>
          <IonCardContent style={{ padding: 0 }}>
            {filteredReports.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center'
              }}>
                <IonIcon icon={informationCircleOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
                <h3 style={{ color: '#9ca3af', marginTop: '16px', fontSize: '18px' }}>
                  {isLoading ? 'Loading reports...' : 'No reports match your filters'}
                </h3>
                <p style={{ color: '#d1d5db', fontSize: '14px', margin: '8px 0 20px 0' }}>
                  {searchText || filterStatus !== 'all' || filterPriority !== 'all' || filterBarangay !== 'all'
                    ? 'Try adjusting your filter criteria or search terms.'
                    : 'No incident reports have been submitted yet.'
                  }
                </p>
                {!isLoading && (
                  <IonButton
                    fill="outline"
                    onClick={fetchReports}
                    style={{ marginRight: '8px' }}
                  >
                    <IonIcon icon={refreshOutline} slot="start" />
                    Refresh
                  </IonButton>
                )}
                {(searchText || filterStatus !== 'all' || filterPriority !== 'all' || filterBarangay !== 'all') && (
                  <IonButton
                    fill="outline"
                    color="secondary"
                    onClick={() => {
                      setSearchText('');
                      setFilterStatus('all');
                      setFilterPriority('all');
                      setFilterBarangay('all');
                    }}
                  >
                    Clear Filters
                  </IonButton>
                )}
              </div>
            ) : (
              <IonList style={{ background: 'transparent' }}>
                {filteredReports.slice(0, 10).map((report) => (
                  <IonItem
                    key={report.id}
                    button
                    onClick={() => {
                      centerMapOnReport(report);
                      setSelectedReport(report);
                      setShowReportModal(true);
                    }}
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <IonChip
                            style={{
                              '--background': getStatusColor(report.status) + '20',
                              '--color': getStatusColor(report.status),
                              height: '24px',
                              fontSize: '11px',
                              fontWeight: '600'
                            } as any}
                          >
                            <IonIcon icon={getStatusIcon(report.status)} style={{ fontSize: '12px', marginRight: '2px' }} />
                            {report.status.toUpperCase()}
                          </IonChip>
                          <IonChip
                            style={{
                              '--background': getPriorityColor(report.priority) + '20',
                              '--color': getPriorityColor(report.priority),
                              height: '24px',
                              fontSize: '11px',
                              fontWeight: '600'
                            } as any}
                          >
                            {report.priority.toUpperCase()}
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

                {filteredReports.length > 10 && (
                  <IonItem style={{ '--background': '#f8fafc' } as any}>
                    <div style={{
                      width: '100%',
                      textAlign: 'center',
                      padding: '12px'
                    }}>
                      <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>
                        Showing 10 of {filteredReports.length} reports
                      </p>
                      <IonButton
                        fill="outline"
                        size="small"
                        routerLink="/it35-lab2/app/home/reports"
                      >
                        View All Reports
                      </IonButton>
                    </div>
                  </IonItem>
                )}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </div>

      {/* Report Detail Modal */}
      <IonModal
        isOpen={showReportModal}
        onDidDismiss={() => setShowReportModal(false)}
        style={{ '--border-radius': '20px' } as any}
      >
        <div style={{
          padding: '0',
          height: '100%',
          background: 'white',
          borderRadius: '20px',
          overflow: 'hidden'
        }}>
          {selectedReport && (
            <div style={{
              height: '100%',
              overflowY: 'auto',
              padding: '16px'
            }}>
              {/* Report Header */}
              <IonCard style={{ borderRadius: '16px', marginBottom: '16px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: getPriorityColor(selectedReport.priority),
                          marginRight: '4px'
                        }}></div>
                        <IonChip
                          style={{
                            '--background': getStatusColor(selectedReport.status) + '20',
                            '--color': getStatusColor(selectedReport.status),
                            fontWeight: '600',
                            height: '28px'
                          } as any}
                        >
                          <IonIcon icon={getStatusIcon(selectedReport.status)} style={{ fontSize: '12px', marginRight: '4px' }} />
                          {selectedReport.status.toUpperCase()}
                        </IonChip>
                        <IonChip
                          style={{
                            '--background': getPriorityColor(selectedReport.priority) + '20',
                            '--color': getPriorityColor(selectedReport.priority),
                            fontWeight: '600',
                            height: '28px'
                          } as any}
                        >
                          {selectedReport.priority.toUpperCase()} PRIORITY
                        </IonChip>
                      </div>

                      <h1 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        margin: '0 0 12px 0',
                        lineHeight: '1.3'
                      }}>
                        {selectedReport.title}
                      </h1>
                    </div>

                    <IonButton
                      fill="clear"
                      onClick={() => setShowReportModal(false)}
                      style={{ '--padding-start': '4px', '--padding-end': '4px', marginTop: '-8px' } as any}
                    >
                      <IonIcon icon={closeCircle} />
                    </IonButton>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <IonIcon icon={locationOutline} style={{ color: '#6b7280', marginRight: '8px' }} />
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      {selectedReport.location}, {selectedReport.barangay}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <IonIcon icon={timeOutline} style={{ color: '#6b7280', marginRight: '8px' }} />
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      Reported on {new Date(selectedReport.created_at).toLocaleDateString()}
                      {selectedReport.updated_at !== selectedReport.created_at && (
                        <span> • Updated {new Date(selectedReport.updated_at).toLocaleDateString()}</span>
                      )}
                    </span>
                  </div>

                  <div style={{
                    background: '#f9fafb',
                    border: '1px solid',
                    borderColor: '#e5e7eb',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <p style={{
                      color: '#374151',
                      lineHeight: '1.6',
                      margin: 0,
                      fontSize: '14px'
                    }}>
                      {selectedReport.description}
                    </p>
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Report Images */}
              {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                  <IonCardHeader>
                    <IonCardTitle style={{ color: '#1f2937', fontSize: '18px' }}>
                      Report Images ({selectedReport.image_urls.length})
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        {selectedReport.image_urls.map((imageUrl, index) => (
                          <IonCol key={index} size="6" sizeMd="4">
                            <div style={{
                              position: 'relative',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1px solid #e5e7eb',
                              aspectRatio: '1',
                              cursor: 'pointer'
                            }}
                              onClick={() => {
                                window.open(imageUrl, '_blank');
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt={`Report image ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const container = e.currentTarget.parentElement;
                                  if (container) {
                                    container.innerHTML = `
                                      <div style="
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        height: 100%;
                                        background: #f3f4f6;
                                        color: #6b7280;
                                        font-size: 12px;
                                        text-align: center;
                                        padding: 8px;
                                      ">
                                        <div>
                                          <div style="font-size: 24px; margin-bottom: 4px;">📷</div>
                                          Image not available
                                        </div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                              <div style={{
                                position: 'absolute',
                                top: '4px',
                                left: '4px',
                                background: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                {index + 1}
                              </div>
                              <div style={{
                                position: 'absolute',
                                bottom: '4px',
                                right: '4px',
                                background: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px'
                              }}>
                                👁️ Click to view
                              </div>
                            </div>
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      textAlign: 'center',
                      margin: '12px 0 0 0'
                    }}>
                      Click any image to view in full size
                    </p>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Admin Response */}
              {selectedReport.admin_response && (
                <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                  <IonCardHeader>
                    <IonCardTitle style={{ color: '#075985', fontSize: '18px' }}>LDRRMO Response</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid',
                      borderColor: '#bae6fd',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <p style={{
                        fontSize: '15px',
                        color: '#0c4a6e',
                        margin: 0,
                        lineHeight: '1.6'
                      }}>{selectedReport.admin_response}</p>
                    </div>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Report Information */}
              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardHeader>
                  <IonCardTitle>Report Information</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Category</p>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0' }}>
                          {selectedReport.category}
                        </p>
                      </IonCol>
                      <IonCol size="6">
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Reporter</p>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0' }}>
                          {selectedReport.reporter_name || 'Anonymous'}
                        </p>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size="12">
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>GPS Coordinates</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontFamily: 'monospace' }}>
                          {selectedReport.coordinates ?
                            `${selectedReport.coordinates.lat.toFixed(6)}, ${selectedReport.coordinates.lng.toFixed(6)}` :
                            'Not available'
                          }
                        </p>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>

              {/* Actions */}
              <IonCard style={{ borderRadius: '16px' }}>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <IonButton
                          expand="block"
                          fill="outline"
                          onClick={() => {
                            centerMapOnReport(selectedReport);
                            setShowReportModal(false);
                          }}
                        >
                          <IonIcon icon={navigateOutline} slot="start" />
                          View on Map
                        </IonButton>
                      </IonCol>
                      <IonCol size="6">
                        <IonButton
                          expand="block"
                          routerLink="/it35-lab2/app/home/submit"
                          onClick={() => setShowReportModal(false)}
                        >
                          <IonIcon icon={warningOutline} slot="start" />
                          Report Similar
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </div>
      </IonModal>

      {/* Toast */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
        color="warning"
      />
    </IonContent>
  );
};

export default IncidentMap;