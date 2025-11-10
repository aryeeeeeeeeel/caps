// src/pages/admin-tabs/AdminDashboard.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
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
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonSkeletonText,
  IonText,
  IonLabel,
  useIonViewWillEnter
} from "@ionic/react"
import {
  logOutOutline,
  notificationsOutline,
  chevronForwardOutline,
  chevronBackOutline,
  locationOutline,
  timeOutline,
  closeOutline,
  alertCircleOutline,
  sendOutline,
  peopleOutline,
  statsChartOutline,
  documentTextOutline,
  navigateOutline,
  carOutline,
  businessOutline,
  calendarOutline,
  checkmarkCircleOutline,
  warningOutline,
  pauseCircleOutline,
  banOutline,
  checkmarkCircleOutline as activateOutline,
  filterOutline,
  notifications,
  trashOutline,
} from "ionicons/icons"
import { supabase } from "../../utils/supabaseClient"
import SystemLogs from "./SystemLogs"
import { logAdminLogout, logReportStatusUpdate, logUserAction, logUserNotification } from "../../utils/activityLogger"
// Type definitions moved inline since types.ts doesn't exist
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const COMMAND_CENTER = {
  lat: 8.371646,
  lng: 124.857026,
  name: "MDRRMO",
}

interface IncidentReport {
  id: string
  title: string
  description: string
  location: string
  status: "pending" | "active" | "resolved"
  priority: "low" | "medium" | "high" | "critical"
  reporter_name: string
  reporter_email: string
  reporter_address: string
  reporter_contact: string
  read?: boolean
  created_at: string
  barangay: string
  coordinates?: { lat: number; lng: number }
  category: string
  image_urls?: string[]
  admin_response?: string
  updated_at?: string
  // NEW FIELDS
  scheduled_response_time?: string
  estimated_arrival_time?: string
  actual_response_started?: string
  actual_resolved_time?: string
  current_eta_minutes?: number
  response_route_data?: any
  // Added fields used elsewhere in the component
  resolved_at?: string
  resolved_photo_url?: string
}

interface User {
  id: string
  user_id: string
  user_firstname: string
  user_lastname: string
  user_email: string
  status: "active" | "inactive" | "suspended" | "banned"
  warnings: number
  last_warning_date?: string
  date_registered: string
  last_active_at?: string
  user_contact_number?: string
  user_address?: string
  has_reports?: boolean
  is_online: boolean
}

interface IncidentResponseRoute {
  id: string
  incident_report_id: string
  route_coordinates: any
  calculated_distance_km: number
  calculated_eta_minutes: number
  route_polyline: string
  calculated_at: string
}

