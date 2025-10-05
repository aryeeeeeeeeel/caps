// src/pages/admin-tabs/AdminDashboard.tsx - Fixed Version
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge,
  IonList,
  IonItem,
  IonChip,
  IonAlert,
  IonToast,
  IonModal,
  IonTextarea,
  IonDatetime,
  useIonRouter,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonImg,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  logOutOutline,
  notificationsOutline,
  chevronForwardOutline,
  chevronBackOutline,
  locationOutline,
  timeOutline,
  closeOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  sendOutline,
  peopleOutline,
  statsChartOutline,
  documentTextOutline,
  navigateOutline,
  carOutline,
  closeCircleOutline,
  businessOutline,
  filterOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  reporter_address: string;
  reporter_contact: string;
  created_at: string;
  barangay: string;
  coordinates?: { lat: number; lng: number };
  category: string;
  image_urls?: string[];
  admin_response?: string;
  updated_at?: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  user_email: string;
  status: 'active' | 'suspended' | 'banned';
  warnings: number;
  last_warning_date?: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const navigation = useIonRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const commandCenterMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [isIncidentsCollapsed, setIsIncidentsCollapsed] = useState(false);
  const [isUsersCollapsed, setIsUsersCollapsed] = useState(false);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [userSort, setUserSort] = useState<'alphabetical'>('alphabetical');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showUserActionAlert, setShowUserActionAlert] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAction, setUserAction] = useState<'warn' | 'suspend' | 'ban'>('warn');
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    verifyAdminAccess();
  }, []);

  // Initialize map after component mounts
  useEffect(() => {
    if (!isLoading && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [isLoading]);

  // Update markers when reports change and map is ready
  useEffect(() => {
    if (mapInstanceRef.current && reports.length > 0 && isMapReady) {
      updateMapMarkers();
    }
  }, [reports, statusFilter, priorityFilter, isMapReady]);

  // Invalidate map size when panels collapse/expand
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 350);
    }
  }, [isIncidentsCollapsed, isUsersCollapsed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const verifyAdminAccess = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role, user_email')
        .eq('auth_uuid', user.id)
        .single();

      if (userError) throw userError;

      if (!userData?.role || userData.role !== 'admin') {
        await supabase.auth.signOut();
        navigation.push('/it35-lab2', 'root', 'replace');
        return;
      }

      setUserEmail(userData.user_email);
      await fetchInitialData();
      setupRealtimeSubscriptions();

    } catch (error) {
      console.error('Admin access verification failed:', error);
      await supabase.auth.signOut();
      navigation.push('/it35-lab2', 'root', 'replace');
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Enhanced coordinate parsing and validation
  const parseAndValidateCoordinates = (coordinates: any): { lat: number; lng: number } | undefined => {
    if (!coordinates) {
      console.warn('No coordinates provided');
      return undefined;
    }

    try {
      let lat: number;
      let lng: number;

      // Handle different coordinate formats
      if (typeof coordinates === 'string') {
        // Try to parse as JSON string
        try {
          const parsed = JSON.parse(coordinates);
          if (parsed && typeof parsed === 'object') {
            lat = parsed.lat;
            lng = parsed.lng;
          } else {
            return undefined;
          }
        } catch {
          return undefined;
        }
      } else if (typeof coordinates === 'object') {
        lat = coordinates.lat;
        lng = coordinates.lng;
      } else {
        return undefined;
      }

      // Convert to numbers if they're strings
      if (typeof lat === 'string') {
        lat = parseFloat(lat);
      }
      if (typeof lng === 'string') {
        lng = parseFloat(lng);
      }

      // Final validation
      const isLatValid = typeof lat === 'number' && !isNaN(lat) && Math.abs(lat) <= 90;
      const isLngValid = typeof lng === 'number' && !isNaN(lng) && Math.abs(lng) <= 180;

      if (isLatValid && isLngValid) {
        return { lat, lng };
      } else {
        console.warn('Invalid coordinate values:', { lat, lng });
        return undefined;
      }
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return undefined;
    }
  };

  const fetchInitialData = async () => {
    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from('incident_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
        throw reportsError;
      }

      if (reportsData) {
        // FIXED: Use the enhanced coordinate parsing function
        const validatedReports = reportsData.map(report => {
          const validatedCoords = parseAndValidateCoordinates(report.coordinates);
          
          if (validatedCoords) {
            console.log(`✅ VALID COORDINATES for report ${report.id}:`, validatedCoords);
            return {
              ...report,
              coordinates: validatedCoords
            };
          } else {
            console.warn(`❌ INVALID coordinates for report:`, report.id, report.coordinates);
            return { ...report, coordinates: undefined };
          }
        });
        setReports(validatedReports);
      }

      // FIXED: Fetch users with first_name and last_name
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      if (usersData) {
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setToastMessage('Error loading data');
      setShowToast(true);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const reportsChannel = supabase
      .channel('reports_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_reports' },
        (payload) => {
          console.log('Real-time report update:', payload);
          fetchInitialData();
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel('users_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchInitialData();
        }
      )
      .subscribe();

    return () => {
      reportsChannel.unsubscribe();
      usersChannel.unsubscribe();
    };
  };

  // Improved map initialization with error handling
  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      setMapError(null);

      // Center on Command Center
      const center: [number, number] = [COMMAND_CENTER.lat, COMMAND_CENTER.lng];

      mapInstanceRef.current = L.map(mapRef.current).setView(center, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add Command Center marker
      addCommandCenterMarker();

      // Force map to render
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
        setIsMapReady(true);
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
      setIsMapReady(true); // Still set ready to hide loading
    }
  };

  const addCommandCenterMarker = () => {
    if (!mapInstanceRef.current) return;

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

  // FIXED: Improved marker creation with better coordinate validation
  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    try {
      // Clear existing markers (except command center)
      markersRef.current.forEach(marker => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      markersRef.current = [];

      const filteredReports = reports.filter(report => {
        const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;

        // Use the enhanced validation function
        const hasValidCoordinates = report.coordinates !== undefined;

        return matchesStatus && matchesPriority && hasValidCoordinates;
      });

      console.log(`Creating markers for ${filteredReports.length} valid reports`);

      filteredReports.forEach(report => {
        if (!report.coordinates) return;

        const { lat, lng } = report.coordinates;

        // Final validation before creating marker
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
          console.warn('Skipping invalid coordinates for report:', report.id, { lat, lng });
          return;
        }

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

        try {
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

          marker.on('click', () => {
            setSelectedReport(report);
          });

          markersRef.current.push(marker);
        } catch (markerError) {
          console.error('Error creating marker for report:', report.id, markerError);
        }
      });

      // Add global functions for popup buttons
      (window as any).selectReport = (reportId: string) => {
        const report = reports.find(r => r.id === reportId);
        if (report) {
          setSelectedReport(report);
          setShowReportModal(true);
        }
      };

      (window as any).trackIncident = (reportId: string) => {
        const report = reports.find(r => r.id === reportId);
        if (report && report.coordinates) {
          calculateRouteFromCommandCenter(report.coordinates);
        }
      };

    } catch (error) {
      console.error('Error updating map markers:', error);
      setMapError('Error updating markers');
    }
  };

  // FIXED: Track Report Function with comprehensive validation
  const handleTrackReport = (report: IncidentReport) => {
    // Don't track resolved incidents
    if (report.status === 'resolved') {
      setToastMessage('Cannot track route for resolved incidents');
      setShowToast(true);
      return;
    }

    // Comprehensive coordinate validation
    if (!report.coordinates) {
      setToastMessage('No coordinates available for this incident');
      setShowToast(true);
      return;
    }

    const { lat, lng } = report.coordinates;

    // Validate coordinate types and values
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.error('Invalid coordinate types:', { lat, lng, types: [typeof lat, typeof lng] });
      setToastMessage('Invalid coordinate data type');
      setShowToast(true);
      return;
    }

    if (isNaN(lat) || isNaN(lng)) {
      console.error('NaN coordinates:', { lat, lng });
      setToastMessage('Invalid coordinate values (NaN)');
      setShowToast(true);
      return;
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Coordinates out of range:', { lat, lng });
      setToastMessage('Coordinates are out of valid range');
      setShowToast(true);
      return;
    }

    // Additional validation for realistic coordinates (adjust for your region if needed)
    if (lat === 0 && lng === 0) {
      console.error('Null Island coordinates detected');
      setToastMessage('Invalid default coordinates (0,0)');
      setShowToast(true);
      return;
    }

    console.log(`✅ Starting route calculation for report ${report.id}:`, { lat, lng });
    calculateRouteFromCommandCenter(report.coordinates);
  };

  // FIXED: Route Calculation Function with enhanced validation and error handling
  const calculateRouteFromCommandCenter = async (destination: { lat: number; lng: number }) => {
    // Enhanced destination validation
    if (!destination) {
      setToastMessage('No destination coordinates provided');
      setShowToast(true);
      return;
    }

    const { lat, lng } = destination;

    // Comprehensive validation
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.error('Invalid destination coordinate types:', { lat, lng });
      setToastMessage('Invalid destination coordinate types');
      setShowToast(true);
      return;
    }

    if (isNaN(lat) || isNaN(lng)) {
      console.error('NaN destination coordinates:', { lat, lng });
      setToastMessage('Invalid destination coordinate values');
      setShowToast(true);
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Destination coordinates out of range:', { lat, lng });
      setToastMessage('Destination coordinates are out of valid range');
      setShowToast(true);
      return;
    }

    // Don't calculate route for resolved reports
    const targetReport = reports.find(report =>
      report.coordinates?.lat === destination.lat &&
      report.coordinates?.lng === destination.lng
    );

    if (targetReport?.status === 'resolved') {
      setToastMessage('Cannot calculate route for resolved incidents');
      setShowToast(true);
      return;
    }

    setIsCalculatingRoute(true);
    setToastMessage('Calculating response route...');
    setShowToast(true);

    try {
      // Clear existing route
      clearRoute();

      console.log('🔄 Calculating route from:', COMMAND_CENTER, 'to:', destination);

      // Use OpenStreetMap Routing API with error handling
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${COMMAND_CENTER.lng},${COMMAND_CENTER.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OSRM API error:', response.status, errorText);
        throw new Error(`Route calculation failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];

        // Validate route data
        if (!route.geometry || !route.geometry.coordinates) {
          throw new Error('Invalid route data received');
        }

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

        // Add route info to the map
        routeLayerRef.current.bindPopup(`
        <div style="padding: 8px; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0;">Response Route</h4>
          <p style="margin: 0 0 4px 0; font-size: 12px;">
            <strong>Distance:</strong> ${(route.distance / 1000).toFixed(1)} km
          </p>
          <p style="margin: 0 0 4px 0; font-size: 12px;">
            <strong>ETA:</strong> ${Math.round(route.duration / 60)} minutes
          </p>
          <p style="margin: 0; font-size: 11px; color: #6b7280;">
            From Command Center to Incident
          </p>
        </div>
      `);

        // Fit map to show entire route with padding
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

        console.log('✅ Route calculated successfully:', {
          distance: route.distance,
          duration: route.duration,
          coordinates: routeCoordinates.length
        });

      } else {
        throw new Error('No route found between these points');
      }
    } catch (error) {
      console.error('Error calculating route:', error);

      let errorMessage = 'Error calculating response route. ';

      if (error instanceof Error) {
        if (error.message.includes('failed')) {
          errorMessage += 'Routing service unavailable. Please try again later.';
        } else if (error.message.includes('No route')) {
          errorMessage += 'No route found between these locations.';
        } else {
          errorMessage += 'Please try again.';
        }
      }

      setToastMessage(errorMessage);
      setShowToast(true);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // FIXED: Clear Route Function with better cleanup
  const clearRoute = () => {
    if (routeLayerRef.current && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      } catch (error) {
        console.error('Error clearing route:', error);
      }
    }
    setRouteInfo(null);
  };

  const stats = useMemo(() => ({
    pending: reports.filter(r => r.status === 'pending').length,
    active: reports.filter(r => r.status === 'active').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    total: reports.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    inactiveUsers: users.filter(u => u.status !== 'active').length,
    totalUsers: users.length,
  }), [reports, users]);

  // FIXED: Filter reports - when "all" is selected, show ALL reports including resolved
  const filteredReports = useMemo(() => {
    let filtered = reports.filter(report => {
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });

    // Sort by status: pending -> active -> resolved, then by priority: critical -> high -> medium -> low
    return filtered.sort((a, b) => {
      // First sort by status priority
      const statusOrder = { pending: 0, active: 1, resolved: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Then sort by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [reports, statusFilter, priorityFilter]);

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      if (userFilter === 'all') return true;
      if (userFilter === 'active') return user.status === 'active';
      if (userFilter === 'inactive') return user.status !== 'active';
      return true;
    });

    // Sort alphabetically by full name
    return filtered.sort((a, b) => {
      const fullNameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const fullNameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return fullNameA.localeCompare(fullNameB);
    });
  }, [users, userFilter, userSort]);

  // Handle status filter click - reset priority to 'all'
  const handleStatusFilterClick = (status: 'all' | 'pending' | 'active' | 'resolved') => {
    setStatusFilter(status);
    setPriorityFilter('all'); // Reset priority filter when status changes
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <IonSpinner />
            <p>Loading dashboard...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', '--color': 'white' } as any}>
          <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta - Admin Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" style={{ color: 'white' }}>
              <IonIcon icon={notificationsOutline} />
            </IonButton>
            <IonButton fill="clear" onClick={() => setShowLogoutAlert(true)} style={{ color: 'white' }}>
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        {/* Menu Bar */}
        <IonToolbar style={{ '--background': 'white' } as any}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: statsChartOutline },
              { id: 'incidents', label: 'Incidents', icon: alertCircleOutline, route: '/it35-lab2/admin/incidents' },
              { id: 'users', label: 'Users', icon: peopleOutline, route: '/it35-lab2/admin/users' },
              { id: 'analytics', label: 'Analytics', icon: documentTextOutline, route: '/it35-lab2/admin/analytics' }
            ].map(menu => (
              <IonButton
                key={menu.id}
                fill="clear"
                onClick={() => {
                  if (menu.route) {
                    navigation.push(menu.route, 'forward', 'push');
                  }
                }}
                style={{
                  '--color': menu.id === 'dashboard' ? '#3b82f6' : '#6b7280',
                  '--background': 'transparent',
                  '--border-radius': '0',
                  borderBottom: menu.id === 'dashboard' ? '2px solid #3b82f6' : '2px solid transparent',
                  margin: 0,
                  flex: 1
                } as any}
              >
                <IonIcon icon={menu.icon} slot="start" />
                {menu.label}
              </IonButton>
            ))}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f8fafc' } as any} fullscreen>
        <div style={{ display: 'flex', height: 'calc(100vh - 112px)', width: '100%' }}>
          {/* Left Panel - Incidents */}
          <div style={{
            width: isIncidentsCollapsed ? '60px' : '350px',
            borderRight: '1px solid #e5e7eb',
            background: 'white',
            transition: 'width 0.3s',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '12px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'white'
            }}>
              {!isIncidentsCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={alertCircleOutline} style={{ color: '#dc2626' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Incident Reports</span>
                  <IonBadge color="danger" style={{ marginLeft: '8px' }}>{stats.total}</IonBadge>
                </div>
              )}
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setIsIncidentsCollapsed(!isIncidentsCollapsed)}
                style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
              >
                <IonIcon icon={isIncidentsCollapsed ? chevronForwardOutline : chevronBackOutline} />
              </IonButton>
            </div>

            {!isIncidentsCollapsed && (
              <>
                {/* Status Filter */}
                <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>
                    STATUS FILTER
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {[
                      { value: 'all', label: 'All', count: stats.total, color: '#6b7280' },
                      { value: 'pending', label: 'Pending', count: stats.pending, color: '#f59e0b' },
                      { value: 'active', label: 'Active', count: stats.active, color: '#3b82f6' },
                      { value: 'resolved', label: 'Resolved', count: stats.resolved, color: '#10b981' }
                    ].map(filter => (
                      <IonChip
                        key={filter.value}
                        outline={statusFilter !== filter.value}
                        color={statusFilter === filter.value ? 'primary' : undefined}
                        onClick={() => handleStatusFilterClick(filter.value as any)}
                        style={{
                          '--background': statusFilter === filter.value ? filter.color : 'transparent',
                          '--color': statusFilter === filter.value ? 'white' : filter.color,
                          cursor: 'pointer',
                          margin: 0,
                          fontSize: '12px'
                        } as any}
                      >
                        {filter.label} ({filter.count})
                      </IonChip>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>
                    PRIORITY FILTER
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {[
                      { value: 'all', label: 'All', color: '#6b7280' },
                      { value: 'critical', label: 'Critical', color: '#dc2626' },
                      { value: 'high', label: 'High', color: '#f97316' },
                      { value: 'medium', label: 'Medium', color: '#eab308' },
                      { value: 'low', label: 'Low', color: '#84cc16' }
                    ].map(filter => (
                      <IonChip
                        key={filter.value}
                        outline={priorityFilter !== filter.value}
                        color={priorityFilter === filter.value ? 'primary' : undefined}
                        onClick={() => setPriorityFilter(filter.value as any)}
                        style={{
                          '--background': priorityFilter === filter.value ? filter.color : 'transparent',
                          '--color': priorityFilter === filter.value ? 'white' : filter.color,
                          cursor: 'pointer',
                          margin: 0,
                          fontSize: '12px'
                        } as any}
                      >
                        {filter.label}
                      </IonChip>
                    ))}
                  </div>
                </div>

                {/* Reports List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {filteredReports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                      <IonIcon icon={alertCircleOutline} style={{ fontSize: '48px', marginBottom: '16px' }} />
                      <p>No incidents found</p>
                    </div>
                  ) : (
                    <IonList style={{ padding: 0 }}>
                      {filteredReports.map((report) => (
                        <IonItem
                          key={report.id}
                          button
                          detail={false}
                          onClick={() => {
                            setSelectedReport(report);
                            setShowReportModal(true);
                          }}
                          style={{
                            '--background': selectedReport?.id === report.id ? '#eff6ff' : 'transparent',
                            '--border-color': '#f3f4f6'
                          } as any}
                        >
                          <div style={{ width: '100%', padding: '8px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                                {report.title}
                              </span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <IonBadge
                                  style={{
                                    fontSize: '10px',
                                    '--background': getStatusColor(report.status),
                                    '--color': 'white'
                                  } as any}
                                >
                                  {report.status}
                                </IonBadge>
                                <IonBadge
                                  style={{
                                    fontSize: '10px',
                                    '--background': getPriorityColor(report.priority),
                                    '--color': 'white'
                                  } as any}
                                >
                                  {report.priority}
                                </IonBadge>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                              <IonIcon icon={locationOutline} style={{ fontSize: '12px', color: '#6b7280' }} />
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>{report.location}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                              <IonIcon icon={timeOutline} style={{ fontSize: '12px', color: '#6b7280' }} />
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                {new Date(report.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Reporter: {report.reporter_name}
                            </div>
                          </div>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Main Content - Map */}
          <div style={{ flex: 1, position: 'relative', background: '#f1f5f9' }}>
            {mapError && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center',
                zIndex: 1000
              }}>
                <IonIcon icon={alertCircleOutline} style={{ fontSize: '24px', marginBottom: '8px' }} />
                <p style={{ margin: 0 }}>{mapError}</p>
              </div>
            )}

            {isCalculatingRoute && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 1000
              }}>
                <IonSpinner style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Calculating route...</span>
              </div>
            )}

            {routeInfo && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '200px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#1f2937' }}>Response Route</h4>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={clearRoute}
                    style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                  >
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  From Command Center to Incident
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#374151' }}>Distance:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937' }}>
                    {routeInfo.distance.toFixed(1)} km
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#374151' }}>ETA:</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937' }}>
                    {Math.round(routeInfo.duration)} min
                  </span>
                </div>
              </div>
            )}

            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '100%',
                background: '#f1f5f9'
              }}
            />
          </div>

          {/* Right Panel - Users */}
          <div style={{
            width: isUsersCollapsed ? '60px' : '300px',
            borderLeft: '1px solid #e5e7eb',
            background: 'white',
            transition: 'width 0.3s',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '12px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'white'
            }}>
              {!isUsersCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={peopleOutline} style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Users</span>
                  <IonBadge color="primary" style={{ marginLeft: '8px' }}>{stats.totalUsers}</IonBadge>
                </div>
              )}
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setIsUsersCollapsed(!isUsersCollapsed)}
                style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
              >
                <IonIcon icon={isUsersCollapsed ? chevronBackOutline : chevronForwardOutline} />
              </IonButton>
            </div>

            {!isUsersCollapsed && (
              <>
                {/* User Filters */}
                <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>
                    USER FILTER
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {[
                      { value: 'all', label: 'All', count: stats.totalUsers, color: '#6b7280' },
                      { value: 'active', label: 'Active', count: stats.activeUsers, color: '#10b981' },
                      { value: 'inactive', label: 'Inactive', count: stats.inactiveUsers, color: '#ef4444' }
                    ].map(filter => (
                      <IonChip
                        key={filter.value}
                        outline={userFilter !== filter.value}
                        color={userFilter === filter.value ? 'primary' : undefined}
                        onClick={() => setUserFilter(filter.value as any)}
                        style={{
                          '--background': userFilter === filter.value ? filter.color : 'transparent',
                          '--color': userFilter === filter.value ? 'white' : filter.color,
                          cursor: 'pointer',
                          margin: 0,
                          fontSize: '12px'
                        } as any}
                      >
                        {filter.label} ({filter.count})
                      </IonChip>
                    ))}
                  </div>
                </div>

                {/* Users List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {filteredAndSortedUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                      <IonIcon icon={peopleOutline} style={{ fontSize: '48px', marginBottom: '16px' }} />
                      <p>No users found</p>
                    </div>
                  ) : (
                    <IonList style={{ padding: 0 }}>
                      {filteredAndSortedUsers.map((user) => (
                        <IonItem
                          key={user.id}
                          button
                          detail={false}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserActionAlert(true);
                          }}
                        >
                          <div style={{ width: '100%', padding: '8px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                                {user.first_name} {user.last_name}
                              </span>
                              <IonBadge
                                style={{
                                  fontSize: '10px',
                                  '--background': user.status === 'active' ? '#10b981' : user.status === 'suspended' ? '#f59e0b' : '#ef4444',
                                  '--color': 'white'
                                } as any}
                              >
                                {user.status}
                              </IonBadge>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                              {user.user_email}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </div>
                            {user.warnings > 0 && (
                              <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                                ⚠️ {user.warnings} warning{user.warnings > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </IonItem>
                      ))}
                    </IonList>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Report Detail Modal */}
        <IonModal isOpen={showReportModal} onDidDismiss={() => setShowReportModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowReportModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Incident Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => selectedReport && handleTrackReport(selectedReport)}>
                  <IonIcon icon={navigateOutline} slot="start" />
                  Track
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedReport && (
              <div style={{ padding: '16px' }}>
                <IonCard>
                  <IonCardContent>
                    <h2 style={{ marginTop: 0, marginBottom: '16px' }}>{selectedReport.title}</h2>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <IonBadge style={{ '--background': getStatusColor(selectedReport.status) } as any}>
                        {selectedReport.status}
                      </IonBadge>
                      <IonBadge style={{ '--background': getPriorityColor(selectedReport.priority) } as any}>
                        {selectedReport.priority}
                      </IonBadge>
                    </div>

                    <IonGrid>
                      <IonRow>
                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Location:</strong>
                            <p>{selectedReport.location}</p>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Barangay:</strong>
                            <p>{selectedReport.barangay}</p>
                          </div>
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Category:</strong>
                            <p>{selectedReport.category}</p>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Reported:</strong>
                            <p>{new Date(selectedReport.created_at).toLocaleString()}</p>
                          </div>
                        </IonCol>
                      </IonRow>
                    </IonGrid>

                    <div style={{ marginBottom: '16px' }}>
                      <strong>Description:</strong>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.description}</p>
                    </div>

                    {/* Reporter Information */}
                    <IonCard style={{ background: '#f8fafc' }}>
                      <IonCardContent>
                        <h3 style={{ marginTop: 0 }}>Reporter Information</h3>
                        <IonGrid>
                          <IonRow>
                            <IonCol size="6">
                              <strong>Name:</strong>
                              <p>{selectedReport.reporter_name}</p>
                            </IonCol>
                            <IonCol size="6">
                              <strong>Email:</strong>
                              <p>{selectedReport.reporter_email}</p>
                            </IonCol>
                          </IonRow>
                          <IonRow>
                            <IonCol size="6">
                              <strong>Contact:</strong>
                              <p>{selectedReport.reporter_contact}</p>
                            </IonCol>
                            <IonCol size="6">
                              <strong>Address:</strong>
                              <p>{selectedReport.reporter_address}</p>
                            </IonCol>
                          </IonRow>
                        </IonGrid>
                      </IonCardContent>
                    </IonCard>

                    {/* Images */}
                    {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <strong>Attached Images:</strong>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {selectedReport.image_urls.map((url, index) => (
                            <IonImg
                              key={index}
                              src={url}
                              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Response */}
                    {selectedReport.admin_response && (
                      <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '8px' }}>
                        <strong>Admin Response:</strong>
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selectedReport.admin_response}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                      <IonButton
                        expand="block"
                        color="primary"
                        onClick={() => selectedReport && handleTrackReport(selectedReport)}
                        disabled={selectedReport.status === 'resolved'}
                      >
                        <IonIcon icon={navigateOutline} slot="start" />
                        Track Response Route
                      </IonButton>
                      <IonButton
                        expand="block"
                        color="secondary"
                        onClick={() => {
                          setShowReportModal(false);
                          setShowNotifyModal(true);
                        }}
                      >
                        <IonIcon icon={sendOutline} slot="start" />
                        Notify Reporter
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Notify Reporter Modal */}
        <IonModal isOpen={showNotifyModal} onDidDismiss={() => setShowNotifyModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowNotifyModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Notify Reporter</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonCard>
                <IonCardContent>
                  <p>Send notification to {selectedReport?.reporter_name}</p>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <IonTextarea
                      label="Message"
                      labelPlacement="floating"
                      placeholder="Enter your message..."
                      value={notificationMessage}
                      onIonInput={(e) => setNotificationMessage(e.detail.value!)}
                      rows={6}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Select estimated resolution time
                    </div>
                    <IonDatetime
                      presentation="date-time"
                      onIonChange={(e) => setEstimatedTime(e.detail.value as string)}
                    />
                  </div>

                  <IonButton expand="block" onClick={() => {
                    // Handle notification sending
                    setToastMessage('Notification sent to reporter');
                    setShowToast(true);
                    setShowNotifyModal(false);
                    setNotificationMessage('');
                    setEstimatedTime('');
                  }}>
                    <IonIcon icon={sendOutline} slot="start" />
                    Send Notification
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
          </IonContent>
        </IonModal>

        {/* Alerts and Toasts */}
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header={'Logout'}
          message={'Are you sure you want to logout?'}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Logout', role: 'confirm', handler: () => {
              supabase.auth.signOut();
              navigation.push('/it35-lab2', 'root', 'replace');
            }}
          ]}
        />

        <IonAlert
          isOpen={showUserActionAlert}
          onDidDismiss={() => setShowUserActionAlert(false)}
          header={'User Action'}
          message={`Select action for ${selectedUser?.first_name} ${selectedUser?.last_name}`}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Warn', role: 'warn', handler: () => handleUserAction('warn') },
            { text: 'Suspend', role: 'suspend', handler: () => handleUserAction('suspend') },
            { text: 'Ban', role: 'ban', handler: () => handleUserAction('ban') }
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );

  // Helper functions
  function getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: '#f59e0b',
      active: '#3b82f6',
      resolved: '#10b981'
    };
    return colors[status] || '#6b7280';
  }

  function getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      critical: '#dc2626',
      high: '#f97316',
      medium: '#eab308',
      low: '#84cc16'
    };
    return colors[priority] || '#6b7280';
  }

  async function handleUserAction(action: 'warn' | 'suspend' | 'ban') {
    if (!selectedUser) return;

    try {
      let newStatus = selectedUser.status;
      let warnings = selectedUser.warnings || 0;

      switch (action) {
        case 'warn':
          warnings += 1;
          if (warnings >= 3) newStatus = 'suspended';
          break;
        case 'suspend':
          newStatus = 'suspended';
          break;
        case 'ban':
          newStatus = 'banned';
          break;
      }

      const { error } = await supabase
        .from('users')
        .update({
          status: newStatus,
          warnings: warnings,
          last_warning_date: action === 'warn' ? new Date().toISOString() : selectedUser.last_warning_date
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setToastMessage(`User ${action}ed successfully`);
      setShowToast(true);
      await fetchInitialData();

    } catch (error) {
      console.error('Error updating user:', error);
      setToastMessage('Error updating user');
      setShowToast(true);
    }
  }
};

export default AdminDashboard;