// src/pages/AdminMap.tsx - With MDRRMO Command Center and Incident Tracking
import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonBadge,
  IonSpinner,
  IonAlert,
  IonToast,
  IonModal,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  arrowBackOutline,
  navigateOutline,
  locationOutline,
  timeOutline,
  warningOutline,
  checkmarkCircleOutline,
  refreshOutline,
  layersOutline,
  carOutline,
  businessOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import { useIonRouter } from '@ionic/react';

// Leaflet imports
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// MDRRMO Command Center Coordinates
const COMMAND_CENTER = {
  lat: 8.371646,
  lng: 124.857026,
  name: 'MDRRMO Command Center'
};

interface IncidentReport {
  id: string;
  title: string;
  description: string;
  location: string;
  status: 'pending' | 'active' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reporter_name: string;
  reporter_email: string;
  reporter_address: string; // NEW
  reporter_contact: string; // NEW
  created_at: string;
  barangay: string;
  coordinates?: { lat: number; lng: number };
  category: string;
}

const AdminMap: React.FC = () => {
  const navigation = useIonRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const commandCenterMarkerRef = useRef<L.Marker | null>(null);
  
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  useEffect(() => {
    initializeMap();
    fetchReports();
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) return;

    // Center on Command Center
    const center: [number, number] = [COMMAND_CENTER.lat, COMMAND_CENTER.lng];
    
    mapInstanceRef.current = L.map(mapRef.current).setView(center, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    // Add Command Center marker
    addCommandCenterMarker();

    // Add click listener for map
    mapInstanceRef.current.on('click', (e: L.LeafletMouseEvent) => {
      setSelectedReport(null);
      clearRoute();
    });
  };

  const addCommandCenterMarker = () => {
    if (!mapInstanceRef.current) return;

    // Create custom Command Center icon
    const commandCenterIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          animation: pulse 2s infinite;
        ">
          <div style="
            color: white;
            font-size: 20px;
            font-weight: bold;
          ">🏢</div>
        </div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5); }
            50% { transform: scale(1.1); box-shadow: 0 6px 20px rgba(220, 38, 38, 0.8); }
          }
        </style>
      `,
      className: 'command-center-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    commandCenterMarkerRef.current = L.marker(
      [COMMAND_CENTER.lat, COMMAND_CENTER.lng],
      { icon: commandCenterIcon }
    )
      .addTo(mapInstanceRef.current)
      .bindPopup(`
        <div style="padding: 12px; text-align: center; min-width: 200px;">
          <div style="
            width: 48px;
            height: 48px;
            margin: 0 auto 12px;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          ">🏢</div>
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">
            ${COMMAND_CENTER.name}
          </h3>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
            Emergency Response Hub
          </p>
          <div style="
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 8px;
            margin-bottom: 8px;
          ">
            <p style="margin: 0; color: #991b1b; font-size: 11px; font-weight: 600;">
              📍 ${COMMAND_CENTER.lat.toFixed(6)}, ${COMMAND_CENTER.lng.toFixed(6)}
            </p>
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 11px; font-style: italic;">
            All response routes start from here
          </p>
        </div>
      `);
  };

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setReports(data);
        addMarkersToMap(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setToastMessage('Error loading reports');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const addMarkersToMap = (reportsData: IncidentReport[]) => {
    // Clear existing markers (except command center)
    markersRef.current.forEach(marker => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    if (!mapInstanceRef.current) return;

    reportsData.forEach(report => {
      if (!report.coordinates) return;

      const { lat, lng } = report.coordinates;
      
      // Create custom marker based on priority
      const markerColor = getPriorityColor(report.priority);
      const markerIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${markerColor};
            width: 24px;
            height: 24px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            position: relative;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-weight: bold;
              font-size: 12px;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(45deg);
            ">!</div>
          </div>
        `,
        className: 'incident-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });

      const marker = L.marker([lat, lng], { icon: markerIcon })
  .addTo(mapInstanceRef.current!)
  .bindPopup(`
    <div style="min-width: 250px;">
      <h3 style="margin: 0 0 8px 0; color: #1f2937;">${report.title}</h3>
      <p style="margin: 0 0 8px 0; color: #6b7280;">${report.location}</p>
      <div style="display: flex; gap: 4px; margin-bottom: 8px;">
        <span style="
          background: ${getStatusColor(report.status)}20;
          color: ${getStatusColor(report.status)};
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
        ">${report.status.toUpperCase()}</span>
        <span style="
          background: ${markerColor}20;
          color: ${markerColor};
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
        ">${report.priority.toUpperCase()}</span>
      </div>
      <div style="background: #f8fafc; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #374151;">
          <strong>Reporter:</strong> ${report.reporter_name}
        </p>
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #374151;">
          <strong>Contact:</strong> ${report.reporter_contact}
        </p>
        <p style="margin: 0; font-size: 11px; color: #374151;">
          <strong>Address:</strong> ${report.reporter_address}
        </p>
      </div>
      <button onclick="window.selectReport('${report.id}')" style="
        width: 100%;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        margin-bottom: 4px;
      ">View Details</button>
      <button onclick="window.trackIncident('${report.id}')" style="
        width: 100%;
        background: #dc2626;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
      ">📍 Track Response Route</button>
    </div>
  `);

      // Add click handler
      marker.on('click', () => {
        setSelectedReport(report);
      });

      markersRef.current.push(marker);
    });

    // Add global functions for popup buttons
    (window as any).selectReport = (reportId: string) => {
      const report = reportsData.find(r => r.id === reportId);
      if (report) {
        setSelectedReport(report);
      }
    };

    (window as any).trackIncident = (reportId: string) => {
      const report = reportsData.find(r => r.id === reportId);
      if (report && report.coordinates) {
        calculateRouteFromCommandCenter(report.coordinates);
      }
    };
  };

  const calculateRouteFromCommandCenter = async (destination: { lat: number; lng: number }) => {
    setIsCalculatingRoute(true);
    
    try {
      // Clear existing route
      clearRoute();

      // Use OpenStreetMap Routing API
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${COMMAND_CENTER.lng},${COMMAND_CENTER.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const routeCoordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        
        // Draw route on map with animated style
        routeLayerRef.current = L.polyline(routeCoordinates as [number, number][], {
          color: '#dc2626',
          weight: 5,
          opacity: 0.8,
          lineJoin: 'round',
          dashArray: '10, 10',
          className: 'animated-route'
        }).addTo(mapInstanceRef.current!);

        // Add arrow decorator to show direction
        const arrowIcon = L.divIcon({
          html: `
            <div style="
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-bottom: 12px solid #dc2626;
              transform: rotate(45deg);
            "></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        // Add direction markers along the route
        const totalPoints = routeCoordinates.length;
        for (let i = 0; i < totalPoints; i += Math.floor(totalPoints / 5)) {
          if (i < totalPoints) {
            const point = routeCoordinates[i] as [number, number];
            L.marker(point, { icon: arrowIcon, opacity: 0.6 })
              .addTo(mapInstanceRef.current!);
          }
        }
        
        // Fit map to show entire route
        const bounds = L.latLngBounds([
          [COMMAND_CENTER.lat, COMMAND_CENTER.lng],
          [destination.lat, destination.lng]
        ]);
        
        mapInstanceRef.current?.fitBounds(bounds, {
          padding: [50, 50]
        });
        
        // Store route info
        setRouteInfo({
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60 // Convert to minutes
        });
        
        setToastMessage(`Response route calculated: ${(route.distance / 1000).toFixed(1)} km, ETA ${Math.round(route.duration / 60)} min`);
        setShowToast(true);

        // Highlight the command center
        if (commandCenterMarkerRef.current) {
          commandCenterMarkerRef.current.openPopup();
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      setToastMessage('Error calculating response route');
      setShowToast(true);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const clearRoute = () => {
    if (routeLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setRouteInfo(null);
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{
          '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
          '--color': 'white'
        } as any}>
          <IonButtons slot="start">
            <IonButton onClick={() => navigation.push('/it35-lab2/admin-dashboard')}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Incident Tracking Map</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => {
              if (commandCenterMarkerRef.current && mapInstanceRef.current) {
                mapInstanceRef.current.setView([COMMAND_CENTER.lat, COMMAND_CENTER.lng], 15);
                commandCenterMarkerRef.current.openPopup();
              }
            }}>
              <IonIcon icon={businessOutline} />
            </IonButton>
            <IonButton onClick={fetchReports}>
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Map Controls */}
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '16px',
          right: '16px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <IonCard style={{
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            margin: 0,
            flex: 1
          }}>
            <IonCardContent style={{ padding: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <IonSelect
                  value={filterStatus}
                  onIonChange={e => setFilterStatus(e.detail.value)}
                  placeholder="Status"
                  interface="popover"
                  style={{ minWidth: '120px' }}
                >
                  <IonSelectOption value="all">All Status</IonSelectOption>
                  <IonSelectOption value="pending">Pending</IonSelectOption>
                  <IonSelectOption value="active">Active</IonSelectOption>
                  <IonSelectOption value="resolved">Resolved</IonSelectOption>
                </IonSelect>
               
              </div>
            </IonCardContent>
          </IonCard>

          {routeInfo && (
            <IonCard style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              margin: 0,
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white'
            }}>
              <IonCardContent style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IonIcon icon={carOutline} style={{ fontSize: '24px' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {routeInfo.distance.toFixed(1)} km • {Math.round(routeInfo.duration)} min
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Response Route Active</div>
                </div>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={clearRoute}
                  style={{ '--color': 'white' } as any}
                >
                  <IonIcon icon={closeCircleOutline} slot="icon-only" />
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        {/* Map Container */}
        <div 
          ref={mapRef} 
          style={{ 
            height: '60%', 
            width: '100%',
            position: 'relative'
          }}
        >
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <IonSpinner />
              <span>Loading map...</span>
            </div>
          )}

          {isCalculatingRoute && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1001,
              background: 'rgba(220, 38, 38, 0.95)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <IonSpinner name="circular" style={{ '--color': 'white' } as any} />
              <span style={{ fontWeight: '600' }}>Calculating response route...</span>
            </div>
          )}
        </div>

        {/* Reports List */}
        <div style={{ height: '40%', overflow: 'auto', paddingBottom: '70px' }}>
          <IonCard style={{ margin: 0, borderRadius: 0 }}>
            <IonCardContent style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ 
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  Incident Reports ({filteredReports.length})
                </h2>
                <IonChip style={{
                  '--background': '#fef2f2',
                  '--color': '#dc2626',
                  fontWeight: '600'
                } as any}>
                  <IonIcon icon={businessOutline} />
                  <IonLabel>Command Center</IonLabel>
                </IonChip>
              </div>
              
              <IonList style={{ background: 'transparent' }}>
                {filteredReports.map((report) => (
                  <IonItem 
                    key={report.id}
                    button
                    onClick={() => {
                      setSelectedReport(report);
                      if (report.coordinates && mapInstanceRef.current) {
                        mapInstanceRef.current.setView(
                          [report.coordinates.lat, report.coordinates.lng], 
                          16
                        );
                      }
                    }}
                    style={{
                      '--background': selectedReport?.id === report.id ? '#f3f4f6' : 'transparent',
                      '--border-color': '#f1f5f9'
                    } as any}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%',
                      padding: '8px 0'
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
                          <IonIcon icon={locationOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                          {report.location}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <IonChip 
                            style={{
                              '--background': getStatusColor(report.status) + '20',
                              '--color': getStatusColor(report.status),
                              height: '20px',
                              fontSize: '10px',
                              fontWeight: '600',
                              margin: 0
                            } as any}
                          >
                            {report.status.toUpperCase()}
                          </IonChip>
                          <span style={{
                            fontSize: '11px',
                            color: '#9ca3af'
                          }}>
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <IonButton 
                        size="small" 
                        fill="solid"
                        color="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (report.coordinates) {
                            calculateRouteFromCommandCenter(report.coordinates);
                          }
                        }}
                        style={{
                          '--padding-start': '8px',
                          '--padding-end': '8px',
                          height: '32px',
                          fontSize: '11px'
                        } as any}
                      >
                        <IonIcon icon={navigateOutline} slot="start" style={{ fontSize: '14px' }} />
                        Track
                      </IonButton>
                    </div>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Selected Report Modal */}
        <IonModal 
          isOpen={!!selectedReport} 
          onDidDismiss={() => setSelectedReport(null)}
          breakpoints={[0, 0.75]}
          initialBreakpoint={0.75}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Report Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setSelectedReport(null)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedReport && (
              <div style={{ padding: '20px' }}>
                <IonCard>
                  <IonCardContent>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: getPriorityColor(selectedReport.priority)
                      }}></div>
                      <h2 style={{ 
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#1f2937'
                      }}>
                        {selectedReport.title}
                      </h2>
                    </div>
                    
                    <p style={{ 
                      margin: '0 0 16px 0',
                      color: '#6b7280',
                      lineHeight: '1.5'
                    }}>
                      {selectedReport.description}
                    </p>
                    
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IonIcon icon={locationOutline} color="medium" />
                        <span style={{ color: '#6b7280' }}>{selectedReport.location}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IonIcon icon={warningOutline} color="medium" />
                        <span style={{ color: '#6b7280' }}>{selectedReport.category}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IonIcon icon={timeOutline} color="medium" />
                        <span style={{ color: '#6b7280' }}>
                          {new Date(selectedReport.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginTop: '20px',
                      flexWrap: 'wrap'
                    }}>
                      <IonButton 
                        expand="block"
                        color="danger"
                        onClick={() => {
                          if (selectedReport.coordinates) {
                            calculateRouteFromCommandCenter(selectedReport.coordinates);
                            setSelectedReport(null);
                          }
                        }}
                      >
                        <IonIcon icon={carOutline} slot="start" />
                        Calculate Response Route
                      </IonButton>
                      
                      <IonButton 
                        expand="block"
                        fill="outline"
                        onClick={() => {
                          if (selectedReport.coordinates && mapInstanceRef.current) {
                            mapInstanceRef.current.setView(
                              [selectedReport.coordinates.lat, selectedReport.coordinates.lng], 
                              16
                            );
                            setSelectedReport(null);
                          }
                        }}
                      >
                        View on Map
                      </IonButton>
                    </div>
                    
                    {/* Reporter Information */}
<div style={{ 
  marginTop: '20px',
  padding: '16px',
  background: '#f8fafc',
  borderRadius: '8px'
}}>
  <h3 style={{ 
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151'
  }}>
    Reporter Information
  </h3>
  <div style={{ display: 'grid', gap: '8px' }}>
    <div>
      <strong>Name:</strong> {selectedReport.reporter_name}
    </div>
    <div>
      <strong>Contact:</strong> {selectedReport.reporter_contact}
    </div>
    <div>
      <strong>Address:</strong> {selectedReport.reporter_address}
    </div>
    <div>
      <strong>Email:</strong> {selectedReport.reporter_email}
    </div>
  </div>
</div>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>

      {/* Footer with Quick Actions */}
      <IonFooter style={{
        boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
      }}>
        <IonToolbar style={{
          '--background': 'white',
          '--padding-top': '8px',
          '--padding-bottom': '8px'
        } as any}>
          <IonGrid>
            <IonRow>
              <IonCol size="4">
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => {
                    if (commandCenterMarkerRef.current && mapInstanceRef.current) {
                      mapInstanceRef.current.setView([COMMAND_CENTER.lat, COMMAND_CENTER.lng], 15);
                      commandCenterMarkerRef.current.openPopup();
                    }
                  }}
                  style={{
                    '--color': '#dc2626',
                    height: '60px',
                    flexDirection: 'column',
                    fontSize: '10px'
                  } as any}
                >
                  <IonIcon icon={businessOutline} style={{ fontSize: '24px', marginBottom: '4px' }} />
                  Command Center
                </IonButton>
              </IonCol>
              <IonCol size="4">
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={clearRoute}
                  disabled={!routeInfo}
                  style={{
                    '--color': routeInfo ? '#f59e0b' : '#9ca3af',
                    height: '60px',
                    flexDirection: 'column',
                    fontSize: '10px'
                  } as any}
                >
                  <IonIcon icon={closeCircleOutline} style={{ fontSize: '24px', marginBottom: '4px' }} />
                  Clear Route
                </IonButton>
              </IonCol>
              <IonCol size="4">
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => navigation.push('/it35-lab2/admin-dashboard')}
                  style={{
                    '--color': '#3b82f6',
                    height: '60px',
                    flexDirection: 'column',
                    fontSize: '10px'
                  } as any}
                >
                  <IonIcon icon={arrowBackOutline} style={{ fontSize: '24px', marginBottom: '4px' }} />
                  Dashboard
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

// Utility functions
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'active': return '#8b5cf6';
    case 'resolved': return '#10b981';
    default: return '#6b7280';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'high': return '#ef4444';
    case 'critical': return '#dc2626';
    default: return '#6b7280';
  }
};

export default AdminMap;