const AdminDashboard: React.FC = () => {
  const navigation = useIonRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const commandCenterMarkerRef = useRef<L.Marker | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)
  const [isIncidentsCollapsed, setIsIncidentsCollapsed] = useState(false)
  const [isUsersCollapsed, setIsUsersCollapsed] = useState(false)
  const [reports, setReports] = useState<IncidentReport[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "active" | "resolved">("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all")
  const [userFilter, setUserFilter] = useState<"all" | "active" | "inactive" | "suspended" | "banned" | "online" | "offline">("all")
  const [userSort, setUserSort] = useState<"alphabetical">("alphabetical")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [showReportModal, setShowReportModal] = useState(false)
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [scheduledResponseTime, setScheduledResponseTime] = useState("")
  const [showUserActionAlert, setShowUserActionAlert] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userAction, setUserAction] = useState<"warn" | "suspend" | "ban">("warn")
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [userSearchText, setUserSearchText] = useState("")
  const [isRouteDisplayed, setIsRouteDisplayed] = useState(false)
  const [showUserActionModal, setShowUserActionModal] = useState(false)
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null)
  const [userActionType, setUserActionType] = useState<"warn" | "suspend" | "ban" | "activate">("warn")
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState<number>(0);
  const [sortAlphabetical, setSortAlphabetical] = useState<boolean>(true)
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false)
  const [statusChangeType, setStatusChangeType] = useState<"pending-to-active" | "active-to-resolved">("pending-to-active")
  const [resolvedPhoto, setResolvedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [selectedReportFeedback, setSelectedReportFeedback] = useState<{ overall_rating: number; comments: string | null } | null>(null)
  const [showActionConfirmAlert, setShowActionConfirmAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ 
  type: 'warn' | 'suspend' | 'ban' | 'activate' | 'delete', 
  user?: User,
  report?: IncidentReport 
} | null>(null);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data: reports } = await supabase
          .from('incident_reports')
          .select('id, created_at')
          .eq('read', false);

        const { data: feedback } = await supabase
          .from('feedback')
          .select('id, created_at')
          .eq('read', false);

        const newCount = (reports?.length || 0) + (feedback?.length || 0);
        setUnreadCount(newCount);
        if (newCount > prevUnreadCount) {
          setToastMessage(`You have ${newCount} unread notifications`);
          setShowToast(true);
        }
        setPrevUnreadCount(newCount);
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    };
    const interval = setInterval(fetchUnreadCount, 30000);
    fetchUnreadCount();
    return () => clearInterval(interval);
  }, [prevUnreadCount]);

  useEffect(() => {
    console.log(
      "📊 Current reports with ETA:",
      reports.map((r) => ({
        id: r.id,
        status: r.status,
        hasETA: !!r.estimated_arrival_time,
        eta: r.estimated_arrival_time,
        currentETA: r.current_eta_minutes,
      })),
    )
  }, [reports])

  // Refresh data when page becomes active
  useIonViewWillEnter(() => {
    const refreshData = async () => {
      try {
        await fetchInitialData()
      } catch (error) {
        console.error('Error refreshing admin dashboard data:', error)
      }
    }
    refreshData()
  })

  useEffect(() => {
    verifyAdminAccess()
    setupAutomatedNotificationsCheck()
  }, [])

  // Initialize map after component mounts
  useEffect(() => {
    if (!isLoading && mapRef.current && !mapInstanceRef.current) {
      initializeMap()
    }
  }, [isLoading])

  // Update markers when reports change and map is ready
  useEffect(() => {
    if (mapInstanceRef.current && reports.length > 0 && isMapReady) {
      updateMapMarkers()
    }
  }, [reports, statusFilter, priorityFilter, isMapReady])

  // Invalidate map size when panels collapse/expand
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
      }, 350)
    }
  }, [isIncidentsCollapsed, isUsersCollapsed])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Enhanced useEffect for real-time subscriptions
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const setupSubscriptions = async () => {
      // Wait a bit for initial data to load
      await new Promise((resolve) => setTimeout(resolve, 1000))
      unsubscribe = setupRealtimeSubscriptions()
    }

    if (!isLoading) {
      setupSubscriptions()
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [isLoading])

  // NEW: Setup interval to check for automated notifications
  const setupAutomatedNotificationsCheck = () => {
    // Check every minute for scheduled notifications
    const interval = setInterval(() => {
      checkAndTriggerAutomatedNotifications()
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }

  // UPDATED: Automated notification system with better error handling
  const checkAndTriggerAutomatedNotifications = async () => {
    try {
      const now = new Date()

      console.log("🛠️ Checking automated notifications...")

      // Check for reports that need status updates
      const pendingReports = reports.filter((report) => {
        if (report.status !== "pending" || !report.scheduled_response_time) {
          return false
        }

        try {
          const scheduledTime = new Date(report.scheduled_response_time)
          return !isNaN(scheduledTime.getTime()) && scheduledTime <= now
        } catch {
          return false
        }
      })

      console.log(`📅 ${pendingReports.length} pending reports ready for activation`)

      // Update pending reports to active
      for (const report of pendingReports) {
        console.log(`🛠️ Activating report: ${report.id}`)
        await updateReportStatus(report.id, "active")
        await createAutomatedNotification(
          report.reporter_email,
          "Response Started",
          `Your incident report "${report.title}" is now being actively addressed by our response team.`,
          "response_started",
        )
      }

      // Check for ETA notifications with better validation
      const activeReports = reports.filter((report) => {
        if (report.status !== "active" || !report.estimated_arrival_time) {
          return false
        }

        try {
          const arrivalTime = new Date(report.estimated_arrival_time!)
          return !isNaN(arrivalTime.getTime())
        } catch {
          return false
        }
      })

      console.log(`🚑 ${activeReports.length} active reports with valid ETA`)

      for (const report of activeReports) {
        try {
          const arrivalTime = new Date(report.estimated_arrival_time!)
          const threeMinutesBefore = new Date(arrivalTime.getTime() - 3 * 60000)

          console.log(`📊 Report ${report.id}:`, {
            now: now.toISOString(),
            arrivalTime: arrivalTime.toISOString(),
            threeMinutesBefore: threeMinutesBefore.toISOString(),
            shouldNotify: now >= threeMinutesBefore && now < arrivalTime,
          })

          if (now >= threeMinutesBefore && now < arrivalTime) {
            // Check if we already sent this notification
            const { data: existingNotifications } = await supabase
              .from("notifications")
              .select("id")
              .eq("related_report_id", report.id)
              .eq("trigger_type", "eta_reminder")
              .limit(1)

            if (!existingNotifications || existingNotifications.length === 0) {
              console.log(`🔔 Sending ETA reminder for report: ${report.id}`)
              await createAutomatedNotification(
                report.reporter_email,
                "Response Team Arriving Soon",
                `Our response team will arrive at your incident location in approximately 3 minutes.`,
                "eta_reminder",
                report.id,
              )
            }
          }
        } catch (error) {
          console.error(`Error processing ETA for report ${report.id}:`, error)
        }
      }
    } catch (error) {
      console.error("Error in automated notifications:", error)
    }
  }

  // NEW: Create automated notification
  const createAutomatedNotification = async (
    userEmail: string,
    title: string,
    message: string,
    triggerType: string,
    relatedReportId?: string,
  ) => {
    try {
      const { error } = await supabase.from("notifications").insert({
        user_email: userEmail,
        title,
        message,
        type: "info",
        read: false,
        is_automated: true,
        trigger_type: triggerType,
        related_report_id: relatedReportId,
        created_at: new Date().toISOString(),
      })

      if (error) throw error
      console.log(`✅ Automated notification sent: ${triggerType}`)

      // Log the notification
      const { data: { user } } = await supabase.auth.getUser();
      await logUserNotification(userEmail, triggerType, user?.email);
    } catch (error) {
      console.error("Error creating automated notification:", error)
    }
  }

  // NEW: Update report status with timestamps
  const updateReportStatus = async (reportId: string, newStatus: "pending" | "active" | "resolved") => {
    try {
      // Get current report to find old status
      const currentReport = reports.find(r => r.id === reportId);
      const oldStatus = currentReport?.status || 'unknown';

      const updateData: any = { status: newStatus }

      if (newStatus === "active") {
        updateData.actual_response_started = new Date().toISOString()
      } else if (newStatus === "resolved") {
        updateData.actual_resolved_time = new Date().toISOString()
      }

      const { error } = await supabase.from("incident_reports").update(updateData).eq("id", reportId)

      if (error) throw error

      // Log the status update
      const { data: { user } } = await supabase.auth.getUser();
      await logReportStatusUpdate(reportId, oldStatus, newStatus, user?.email);

      // Update local state
      setReports((prev) => prev.map((report) => (report.id === reportId ? { ...report, ...updateData } : report)))

      return true
    } catch (error) {
      console.error("Error updating report status:", error)
      return false
    }
  }

  // NEW: Schedule response time
  const scheduleResponseTime = async (reportId: string, scheduledTime: string) => {
    try {
      const { error } = await supabase
        .from("incident_reports")
        .update({
          scheduled_response_time: scheduledTime,
        })
        .eq("id", reportId)

      if (error) throw error

      // Update local state
      setReports((prev) =>
        prev.map((report) => (report.id === reportId ? { ...report, scheduled_response_time: scheduledTime } : report)),
      )

      // Create scheduled response notification
      const report = reports.find((r) => r.id === reportId)
      if (report) {
        await createAutomatedNotification(
          report.reporter_email,
          "Response Scheduled",
          `Your incident report "${report.title}" has been scheduled for response at ${new Date(scheduledTime).toLocaleString()}.`,
          "scheduled_response",
          reportId,
        )
      }

      setToastMessage("Response scheduled successfully")
      setShowToast(true)
      setShowScheduleModal(false)
    } catch (error) {
      console.error("Error scheduling response:", error)
      setToastMessage("Error scheduling response")
      setShowToast(true)
    }
  }

  // FIXED: Save route data to Supabase
  const saveRouteData = async (
    reportId: string,
    routeCoordinates: any,
    distance: number,
    duration: number,
    routePolyline?: string,
  ) => {
    try {
      // Calculate estimated arrival time correctly
      const estimatedArrival = new Date(Date.now() + duration * 60000)
      const estimatedArrivalISO = estimatedArrival.toISOString()

      console.log("🛠️ Saving route data for report:", reportId, {
        distance,
        duration,
        estimatedArrival: estimatedArrivalISO,
      })

      // Save to incident_response_routes table
      const { error: routeError } = await supabase.from("incident_response_routes").insert({
        incident_report_id: reportId,
        route_coordinates: routeCoordinates,
        calculated_distance_km: distance,
        calculated_eta_minutes: duration,
        route_polyline: routePolyline,
      })

      if (routeError) {
        console.error("Error saving route:", routeError)
        throw routeError
      }

      // Update incident report with ETA - FIXED: Use the correct field name
      const { error: reportError } = await supabase
        .from("incident_reports")
        .update({
          estimated_arrival_time: estimatedArrivalISO, // This is the correct field name
          current_eta_minutes: duration,
          response_route_data: {
            last_calculated: new Date().toISOString(),
            distance_km: distance,
            duration_minutes: duration,
          },
        })
        .eq("id", reportId)

      if (reportError) {
        console.error("Error updating report:", reportError)
        throw reportError
      }

      // Update local state
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? {
              ...report,
              estimated_arrival_time: estimatedArrivalISO, // Make sure this matches
              current_eta_minutes: duration,
              response_route_data: {
                last_calculated: new Date().toISOString(),
                distance_km: distance,
                duration_minutes: duration,
              },
            }
            : report,
        ),
      )

      console.log("✅ Route data saved successfully for report:", reportId)
    } catch (error) {
      console.error("Error saving route data:", error)
    }
  }

  // NEW: Mark incident as resolved
  const markAsResolved = async (reportId: string) => {
    try {
      const success = await updateReportStatus(reportId, "resolved")

      if (success) {
        const report = reports.find((r) => r.id === reportId)
        if (report) {
          await createAutomatedNotification(
            report.reporter_email,
            "Incident Resolved",
            `Your incident report "${report.title}" has been successfully resolved at ${new Date().toLocaleString()}.`,
            "incident_resolved",
            reportId,
          )
        }

        setToastMessage("Incident marked as resolved")
        setShowToast(true)
        setShowReportModal(false)
      }
    } catch (error) {
      console.error("Error marking as resolved:", error)
      setToastMessage("Error marking incident as resolved")
      setShowToast(true)
    }
  }

  const verifyAdminAccess = async () => {
    try {
      setIsLoading(true)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error("Not authenticated")
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, role, user_email")
        .eq("auth_uuid", user.id)
        .single()

      if (userError) throw userError

      if (!userData?.role || userData.role !== "admin") {
        await supabase.auth.signOut()
        navigation.push("/iAMUMAta", "root", "replace")
        return
      }

      setUserEmail(userData.user_email)
      await fetchInitialData()
      setupRealtimeSubscriptions()
    } catch (error) {
      console.error("Admin access verification failed:", error)
      await supabase.auth.signOut()
      navigation.push("/iAMUMAta", "root", "replace")
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced coordinate validation with better error handling
  const parseAndValidateCoordinates = (coordinates: any): { lat: number; lng: number } | undefined => {
    if (!coordinates) {
      console.warn("No coordinates provided")
      return undefined
    }

    try {
      let lat: number
      let lng: number

      // Handle different coordinate formats
      if (typeof coordinates === "string") {
        // Try to parse as JSON string
        try {
          const parsed = JSON.parse(coordinates)
          if (parsed && typeof parsed === "object") {
            lat = parsed.lat
            lng = parsed.lng
          } else {
            return undefined
          }
        } catch {
          // If JSON parsing fails, try to split comma-separated string
          const parts = coordinates.split(",")
          if (parts.length === 2) {
            lat = Number.parseFloat(parts[0].trim())
            lng = Number.parseFloat(parts[1].trim())
          } else {
            return undefined
          }
        }
      } else if (typeof coordinates === "object") {
        lat = coordinates.lat
        lng = coordinates.lng
      } else {
        return undefined
      }

      // Convert to numbers if they're strings
      if (typeof lat === "string") {
        lat = Number.parseFloat(lat)
      }
      if (typeof lng === "string") {
        lng = Number.parseFloat(lng)
      }

      // Final validation
      const isLatValid = typeof lat === "number" && !isNaN(lat) && Math.abs(lat) <= 90
      const isLngValid = typeof lng === "number" && !isNaN(lng) && Math.abs(lng) <= 180

      if (isLatValid && isLngValid) {
        return { lat, lng }
      } else {
        console.warn("Invalid coordinate values:", { lat, lng })
        return undefined
      }
    } catch (error) {
      console.error("Error parsing coordinates:", error)
      return undefined
    }
  }

  const fetchInitialData = async () => {
    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from("incident_reports")
        .select("*")
        .order("created_at", { ascending: false })

      if (reportsError) {
        console.error("Error fetching reports:", reportsError)
        throw reportsError
      }

      if (reportsData) {
        // FIXED: Use the enhanced coordinate parsing function
        const validatedReports = reportsData.map((report) => {
          const validatedCoords = parseAndValidateCoordinates(report.coordinates)

          if (validatedCoords) {
            console.log(`✅ VALID COORDINATES for report ${report.id}:`, validatedCoords)
            return {
              ...report,
              coordinates: validatedCoords,
            }
          } else {
            console.warn(`❌ INVALID coordinates for report:`, report.id, report.coordinates)
            return { ...report, coordinates: undefined }
          }
        })
        setReports(validatedReports)
      }

      // FIXED: Fetch users with user_firstname and user_lastname
      const { data: usersData, error: usersError } = await supabase.from("users").select("*").neq("role", "admin")

      if (usersError) {
        console.error("Error fetching users:", usersError)
        throw usersError
      }

      if (usersData) {
        // Fetch reports for each user to determine if they're truly "active"
        const usersWithReports = await Promise.all(
          usersData.map(async (user) => {
            const { data: reports } = await supabase
              .from('incident_reports')
              .select('id')
              .eq('reporter_email', user.user_email)
              .limit(1);

            return {
              ...user,
              status: user.status || 'active',
              warnings: user.warnings || 0,
              has_reports: (reports && reports.length > 0) || false
            };
          })
        );
        setUsers(usersWithReports);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      setToastMessage("Error loading data")
      setShowToast(true)
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Enhanced reports channel with proper event handling
    const reportsChannel = supabase
      .channel("reports_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incident_reports",
        },
        async (payload) => {
          console.log("Real-time report update:", payload)

          // Handle different event types
          switch (payload.eventType) {
            case "INSERT":
              console.log("New incident reported:", payload.new)
              await handleNewIncident(payload.new as IncidentReport)
              break

            case "UPDATE":
              console.log("Incident updated:", payload.new)
              const updatedReport = payload.new as IncidentReport
              const oldReport = payload.old as IncidentReport
              
              // Show toast for status changes
              if (updatedReport.status !== oldReport.status) {
                const statusEmojis: { [key: string]: string } = {
                  'pending': '⏳',
                  'active': '🔍',
                  'resolved': '✅'
                }
                const emoji = statusEmojis[updatedReport.status] || '📋'
                setToastMessage(`${emoji} Report "${updatedReport.title}" status changed to ${updatedReport.status}`)
                setShowToast(true)
              }
              
              await handleUpdatedIncident(updatedReport)
              break

            case "DELETE":
              console.log("Incident deleted:", payload.old)
              await handleDeletedIncident(payload.old as IncidentReport)
              break
          }

          // Also refresh the data to ensure consistency
          await fetchInitialData()
        },
      )
      .subscribe()

    const usersChannel = supabase
      .channel("users_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, async (payload) => {
        // Show toast for new user registrations
        if (payload.eventType === "INSERT") {
          const newUser = payload.new as any
          setToastMessage(`👤 New user registered: ${newUser.user_firstname || ''} ${newUser.user_lastname || ''}`)
          setShowToast(true)
        }
        // Update users list when user status changes (online/offline, suspended, etc.)
        await fetchInitialData()
      })
      .subscribe()

    // Feedback channel for new feedback submissions
    const feedbackChannel = supabase
      .channel("feedback_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, async (payload) => {
        if (payload.eventType === "INSERT") {
          const newFeedback = payload.new as any
          setToastMessage(`💬 New feedback received: ${newFeedback.overall_rating}/5 stars`)
          setShowToast(true)
        }
        await fetchInitialData()
      })
      .subscribe()

    return () => {
      reportsChannel.unsubscribe()
      usersChannel.unsubscribe()
      feedbackChannel.unsubscribe()
    }
  }

  // NEW: Handle new incident insertion
  // Helper function to mark report as read when admin views it
  const markReportAsRead = async (report: IncidentReport) => {
    if (!report.read) {
      try {
        await supabase
          .from('incident_reports')
          .update({ read: true })
          .eq('id', report.id)

        // Update local state
        setReports(prev => prev.map(r =>
          r.id === report.id ? { ...r, read: true } : r
        ))

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Error marking report as read:', error)
      }
    }
  }

  const handleNewIncident = async (newReport: IncidentReport) => {
    try {
      console.log("🆕 Processing new incident:", newReport.id)

      // Validate and parse coordinates for the new report
      const validatedCoords = parseAndValidateCoordinates(newReport.coordinates)

      const reportWithValidatedCoords = {
        ...newReport,
        coordinates: validatedCoords,
      }

      // Add the new report to the state
      setReports((prev) => {
        // Check if report already exists to avoid duplicates
        const exists = prev.find((r) => r.id === newReport.id)
        if (exists) {
          console.log("Report already exists, updating instead")
          return prev.map((r) => (r.id === newReport.id ? reportWithValidatedCoords : r))
        }

        // Add new report to the beginning of the list
        return [reportWithValidatedCoords, ...prev]
      })

      // Update map markers if map is ready
      if (mapInstanceRef.current && isMapReady) {
        setTimeout(() => {
          updateMapMarkers()

          // Auto-center on new incident if it matches current filters
          if (validatedCoords) {
            const matchesStatus = statusFilter === "all" || newReport.status === statusFilter
            const matchesPriority = priorityFilter === "all" || newReport.priority === priorityFilter

            if (matchesStatus && matchesPriority) {
              // Zoom to the new incident
              mapInstanceRef.current?.setView([validatedCoords.lat, validatedCoords.lng], 15)

              // Show toast notification with priority indicator
              const priorityEmojis = {
                'critical': '🚨',
                'high': '⚠️',
                'medium': '📋',
                'low': 'ℹ️'
              } as const;
              const priorityEmoji = priorityEmojis[newReport.priority as keyof typeof priorityEmojis] || '📋';

              setToastMessage(`${priorityEmoji} New ${newReport.priority} priority incident: ${newReport.title} in ${newReport.barangay}`)
              setShowToast(true)

              // Update unread count
              setUnreadCount(prev => prev + 1)
            }
          }
        }, 100)
      }
    } catch (error) {
      console.error("Error handling new incident:", error)
    }
  }

  // NEW: Handle incident updates
  const handleUpdatedIncident = async (updatedReport: IncidentReport) => {
    try {
      console.log("🛠️ Processing updated incident:", updatedReport.id)

      // Validate and parse coordinates
      const validatedCoords = parseAndValidateCoordinates(updatedReport.coordinates)

      const reportWithValidatedCoords = {
        ...updatedReport,
        coordinates: validatedCoords,
      }

      // Update the report in state
      setReports((prev) => prev.map((r) => (r.id === updatedReport.id ? reportWithValidatedCoords : r)))

      // Update map markers if this report is currently visible
      if (mapInstanceRef.current && isMapReady) {
        setTimeout(() => {
          updateMapMarkers()
        }, 100)
      }
    } catch (error) {
      console.error("Error handling updated incident:", error)
    }
  }

  // NEW: Handle incident deletion
  const handleDeletedIncident = async (deletedReport: IncidentReport) => {
    try {
      console.log("🗑️ Processing deleted incident:", deletedReport.id)

      // Remove the report from state
      setReports((prev) => prev.filter((r) => r.id !== deletedReport.id))

      // Update map markers
      if (mapInstanceRef.current && isMapReady) {
        setTimeout(() => {
          updateMapMarkers()
        }, 100)
      }
    } catch (error) {
      console.error("Error handling deleted incident:", error)
    }
  }

  // Load latest feedback for selected report (for resolved reports)
  useEffect(() => {
    const loadFeedback = async () => {
      if (!selectedReport || selectedReport.status !== 'resolved') {
        setSelectedReportFeedback(null)
        return
      }
      try {
        const { data } = await supabase
          .from('feedback')
          .select('overall_rating, comments')
          .eq('report_id', selectedReport.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (data) {
          setSelectedReportFeedback({ overall_rating: data.overall_rating, comments: data.comments || null })
        } else {
          setSelectedReportFeedback(null)
        }
      } catch {
        setSelectedReportFeedback(null)
      }
    }
    loadFeedback()
  }, [selectedReport])

  // Improved map initialization with error handling
  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      setMapError(null)

      // Center on MDRRMO
      const center: [number, number] = [COMMAND_CENTER.lat, COMMAND_CENTER.lng]

      mapInstanceRef.current = L.map(mapRef.current).setView(center, 13)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current)

      // Add Command Center marker
      addCommandCenterMarker()

      // Add click event to map to clear route only when route is displayed
      mapInstanceRef.current.on("click", (e) => {
        // Only clear route if one is currently displayed and user clicks on the map (not on a marker)
        if (
          isRouteDisplayed &&
          e.originalEvent &&
          (e.originalEvent.target as HTMLElement).className === "leaflet-container"
        ) {
          clearRoute()
        }
      })

      // Force map to render
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
        setIsMapReady(true)
      }, 100)
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError("Failed to initialize map")
      setIsMapReady(true) // Still set ready to hide loading
    }
  }

  const addCommandCenterMarker = () => {
    if (!mapInstanceRef.current) return

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
      className: "command-center-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })

    commandCenterMarkerRef.current = L.marker([COMMAND_CENTER.lat, COMMAND_CENTER.lng], { icon: commandCenterIcon })
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
      `)
  }

  // FIXED: Improved marker creation with better coordinate validation
  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return

    try {
      // Clear existing markers (except command center)
      markersRef.current.forEach((marker) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(marker)
        }
      })
      markersRef.current = []

      const filteredReports = reports.filter((report) => {
        const matchesStatus = statusFilter === "all" || report.status === statusFilter
        const matchesPriority = priorityFilter === "all" || report.priority === priorityFilter

        // Use the enhanced validation function
        const hasValidCoordinates = report.coordinates !== undefined

        return matchesStatus && matchesPriority && hasValidCoordinates
      })

      console.log(`Creating markers for ${filteredReports.length} valid reports`)

      filteredReports.forEach((report) => {
        if (!report.coordinates) return

        const { lat, lng } = report.coordinates

        // Final validation before creating marker
        if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
          console.warn("Skipping invalid coordinates for report:", report.id, { lat, lng })
          return
        }

        // Create custom marker based on priority
        const markerColor = getPriorityColor(report.priority)
        const markerIcon = L.divIcon({
          html: `
            <div style="
              width: 32px;
              height: 32px;
              position: relative;
              cursor: pointer;
            ">
              <!-- Modern Circular Marker -->
              <div style="
                width: 32px;
                height: 32px;
                background: ${markerColor};
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
                
                <!-- Status Icon -->
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
                border: 2px solid ${markerColor};
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
            </style>
          `,
          className: "modern-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

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
            `)

          marker.on("click", () => {
            setSelectedReport(report)
            // Clear route when selecting another report ONLY if route is displayed
            if (isRouteDisplayed) {
              clearRoute()
            }
            // Zoom and center on selected marker
            mapInstanceRef.current?.setView([lat, lng], 15)
          })

          markersRef.current.push(marker)
        } catch (markerError) {
          console.error("Error creating marker for report:", report.id, markerError)
        }
      })

        // Add global functions for popup buttons
        ; (window as any).selectReport = (reportId: string) => {
          const report = reports.find((r) => r.id === reportId)
          if (report) {
            setSelectedReport(report)
            setShowReportModal(true)
            // Clear route when selecting another report ONLY if route is displayed
            if (isRouteDisplayed) {
              clearRoute()
            }
            // Zoom and center on selected report
            if (report.coordinates) {
              mapInstanceRef.current?.setView([report.coordinates.lat, report.coordinates.lng], 15)
            }
          }
        }
        ; (window as any).trackIncident = (reportId: string) => {
          const report = reports.find((r) => r.id === reportId)
          if (report && report.coordinates) {
            calculateRouteFromCommandCenter(report.coordinates)
          }
        }
    } catch (error) {
      console.error("Error updating map markers:", error)
      setMapError("Error updating markers")
    }
  }

  // FIXED: Track Report Function with comprehensive validation
  const handleTrackReport = (report: IncidentReport) => {
    // Don't track resolved incidents
    if (report.status === "resolved") {
      setToastMessage("Cannot track route for resolved incidents")
      setShowToast(true)
      return
    }

    // Comprehensive coordinate validation
    if (!report.coordinates) {
      setToastMessage("No coordinates available for this incident")
      setShowToast(true)
      return
    }

    const { lat, lng } = report.coordinates

    // Validate coordinate types and values
    if (typeof lat !== "number" || typeof lng !== "number") {
      console.error("Invalid coordinate types:", { lat, lng, types: [typeof lat, typeof lng] })
      setToastMessage("Invalid coordinate data type")
      setShowToast(true)
      return
    }

    if (isNaN(lat) || isNaN(lng)) {
      console.error("NaN coordinates:", { lat, lng })
      setToastMessage("Invalid coordinate values (NaN)")
      setShowToast(true)
      return
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error("Coordinates out of range:", { lat, lng })
      setToastMessage("Coordinates are out of valid range")
      setShowToast(true)
      return
    }

    // Additional validation for realistic coordinates (adjust for your region if needed)
    if (lat === 0 && lng === 0) {
      console.error("Null Island coordinates detected")
      setToastMessage("Invalid default coordinates (0,0)")
      setShowToast(true)
      return
    }

    console.log(`✅ Starting route calculation for report ${report.id}:`, { lat, lng })
    calculateRouteFromCommandCenter(report.coordinates, report.id)
  }

  // UPDATED: Route Calculation Function with ETA saving
  const calculateRouteFromCommandCenter = async (destination: { lat: number; lng: number }, reportId?: string) => {
    // Enhanced destination validation
    if (!destination) {
      setToastMessage("No destination coordinates provided")
      setShowToast(true)
      return
    }

    const { lat, lng } = destination

    // Comprehensive validation
    if (typeof lat !== "number" || typeof lng !== "number") {
      console.error("Invalid destination coordinate types:", { lat, lng })
      setToastMessage("Invalid destination coordinate types")
      setShowToast(true)
      return
    }

    if (isNaN(lat) || isNaN(lng)) {
      console.error("NaN destination coordinates:", { lat, lng })
      setToastMessage("Invalid destination coordinate values")
      setShowToast(true)
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error("Destination coordinates out of range:", { lat, lng })
      setToastMessage("Destination coordinates are out of valid range")
      setShowToast(true)
      return
    }

    // Don't calculate route for resolved reports
    const targetReport = reports.find(
      (report) => report.coordinates?.lat === destination.lat && report.coordinates?.lng === destination.lng,
    )

    if (targetReport?.status === "resolved") {
      setToastMessage("Cannot calculate route for resolved incidents")
      setShowToast(true)
      return
    }

    setIsCalculatingRoute(true)
    setToastMessage("Calculating response route...")
    setShowToast(true)

    try {
      // Clear existing route
      clearRoute()

      console.log("🛠️ Calculating route from:", COMMAND_CENTER, "to:", destination)

      // Use OpenStreetMap Routing API with error handling
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${COMMAND_CENTER.lng},${COMMAND_CENTER.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`,
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("OSRM API error:", response.status, errorText)
        throw new Error(`Route calculation failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]

        // Validate route data
        if (!route.geometry || !route.geometry.coordinates) {
          throw new Error("Invalid route data received")
        }

        const routeCoordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])

        // Draw route on map with animated style
        routeLayerRef.current = L.polyline(routeCoordinates as [number, number][], {
          color: "#dc2626",
          weight: 5,
          opacity: 0.8,
          lineJoin: "round",
          dashArray: "10, 10",
          className: "animated-route",
        }).addTo(mapInstanceRef.current!)

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
      `)

        // Fit map to show entire route with padding
        const bounds = L.latLngBounds([
          [COMMAND_CENTER.lat, COMMAND_CENTER.lng],
          [destination.lat, destination.lng],
        ])

        mapInstanceRef.current?.fitBounds(bounds, {
          padding: [50, 50],
        })

        // Store route info
        const routeInfoData = {
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
        }
        setRouteInfo(routeInfoData)
        setIsRouteDisplayed(true) // Set route as displayed

        // NEW: Save route data to Supabase if reportId is provided
        if (reportId) {
          await saveRouteData(reportId, routeCoordinates, routeInfoData.distance, Math.round(routeInfoData.duration))
        }

        setToastMessage(
          `Response route calculated: ${routeInfoData.distance.toFixed(1)} km, ETA ${Math.round(routeInfoData.duration)} min`,
        )
        setShowToast(true)

        // Highlight the command center
        if (commandCenterMarkerRef.current) {
          commandCenterMarkerRef.current.openPopup()
        }

        console.log("✅ Route calculated successfully:", {
          distance: route.distance,
          duration: route.duration,
          coordinates: routeCoordinates.length,
        })
      } else {
        throw new Error("No route found between these points")
      }
    } catch (error) {
      console.error("Error calculating route:", error)

      let errorMessage = "Error calculating response route. "

      if (error instanceof Error) {
        if (error.message.includes("failed")) {
          errorMessage += "Routing service unavailable. Please try again later."
        } else if (error.message.includes("No route")) {
          errorMessage += "No route found between these locations."
        } else {
          errorMessage += "Please try again."
        }
      }

      setToastMessage(errorMessage)
      setShowToast(true)
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // FIXED: Clear Route Function with better cleanup and state management
  const clearRoute = () => {
    if (routeLayerRef.current && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.removeLayer(routeLayerRef.current)
        routeLayerRef.current = null
      } catch (error) {
        console.error("Error clearing route:", error)
      }
    }
    setRouteInfo(null)
    setIsRouteDisplayed(false) // Reset route display state
  }

  // NEW: Center map on MDRRMO command center
  const centerOnCommandCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([COMMAND_CENTER.lat, COMMAND_CENTER.lng], 15)
      if (commandCenterMarkerRef.current) {
        commandCenterMarkerRef.current.openPopup()
      }
    }
  }

  // User Management Helper Functions
  const isUserOnline = (user: User): boolean => {
    return user.is_online;
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return 'Invalid Date'; }
  };

  const getLastActiveText = (user: User): string => {
    if (!user.last_active_at) return 'Never';
    const lastActive = new Date(user.last_active_at);
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(user.last_active_at);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'suspended': return '#f59e0b';
      case 'banned': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const stats = useMemo(
    () => ({
      pending: reports.filter((r) => r.status === "pending").length,
      active: reports.filter((r) => r.status === "active").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
      total: reports.length,
      // Align with AdminUsers: active = has_reports true, inactive = has_reports false
      activeUsers: users.filter((u) => u.has_reports).length,
      inactiveUsers: users.filter((u) => !u.has_reports).length,
      suspendedUsers: users.filter((u) => u.status === 'suspended').length,
      bannedUsers: users.filter((u) => u.status === 'banned').length,
      onlineUsers: users.filter((u) => u.is_online).length,
      offlineUsers: users.filter((u) => !u.is_online).length,
      totalUsers: users.length,
    }),
    [reports, users],
  )

  // FIXED: Filter reports - when "all" is selected, show ALL reports including resolved
  const filteredReports = useMemo(() => {
    const filtered = reports.filter((report) => {
      const matchesStatus = statusFilter === "all" || report.status === statusFilter
      const matchesPriority = priorityFilter === "all" || report.priority === priorityFilter
      return matchesStatus && matchesPriority
    })

    // Sort by status: pending -> active -> resolved, then by priority: critical -> high -> medium -> low
    return filtered.sort((a, b) => {
      // First sort by status priority
      const statusOrder = { pending: 0, active: 1, resolved: 2 }
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff

      // Then sort by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [reports, statusFilter, priorityFilter])

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      // Apply status filter (match AdminUsers semantics)
      let matchesStatus = false;
      if (userFilter === 'all') {
        matchesStatus = true;
      } else if (userFilter === 'active') {
        matchesStatus = user.has_reports === true;
      } else if (userFilter === 'inactive') {
        matchesStatus = !user.has_reports;
      } else if (userFilter === 'online') {
        matchesStatus = user.is_online;
      } else if (userFilter === 'offline') {
        matchesStatus = !user.is_online;
      } else if (userFilter === 'suspended' || userFilter === 'banned') {
        matchesStatus = user.status === userFilter;
      } else {
        matchesStatus = true;
      }

      // Apply search filter
      const matchesSearch = userSearchText === '' ||
        `${user.user_firstname} ${user.user_lastname}`.toLowerCase().includes(userSearchText.toLowerCase()) ||
        user.user_email.toLowerCase().includes(userSearchText.toLowerCase());

      return matchesStatus && matchesSearch;
    });

    // Sort alphabetically by full name
    if (sortAlphabetical) {
      filtered = filtered.sort((a, b) => {
        const nameA = `${a.user_firstname} ${a.user_lastname}`.toLowerCase();
        const nameB = `${b.user_firstname} ${b.user_lastname}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }

    return filtered;
  }, [users, userFilter, userSearchText, sortAlphabetical]);

  // Handle status filter click - reset priority to 'all'
  const handleStatusFilterClick = (status: "all" | "pending" | "active" | "resolved") => {
    setStatusFilter(status)
    setPriorityFilter("all") // Reset priority filter when status changes
  }

  const handleUserActionModal = async (action: "warn" | "suspend" | "ban" | "activate") => {
    if (!selectedUserForAction) return

    try {
      let updates: any = {};
      switch (action) {
        case "warn":
          updates = { warnings: (selectedUserForAction.warnings || 0) + 1, last_warning_date: new Date().toISOString() };
          if (updates.warnings >= 3) updates.status = 'suspended';
          break;
        case "suspend":
          updates = { status: 'suspended' };
          break;
        case "ban":
          updates = { status: 'banned' };
          break;
        case "activate":
          updates = { status: 'active', warnings: 0, last_warning_date: null };
          break;
      }

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", selectedUserForAction.id)

      if (error) throw error

      const actionMessage = action === 'warn' && updates.warnings >= 3 ?
        'User warned and auto-suspended (3 warnings)' :
        `User ${action}ed successfully`;

      setToastMessage(actionMessage);
      setShowToast(true);
      setShowUserActionModal(false);
      await fetchInitialData();
    } catch (error) {
      console.error("Error updating user:", error)
      setToastMessage("Error updating user")
      setShowToast(true)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setToastMessage('Please upload an image file')
        setShowToast(true)
        return
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage('Image size must be less than 5MB')
        setShowToast(true)
        return
      }

      setResolvedPhoto(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadResolvedPhoto = async (file: File, reportId: string): Promise<string> => {
    try {
      const fileName = `resolved-proof-${Date.now()}.png`
      const filePath = `${reportId}/${fileName}`

      // Upload the file
      const { data, error } = await supabase.storage
        .from('resolved-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        if (error.message.includes('Bucket not found')) {
          console.error('Storage bucket not found. Please create "resolved-photos" bucket in Supabase.')
          throw new Error('Storage configuration error. Please contact administrator.')
        }
        throw error
      }

      // Get a signed URL for temporary access (if needed for display)
      const { data: signedUrlData } = await supabase.storage
        .from('resolved-photos')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      return signedUrlData?.signedUrl || data.path
    } catch (error) {
      console.error('Error uploading resolved photo:', error)
      throw new Error('Failed to upload photo')
    }
  }

  const handleStatusBadgeClick = (report: IncidentReport, e: React.MouseEvent) => {
    e.stopPropagation()

    if (report.status === 'pending') {
      setStatusChangeType('pending-to-active')
      setSelectedReport(report)
      setShowStatusChangeModal(true)
    } else if (report.status === 'active') {
      setStatusChangeType('active-to-resolved')
      setSelectedReport(report)
      setShowStatusChangeModal(true)
    }
    // Resolved status is not clickable
  }

  const handleStatusChange = async () => {
    if (!selectedReport || !notificationMessage.trim() || !estimatedTime) {
      setToastMessage('Please fill in all required fields')
      setShowToast(true)
      return
    }

    // Additional validation for resolved status
    if (statusChangeType === 'active-to-resolved' && !resolvedPhoto) {
      setToastMessage('Proof of resolution photo is required')
      setShowToast(true)
      return
    }

    try {
      let newStatus: 'pending' | 'active' | 'resolved' = selectedReport.status
      let updateData: any = {
        updated_at: new Date().toISOString()
      }

      const formattedTime = new Date(estimatedTime).toISOString()

      if (statusChangeType === 'pending-to-active') {
        newStatus = 'active'
        updateData.status = 'active'
        updateData.scheduled_response_time = formattedTime
        updateData.resolved_at = null
      } else if (statusChangeType === 'active-to-resolved') {
        newStatus = 'resolved'
        updateData.status = 'resolved'
        updateData.resolved_at = new Date().toISOString()

        // Upload resolved photo
        if (resolvedPhoto) {
          const photoUrl = await uploadResolvedPhoto(resolvedPhoto, selectedReport.id)
          updateData.resolved_photo_url = photoUrl
        }
      }

      // Update the incident report
      const { error: updateError } = await supabase
        .from('incident_reports')
        .update(updateData)
        .eq('id', selectedReport.id)

      if (updateError) throw updateError

      // Send notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_email: selectedReport.reporter_email,
          title: `Status Update: ${selectedReport.title}`,
          message: `${notificationMessage}\n\n${statusChangeType === 'pending-to-active' ? 'Estimated Response Time' : 'Resolved At'}: ${new Date(estimatedTime).toLocaleString()}`,
          related_report_id: selectedReport.id,
          type: 'update'
        })

      if (notificationError) throw notificationError

      setToastMessage(`Status updated to ${newStatus} successfully`)
      setShowToast(true)

      // Close the modal and reset state
      setShowStatusChangeModal(false)
      setShowReportModal(false) // Also close the incident details modal
      setNotificationMessage('')
      setEstimatedTime('')
      setResolvedPhoto(null)
      setPhotoPreview(null)
      setSelectedReport(null)
      setStatusChangeType('pending-to-active')

      // Force refresh reports to show updated status
      await fetchInitialData()

    } catch (error) {
      console.error('Error updating status:', error)
      setToastMessage('Error updating status. Please try again.')
      setShowToast(true)
      setShowStatusChangeModal(false)
    }
  }

  // NEW: Notify User function copied from AdminIncidents.tsx
  const handleNotifyUser = async () => {
    if (!selectedReport || !notificationMessage.trim()) return;

    try {
      // Store the estimated time in the incident report if provided
      const updateFields: any = {
        admin_response: notificationMessage,
        updated_at: new Date().toISOString()
      };
      if (estimatedTime) {
        updateFields.estimated_arrival_time = estimatedTime;
      }
      await supabase
        .from('incident_reports')
        .update(updateFields)
        .eq('id', selectedReport.id);

      // Send notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_email: selectedReport.reporter_email,
          title: `Update: ${selectedReport.title}`,
          message: estimatedTime
            ? `${notificationMessage}\n\nEstimated resolution: ${new Date(estimatedTime).toLocaleString()}`
            : notificationMessage,
          related_report_id: selectedReport.id,
          type: 'update'
        });

      if (error) throw error;

      setToastMessage('User notified successfully');
      setShowToast(true);
      setShowNotifyModal(false);
      setShowReportModal(false); // Also close the incident details modal
      setNotificationMessage('');
      setEstimatedTime('');

      // Refresh reports to show updated estimated time
      await fetchInitialData();

    } catch (error) {
      console.error('Error sending notification:', error);
      setToastMessage('Error sending notification. Please check RLS policies.');
      setShowToast(true);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', user.user_id);

      if (error) throw error;

      // Log the deletion
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      await logUserAction(user.user_email, 'delete_user', adminUser?.email);

      setToastMessage('User deleted successfully');
      setShowToast(true);
      await fetchInitialData();
    } catch (error) {
      console.error('Error deleting user:', error);
      setToastMessage('Error deleting user');
      setShowToast(true);
    }
  };

  // Add this to your delete handler after successful user deletion
  const deleteAuthUser = async (userId: string) => {
    try {
      // Note: This requires SUPABASE_SERVICE_ROLE_KEY and should be done server-side
      // For client-side, you might want to create an edge function
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) console.warn('Could not delete auth user:', error);
    } catch (error) {
      console.warn('Error deleting auth user:', error);
    }
  };

  // Show confirmation dialog for user actions
  const showConfirmationDialog = (user: User, action: 'warn' | 'suspend' | 'ban' | 'activate' | 'delete') => {
    setSelectedUserForAction(user);
    setPendingAction({ type: action, user });
    setShowActionConfirmAlert(true);
  };

  // Update getConfirmationMessage function
