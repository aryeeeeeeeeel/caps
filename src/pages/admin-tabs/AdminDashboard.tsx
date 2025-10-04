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
        // FIXED: Better coordinate validation
        const validatedReports = reportsData.map(report => {
          if (report.coordinates && 
              typeof report.coordinates.lat === 'number' && 
              typeof report.coordinates.lng === 'number' &&
              !isNaN(report.coordinates.lat) && 
              !isNaN(report.coordinates.lng) &&
              report.coordinates.lat >= -90 && 
              report.coordinates.lat <= 90 &&
              report.coordinates.lng >= -180 && 
              report.coordinates.lng <= 180) {
            return report;
          } else {
            console.warn('Invalid coordinates for report:', report.id, report.coordinates);
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
        
        // FIXED: Better coordinate validation
        const hasValidCoordinates = report.coordinates && 
          typeof report.coordinates.lat === 'number' && 
          typeof report.coordinates.lng === 'number' &&
          !isNaN(report.coordinates.lat) && 
          !isNaN(report.coordinates.lng) &&
          report.coordinates.lat >= -90 && 
          report.coordinates.lat <= 90 &&
          report.coordinates.lng >= -180 && 
          report.coordinates.lng <= 180;
        
        return matchesStatus && matchesPriority && hasValidCoordinates;
      });

      console.log(`Creating markers for ${filteredReports.length} valid reports`);

      filteredReports.forEach(report => {
        if (!report.coordinates) return;

        const { lat, lng } = report.coordinates;
        
        // FIXED: Final validation before creating marker
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

  // Route Calculation Function with validation
  const calculateRouteFromCommandCenter = async (destination: { lat: number; lng: number }) => {
    // Validate destination coordinates
    if (!destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number' || 
        isNaN(destination.lat) || isNaN(destination.lng)) {
      setToastMessage('Invalid destination coordinates');
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
    
    try {
      // Clear existing route
      clearRoute();

      // Use OpenStreetMap Routing API
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${COMMAND_CENTER.lng},${COMMAND_CENTER.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) {
        throw new Error('Route calculation failed');
      }
      
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
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      setToastMessage('Error calculating response route. Please try again.');
      setShowToast(true);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Clear Route Function
  const clearRoute = () => {
    if (routeLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setRouteInfo(null);
  };

  // Track Report Function with validation
  const handleTrackReport = (report: IncidentReport) => {
  if (report.status === 'resolved') {
    setToastMessage('Cannot track route for resolved incidents');
    setShowToast(true);
    return;
  }
  
  if (!report.coordinates || 
      typeof report.coordinates.lat !== 'number' || 
      typeof report.coordinates.lng !== 'number' ||
      isNaN(report.coordinates.lat) || 
      isNaN(report.coordinates.lng)) {
    setToastMessage('Invalid coordinates for this incident');
    setShowToast(true);
    return;
  }
  
  calculateRouteFromCommandCenter(report.coordinates);
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
              background: '#f8fafc'
            }}>
              {!isIncidentsCollapsed ? (
                <>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Incident Details</h3>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setIsIncidentsCollapsed(true)}
                  >
                    <IonIcon icon={chevronBackOutline} />
                  </IonButton>
                </>
              ) : (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setIsIncidentsCollapsed(false)}
                    style={{ margin: '0 auto' }}
                  >
                    <IonIcon icon={alertCircleOutline} style={{ fontSize: '24px' }} />
                  </IonButton>
                </div>
              )}
            </div>

            {!isIncidentsCollapsed && (
              <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                {/* Stats - Now Clickable Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'Pending', value: stats.pending, color: '#f59e0b', icon: timeOutline, status: 'pending' },
                    { label: 'Active', value: stats.active, color: '#3b82f6', icon: alertCircleOutline, status: 'active' },
                    { label: 'Resolved', value: stats.resolved, color: '#10b981', icon: checkmarkCircleOutline, status: 'resolved' },
                    { label: 'Total', value: stats.total, color: '#6b7280', icon: documentTextOutline, status: 'all' }
                  ].map((stat, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleStatusFilterClick(stat.status as any)}
                      style={{
                        padding: '12px',
                        background: statusFilter === stat.status ? stat.color + '20' : '#f8fafc',
                        borderRadius: '8px',
                        border: `1px solid ${statusFilter === stat.status ? stat.color : '#e5e7eb'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <IonIcon icon={stat.icon} style={{ color: stat.color, fontSize: '16px' }} />
                        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>{stat.label}</span>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Priority Filters - Clickable Chips */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                      Priority Filter
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'All', value: 'all', color: '#6b7280' },
                      { label: 'Critical', value: 'critical', color: '#dc2626' },
                      { label: 'High', value: 'high', color: '#f97316' },
                      { label: 'Medium', value: 'medium', color: '#f59e0b' },
                      { label: 'Low', value: 'low', color: '#10b981' }
                    ].map((priority) => (
                      <div
                        key={priority.value}
                        onClick={() => setPriorityFilter(priority.value as any)}
                        style={{
                          padding: '6px 12px',
                          background: priorityFilter === priority.value ? priority.color : '#f3f4f6',
                          color: priorityFilter === priority.value ? 'white' : priority.color,
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          border: `1px solid ${priorityFilter === priority.value ? priority.color : '#e5e7eb'}`,
                          transition: 'all 0.2s'
                        }}
                      >
                        {priority.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reports List */}
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                  Showing {filteredReports.length} Incidents
                </div>
                <IonList style={{ background: 'transparent' }}>
                  {filteredReports.map(report => {
                    const hasValidCoords = report.coordinates && 
                      typeof report.coordinates.lat === 'number' && 
                      typeof report.coordinates.lng === 'number' &&
                      !isNaN(report.coordinates.lat) && 
                      !isNaN(report.coordinates.lng);
                    
                    return (
                      <IonItem
                        key={report.id}
                        button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReportModal(true);
                          if (hasValidCoords && report.coordinates && mapInstanceRef.current) {
                            mapInstanceRef.current.setView([report.coordinates.lat, report.coordinates.lng], 16);
                          }
                        }}
                        style={{
                          '--padding-start': '0',
                          '--inner-padding-end': '0',
                          '--background': 'transparent',
                          '--border-color': '#f1f5f9',
                          marginBottom: '8px'
                        } as any}
                      >
                        <div style={{ width: '100%', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', flex: 1 }}>
                              {report.title}
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                              <span style={{
                                background: getStatusColor(report.status) + '20',
                                color: getStatusColor(report.status),
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}>
                                {report.status}
                              </span>
                              <span style={{
                                background: getPriorityColor(report.priority) + '20',
                                color: getPriorityColor(report.priority),
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}>
                                {report.priority}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                            <IonIcon icon={locationOutline} style={{ fontSize: '12px', marginRight: '4px' }} />
                            {report.location}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                              {new Date(report.created_at).toLocaleString()}
                            </div>
                            
                            {/* Tracking Button */}
                            <IonButton
                              fill="solid"
                              size="small"
                              color="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackReport(report);
                              }}
                              disabled={report.status === 'resolved' || !hasValidCoords}
                              style={{
                                '--padding-start': '8px',
                                '--padding-end': '8px',
                                fontSize: '11px',
                                height: '28px'
                              } as any}
                            >
                              <IonIcon icon={navigateOutline} slot="start" style={{ fontSize: '12px' }} />
                              Track
                            </IonButton>
                          </div>
                        </div>
                      </IonItem>
                    );
                  })}
                </IonList>
              </div>
            )}
          </div>

          {/* Middle Panel - Map */}
          <div style={{ flex: 1, position: 'relative' }}>
            {mapError && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '16px',
                borderRadius: '8px',
                zIndex: 1000,
                textAlign: 'center'
              }}>
                <IonIcon icon={alertCircleOutline} style={{ fontSize: '24px', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Map Error</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>{mapError}</div>
                <IonButton 
                  size="small" 
                  onClick={() => {
                    setMapError(null);
                    initializeMap();
                  }}
                  style={{ marginTop: '8px' }}
                >
                  Retry
                </IonButton>
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
            width: isUsersCollapsed ? '60px' : '350px',
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
              background: '#f8fafc'
            }}>
              {!isUsersCollapsed ? (
                <>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>User Management</h3>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setIsUsersCollapsed(true)}
                  >
                    <IonIcon icon={chevronForwardOutline} />
                  </IonButton>
                </>
              ) : (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setIsUsersCollapsed(false)}
                    style={{ margin: '0 auto' }}
                  >
                    <IonIcon icon={peopleOutline} style={{ fontSize: '24px' }} />
                  </IonButton>
                </div>
              )}
            </div>

            {!isUsersCollapsed && (
              <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                {/* User Stats - Clickable Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { label: 'Active', value: stats.activeUsers, color: '#10b981', status: 'active' },
                    { label: 'Inactive', value: stats.inactiveUsers, color: '#6b7280', status: 'inactive' },
                    { label: 'Total', value: stats.totalUsers, color: '#3b82f6', status: 'all' }
                  ].map((stat, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setUserFilter(stat.status as any)}
                      style={{
                        padding: '12px',
                        background: userFilter === stat.status ? stat.color + '20' : '#f8fafc',
                        borderRadius: '8px',
                        border: `1px solid ${userFilter === stat.status ? stat.color : '#e5e7eb'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', marginBottom: '4px' }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Alphabetical Filter Button */}
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    User List
                  </div>
                  <IonButton
                    fill={userSort === 'alphabetical' ? 'solid' : 'outline'}
                    size="small"
                    onClick={() => setUserSort('alphabetical')}
                    style={{ '--border-radius': '20px' } as any}
                  >
                    <IonIcon icon={filterOutline} slot="start" style={{ fontSize: '14px' }} />
                    A-Z
                  </IonButton>
                </div>

                {/* Users List */}
                <IonList style={{ background: 'transparent' }}>
                  {filteredAndSortedUsers.map(user => (
                    <IonItem
                      key={user.id}
                      button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserActionAlert(true);
                      }}
                      style={{
                        '--padding-start': '0',
                        '--inner-padding-end': '0',
                        '--background': 'transparent',
                        '--border-color': '#f1f5f9',
                        marginBottom: '8px'
                      } as any}
                    >
                      <div style={{ width: '100%', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                            {user.first_name} {user.last_name}
                          </div>
                          <span style={{
                            background: user.status === 'active' ? '#10b98120' : '#6b728020',
                            color: user.status === 'active' ? '#10b981' : '#6b7280',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            {user.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          {user.user_email}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                            Warnings: {user.warnings}
                          </div>
                        </div>
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            )}
          </div>
        </div>

        {/* Report Details Modal */}
        <IonModal isOpen={showReportModal} onDidDismiss={() => setShowReportModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Incident Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowReportModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedReport && (
              <div style={{ padding: '16px' }}>
                <IonGrid>
                  <IonRow>
                    <IonCol size="12">
                      <h2 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>{selectedReport.title}</h2>
                      
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <IonChip color={getStatusChipColor(selectedReport.status)}>
                          {selectedReport.status.toUpperCase()}
                        </IonChip>
                        <IonChip color={getPriorityChipColor(selectedReport.priority)}>
                          {selectedReport.priority.toUpperCase()}
                        </IonChip>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#374151' }}>Incident Information</h3>
                        <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>{selectedReport.description}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <IonIcon icon={locationOutline} style={{ color: '#6b7280' }} />
                          <span style={{ color: '#6b7280', fontSize: '14px' }}>{selectedReport.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <IonIcon icon={timeOutline} style={{ color: '#6b7280' }} />
                          <span style={{ color: '#6b7280', fontSize: '14px' }}>
                            {new Date(selectedReport.created_at).toLocaleString()}
                          </span>
                        </div>
                        {selectedReport.barangay && (
                          <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                            Barangay: {selectedReport.barangay}
                          </div>
                        )}
                        {selectedReport.category && (
                          <div style={{ color: '#6b7280', fontSize: '14px' }}>
                            Category: {selectedReport.category}
                          </div>
                        )}
                      </div>

                      <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0369a1' }}>Reporter Information</h3>
                        <p style={{ margin: '0 0 8px 0', color: '#0c4a6e' }}><strong>Name:</strong> {selectedReport.reporter_name}</p>
                        <p style={{ margin: '0 0 8px 0', color: '#0c4a6e' }}><strong>Email:</strong> {selectedReport.reporter_email}</p>
                        <p style={{ margin: '0 0 8px 0', color: '#0c4a6e' }}><strong>Contact:</strong> {selectedReport.reporter_contact}</p>
                        <p style={{ margin: '0 0 8px 0', color: '#0c4a6e' }}><strong>Address:</strong> {selectedReport.reporter_address}</p>
                      </div>

                      {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#374151' }}>Attached Images</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                            {selectedReport.image_urls.map((url, index) => (
                              <IonImg
                                key={index}
                                src={url}
                                style={{ borderRadius: '8px', height: '100px', objectFit: 'cover' }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedReport.admin_response && (
                        <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#166534' }}>Admin Response</h3>
                          <p style={{ margin: '0 0 8px 0', color: '#166534' }}>{selectedReport.admin_response}</p>
                          {selectedReport.updated_at && (
                            <div style={{ color: '#166534', fontSize: '12px', fontStyle: 'italic' }}>
                              Last updated: {new Date(selectedReport.updated_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {selectedReport.status !== 'resolved' && (
                          <>
                            <IonButton 
                              onClick={() => handleTrackReport(selectedReport)}
                              disabled={!selectedReport.coordinates || 
                                typeof selectedReport.coordinates?.lat !== 'number' || 
                                typeof selectedReport.coordinates?.lng !== 'number' ||
                                isNaN(selectedReport.coordinates.lat) || 
                                isNaN(selectedReport.coordinates.lng)}
                            >
                              <IonIcon icon={carOutline} slot="start" />
                              Track Response
                            </IonButton>
                            <IonButton 
                              fill="outline" 
                              onClick={() => setShowNotifyModal(true)}
                            >
                              <IonIcon icon={sendOutline} slot="start" />
                              Send Update
                            </IonButton>
                          </>
                        )}
                        <IonButton 
                          fill="clear" 
                          color="medium" 
                          onClick={() => setShowReportModal(false)}
                        >
                          Close
                        </IonButton>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
            )}
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
};

// Helper functions
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'active': return '#3b82f6';
    case 'resolved': return '#10b981';
    default: return '#6b7280';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'high': return '#f97316';
    case 'critical': return '#dc2626';
    default: return '#6b7280';
  }
};

const getStatusChipColor = (status: string): any => {
  switch (status) {
    case 'pending': return 'warning';
    case 'active': return 'primary';
    case 'resolved': return 'success';
    default: return 'medium';
  }
};

const getPriorityChipColor = (priority: string): any => {
  switch (priority) {
    case 'low': return 'success';
    case 'medium': return 'warning';
    case 'high': return 'danger';
    case 'critical': return 'danger';
    default: return 'medium';
  }
};

const handleUserAction = async (action: 'warn' | 'suspend' | 'ban') => {
  // Implementation for user actions
  console.log(`User action: ${action}`);
};

export default AdminDashboard;