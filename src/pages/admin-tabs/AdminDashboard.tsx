// src/pages/admin-tabs/AdminDashboard.tsx - Fixed with requested changes
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
  IonCol,
  IonSearchbar,
  IonSkeletonText
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
  filterOutline,
  calendarOutline,
  playOutline,
  checkmarkDoneOutline,
  searchOutline
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
  name: 'MDRRMO'
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
  // NEW FIELDS
  scheduled_response_time?: string;
  estimated_arrival_time?: string;
  actual_response_started?: string;
  actual_resolved_time?: string;
  current_eta_minutes?: number;
  response_route_data?: any;
}

interface User {
  id: string;
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  status: 'active' | 'suspended' | 'banned';
  warnings: number;
  last_warning_date?: string;
  created_at: string;
}

interface IncidentResponseRoute {
  id: string;
  incident_report_id: string;
  route_coordinates: any;
  calculated_distance_km: number;
  calculated_eta_minutes: number;
  route_polyline: string;
  calculated_at: string;
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
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [scheduledResponseTime, setScheduledResponseTime] = useState('');
  const [showUserActionAlert, setShowUserActionAlert] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAction, setUserAction] = useState<'warn' | 'suspend' | 'ban'>('warn');
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userSearchText, setUserSearchText] = useState('');

  // NEW: Track if route is currently displayed
  const [isRouteDisplayed, setIsRouteDisplayed] = useState(false);

  useEffect(() => {
    console.log('📊 Current reports with ETA:', reports.map(r => ({
      id: r.id,
      status: r.status,
      hasETA: !!r.estimated_arrival_time,
      eta: r.estimated_arrival_time,
      currentETA: r.current_eta_minutes
    })));
  }, [reports]);

  useEffect(() => {
    verifyAdminAccess();
    setupAutomatedNotificationsCheck();
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

  // NEW: Setup interval to check for automated notifications
  const setupAutomatedNotificationsCheck = () => {
    // Check every minute for scheduled notifications
    const interval = setInterval(() => {
      checkAndTriggerAutomatedNotifications();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  };

  // UPDATED: Automated notification system with better error handling
  const checkAndTriggerAutomatedNotifications = async () => {
    try {
      const now = new Date();

      console.log('🔄 Checking automated notifications...');

      // Check for reports that need status updates
      const pendingReports = reports.filter(report => {
        if (report.status !== 'pending' || !report.scheduled_response_time) {
          return false;
        }

        try {
          const scheduledTime = new Date(report.scheduled_response_time);
          return !isNaN(scheduledTime.getTime()) && scheduledTime <= now;
        } catch {
          return false;
        }
      });

      console.log(`📅 ${pendingReports.length} pending reports ready for activation`);

      // Update pending reports to active
      for (const report of pendingReports) {
        console.log(`🔄 Activating report: ${report.id}`);
        await updateReportStatus(report.id, 'active');
        await createAutomatedNotification(
          report.reporter_email,
          'Response Started',
          `Your incident report "${report.title}" is now being actively addressed by our response team.`,
          'response_started'
        );
      }

      // Check for ETA notifications with better validation
      const activeReports = reports.filter(report => {
        if (report.status !== 'active' || !report.estimated_arrival_time) {
          return false;
        }

        try {
          const arrivalTime = new Date(report.estimated_arrival_time!);
          return !isNaN(arrivalTime.getTime());
        } catch {
          return false;
        }
      });

      console.log(`🚗 ${activeReports.length} active reports with valid ETA`);

      for (const report of activeReports) {
        try {
          const arrivalTime = new Date(report.estimated_arrival_time!);
          const threeMinutesBefore = new Date(arrivalTime.getTime() - 3 * 60000);

          console.log(`📊 Report ${report.id}:`, {
            now: now.toISOString(),
            arrivalTime: arrivalTime.toISOString(),
            threeMinutesBefore: threeMinutesBefore.toISOString(),
            shouldNotify: now >= threeMinutesBefore && now < arrivalTime
          });

          if (now >= threeMinutesBefore && now < arrivalTime) {
            // Check if we already sent this notification
            const { data: existingNotifications } = await supabase
              .from('notifications')
              .select('id')
              .eq('related_report_id', report.id)
              .eq('trigger_type', 'eta_reminder')
              .limit(1);

            if (!existingNotifications || existingNotifications.length === 0) {
              console.log(`🔔 Sending ETA reminder for report: ${report.id}`);
              await createAutomatedNotification(
                report.reporter_email,
                'Response Team Arriving Soon',
                `Our response team will arrive at your incident location in approximately 3 minutes.`,
                'eta_reminder',
                report.id
              );
            }
          }
        } catch (error) {
          console.error(`Error processing ETA for report ${report.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in automated notifications:', error);
    }
  };

  // NEW: Create automated notification
  const createAutomatedNotification = async (
    userEmail: string,
    title: string,
    message: string,
    triggerType: string,
    relatedReportId?: string
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_email: userEmail,
          title,
          message,
          type: 'info',
          read: false,
          is_automated: true,
          trigger_type: triggerType,
          related_report_id: relatedReportId,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log(`Automated notification sent: ${triggerType}`);
    } catch (error) {
      console.error('Error creating automated notification:', error);
    }
  };

  // NEW: Update report status with timestamps
  const updateReportStatus = async (reportId: string, newStatus: 'pending' | 'active' | 'resolved') => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'active') {
        updateData.actual_response_started = new Date().toISOString();
      } else if (newStatus === 'resolved') {
        updateData.actual_resolved_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('incident_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      // Update local state
      setReports(prev => prev.map(report =>
        report.id === reportId ? { ...report, ...updateData } : report
      ));

      return true;
    } catch (error) {
      console.error('Error updating report status:', error);
      return false;
    }
  };

  // NEW: Schedule response time
  const scheduleResponseTime = async (reportId: string, scheduledTime: string) => {
    try {
      const { error } = await supabase
        .from('incident_reports')
        .update({
          scheduled_response_time: scheduledTime
        })
        .eq('id', reportId);

      if (error) throw error;

      // Update local state
      setReports(prev => prev.map(report =>
        report.id === reportId ? { ...report, scheduled_response_time: scheduledTime } : report
      ));

      // Create scheduled response notification
      const report = reports.find(r => r.id === reportId);
      if (report) {
        await createAutomatedNotification(
          report.reporter_email,
          'Response Scheduled',
          `Your incident report "${report.title}" has been scheduled for response at ${new Date(scheduledTime).toLocaleString()}.`,
          'scheduled_response',
          reportId
        );
      }

      setToastMessage('Response scheduled successfully');
      setShowToast(true);
      setShowScheduleModal(false);

    } catch (error) {
      console.error('Error scheduling response:', error);
      setToastMessage('Error scheduling response');
      setShowToast(true);
    }
  };

  // FIXED: Save route data to Supabase
  const saveRouteData = async (
    reportId: string,
    routeCoordinates: any,
    distance: number,
    duration: number,
    routePolyline?: string
  ) => {
    try {
      // Calculate estimated arrival time correctly
      const estimatedArrival = new Date(Date.now() + duration * 60000);
      const estimatedArrivalISO = estimatedArrival.toISOString();

      console.log('🔄 Saving route data for report:', reportId, {
        distance,
        duration,
        estimatedArrival: estimatedArrivalISO
      });

      // Save to incident_response_routes table
      const { error: routeError } = await supabase
        .from('incident_response_routes')
        .insert({
          incident_report_id: reportId,
          route_coordinates: routeCoordinates,
          calculated_distance_km: distance,
          calculated_eta_minutes: duration,
          route_polyline: routePolyline
        });

      if (routeError) {
        console.error('Error saving route:', routeError);
        throw routeError;
      }

      // Update incident report with ETA - FIXED: Use the correct field name
      const { error: reportError } = await supabase
        .from('incident_reports')
        .update({
          estimated_arrival_time: estimatedArrivalISO, // This is the correct field name
          current_eta_minutes: duration,
          response_route_data: {
            last_calculated: new Date().toISOString(),
            distance_km: distance,
            duration_minutes: duration
          }
        })
        .eq('id', reportId);

      if (reportError) {
        console.error('Error updating report:', reportError);
        throw reportError;
      }

      // Update local state
      setReports(prev => prev.map(report =>
        report.id === reportId ? {
          ...report,
          estimated_arrival_time: estimatedArrivalISO, // Make sure this matches
          current_eta_minutes: duration,
          response_route_data: {
            last_calculated: new Date().toISOString(),
            distance_km: distance,
            duration_minutes: duration
          }
        } : report
      ));

      console.log('✅ Route data saved successfully for report:', reportId);

    } catch (error) {
      console.error('Error saving route data:', error);
    }
  };

  // NEW: Mark incident as resolved
  const markAsResolved = async (reportId: string) => {
    try {
      const success = await updateReportStatus(reportId, 'resolved');

      if (success) {
        const report = reports.find(r => r.id === reportId);
        if (report) {
          await createAutomatedNotification(
            report.reporter_email,
            'Incident Resolved',
            `Your incident report "${report.title}" has been successfully resolved at ${new Date().toLocaleString()}.`,
            'incident_resolved',
            reportId
          );
        }

        setToastMessage('Incident marked as resolved');
        setShowToast(true);
        setShowReportModal(false);
      }
    } catch (error) {
      console.error('Error marking as resolved:', error);
      setToastMessage('Error marking incident as resolved');
      setShowToast(true);
    }
  };

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

      // FIXED: Fetch users with user_firstname and user_lastname
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

      // Center on MDRRMO
      const center: [number, number] = [COMMAND_CENTER.lat, COMMAND_CENTER.lng];

      mapInstanceRef.current = L.map(mapRef.current).setView(center, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add Command Center marker
      addCommandCenterMarker();

      // Add click event to map to clear route only when route is displayed
      mapInstanceRef.current.on('click', (e) => {
        // Only clear route if one is currently displayed and user clicks on the map (not on a marker)
        if (isRouteDisplayed && e.originalEvent && (e.originalEvent.target as HTMLElement).className === 'leaflet-container') {
          clearRoute();
        }
      });

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
        <div style="padding: 8px; text-align: center; min-width: 150px;">
          <div style="
            width: 32px;
            height: 32px;
            margin: 0 auto 8px;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          ">🏢</div>
          <h3 style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px; font-weight: bold;">
            ${COMMAND_CENTER.name}
          </h3>
          <p style="margin: 0; color: #6b7280; font-size: 10px; font-style: italic;">
            Emergency Response Hub
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
              <div style="min-width: 180px; padding: 4px;">
                <h3 style="margin: 0 0 6px 0; color: #1f2937; font-size: 13px; font-weight: bold;">${report.title}</h3>
                <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 11px;">
                  <strong>Barangay:</strong> ${report.barangay}
                </p>
                <div style="display: flex; gap: 4px; margin-bottom: 8px;">
                  <span style="
                    background: ${getStatusColor(report.status)}20;
                    color: ${getStatusColor(report.status)};
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 9px;
                    font-weight: bold;
                  ">${report.status.toUpperCase()}</span>
                  <span style="
                    background: ${markerColor}20;
                    color: ${markerColor};
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 9px;
                    font-weight: bold;
                  ">${report.priority.toUpperCase()}</span>
                </div>
                <div style="background: #f8fafc; padding: 6px; border-radius: 4px; margin-bottom: 6px;">
                  <p style="margin: 0 0 3px 0; font-size: 9px; color: #374151;">
                    <strong>Reporter:</strong> ${report.reporter_name}
                  </p>
                  <p style="margin: 0; font-size: 9px; color: #374151;">
                    <strong>Contact:</strong> ${report.reporter_contact}
                  </p>
                </div>
                <button onclick="window.selectReport('${report.id}')" style="
                  width: 100%;
                  background: #3b82f6;
                  color: white;
                  border: none;
                  padding: 5px 8px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 10px;
                  margin-bottom: 3px;
                ">View Details</button>
                <button onclick="window.trackIncident('${report.id}')" style="
                  width: 100%;
                  background: #dc2626;
                  color: white;
                  border: none;
                  padding: 5px 8px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 10px;
                ">📍 Track Route</button>
              </div>
            `);

          marker.on('click', () => {
            setSelectedReport(report);
            // Clear route when selecting another report ONLY if route is displayed
            if (isRouteDisplayed) {
              clearRoute();
            }
            // Zoom and center on selected marker
            mapInstanceRef.current?.setView([lat, lng], 15);
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
          // Clear route when selecting another report ONLY if route is displayed
          if (isRouteDisplayed) {
            clearRoute();
          }
          // Zoom and center on selected report
          if (report.coordinates) {
            mapInstanceRef.current?.setView([report.coordinates.lat, report.coordinates.lng], 15);
          }
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
    calculateRouteFromCommandCenter(report.coordinates, report.id);
  };

  // UPDATED: Route Calculation Function with ETA saving
  const calculateRouteFromCommandCenter = async (destination: { lat: number; lng: number }, reportId?: string) => {
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
            From MDRRMO to Incident
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
        const routeInfoData = {
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60 // Convert to minutes
        };
        setRouteInfo(routeInfoData);
        setIsRouteDisplayed(true); // Set route as displayed

        // NEW: Save route data to Supabase if reportId is provided
        if (reportId) {
          await saveRouteData(
            reportId,
            routeCoordinates,
            routeInfoData.distance,
            Math.round(routeInfoData.duration)
          );
        }

        setToastMessage(`Response route calculated: ${routeInfoData.distance.toFixed(1)} km, ETA ${Math.round(routeInfoData.duration)} min`);
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

  // FIXED: Clear Route Function with better cleanup and state management
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
    setIsRouteDisplayed(false); // Reset route display state
  };

  // NEW: Center map on MDRRMO command center
  const centerOnCommandCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([COMMAND_CENTER.lat, COMMAND_CENTER.lng], 15);
      if (commandCenterMarkerRef.current) {
        commandCenterMarkerRef.current.openPopup();
      }
    }
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

    // Apply search filter
    if (userSearchText) {
      filtered = filtered.filter(user =>
        `${user.user_firstname} ${user.user_lastname}`.toLowerCase().includes(userSearchText.toLowerCase()) ||
        user.user_email.toLowerCase().includes(userSearchText.toLowerCase())
      );
    }

    // Sort alphabetically by full name
    return filtered.sort((a, b) => {
      const fullNameA = `${a.user_firstname} ${a.user_lastname}`.toLowerCase();
      const fullNameB = `${b.user_firstname} ${b.user_lastname}`.toLowerCase();
      return fullNameA.localeCompare(fullNameB);
    });
  }, [users, userFilter, userSort, userSearchText]);

  // Handle status filter click - reset priority to 'all'
  const handleStatusFilterClick = (status: 'all' | 'pending' | 'active' | 'resolved') => {
    setStatusFilter(status);
    setPriorityFilter('all'); // Reset priority filter when status changes
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', '--color': 'white' } as any}>
            <IonTitle style={{ fontWeight: 'bold' }}>
              <IonSkeletonText animated style={{ width: '250px', height: '20px' }} />
            </IonTitle>
            <IonButtons slot="end">
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px' }} />
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </IonButtons>
          </IonToolbar>

          <IonToolbar style={{ '--background': 'white' } as any}>
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb' }}>
              {[1, 2, 3, 4].map((item) => (
                <div key={item} style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                  <IonSkeletonText animated style={{ width: '80%', height: '16px', margin: '0 auto' }} />
                </div>
              ))}
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#f8fafc' } as any} fullscreen>
          <div style={{ display: 'flex', height: 'calc(100vh - 112px)', width: '100%' }}>
            {/* Left Panel Skeleton - Incidents */}
            <div style={{
              width: '360px',
              borderRight: '1px solid #e5e7eb',
              background: 'white',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '12px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonSkeletonText animated style={{ width: '24px', height: '24px' }} />
                  <IonSkeletonText animated style={{ width: '120px', height: '16px' }} />
                  <IonSkeletonText animated style={{ width: '32px', height: '20px', borderRadius: '10px' }} />
                </div>
              </div>

              {/* Status Filter Skeleton */}
              <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <IonSkeletonText animated style={{ width: '100px', height: '12px', marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4].map((item) => (
                    <IonSkeletonText key={item} animated style={{ width: '70px', height: '28px', borderRadius: '14px' }} />
                  ))}
                </div>
              </div>

              {/* Priority Filter Skeleton */}
              <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <IonSkeletonText animated style={{ width: '100px', height: '12px', marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <IonSkeletonText key={item} animated style={{ width: '60px', height: '28px', borderRadius: '14px' }} />
                  ))}
                </div>
              </div>

              {/* Reports List Skeleton */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <IonList style={{ padding: 0 }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <IonItem key={item} style={{ '--background': 'transparent', '--border-color': '#f3f4f6' } as any}>
                      <div style={{ width: '100%', padding: '8px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <IonSkeletonText animated style={{ width: '60%', height: '14px' }} />
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <IonSkeletonText animated style={{ width: '50px', height: '20px', borderRadius: '10px' }} />
                            <IonSkeletonText animated style={{ width: '50px', height: '20px', borderRadius: '10px' }} />
                          </div>
                        </div>
                        <IonSkeletonText animated style={{ width: '40%', height: '12px', marginBottom: '4px' }} />
                        <IonSkeletonText animated style={{ width: '70%', height: '12px', marginBottom: '8px' }} />
                        <IonSkeletonText animated style={{ width: '50%', height: '12px', marginBottom: '8px' }} />
                        <IonSkeletonText animated style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            </div>

            {/* Main Content Skeleton - Map */}
            <div style={{ flex: 1, position: 'relative', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <IonSkeletonText animated style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px' }} />
                <IonSkeletonText animated style={{ width: '200px', height: '16px', margin: '0 auto 8px' }} />
                <IonSkeletonText animated style={{ width: '150px', height: '12px', margin: '0 auto' }} />
              </div>
            </div>

            {/* Right Panel Skeleton - Users */}
            <div style={{
              width: '300px',
              borderLeft: '1px solid #e5e7eb',
              background: 'white',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '12px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonSkeletonText animated style={{ width: '24px', height: '24px' }} />
                  <IonSkeletonText animated style={{ width: '60px', height: '16px' }} />
                  <IonSkeletonText animated style={{ width: '32px', height: '20px', borderRadius: '10px' }} />
                </div>
              </div>

              {/* Search Skeleton */}
              <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                <IonSkeletonText animated style={{ width: '100%', height: '40px', borderRadius: '8px' }} />
              </div>

              {/* User Filter Skeleton */}
              <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <IonSkeletonText animated style={{ width: '80px', height: '12px', marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[1, 2, 3].map((item) => (
                    <IonSkeletonText key={item} animated style={{ width: '70px', height: '28px', borderRadius: '14px' }} />
                  ))}
                </div>
              </div>

              {/* Users List Skeleton */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <IonList style={{ padding: 0 }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <IonItem key={item}>
                      <div style={{ width: '100%', padding: '8px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <IonSkeletonText animated style={{ width: '60%', height: '14px' }} />
                          <IonSkeletonText animated style={{ width: '50px', height: '20px', borderRadius: '10px' }} />
                        </div>
                        <IonSkeletonText animated style={{ width: '70%', height: '12px', marginBottom: '4px' }} />
                        <IonSkeletonText animated style={{ width: '50%', height: '11px' }} />
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            </div>
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
            width: isIncidentsCollapsed ? '60px' : '360px',
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
                          key={report.id || `report-${Math.random()}`}
                          button
                          detail={false}
                          onClick={() => {
                            setSelectedReport(report);
                            setShowReportModal(true);
                            // Clear route when selecting another report ONLY if route is displayed
                            if (isRouteDisplayed) {
                              clearRoute();
                            }
                            // Zoom and center on selected report
                            if (report.coordinates) {
                              mapInstanceRef.current?.setView([report.coordinates.lat, report.coordinates.lng], 15);
                            }
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
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>{report.barangay}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                              <IonIcon icon={timeOutline} style={{ fontSize: '12px', color: '#6b7280' }} />
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                {new Date(report.created_at).toLocaleDateString()} - {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                              Reporter: {report.reporter_name}
                            </div>
                            {/* NEW: Track button positioned below status and priority */}
                            <div style={{ marginTop: '8px' }}>
                              <IonButton
                                size="small"
                                fill="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTrackReport(report);
                                }}
                                disabled={report.status === 'resolved'}
                                style={{
                                  '--background': '#dc2626',
                                  '--color': 'white',
                                  '--border-color': '#dc2626',
                                  fontSize: '10px',
                                  height: '24px'
                                } as any}
                              >
                                <IonIcon icon={navigateOutline} slot="start" style={{ fontSize: '10px' }} />
                                Track
                              </IonButton>
                            </div>
                            {/* NEW: Show scheduled time if exists */}
                            {report.scheduled_response_time && (
                              <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                                <IonIcon icon={calendarOutline} style={{ fontSize: '10px', marginRight: '4px' }} />
                                Scheduled: {new Date(report.scheduled_response_time).toLocaleString()}
                              </div>
                            )}
                            {/* NEW: Show ETA if exists */}
                            {report.current_eta_minutes && report.status === 'active' && (
                              <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px' }}>
                                <IonIcon icon={carOutline} style={{ fontSize: '10px', marginRight: '4px' }} />
                                ETA: {report.current_eta_minutes} min
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

            {/* Moved Route Info to Upper Right - ADDED FONT SIZE */}
            {routeInfo && (
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px', // Changed from left to right
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '200px',
                fontSize: '14px' // ADDED: Font size for mini details
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#1f2937', fontWeight: 'bold' }}>Response Route</h4>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={clearRoute}
                    style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                  >
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                  From MDRRMO to Incident
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>Distance:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                    {routeInfo.distance.toFixed(1)} km
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>ETA:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                    {Math.round(routeInfo.duration)} min
                  </span>
                </div>
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

            {/* UPDATED: MDRRMO Container - Made clickable and centered */}
            <div 
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                background: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#dc2626',
                cursor: 'pointer', // ADDED: Show pointer cursor
                transition: 'all 0.2s ease'
              }}
              onClick={centerOnCommandCenter} // ADDED: Click handler
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fef2f2'; // ADDED: Hover effect
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <IonIcon icon={businessOutline} />
              <span>MDRRMO</span>
            </div>

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
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setIsUsersCollapsed(!isUsersCollapsed)}
                style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
              >
                <IonIcon icon={isUsersCollapsed ? chevronBackOutline : chevronForwardOutline} />
              </IonButton>
              {!isUsersCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={peopleOutline} style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Users</span>
                  <IonBadge color="primary" style={{ marginLeft: '8px' }}>{stats.totalUsers}</IonBadge>
                </div>
              )}
            </div>

            {!isUsersCollapsed && (
              <>
                {/* User Search - Made smaller with 8px gap */}
                <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                  <IonSearchbar
                    value={userSearchText}
                    onIonInput={(e) => setUserSearchText(e.detail.value!)}
                    placeholder="Search users..."
                    style={{
                      '--background': '#f8fafc',
                      '--border-radius': '8px',
                      '--box-shadow': 'none',
                      fontSize: '12px',
                      height: '40px'
                    } as any}
                  />
                </div>

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
                                {user.user_firstname} {user.user_lastname}
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
                <IonButton
                  onClick={() => selectedReport && handleTrackReport(selectedReport)}
                  style={{ '--background': '#dc2626', '--color': 'white' } as any}
                >
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

                    {/* NEW: Scheduled and ETA Information */}
                    {selectedReport.scheduled_response_time && (
                      <div style={{
                        background: '#fffbeb',
                        border: '1px solid #fcd34d',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <IonIcon icon={calendarOutline} style={{ color: '#f59e0b' }} />
                          <strong style={{ color: '#92400e' }}>Scheduled Response</strong>
                        </div>
                        <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                          {new Date(selectedReport.scheduled_response_time).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {selectedReport.current_eta_minutes && selectedReport.status === 'active' && (
                      <div style={{
                        background: '#eff6ff',
                        border: '1px solid #93c5fd',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <IonIcon icon={carOutline} style={{ color: '#3b82f6' }} />
                          <strong style={{ color: '#1e40af' }}>Estimated Arrival</strong>
                        </div>
                        <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>
                          {selectedReport.current_eta_minutes} minutes
                        </p>
                        {selectedReport.estimated_arrival_time && (
                          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
                            Arrival at: {new Date(selectedReport.estimated_arrival_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    <IonGrid>
                      <IonRow>
                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Barangay:</strong>
                            <p>{selectedReport.barangay}</p>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Reported Date:</strong>
                            <p>{new Date(selectedReport.created_at).toLocaleDateString()}</p>
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
                            <strong>Reported Time:</strong>
                            <p>{new Date(selectedReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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

                    {/* NEW: Enhanced Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
                      {selectedReport.status === 'pending' && (
                        <IonButton
                          expand="block"
                          color="warning"
                          onClick={() => setShowScheduleModal(true)}
                        >
                          <IonIcon icon={calendarOutline} slot="start" />
                          Schedule Response
                        </IonButton>
                      )}

                      {selectedReport.status === 'active' && (
                        <IonButton
                          expand="block"
                          color="success"
                          onClick={() => selectedReport && markAsResolved(selectedReport.id)}
                        >
                          <IonIcon icon={checkmarkDoneOutline} slot="start" />
                          Mark Resolved
                        </IonButton>
                      )}

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

        {/* NEW: Schedule Response Modal */}
        <IonModal isOpen={showScheduleModal} onDidDismiss={() => setShowScheduleModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowScheduleModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Schedule Response</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonCard>
                <IonCardContent>
                  <p>Schedule when the response team will address this incident:</p>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                      Select Response Time
                    </div>
                    <IonDatetime
                      presentation="date-time"
                      onIonChange={(e) => setScheduledResponseTime(e.detail.value as string)}
                    />
                  </div>

                  <IonButton
                    expand="block"
                    onClick={() => {
                      if (selectedReport && scheduledResponseTime) {
                        scheduleResponseTime(selectedReport.id, scheduledResponseTime);
                      }
                    }}
                    disabled={!scheduledResponseTime}
                  >
                    <IonIcon icon={calendarOutline} slot="start" />
                    Schedule Response
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </div>
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

                  <IonButton expand="block" onClick={() => {
                    // Handle notification sending
                    setToastMessage('Notification sent to reporter');
                    setShowToast(true);
                    setShowNotifyModal(false);
                    setNotificationMessage('');
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
            {
              text: 'Logout', role: 'confirm', handler: () => {
                supabase.auth.signOut();
                navigation.push('/it35-lab2', 'root', 'replace');
              }
            }
          ]}
        />

        <IonAlert
          isOpen={showUserActionAlert}
          onDidDismiss={() => setShowUserActionAlert(false)}
          header={'User Action'}
          message={`Select action for ${selectedUser?.user_firstname} ${selectedUser?.user_lastname}`}
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