const getConfirmationMessage = () => {
  if (!pendingAction) return '';

  // Handle report deletion
  if (pendingAction.type === 'delete' && pendingAction.report) {
    return `Are you sure you want to delete the report "${pendingAction.report.title}"? This action is permanent and cannot be undone.`;
  }

  // Handle user actions
  if (pendingAction.user) {
    const userName = `${pendingAction.user.user_firstname} ${pendingAction.user.user_lastname}`;
    const userEmail = pendingAction.user.user_email;

    switch (pendingAction.type) {
      case 'warn':
        return `Are you sure you want to issue a warning to ${userName} (${userEmail})? This will increment their warning count.`;
      case 'suspend':
        return `Are you sure you want to suspend ${userName} (${userEmail})? They will not be able to access the system.`;
      case 'ban':
        return `Are you sure you want to ban ${userName} (${userEmail})? This action is permanent and cannot be undone.`;
      case 'activate':
        return `Are you sure you want to activate ${userName} (${userEmail})? This will reset their warnings and restore access.`;
      case 'delete':
        return `Are you sure you want to delete ${userName} (${userEmail})? This action is permanent and cannot be undone.`;
      default:
        return 'Are you sure you want to perform this action?';
    }
  }
  
  return 'Are you sure you want to perform this action?';
};

// Update getConfirmationHeader function
const getConfirmationHeader = () => {
  if (!pendingAction) return 'Confirm Action';

  if (pendingAction.type === 'delete' && pendingAction.report) {
    return 'Delete Report';
  }

  switch (pendingAction.type) {
    case 'warn': return 'Issue Warning';
    case 'suspend': return 'Suspend User';
    case 'ban': return 'Ban User';
    case 'activate': return 'Activate User';
    case 'delete': return 'Delete User';
    default: return 'Confirm Action';
  }
};

  // Update executeConfirmedAction function
  const executeConfirmedAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'delete' && pendingAction.report) {
        await handleDeleteReport(pendingAction.report);
      } else if (pendingAction.user) {
        switch (pendingAction.type) {
          case 'warn':
          case 'suspend':
          case 'ban':
          case 'activate':
            await handleUserActionModal(pendingAction.type);
            break;
          case 'delete':
            await handleDeleteUser(pendingAction.user);
            break;
        }
      }
    } catch (error) {
      console.error('Error executing action:', error);
      setToastMessage('Error executing action');
      setShowToast(true);
    } finally {
      setPendingAction(null);
      setShowActionConfirmAlert(false);
    }
  };

  // Add this function to your component
const handleDeleteReport = async (report: IncidentReport) => {
  try {
    const { error } = await supabase
      .from('incident_reports')
      .delete()
      .eq('id', report.id);

    if (error) throw error;

    // Log the deletion
    const { data: { user } } = await supabase.auth.getUser();
    await logUserAction(report.reporter_email, 'delete_report', user?.email);

    setToastMessage('Report deleted successfully');
    setShowToast(true);
    setShowReportModal(false);
    await fetchInitialData();
  } catch (error) {
    console.error('Error deleting report:', error);
    setToastMessage('Error deleting report');
    setShowToast(true);
  }
};

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar
            style={{ "--background": "var(--gradient-primary)", "--color": "white" } as any}
          >
            <IonTitle style={{ fontWeight: "bold" }}>
              <IonSkeletonText animated style={{ width: "250px", height: "20px" }} />
            </IonTitle>
            <IonButtons slot="end">
              <IonSkeletonText
                animated
                style={{ width: "32px", height: "32px", borderRadius: "50%", marginRight: "8px" }}
              />
              <IonSkeletonText animated style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
            </IonButtons>
          </IonToolbar>

          <IonToolbar style={{ "--background": "white" } as any}>
            <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #e5e7eb" }}>
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} style={{ flex: 1, padding: "12px", textAlign: "center" }}>
                  <IonSkeletonText animated style={{ width: "80%", height: "16px", margin: "0 auto" }} />
                </div>
              ))}
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ "--background": "#f8fafc" } as any} fullscreen>
          <div style={{ display: "flex", height: "calc(100vh - 112px)", width: "100%" }}>
            {/* Left Panel Skeleton - Incidents */}
            <div
              style={{
                width: "360px",
                borderRight: "1px solid #e5e7eb",
                background: "white",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IonSkeletonText animated style={{ width: "24px", height: "24px" }} />
                  <IonSkeletonText animated style={{ width: "120px", height: "16px" }} />
                  <IonSkeletonText animated style={{ width: "32px", height: "20px", borderRadius: "10px" }} />
                </div>
              </div>

              {/* Status Filter Skeleton */}
              <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
                <IonSkeletonText animated style={{ width: "100px", height: "12px", marginBottom: "8px" }} />
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4].map((item) => (
                    <IonSkeletonText
                      key={item}
                      animated
                      style={{ width: "70px", height: "28px", borderRadius: "14px" }}
                    />
                  ))}
                </div>
              </div>

              {/* Priority Filter Skeleton */}
              <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
                <IonSkeletonText animated style={{ width: "100px", height: "12px", marginBottom: "8px" }} />
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <IonSkeletonText
                      key={item}
                      animated
                      style={{ width: "60px", height: "28px", borderRadius: "14px" }}
                    />
                  ))}
                </div>
              </div>

              {/* Reports List Skeleton */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                <IonList style={{ padding: 0 }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <IonItem key={item} style={{ "--background": "transparent", "--border-color": "#f3f4f6" } as any}>
                      <div style={{ width: "100%", padding: "8px 0", willChange: "transform" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <IonSkeletonText animated style={{ width: "60%", height: "14px" }} />
                          <div style={{ display: "flex", gap: "4px" }}>
                            <IonSkeletonText animated style={{ width: "50px", height: "20px", borderRadius: "10px" }} />
                            <IonSkeletonText animated style={{ width: "50px", height: "20px", borderRadius: "10px" }} />
                          </div>
                        </div>
                        <IonSkeletonText animated style={{ width: "40%", height: "12px", marginBottom: "4px" }} />
                        <IonSkeletonText animated style={{ width: "70%", height: "12px", marginBottom: "8px" }} />
                        <IonSkeletonText animated style={{ width: "50%", height: "12px", marginBottom: "8px" }} />
                        <IonSkeletonText animated style={{ width: "80px", height: "24px", borderRadius: "12px" }} />
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            </div>

            {/* Main Content Skeleton - Map */}
            <div
              style={{
                flex: 1,
                position: "relative",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <IonSkeletonText
                  animated
                  style={{ width: "64px", height: "64px", borderRadius: "50%", margin: "0 auto 16px" }}
                />
                <IonSkeletonText animated style={{ width: "200px", height: "16px", margin: "0 auto 8px" }} />
                <IonSkeletonText animated style={{ width: "150px", height: "12px", margin: "0 auto" }} />
              </div>
            </div>

            {/* Right Panel Skeleton - Users */}
            <div
              style={{
                width: "360px",
                borderLeft: "1px solid #e5e7eb",
                background: "white",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IonSkeletonText animated style={{ width: "24px", height: "24px" }} />
                  <IonSkeletonText animated style={{ width: "60px", height: "16px" }} />
                  <IonSkeletonText animated style={{ width: "32px", height: "20px", borderRadius: "10px" }} />
                </div>
              </div>

              {/* Search Skeleton */}
              <div style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>
                <IonSkeletonText animated style={{ width: "100%", height: "40px", borderRadius: "8px" }} />
              </div>

              {/* User Filter Skeleton */}
              <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
                <IonSkeletonText animated style={{ width: "80px", height: "12px", marginBottom: "8px" }} />
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <IonSkeletonText
                      key={item}
                      animated
                      style={{ width: "70px", height: "28px", borderRadius: "14px" }}
                    />
                  ))}
                </div>
              </div>

              {/* Users List Skeleton */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                <IonList style={{ padding: 0 }}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <IonItem key={item}>
                      <div style={{ width: "100%", padding: "8px 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <IonSkeletonText animated style={{ width: "60%", height: "14px" }} />
                          <IonSkeletonText animated style={{ width: "50px", height: "20px", borderRadius: "10px" }} />
                        </div>
                        <IonSkeletonText animated style={{ width: "70%", height: "12px", marginBottom: "4px" }} />
                        <IonSkeletonText animated style={{ width: "50%", height: "11px" }} />
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            </div>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      {/* Status Change Modal */}
      <IonModal isOpen={showStatusChangeModal} onDidDismiss={() => {
        setShowStatusChangeModal(false);
        setNotificationMessage('');
        setEstimatedTime('');
        setResolvedPhoto(null);
        setPhotoPreview(null);
      }}>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => {
                setShowStatusChangeModal(false);
                setNotificationMessage('');
                setEstimatedTime('');
                setResolvedPhoto(null);
                setPhotoPreview(null);
              }}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Update Status</IonTitle>
            <IonButtons slot="end">
              <IonButton
                onClick={handleStatusChange}
                strong
                disabled={!notificationMessage.trim() || !estimatedTime || (statusChangeType === 'active-to-resolved' && !resolvedPhoto)}
                color="primary"
              >
                <IonIcon icon={sendOutline} slot="start" />
                Update
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: '16px' }}>
            <IonCard>
              <IonCardContent>
                {/* Status Change Info */}
                <div style={{
                  background: statusChangeType === 'pending-to-active' ? '#eff6ff' : '#ecfdf5',
                  border: `1px solid ${statusChangeType === 'pending-to-active' ? '#93c5fd' : '#6ee7b7'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <strong style={{ color: statusChangeType === 'pending-to-active' ? '#1e40af' : '#065f46', fontSize: '16px' }}>
                      Status Change
                    </strong>
                  </div>
                  <p style={{ margin: 0, color: statusChangeType === 'pending-to-active' ? '#1e40af' : '#065f46', fontSize: '14px' }}>
                    {statusChangeType === 'pending-to-active' ? 'Pending → Active' : 'Active → Resolved'}
                  </p>
                </div>

                {/* Message Input */}
                <IonItem>
                  <IonLabel position="stacked" color="primary">
                    Message to User *
                  </IonLabel>
                  <IonTextarea
                    value={notificationMessage}
                    onIonInput={e => setNotificationMessage(e.detail.value!)}
                    placeholder={statusChangeType === 'pending-to-active'
                      ? 'Enter message about response activation...'
                      : 'Enter message about incident resolution...'}
                    rows={4}
                    autoGrow
                    counter
                    maxlength={500}
                  />
                </IonItem>

                {/* Date/Time Input */}
                <IonItem>
                  <IonLabel position="stacked" color="primary">
                    {statusChangeType === 'pending-to-active'
                      ? 'Estimated Response Time *'
                      : 'Resolved Date & Time *'}
                  </IonLabel>
                  <IonDatetime
                    value={estimatedTime}
                    onIonChange={e => setEstimatedTime(e.detail.value as string)}
                    presentation="date-time"
                    min={new Date().toISOString()}
                  />
                </IonItem>

                {/* Proof of Photo - Only for Active to Resolved */}
                {statusChangeType === 'active-to-resolved' && (
                  <div style={{ marginTop: '16px' }}>
                    <IonItem>
                      <IonLabel position="stacked" color="primary">
                        Proof of Resolution Photo *
                        <IonText style={{ fontSize: '12px', color: '#6b7280' }}>
                          {' '}(Required for resolution)
                        </IonText>
                      </IonLabel>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        style={{ marginTop: '8px' }}
                      />
                    </IonItem>

                    {photoPreview && (
                      <div style={{ marginTop: '12px', textAlign: 'center' }}>
                        <IonText style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                          Photo Preview:
                        </IonText>
                        <IonImg
                          src={photoPreview}
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            margin: '0 auto',
                            border: '2px solid #e5e7eb'
                          }}
                        />
                        <IonButton
                          size="small"
                          color="danger"
                          fill="clear"
                          onClick={() => {
                            setResolvedPhoto(null);
                            setPhotoPreview(null);
                          }}
                          style={{ marginTop: '8px' }}
                        >
                          <IonIcon icon={closeOutline} slot="start" />
                          Remove Photo
                        </IonButton>
                      </div>
                    )}

                    {!photoPreview && (
                      <div style={{
                        background: '#fef3cd',
                        border: '1px solid #f59e0b',
                        borderRadius: '8px',
                        padding: '12px',
                        marginTop: '12px',
                        fontSize: '14px',
                        color: '#92400e'
                      }}>
                        <strong>Photo Requirement:</strong> A photo is required to mark this incident as resolved.
                        This serves as proof that the issue has been addressed.
                      </div>
                    )}
                  </div>
                )}

                {estimatedTime && (
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '12px',
                    fontSize: '14px',
                    color: '#0369a1'
                  }}>
                    <strong>
                      {statusChangeType === 'pending-to-active'
                        ? 'Response scheduled for:'
                        : 'Report will be marked as resolved at:'}
                    </strong><br />
                    {new Date(estimatedTime).toLocaleString()}
                  </div>
                )}
              </IonCardContent>
            </IonCard>

            {/* Preview */}
            {selectedReport && (
              <IonCard style={{ marginTop: '16px' }}>
                <IonCardContent>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    <strong>Report:</strong> {selectedReport.title}<br />
                    <strong>Notifying:</strong> {selectedReport.reporter_name} ({selectedReport.reporter_email})
                  </div>
                </IonCardContent>
              </IonCard>
            )}
          </div>
        </IonContent>
      </IonModal>
      <IonHeader>
        <IonToolbar
          style={{ "--background": "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)", "--color": "white" } as any}
        >
          <IonTitle style={{ fontWeight: "bold" }}>iAMUMA ta - Admin Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              onClick={() => navigation.push("/iAMUMAta/admin/notifications", "forward", "push")}
              style={{ color: 'white' }}
            >
              <IonIcon icon={notificationsOutline} />
              {unreadCount > 0 && (
                <IonBadge
                  color="danger"
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: '0px',
                    fontSize: '10px',
                    transform: 'translate(25%, -25%)'
                  }}
                >
                  {unreadCount}
                </IonBadge>
              )}
            </IonButton>
            <IonButton
              fill="clear"
              onClick={async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  await logAdminLogout(user?.email);
                  setToastMessage('Logged out successfully');
                  setShowToast(true);
                } finally {
                  supabase.auth.signOut();
                  navigation.push("/iAMUMAta", "root", "replace");
                }
              }}
              style={{ color: "white" }}
            >
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        {/* Menu Bar */}
        <IonToolbar style={{ "--background": "white" } as any}>
          <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #e5e7eb" }}>
            {[
              { id: "dashboard", label: "Dashboard", icon: statsChartOutline, route: "/iAMUMAta/admin-dashboard" },
              { id: "incidents", label: "Incidents", icon: alertCircleOutline, route: "/iAMUMAta/admin/incidents" },
              { id: "users", label: "Users", icon: peopleOutline, route: "/iAMUMAta/admin/users" },
              { id: "analytics", label: "Analytics", icon: documentTextOutline, route: "/iAMUMAta/admin/analytics" },
              { id: "systemlogs", label: "System Logs", icon: documentTextOutline, route: "/iAMUMAta/admin/system-logs" },
            ].map((menu) => (
              <IonButton
                key={menu.id}
                fill="clear"
                onClick={() => {
                  if (menu.route) {
                    navigation.push(menu.route, "forward", "push")
                  }
                }}
                style={
                  {
                    "--color": menu.id === "dashboard" ? "#3b82f6" : "#6b7280",
                    "--background": "transparent",
                    "--border-radius": "0",
                    borderBottom: menu.id === "dashboard" ? "2px solid #3b82f6" : "2px solid transparent",
                    margin: 0,
                    flex: 1,
                  } as any
                }
              >
                <IonIcon icon={menu.icon} slot="start" />
                {menu.label}
              </IonButton>
            ))}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ "--background": "#f8fafc" } as any} fullscreen>
        <div style={{ display: "flex", height: "calc(100vh - 112px)", width: "100%" }}>
          {/* Left Panel - Incidents */}
          <div
            style={{
              width: isIncidentsCollapsed ? "60px" : "360px",
              borderRight: "1px solid #e5e7eb",
              background: "white",
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              willChange: "width"
            }}
          >
            <div
              style={{
                padding: "12px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "white",
              }}
            >
              {!isIncidentsCollapsed && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IonIcon icon={alertCircleOutline} style={{ color: "#dc2626" }} />
                  <span style={{ fontWeight: "bold", fontSize: "16px" }}>Incident Reports</span>
                  <IonBadge color="danger" style={{ marginLeft: "8px" }}>
                    {stats.total}
                  </IonBadge>
                </div>
              )}
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setIsIncidentsCollapsed(!isIncidentsCollapsed)}
                style={{ "--padding-start": "4px", "--padding-end": "4px" } as any}
              >
                <IonIcon icon={isIncidentsCollapsed ? chevronForwardOutline : chevronBackOutline} />
              </IonButton>
            </div>

            {!isIncidentsCollapsed && (
              <>
                {/* Status Filter */}
                <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
                  <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "bold", color: "#6b7280" }}>
                    STATUS FILTER
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {[
                      { value: "all", label: "All", count: stats.total, color: "#6b7280" },
                      { value: "pending", label: "Pending", count: stats.pending, color: "#f59e0b" },
                      { value: "active", label: "Active", count: stats.active, color: "#3b82f6" },
                      { value: "resolved", label: "Resolved", count: stats.resolved, color: "#10b981" },
                    ].map((filter) => (
                      <IonChip
                        key={filter.value}
                        outline={statusFilter !== filter.value}
                        color={statusFilter === filter.value ? "primary" : undefined}
                        onClick={() => handleStatusFilterClick(filter.value as any)}
                        style={
                          {
                            "--background": statusFilter === filter.value ? filter.color : "transparent",
                            "--color": statusFilter === filter.value ? "white" : filter.color,
                            cursor: "pointer",
                            margin: 0,
                            fontSize: "12px",
                          } as any
                        }
                      >
                        {filter.label} ({filter.count})
                      </IonChip>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
                  <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "bold", color: "#6b7280" }}>
                    PRIORITY FILTER
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {[
                      { value: "all", label: "All", color: "#6b7280" },
                      { value: "critical", label: "Critical", color: "#dc2626" },
                      { value: "high", label: "High", color: "#f97316" },
                      { value: "medium", label: "Medium", color: "#eab308" },
                      { value: "low", label: "Low", color: "#84cc16" },
                    ].map((filter) => (
                      <IonChip
                        key={filter.value}
                        outline={priorityFilter !== filter.value}
                        color={priorityFilter === filter.value ? "primary" : undefined}
                        onClick={() => setPriorityFilter(filter.value as any)}
                        style={
                          {
                            "--background": priorityFilter === filter.value ? filter.color : "transparent",
                            "--color": priorityFilter === filter.value ? "white" : filter.color,
                            cursor: "pointer",
                            margin: 0,
                            fontSize: "12px",
                          } as any
                        }
                      >
                        {filter.label}
                      </IonChip>
                    ))}
                  </div>
                </div>

                {/* Reports List */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {filteredReports.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px", color: "#9ca3af" }}>
                      <IonIcon icon={alertCircleOutline} style={{ fontSize: "48px", marginBottom: "16px" }} />
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
                            setSelectedReport(report)
                            setShowReportModal(true)
                            // Clear route when selecting another report ONLY if route is displayed
                            if (isRouteDisplayed) {
                              clearRoute()
                            }
                            // Zoom and center on selected report
                            if (report.coordinates) {
                              mapInstanceRef.current?.setView([report.coordinates.lat, report.coordinates.lng], 15)
                            }
                          }}
                          style={
                            {
                              "--background": selectedReport?.id === report.id ? "#eff6ff" : "transparent",
                              "--border-color": "#f3f4f6",
                              "--transition": "background 0.2s ease",
                            } as any
                          }
                        >
                          <div style={{ width: "100%", padding: "8px 0" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "4px",
                              }}
                            >
                              <span style={{ fontWeight: "bold", fontSize: "14px", color: "#1f2937" }}>
                                {report.title}
                              </span>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <IonBadge
                                  onClick={(e) => handleStatusBadgeClick(report, e)}
                                  style={
                                    {
                                      fontSize: "10px",
                                      "--background": getStatusColor(report.status),
                                      "--color": "white",
                                      cursor: report.status !== 'resolved' ? 'pointer' : 'default',
                                      opacity: report.status !== 'resolved' ? 1 : 0.7
                                    } as any
                                  }
                                >
                                  {report.status}
                                </IonBadge>
                                <IonBadge
                                  style={
                                    {
                                      fontSize: "10px",
                                      "--background": getPriorityColor(report.priority),
                                      "--color": "white",
                                    } as any
                                  }
                                >
                                  {report.priority}
                                </IonBadge>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                              <IonIcon icon={locationOutline} style={{ fontSize: "12px", color: "#6b7280" }} />
                              <span style={{ fontSize: "12px", color: "#6b7280" }}>{report.barangay}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                              <IonIcon icon={timeOutline} style={{ fontSize: "12px", color: "#6b7280" }} />
                              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                                {new Date(report.created_at).toLocaleDateString()} -{" "}
                                {new Date(report.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                              Reporter: {report.reporter_name}
                            </div>
                            {/* NEW: Track button positioned below status and priority */}
                            <div style={{ marginTop: "8px" }}>
                              <IonButton
                                size="small"
                                fill="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTrackReport(report)
                                }}
                                disabled={report.status === "resolved"}
                                style={
                                  {
                                    "--background": "#dc2626",
                                    "--color": "white",
                                    "--border-color": "#dc2626",
                                    fontSize: "10px",
                                    height: "24px",
                                  } as any
                                }
                              >
                                <IonIcon icon={navigateOutline} slot="start" style={{ fontSize: "10px" }} />
                                Track
                              </IonButton>
                              <IonButton
                                size="small"
                                fill="solid"
                                color="danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingAction({ type: 'delete', report: report });
                                  setShowActionConfirmAlert(true);
                                }}
                                style={{
                                  height: "24px",
                                  fontSize: "10px",
                                  "--background": "#dc2626",
                                  "--color": "white"
                                } as any}
                              >
                                <IonIcon icon={trashOutline} slot="start" style={{ fontSize: "10px" }} />
                                Delete
                              </IonButton>
                            </div>
                            {/* NEW: Show scheduled time if exists */}
                            {report.scheduled_response_time && (
                              <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px" }}>
                                <IonIcon icon={calendarOutline} style={{ fontSize: "10px", marginRight: "4px" }} />
                                Scheduled: {new Date(report.scheduled_response_time).toLocaleString()}
                              </div>
                            )}
                            {/* NEW: Show ETA if exists */}
                            {report.current_eta_minutes && report.status === "active" && (
                              <div style={{ fontSize: "11px", color: "#3b82f6", marginTop: "2px" }}>
                                <IonIcon icon={carOutline} style={{ fontSize: "10px", marginRight: "4px" }} />
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
          <div style={{ flex: 1, position: "relative", background: "#f1f5f9" }}>
            {mapError && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "16px",
                  borderRadius: "8px",
                  textAlign: "center",
                  zIndex: 1000,
                }}
              >
                <IonIcon icon={alertCircleOutline} style={{ fontSize: "24px", marginBottom: "8px" }} />
                <p style={{ margin: 0 }}>{mapError}</p>
              </div>
            )}

            {/* Moved Route Info to Upper Right - ADDED FONT SIZE */}
            {routeInfo && (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px", // Changed from left to right
                  background: "white",
                  padding: "16px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  minWidth: "200px",
                  fontSize: "14px", // ADDED: Font size for mini details
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#1f2937", fontWeight: "bold" }}>Response Route</h4>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={clearRoute}
                    style={{ "--padding-start": "4px", "--padding-end": "4px" } as any}
                  >
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>From MDRRMO to Incident</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", color: "#374151" }}>Distance:</span>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937" }}>
                    {routeInfo.distance.toFixed(1)} km
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "14px", color: "#374151" }}>ETA:</span>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937" }}>
                    {Math.round(routeInfo.duration)} min
                  </span>
                </div>
              </div>
            )}

            {isCalculatingRoute && (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "white",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  zIndex: 1000,
                }}
              >
                <IonSpinner style={{ width: "16px", height: "16px" }} />
                <span style={{ fontSize: "14px", fontWeight: "500" }}>Calculating route...</span>
              </div>
            )}

            {/* UPDATED: MDRRMO Container - Made clickable and centered */}
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "16px",
                background: "white",
                padding: "8px 12px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                fontWeight: "bold",
                color: "#dc2626",
                cursor: "pointer", // ADDED: Show pointer cursor
                transition: "all 0.2s ease",
              }}
              onClick={centerOnCommandCenter} // ADDED: Click handler
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fef2f2" // ADDED: Hover effect
                e.currentTarget.style.transform = "scale(1.05)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white"
                e.currentTarget.style.transform = "scale(1)"
              }}
            >
              <IonIcon icon={businessOutline} />
              <span>MDRRMO</span>
            </div>

            <div
              ref={mapRef}
              style={{
                width: "100%",
                height: "100%",
                background: "#f1f5f9",
              }}
            />
          </div>

          {/* Right Panel - Users */}
          <div
            style={{
              width: isUsersCollapsed ? "60px" : "360px",
              borderLeft: "1px solid #e5e7eb",
              background: "white",
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              willChange: "width"
            }}
          >
            <div
              style={{
                padding: "12px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "white",
              }}
            >
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setIsUsersCollapsed(!isUsersCollapsed)}
                style={{ "--padding-start": "4px", "--padding-end": "4px" } as any}
              >
                <IonIcon icon={isUsersCollapsed ? chevronBackOutline : chevronForwardOutline} />
              </IonButton>
              {!isUsersCollapsed && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IonIcon icon={peopleOutline} style={{ color: "#3b82f6" }} />
                  <span style={{ fontWeight: "bold", fontSize: "16px" }}>Users</span>
                  <IonBadge color="primary" style={{ marginLeft: "8px" }}>
                    {stats.totalUsers}
                  </IonBadge>
                </div>
              )}
            </div>

            {!isUsersCollapsed && (
              <>


                {/* User Search and Sort */}
                <div style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <IonSearchbar
                      value={userSearchText}
                      onIonInput={(e) => setUserSearchText(e.detail.value!)}
                      placeholder="Search users..."
                      style={
                        {
                          "--background": "#f8fafc",
                          "--border-radius": "8px",
                          "--box-shadow": "none",
                          fontSize: "12px",
                          height: "40px",
                          flex: 1,
                        } as any
                      }
                    />
                    <IonButton
                      fill={sortAlphabetical ? 'solid' : 'outline'}
                      onClick={() => setSortAlphabetical(!sortAlphabetical)}
                      style={{ '--border-radius': '8px', height: '40px' } as any}
                    >
                      <IonIcon icon={filterOutline} slot="icon-only" />
                    </IonButton>
                  </div>
                </div>

                {/* User Filters */}
                <div style={{ padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
                  <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "bold", color: "#6b7280" }}>
                    USER FILTER
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {[
                      { value: "all", label: "All", count: stats.totalUsers, color: "#6b7280" },
                      { value: "active", label: "Active", count: stats.activeUsers, color: "#10b981" },
                      { value: "inactive", label: "Inactive", count: stats.inactiveUsers, color: "#9ca3af" },
                      { value: "online", label: "Online", count: stats.onlineUsers, color: "#3b82f6" },
                      { value: "offline", label: "Offline", count: stats.offlineUsers, color: "#6b7280" },
                      { value: "suspended", label: "Suspended", count: stats.suspendedUsers, color: "#f59e0b" },
                      { value: "banned", label: "Banned", count: stats.bannedUsers, color: "#dc2626" },
                    ].map((filter) => (
                      <IonChip
                        key={filter.value}
                        outline={userFilter !== filter.value}
                        color={userFilter === filter.value ? "primary" : undefined}
                        onClick={() => setUserFilter(filter.value as any)}
                        style={
                          {
                            "--background": userFilter === filter.value ? filter.color : "transparent",
                            "--color": userFilter === filter.value ? "white" : filter.color,
                            cursor: "pointer",
                            margin: 0,
                            fontSize: "10px",
                            height: "24px",
                          } as any
                        }
                      >
                        {filter.label} ({filter.count})
                      </IonChip>
                    ))}
                  </div>
                </div>

                {/* Users List */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {filteredAndSortedUsers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px", color: "#9ca3af" }}>
                      <IonIcon icon={peopleOutline} style={{ fontSize: "48px", marginBottom: "16px" }} />
                      <p>No users found</p>
                    </div>
                  ) : (
                    <IonList style={{ padding: "8px", willChange: "contents" }}>
                      {filteredAndSortedUsers.map((user) => (
                        <IonItem
                          key={user.id || `user-${Math.random()}`}
                          style={{
                            '--background': 'white',
                            '--border-radius': '8px',
                            marginBottom: '8px',
                            '--padding-start': '0',
                            '--padding-end': '0',
                          } as any}
                        >
                          <div style={{ width: "100%", padding: "12px" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "8px",
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937" }}>
                                    {user.user_firstname} {user.user_lastname}
                                  </div>
                                  {isUserOnline(user) && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 2px #d1fae5" }} />}
                                </div>
                                <div style={{ fontSize: "12px", color: "#6b7280" }}>{user.user_email}</div>
                              </div>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <IonBadge
                                  style={
                                    {
                                      fontSize: "9px",
                                      "--background": getStatusColor(user.status),
                                      "--color": "white",
                                    } as any
                                  }
                                >
                                  {user.status.toUpperCase()}
                                </IonBadge>
                                {user.warnings > 0 && <IonBadge color="warning" style={{ fontSize: "9px" }}>{user.warnings} ⚠️</IonBadge>}
                              </div>
                            </div>

                            <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
                              Joined: {formatDate(user.date_registered)} • Last Online: {getLastActiveText(user)}
                            </div>

                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                              <IonButton
                                size="small"
                                fill="solid"
                                color="warning"
                                onClick={() => {
                                  setSelectedUserForAction(user);
                                  setUserActionType("warn");
                                  showConfirmationDialog(user, 'warn');
                                }}
                                disabled={user.status === 'banned'}
                                style={{ height: "24px", fontSize: "10px", "--color": "white" } as any}
                              >
                                <IonIcon icon={warningOutline} slot="start" style={{ fontSize: "10px", color: "white" }} />
                                Warn
                              </IonButton>
                              <IonButton
                                size="small"
                                fill="solid"
                                color="medium"
                                onClick={() => {
                                  setSelectedUserForAction(user);
                                  setUserActionType(user.status === 'suspended' ? "activate" : "suspend");
                                  showConfirmationDialog(user, user.status === 'suspended' ? 'activate' : 'suspend');
                                }}
                                disabled={user.status === 'banned'}
                                style={{ height: "24px", fontSize: "10px", "--color": "white" } as any}
                              >
                                <IonIcon icon={user.status === 'suspended' ? activateOutline : pauseCircleOutline} slot="start" style={{ fontSize: "10px", color: "white" }} />
                                {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                              </IonButton>
                              <IonButton
                                size="small"
                                fill="solid"
                                color="danger"
                                onClick={() => {
                                  setSelectedUserForAction(user);
                                  setUserActionType(user.status === 'banned' ? "activate" : "ban");
                                  showConfirmationDialog(user, user.status === 'banned' ? 'activate' : 'ban');
                                }}
                                style={{ height: "24px", fontSize: "10px", "--color": "white" } as any}
                              >
                                <IonIcon icon={banOutline} slot="start" style={{ fontSize: "10px", color: "white" }} />
                                {user.status === 'banned' ? 'Unban' : 'Ban'}
                              </IonButton>
                              <IonButton
                                size="small"
                                fill="solid"
                                color="danger"
                                onClick={() => showConfirmationDialog(user, 'delete')}
                                style={{
                                  height: "24px",
                                  fontSize: "10px",
                                  "--background": "#dc2626",
                                  "--color": "white"
                                } as any}
                              >
                                <IonIcon icon={trashOutline} slot="start" style={{ fontSize: "10px" }} />
                              DEL
                              </IonButton>
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
                  onClick={() => {
                    if (selectedReport) {
                      handleTrackReport(selectedReport)
                      setShowReportModal(false)
                    }
                  }}
                  style={{ "--background": "#dc2626", "--color": "white" } as any}
                >
                  <IonIcon icon={navigateOutline} slot="start" />
                  Track
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedReport && (
              <div style={{ padding: "16px" }}>
                <IonCard>
                  <IonCardContent>
                    <h2 style={{ marginTop: 0, marginBottom: "16px" }}>{selectedReport.title}</h2>

                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                      <IonBadge
                        onClick={(e) => handleStatusBadgeClick(selectedReport, e)}
                        style={{
                          "--background": getStatusColor(selectedReport.status),
                          cursor: selectedReport.status !== 'resolved' ? 'pointer' : 'default',
                          opacity: selectedReport.status !== 'resolved' ? 1 : 0.7
                        } as any}
                      >
                        {selectedReport.status}
                      </IonBadge>
                      <IonBadge style={{ "--background": getPriorityColor(selectedReport.priority) } as any}>
                        {selectedReport.priority}
                      </IonBadge>
                    </div>

                    {/* Conditional scheduling/ETA/resolution summary by status */}
                    {selectedReport.status === 'pending' && (
                      <>
                        {selectedReport.current_eta_minutes && (
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
                              <IonText style={{ fontSize: '16px', color: '#1e293b', fontWeight: '500', marginLeft: '26px' }}>
                                {selectedReport.current_eta_minutes ? `${selectedReport.current_eta_minutes} minutes to arrive` : ''}
                              </IonText>
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {selectedReport.status === 'active' && (
                      <>
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

                        {(selectedReport.current_eta_minutes) && (
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
                              {selectedReport.current_eta_minutes ? `${selectedReport.current_eta_minutes} minutes to arrive` : ''}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {selectedReport.status === 'resolved' && selectedReport.resolved_at && (
                      <div style={{
                        background: '#ecfdf5',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <IonIcon icon={checkmarkCircleOutline} style={{ color: '#10b981' }} />
                          <strong style={{ color: '#065f46' }}>Resolved</strong>
                        </div>
                        <p style={{ margin: 0, color: '#065f46', fontSize: '14px' }}>
                          {new Date(selectedReport.resolved_at).toLocaleString()}
                        </p>
                        {/* Proof of Resolution */}
                        {selectedReport.resolved_photo_url && (
                          <div style={{ marginTop: '12px' }}>
                            <strong style={{ color: '#065f46' }}>Proof of Resolution:</strong>
                            <div style={{ marginTop: '8px' }}>
                              <IonImg
                                src={selectedReport.resolved_photo_url}
                                style={{
                                  maxWidth: '300px',
                                  maxHeight: '300px',
                                  borderRadius: '8px',
                                  border: '2px solid #10b981'
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {/* Latest Feedback */}
                        {selectedReportFeedback && (
                          <div style={{
                            background: '#f5f3ff',
                            border: '1px solid #ddd6fe',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '12px'
                          }}>
                            <strong style={{ color: '#5b21b6' }}>User Feedback</strong>
                            <div style={{ marginTop: '6px', color: '#5b21b6' }}>
                              Overall Rating: {selectedReportFeedback.overall_rating}/5
                            </div>
                            {selectedReportFeedback.comments && (
                              <div style={{ marginTop: '4px', color: '#5b21b6' }}>
                                {selectedReportFeedback.comments}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <IonGrid>
                      <IonRow>
                        <IonCol size="6">
                          <div style={{ marginBottom: "16px" }}>
                            <strong>Barangay:</strong>
                            <p>{selectedReport.barangay}</p>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div style={{ marginBottom: "16px" }}>
                            <strong>Reported Date:</strong>
                            <p>{new Date(selectedReport.created_at).toLocaleDateString()}</p>
                          </div>
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="6">
                          <div style={{ marginBottom: "16px" }}>
                            <strong>Category:</strong>
                            <p>{selectedReport.category}</p>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div style={{ marginBottom: "16px" }}>
                            <strong>Reported Time:</strong>
                            <p>
                              {new Date(selectedReport.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </IonCol>
                        <IonCol size="12">
                          <div style={{ marginBottom: "16px" }}>
                            <strong>Description:</strong>
                            <p style={{ whiteSpace: "pre-wrap" }}>{selectedReport.description}</p>
                          </div>

                          {/* Images */}
                          {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                            <div style={{ marginTop: "16px" }}>
                              <strong>Attached Images:</strong>
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
                        </IonCol>
                      </IonRow>
                    </IonGrid>



                    {/* Admin Response */}
                    {selectedReport.admin_response && (
                      <div style={{ marginTop: "16px", padding: "12px", background: "#eff6ff", borderRadius: "8px" }}>
                        <strong>Admin Response:</strong>
                        <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{selectedReport.admin_response}</p>
                      </div>
                    )}

                    {/* Reporter Information */}
                    <IonCard style={{ background: "#f8fafc" }}>
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

                    {/* NEW: Enhanced Action Buttons */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "24px", flexWrap: "wrap" }}>
                      {/* Delete Report Button */}
                      <IonButton
                        expand="block"
                        color="danger"
                        onClick={() => {
                          setPendingAction({ type: 'delete', report: selectedReport });
                          setShowActionConfirmAlert(true);
                        }}
                      >
                        <IonIcon icon={trashOutline} slot="start" />
                        Delete Report
                      </IonButton>

                      <IonButton
                        expand="block"
                        color="secondary"
                        onClick={() => {
                          setShowReportModal(false)
                          setShowNotifyModal(true)
                        }}
                      >
                        <IonIcon icon={sendOutline} slot="start" />
                        Notify User
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
            <div style={{ padding: "16px" }}>
              <IonCard>
                <IonCardContent>
                  <p>Schedule when the response team will address this incident:</p>

                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>
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
                        scheduleResponseTime(selectedReport.id, scheduledResponseTime)
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

        {/* Notify User Modal */}
        <IonModal isOpen={showNotifyModal} onDidDismiss={() => setShowNotifyModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowNotifyModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Notify User</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: "16px" }}>
              <IonCard>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="stacked" color="primary">
                      Message to User *
                    </IonLabel>
                    <IonTextarea
                      value={notificationMessage}
                      onIonInput={e => setNotificationMessage(e.detail.value!)}
                      placeholder="Enter update about their report..."
                      rows={4}
                      autoGrow
                      counter
                      maxlength={500}
                    />
                  </IonItem>
                </IonCardContent>
              </IonCard>

              {/* Preview of who we're notifying */}
              {selectedReport && (
                <IonCard style={{ marginTop: '16px' }}>
                  <IonCardContent>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      <strong>Notifying:</strong> {selectedReport.reporter_name} ({selectedReport.reporter_email})<br />
                      <strong>Report:</strong> {selectedReport.title}
                    </div>
                  </IonCardContent>
                </IonCard>
              )}

              <IonButton
                expand="block"
                onClick={handleNotifyUser}
                disabled={!notificationMessage.trim()}
                style={{ marginTop: '16px' }}
              >
                <IonIcon icon={sendOutline} slot="start" />
                Send Notification
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* User Action Modal */}
        <IonModal isOpen={showUserActionModal} onDidDismiss={() => setShowUserActionModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowUserActionModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>User Management</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedUserForAction && (
              <div style={{ padding: "16px" }}>
                <IonCard>
                  <IonCardContent>
                    <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
                      Manage User: {selectedUserForAction.user_firstname} {selectedUserForAction.user_lastname}
                    </h2>

                    <div style={{ marginBottom: "20px" }}>
                      <strong>User Information:</strong>
                      <IonGrid>
                        <IonRow>
                          <IonCol size="6">
                            <p>
                              <strong>Email:</strong> {selectedUserForAction.user_email}
                            </p>
                          </IonCol>
                          <IonCol size="6">
                            <p>
                              <strong>Status:</strong>
                              <IonBadge
                                color={
                                  selectedUserForAction.status === "active"
                                    ? "success"
                                    : selectedUserForAction.status === "suspended"
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {selectedUserForAction.status}
                              </IonBadge>
                            </p>
                          </IonCol>
                        </IonRow>
                        <IonRow>
                          <IonCol size="6">
                            <p>
                              <strong>Warnings:</strong> {selectedUserForAction.warnings || 0}
                            </p>
                          </IonCol>
                          <IonCol size="6">
                            <p>
                              <strong>Joined:</strong> {new Date(selectedUserForAction.date_registered).toLocaleDateString()}
                            </p>
                          </IonCol>
                        </IonRow>
                        <IonRow>
                          <IonCol size="12">
                            <p>
                              <strong>Activity Status:</strong>{" "}
                              {selectedUserForAction.status.toUpperCase()}
                            </p>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <strong>Select Action:</strong>
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                        <IonButton
                          fill={userActionType === "warn" ? "solid" : "outline"}
                          color="warning"
                          onClick={() => setUserActionType("warn")}
                        >
                          <IonIcon icon={warningOutline} slot="start" />
                          Issue Warning
                        </IonButton>
                        <IonButton
                          fill={userActionType === "suspend" ? "solid" : "outline"}
                          color="medium"
                          onClick={() => setUserActionType("suspend")}
                        >
                          <IonIcon icon={pauseCircleOutline} slot="start" />
                          Suspend User
                        </IonButton>
                        <IonButton
                          fill={userActionType === "ban" ? "solid" : "outline"}
                          color="danger"
                          onClick={() => setUserActionType("ban")}
                        >
                          <IonIcon icon={banOutline} slot="start" />
                          Ban User
                        </IonButton>
                        {(selectedUserForAction.status === 'suspended' || selectedUserForAction.status === 'banned') && (
                          <IonButton
                            fill={userActionType === "activate" ? "solid" : "outline"}
                            color="success"
                            onClick={() => setUserActionType("activate")}
                          >
                            <IonIcon icon={activateOutline} slot="start" />
                            Activate User
                          </IonButton>
                        )}
                      </div>
                    </div>

                    <IonButton
                      expand="block"
                      color={
                        userActionType === "warn" ? "warning" :
                          userActionType === "suspend" ? "medium" :
                            userActionType === "ban" ? "danger" : "success"
                      }
                      onClick={() => {
                        handleUserActionModal(userActionType)
                      }}
                    >
                      Confirm{" "}
                      {userActionType === "warn" ? "Warning" :
                        userActionType === "suspend" ? "Suspension" :
                          userActionType === "ban" ? "Ban" : "Activation"}
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Alerts and Toasts */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />

        {/* Image Gallery Modal */}
        <IonModal
          isOpen={showImageModal}
          onDidDismiss={() => setShowImageModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowImageModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>Image Gallery</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              {selectedImages.length > 0 && (
                <IonCard>
                  <IonCardContent>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '400px',
                      position: 'relative',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <img
                        src={selectedImages[selectedImageIndex]}
                        alt={`Gallery image ${selectedImageIndex + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                      />

                      {/* Navigation arrows */}
                      {selectedImages.length > 1 && (
                        <>
                          <IonButton
                            fill="clear"
                            onClick={() => setSelectedImageIndex(prev =>
                              prev === 0 ? selectedImages.length - 1 : prev - 1
                            )}
                            style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              '--color': '#374151',
                              '--background': 'rgba(255,255,255,0.9)',
                              '--border-radius': '50%',
                              width: '40px',
                              height: '40px',
                              '--box-shadow': '0 2px 8px rgba(0,0,0,0.1)'
                            } as any}
                          >
                            <IonIcon icon={chevronBackOutline} />
                          </IonButton>

                          <IonButton
                            fill="clear"
                            onClick={() => setSelectedImageIndex(prev =>
                              prev === selectedImages.length - 1 ? 0 : prev + 1
                            )}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              '--color': '#374151',
                              '--background': 'rgba(255,255,255,0.9)',
                              '--border-radius': '50%',
                              width: '40px',
                              height: '40px',
                              '--box-shadow': '0 2px 8px rgba(0,0,0,0.1)'
                            } as any}
                          >
                            <IonIcon icon={chevronForwardOutline} />
                          </IonButton>
                        </>
                      )}

                      {/* Image counter */}
                      {selectedImages.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {selectedImageIndex + 1} / {selectedImages.length}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {selectedImages.length > 1 && (
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '8px',
                        justifyContent: 'center'
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
                  </IonCardContent>
                </IonCard>
              )}
            </div>
          </IonContent>
        </IonModal>
        {/* Action Confirmation Alert */}
        <IonAlert
          isOpen={showActionConfirmAlert}
          onDidDismiss={() => {
            setShowActionConfirmAlert(false);
            setPendingAction(null);
          }}
          header={getConfirmationHeader()}
          message={getConfirmationMessage()}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'alert-button-cancel'
            },
            {
              text: 'Confirm',
              role: 'confirm',
              cssClass: pendingAction?.type === 'delete' ? 'alert-button-danger' : 'alert-button-confirm',
              handler: executeConfirmedAction
            }
          ]}
        />
      </IonContent>
    </IonPage>
  )
}

// Helper functions
function getIncidentStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    pending: "#f59e0b",
    active: "#3b82f6",
    resolved: "#10b981",
  }
  return colors[status] || "#6b7280"
}

function getPriorityColor(priority: string): string {
  const colors: { [key: string]: string } = {
    critical: "#dc2626",
    high: "#f97316",
    medium: "#eab308",
    low: "#84cc16",
  }
  return colors[priority] || "#6b7280"
}

export default AdminDashboard