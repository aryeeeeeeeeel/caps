// src/pages/admin-tabs/AdminAnalytics.tsx - Fixed skeleton screen
import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonBadge,
  useIonRouter,
  IonText,
  IonSkeletonText,
  IonToast,
  useIonViewWillEnter,
  IonDatetime,
  IonPopover
} from '@ionic/react';
import {
  arrowBackOutline,
  downloadOutline,
  calendarOutline,
  statsChartOutline,
  documentTextOutline,
  notificationsOutline,
  logOutOutline,
  peopleOutline,
  alertCircleOutline,
  desktopOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';

interface ReportData {
  total: number;
  pending: number;
  active: number;
  resolved: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    prank: number;
  };
  byBarangay: { [key: string]: number };
  byCategory: { [key: string]: number };
}

// Skeleton Components
const SkeletonStatsCard: React.FC = () => (
  <IonCol size="6" sizeMd="3">
    <IonCard style={{ borderRadius: '12px', textAlign: 'center' }}>
      <IonCardContent>
        <IonSkeletonText animated style={{ width: '32px', height: '32px', margin: '0 auto 8px', borderRadius: '50%' }} />
        <IonSkeletonText animated style={{ width: '60%', height: '16px', margin: '0 auto 4px' }} />
        <IonSkeletonText animated style={{ width: '40%', height: '24px', margin: '0 auto' }} />
      </IonCardContent>
    </IonCard>
  </IonCol>
);

const SkeletonPriorityItem: React.FC = () => (
  <IonCol size="6" sizeMd="3">
    <div style={{
      padding: '12px',
      background: '#f8fafc',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <IonSkeletonText animated style={{ width: '50px', height: '20px', margin: '0 auto 8px', borderRadius: '10px' }} />
      <IonSkeletonText animated style={{ width: '30px', height: '24px', margin: '0 auto' }} />
    </div>
  </IonCol>
);

const SkeletonListItems: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '6px',
          marginBottom: '8px'
        }}
      >
        <IonSkeletonText animated style={{ width: '60%', height: '16px' }} />
        <IonSkeletonText animated style={{ width: '20px', height: '20px', borderRadius: '10px' }} />
      </div>
    ))}
  </>
);

const AdminAnalytics: React.FC = () => {
  const navigation = useIonRouter();
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const [showNewNotificationToast, setShowNewNotificationToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: reports } = await supabase
        .from('incident_reports')
        .select('id')
        .eq('read', false);
      const { data: feedback } = await supabase
        .from('feedback')
        .select('id')
        .eq('read', false);
      const newCount = (reports?.length || 0) + (feedback?.length || 0);
      if (newCount > prevUnreadCount && prevUnreadCount > 0) {
        setToastMessage("There's new notification/s! Check it out!");
        setShowNewNotificationToast(true);
      }
      setPrevUnreadCount(newCount);
      setUnreadCount(newCount);
    };

    fetchUnreadCount();

    const reportsChannel = supabase
      .channel('reports_unread_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_reports' }, () => fetchUnreadCount())
      .subscribe();
    const feedbackChannel = supabase
      .channel('feedback_unread_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => fetchUnreadCount())
      .subscribe();

    return () => {
      reportsChannel.unsubscribe();
      feedbackChannel.unsubscribe();
    };
  }, [prevUnreadCount]);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };

    checkDevice();
    setIsInitialLoading(false);
  }, []);

  useEffect(() => {
    setDefaultDates();
  }, [reportPeriod]);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    };

    checkDevice();
    setIsInitialLoading(false);
  }, []);

  useEffect(() => {
    setDefaultDates();
  }, [reportPeriod]);

  // Refresh data when page becomes active
  useIonViewWillEnter(() => {
    // Refresh unread count
    const refreshUnreadCount = async () => {
      const { data: reports } = await supabase
        .from('incident_reports')
        .select('id')
        .eq('read', false);
      const { data: feedback } = await supabase
        .from('feedback')
        .select('id')
        .eq('read', false);
      const newCount = (reports?.length || 0) + (feedback?.length || 0);
      setUnreadCount(newCount);
    };
    refreshUnreadCount();
  });

  const setDefaultDates = () => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = new Date();

    switch (reportPeriod) {
      case 'daily':
        start = today;
        break;
      case 'weekly':
        start.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(today.getMonth() - 3);
        break;
      case 'yearly':
        start.setFullYear(today.getFullYear() - 1);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end);
  };

  const [barangayFilter, setBarangayFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical' | 'prank'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [barangayOptions, setBarangayOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [generatedRows, setGeneratedRows] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const barangayChartRef = useRef<HTMLCanvasElement | null>(null);

  // Load distinct filter options (barangay, category)
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // All 22 barangays in Manolo Fortich
        const allBarangays = [
          'Agusan Canyon', 'Alae', 'Dahilayan', 'Dalirig', 'Damilag', 'Dicklum',
          'Guilang-guilang', 'Kalugmanan', 'Lindaban', 'Lingion', 'Lunocan', 'Maluko',
          'Mambatangan', 'Mampayag', 'Mantibugao', 'Minsuro', 'San Miguel', 'Sankanan',
          'Santiago', 'Santo Niño', 'Tankulan', 'Ticala'
        ];
        setBarangayOptions(allBarangays);
        
        const { data, error } = await supabase
          .from('incident_reports')
          .select('category')
          .order('created_at', { ascending: false });
        if (error) return;
        const categories = Array.from(new Set((data || []).map(r => r.category).filter(Boolean))).sort();
        setCategoryOptions(categories);
      } catch {}
    };
    loadFilterOptions();
  }, []);

  // Draw simple bar graph of barangay counts (top-to-bottom sorted)
  useEffect(() => {
    if (!reportData || !barangayChartRef.current) return;
    const canvas = barangayChartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const entries = Object.entries(reportData.byBarangay)
      .sort((a, b) => b[1] - a[1]);

    // Canvas sizing
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * dpr;
    const height = 320 * dpr; // fixed visual height
    canvas.width = width;
    canvas.height = height;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Layout
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const plotW = canvas.clientWidth - margin.left - margin.right;
    const plotH = 320 - margin.top - margin.bottom;

    // Data
    const labels = entries.map(e => e[0]);
    const values = entries.map(e => e[1]);
    const maxVal = Math.max(1, ...values);

    // Axis
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotH);
    ctx.lineTo(margin.left + plotW, margin.top + plotH);
    ctx.stroke();

    // Bars
    const barGap = 8;
    const barW = plotW / labels.length - barGap;
    labels.forEach((label, i) => {
      const x = margin.left + i * (barW + barGap) + barGap / 2;
      const h = (values[i] / maxVal) * (plotH - 10);
      const y = margin.top + plotH - h;
      // color
      ctx.fillStyle = i === 0 ? '#3b82f6' : '#94a3b8';
      ctx.fillRect(x, y, Math.max(2, barW), h);

      // value
      ctx.fillStyle = '#111827';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(values[i]), x + Math.max(2, barW) / 2, y - 4);

      // label (rotated if too many)
      ctx.save();
      ctx.translate(x + Math.max(2, barW) / 2, margin.top + plotH + 14);
      ctx.rotate(-Math.PI / 8);
      ctx.fillStyle = '#6b7280';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = '14px sans-serif';
    const title = '                         Barangay Reports (highest on left)';
    ctx.fillText(title, margin.left, 16);
  }, [reportData]);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      let query = supabase
        .from('incident_reports')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

      if (barangayFilter !== 'all') {
        query = query.eq('barangay', barangayFilter);
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const reportData: ReportData = {
          total: data.length,
          pending: data.filter(r => r.status === 'pending').length,
          active: data.filter(r => r.status === 'active').length,
          resolved: data.filter(r => r.status === 'resolved').length,
          byPriority: {
            low: data.filter(r => r.priority === 'low').length,
            medium: data.filter(r => r.priority === 'medium').length,
            high: data.filter(r => r.priority === 'high').length,
            critical: data.filter(r => r.priority === 'critical').length,
            prank: data.filter(r => r.priority === 'prank').length
          },
          byBarangay: {},
          byCategory: {}
        };

        data.forEach(report => {
          const barangay = report.barangay || 'Unknown';
          reportData.byBarangay[barangay] = (reportData.byBarangay[barangay] || 0) + 1;
        });

        data.forEach(report => {
          const category = report.category || 'Unknown';
          reportData.byCategory[category] = (reportData.byCategory[category] || 0) + 1;
        });

        setReportData(reportData);
        setGeneratedRows(data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async () => {
    if (!reportData) return;
  
    // Load SheetJS (UMD) from CDN if not already loaded
    const ensureSheetJs = () =>
      new Promise<void>((resolve, reject) => {
        if ((window as any).XLSX) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load SheetJS'));
        document.body.appendChild(script);
      });
  
    try {
      await ensureSheetJs();
    } catch (e) {
      console.error(e);
      return;
    }
  
    const XLSX = (window as any).XLSX;
  
    const summary = [
      ['Incident Report', reportPeriod.toUpperCase()],
      ['Period', `${startDate} to ${endDate}`],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Summary'],
      ['Total', reportData.total],
      ['Pending', reportData.pending],
      ['Active', reportData.active],
      ['Resolved', reportData.resolved],
    ];
  
    const priorities = [
      ['Priority', 'Count'],
      ['Critical', reportData.byPriority.critical],
      ['High', reportData.byPriority.high],
      ['Medium', reportData.byPriority.medium],
      ['Low', reportData.byPriority.low],
      ['Prank', reportData.byPriority.prank || 0],
    ];
  
    const barangays = [['Barangay', 'Count'], ...Object.entries(reportData.byBarangay).sort((a, b) => b[1] - a[1])];
    const categories = [['Category', 'Count'], ...Object.entries(reportData.byCategory).sort((a, b) => b[1] - a[1])];
  
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summary);
    const wsPriority = XLSX.utils.aoa_to_sheet(priorities);
    const wsBarangay = XLSX.utils.aoa_to_sheet(barangays);
    const wsCategory = XLSX.utils.aoa_to_sheet(categories);
  
    // Add applied filters section at top of Summary
    const appliedFilters = [
      [],
      ['Applied Filters'],
      ['Barangay', barangayFilter],
      ['Priority', priorityFilter],
      ['Status', statusFilter],
      ['Category', categoryFilter],
    ];
    XLSX.utils.sheet_add_aoa(wsSummary, appliedFilters, { origin: -1 });
  
    // Set column widths for readability
    wsSummary['!cols'] = [{ wch: 22 }, { wch: 36 }];
    wsPriority['!cols'] = [{ wch: 18 }, { wch: 12 }];
    wsBarangay['!cols'] = [{ wch: 24 }, { wch: 12 }];
    wsCategory['!cols'] = [{ wch: 24 }, { wch: 12 }];
  
    // Add Data sheet with filtered rows
    const headers = ['Title', 'Barangay', 'Category', 'Priority', 'Status', 'Created At', 'Resolved At'];
    const rows = (generatedRows || []).map(r => [
      r.title || '',
      r.barangay || '',
      r.category || '',
      r.priority || '',
      r.status || '',
      r.created_at ? new Date(r.created_at).toLocaleString() : '',
      r.resolved_at ? new Date(r.resolved_at).toLocaleString() : ''
    ]);
    const wsData = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    wsData['!cols'] = [
      { wch: 40 },
      { wch: 18 },
      { wch: 22 },
      { wch: 12 },
      { wch: 12 },
      { wch: 22 },
      { wch: 22 }
    ];
  
    // Build Barangay x Category pivot (detailed analysis)
    const categoriesSet = Array.from(new Set((generatedRows || []).map(r => r.category || 'Unknown'))).sort();
    const barangaySet = Array.from(new Set((generatedRows || []).map(r => r.barangay || 'Unknown'))).sort();
    const pivotHeader = ['Barangay', ...categoriesSet, 'Total'];
    const pivotBody = barangaySet.map(b => {
      const counts = categoriesSet.map(c =>
        (generatedRows || []).filter(r => (r.barangay || 'Unknown') === b && (r.category || 'Unknown') === c).length
      );
      const total = counts.reduce((a, v) => a + v, 0);
      return [b, ...counts, total];
    });
    const wsPivot = XLSX.utils.aoa_to_sheet([pivotHeader, ...pivotBody]);
    wsPivot['!cols'] = [{ wch: 24 }, ...categoriesSet.map(() => ({ wch: 10 })), { wch: 10 }];
  
    // ENHANCED: Build Detailed Per-Barangay Analysis Sheets
    const detailedBarangaySheets: { [key: string]: any } = {};
  
    barangaySet.forEach(barangay => {
      const barangayReports = (generatedRows || []).filter(r => (r.barangay || 'Unknown') === barangay);
      
      // Barangay Summary Sheet
      const barangaySummary = [
        [`Detailed Analysis: ${barangay}`],
        ['Period', `${startDate} to ${endDate}`],
        ['Total Reports', barangayReports.length],
        ['Pending', barangayReports.filter(r => r.status === 'pending').length],
        ['Active', barangayReports.filter(r => r.status === 'active').length],
        ['Resolved', barangayReports.filter(r => r.status === 'resolved').length],
        [],
        ['Priority Breakdown'],
        ['Critical', barangayReports.filter(r => r.priority === 'critical').length],
        ['High', barangayReports.filter(r => r.priority === 'high').length],
        ['Medium', barangayReports.filter(r => r.priority === 'medium').length],
        ['Low', barangayReports.filter(r => r.priority === 'low').length],
        ['Prank', barangayReports.filter(r => r.priority === 'prank').length],
        [],
        ['Category Breakdown'],
      ];
  
      // Add category breakdown
      const categoryBreakdown = categoriesSet.map(category => [
        category,
        barangayReports.filter(r => (r.category || 'Unknown') === category).length
      ]);
      barangaySummary.push(['Category', 'Count'], ...categoryBreakdown);
  
      // Create barangay summary sheet
      const wsBarangaySummary = XLSX.utils.aoa_to_sheet(barangaySummary);
      wsBarangaySummary['!cols'] = [{ wch: 25 }, { wch: 15 }];
  
      // Barangay Detailed Data Sheet
      const barangayDataHeaders = ['Title', 'Category', 'Priority', 'Status', 'Description', 'Created At', 'Resolved At', 'Location Details'];
      const barangayDataRows = barangayReports.map(r => [
        r.title || '',
        r.category || '',
        r.priority || '',
        r.status || '',
        r.description || '',
        r.created_at ? new Date(r.created_at).toLocaleString() : '',
        r.resolved_at ? new Date(r.resolved_at).toLocaleString() : '',
        r.location_details || ''
      ]);
  
      const wsBarangayData = XLSX.utils.aoa_to_sheet([barangayDataHeaders, ...barangayDataRows]);
      wsBarangayData['!cols'] = [
        { wch: 35 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 50 },
        { wch: 22 },
        { wch: 22 },
        { wch: 30 }
      ];
  
      // Store sheets for this barangay
      detailedBarangaySheets[`${barangay}_Summary`] = wsBarangaySummary;
      detailedBarangaySheets[`${barangay}_Data`] = wsBarangayData;
    });
  
    // Add all sheets to workbook
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, wsPriority, 'By Priority');
    XLSX.utils.book_append_sheet(wb, wsBarangay, 'By Barangay');
    XLSX.utils.book_append_sheet(wb, wsCategory, 'By Category');
    XLSX.utils.book_append_sheet(wb, wsData, 'All Data');
    XLSX.utils.book_append_sheet(wb, wsPivot, 'Barangay x Category');
  
    // Add detailed barangay sheets
    Object.entries(detailedBarangaySheets).forEach(([sheetName, sheet]) => {
      // Clean sheet name for Excel (max 31 chars, no special chars)
      const cleanSheetName = sheetName.replace(/[\\/*[\]:?]/g, '').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, sheet, cleanSheetName);
    });
  
    // Create a comprehensive barangay comparison sheet
    const comparisonHeader = [
      'Barangay',
      'Total Reports',
      'Pending',
      'Active',
      'Resolved',
      'Critical',
      'High',
      'Medium',
      'Low',
      'Prank',
      ...categoriesSet
    ];
  
    const comparisonRows = barangaySet.map(barangay => {
      const barangayReports = (generatedRows || []).filter(r => (r.barangay || 'Unknown') === barangay);
      
      return [
        barangay,
        barangayReports.length,
        barangayReports.filter(r => r.status === 'pending').length,
        barangayReports.filter(r => r.status === 'active').length,
        barangayReports.filter(r => r.status === 'resolved').length,
        barangayReports.filter(r => r.priority === 'critical').length,
        barangayReports.filter(r => r.priority === 'high').length,
        barangayReports.filter(r => r.priority === 'medium').length,
        barangayReports.filter(r => r.priority === 'low').length,
        barangayReports.filter(r => r.priority === 'prank').length,
        ...categoriesSet.map(category => 
          barangayReports.filter(r => (r.category || 'Unknown') === category).length
        )
      ];
    });
  
    const wsComparison = XLSX.utils.aoa_to_sheet([comparisonHeader, ...comparisonRows]);
    wsComparison['!cols'] = [
      { wch: 24 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      ...categoriesSet.map(() => ({ wch: 10 }))
    ];
  
    XLSX.utils.book_append_sheet(wb, wsComparison, 'Barangay Comparison');
  
    XLSX.writeFile(wb, `incident_report_${reportPeriod}_${startDate}_to_${endDate}.xlsx`);
  };

  // Show skeleton during initial load
  if (isInitialLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar style={{ '--background': 'var(--gradient-primary)', '--color': 'white' } as any}>
            <IonButtons slot="start">
              <IonSkeletonText animated style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </IonButtons>
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
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                  <IonSkeletonText animated style={{ width: '80%', height: '16px', margin: '0 auto' }} />
                </div>
              ))}
            </div>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#f8fafc' } as any}>
          <div style={{ padding: '20px' }}>
            <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
              <IonCardContent>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <IonSkeletonText animated style={{ width: '24px', height: '24px' }} />
                  <IonSkeletonText animated style={{ width: '150px', height: '20px' }} />
                </div>

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

                <IonSkeletonText animated style={{ width: '100%', height: '48px', borderRadius: '12px', marginTop: '16px' }} />
              </IonCardContent>
            </IonCard>

            <IonCard style={{ borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
              <IonCardContent>
                <IonSkeletonText animated style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%' }} />
                <IonSkeletonText animated style={{ width: '200px', height: '20px', margin: '0 auto 8px' }} />
                <IonSkeletonText animated style={{ width: '300px', height: '14px', margin: '0 auto' }} />
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Show mobile restriction
  if (isMobileDevice) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '400px', padding: '40px 20px' }}>
            <IonIcon
              icon={desktopOutline}
              style={{ fontSize: '64px', color: '#667eea', marginBottom: '20px' }}
            />
            <IonText>
              <h2 style={{ color: '#2d3748', marginBottom: '16px' }}>
                Admin Access Restricted
              </h2>
              <p style={{ color: '#718096', lineHeight: '1.6' }}>
                This analytics page is only accessible by an admin.
              </p>
            </IonText>
            <IonButton
              onClick={() => navigation.push('/iAMUMAta')}
              style={{ marginTop: '20px' }}
            >
              Return to Home
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--gradient-primary)', '--color': 'white' } as any}>
          <IonTitle style={{ fontWeight: 'bold' }}>iAMUMA ta - Analytics & Reports</IonTitle>
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
                  if (user?.email) {
                    await supabase.from('system_logs').insert({
                      admin_email: user.email,
                      activity_type: 'logout',
                      activity_description: 'Admin logged out',
                      details: { source: 'AdminAnalytics' }
                    });
                  }
                } finally {
                  await supabase.auth.signOut();
                  navigation.push('/iAMUMAta', 'root', 'replace');
                }
              }}
              style={{ color: 'white' }}
            >
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        <IonToolbar style={{ '--background': 'white' } as any}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: statsChartOutline, route: '/iAMUMAta/admin-dashboard' },
              { id: 'incidents', label: 'Incidents', icon: alertCircleOutline, route: '/iAMUMAta/admin/incidents' },
              { id: 'users', label: 'Users', icon: peopleOutline, route: '/iAMUMAta/admin/users' },
              { id: 'analytics', label: 'Analytics', icon: documentTextOutline, route: '/iAMUMAta/admin/analytics' },
              { id: 'systemlogs', label: 'System Logs', icon: documentTextOutline, route: '/iAMUMAta/admin/system-logs' }
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
                  '--color': menu.id === 'analytics' ? '#3b82f6' : '#6b7280',
                  '--background': 'transparent',
                  '--border-radius': '0',
                  borderBottom: menu.id === 'analytics' ? '2px solid #3b82f6' : '2px solid transparent',
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
      <IonContent style={{ '--background': '#f8fafc' } as any}>
        <div style={{ padding: '20px' }}>
          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <IonIcon icon={calendarOutline} style={{ fontSize: '24px', color: '#3b82f6' }} />
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Generate Report</h2>
              </div>

              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="4">
                    <IonItem>
                      <IonLabel position="stacked">Report Period</IonLabel>
                      <IonSelect
                        value={reportPeriod}
                        onIonChange={e => setReportPeriod(e.detail.value)}
                      >
                        <IonSelectOption value="daily">Daily</IonSelectOption>
                        <IonSelectOption value="weekly">Weekly</IonSelectOption>
                        <IonSelectOption value="monthly">Monthly</IonSelectOption>
                        <IonSelectOption value="quarterly">Quarterly</IonSelectOption>
                        <IonSelectOption value="yearly">Yearly</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="8">
                    <IonItem>
                      <IonLabel position="stacked">Date Created</IonLabel>
                      <div
                        onClick={() => setShowDatePicker(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          padding: '12px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          cursor: 'pointer',
                          color: '#374151',
                          fontSize: '14px'
                        }}
                      >
                        <IonIcon icon={calendarOutline} style={{ marginRight: '8px', fontSize: '18px', color: '#6b7280' }} />
                        <span style={{ flex: 1 }}>
                          {startDate && endDate
                            ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : 'Select date range'}
                        </span>
                        <IonIcon icon={arrowBackOutline} style={{ fontSize: '16px', color: '#9ca3af', transform: 'rotate(-90deg)' }} />
                      </div>
                    </IonItem>
                    <IonPopover
                      isOpen={showDatePicker}
                      onDidDismiss={() => setShowDatePicker(false)}
                      style={{ '--width': '600px', '--max-width': '90vw' } as any}
                    >
                      <IonContent>
                        <div style={{ padding: '16px' }}>
                          <IonGrid>
                            <IonRow>
                              <IonCol size="6">
                                <IonItem>
                                  <IonLabel position="stacked">Start Date</IonLabel>
                                  <IonDatetime
                                    presentation="date"
                                    value={startDate}
                                    onIonChange={(e) => {
                                      const value = e.detail.value as string;
                                      if (value) setStartDate(value.split('T')[0]);
                                    }}
                                  />
                                </IonItem>
                              </IonCol>
                              <IonCol size="6">
                                <IonItem>
                                  <IonLabel position="stacked">End Date</IonLabel>
                                  <IonDatetime
                                    presentation="date"
                                    value={endDate}
                                    onIonChange={(e) => {
                                      const value = e.detail.value as string;
                                      if (value) setEndDate(value.split('T')[0]);
                                    }}
                                  />
                                </IonItem>
                              </IonCol>
                            </IonRow>
                          </IonGrid>
                          <IonButton expand="block" onClick={() => setShowDatePicker(false)} style={{ marginTop: '16px' }}>
                            Done
                          </IonButton>
                        </div>
                      </IonContent>
                    </IonPopover>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="3">
                    <IonItem>
                      <IonLabel position="stacked">Barangay</IonLabel>
                      <IonSelect
                        value={barangayFilter}
                        onIonChange={e => setBarangayFilter(e.detail.value)}
                      >
                        <IonSelectOption value="all">All</IonSelectOption>
                        {barangayOptions.map((b) => (
                          <IonSelectOption key={b} value={b}>{b}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCol>

                  <IonCol size="12" sizeMd="3">
                    <IonItem>
                      <IonLabel position="stacked">Priority</IonLabel>
                      <IonSelect
                        value={priorityFilter}
                        onIonChange={e => setPriorityFilter(e.detail.value)}
                      >
                        <IonSelectOption value="all">All</IonSelectOption>
                        <IonSelectOption value="critical">Critical</IonSelectOption>
                        <IonSelectOption value="high">High</IonSelectOption>
                        <IonSelectOption value="medium">Medium</IonSelectOption>
                        <IonSelectOption value="low">Low</IonSelectOption>
                        <IonSelectOption value="prank">Prank</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>

                  <IonCol size="12" sizeMd="3">
                    <IonItem>
                      <IonLabel position="stacked">Status</IonLabel>
                      <IonSelect
                        value={statusFilter}
                        onIonChange={e => setStatusFilter(e.detail.value)}
                      >
                        <IonSelectOption value="all">All</IonSelectOption>
                        <IonSelectOption value="pending">Pending</IonSelectOption>
                        <IonSelectOption value="active">Active</IonSelectOption>
                        <IonSelectOption value="resolved">Resolved</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>

                  <IonCol size="12" sizeMd="3">
                    <IonItem>
                      <IonLabel position="stacked">Category</IonLabel>
                      <IonSelect
                        value={categoryFilter}
                        onIonChange={e => setCategoryFilter(e.detail.value)}
                      >
                        <IonSelectOption value="all">All</IonSelectOption>
                        {categoryOptions.map((c) => (
                          <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>

              <IonButton
                expand="block"
                onClick={generateReport}
                disabled={isGenerating || !startDate || !endDate}
                style={{ marginTop: '16px' }}
              >
                {isGenerating ? (
                  <>
                    <IonSpinner name="circular" style={{ marginRight: '8px' }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <IonIcon icon={statsChartOutline} slot="start" />
                    Generate Report
                  </>
                )}
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Show skeleton while generating report */}
          {isGenerating && (
            <>
              <IonGrid>
                <IonRow>
                  <SkeletonStatsCard />
                  <SkeletonStatsCard />
                  <SkeletonStatsCard />
                  <SkeletonStatsCard />
                </IonRow>
              </IonGrid>

              <IonCard style={{ borderRadius: '16px', marginBottom: '20px', marginTop: '20px' }}>
                <IonCardContent>
                  <IonSkeletonText animated style={{ width: '120px', height: '18px', marginBottom: '16px' }} />
                  <IonGrid>
                    <IonRow>
                      <SkeletonPriorityItem />
                      <SkeletonPriorityItem />
                      <SkeletonPriorityItem />
                      <SkeletonPriorityItem />
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>

              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardContent>
                  <IonSkeletonText animated style={{ width: '140px', height: '18px', marginBottom: '16px' }} />
                  <SkeletonListItems count={6} />
                </IonCardContent>
              </IonCard>

              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardContent>
                  <IonSkeletonText animated style={{ width: '130px', height: '18px', marginBottom: '16px' }} />
                  <SkeletonListItems count={4} />
                </IonCardContent>
              </IonCard>

              <IonSkeletonText animated style={{ width: '100%', height: '48px', borderRadius: '12px' }} />
            </>
          )}

          {/* Report Results - Only show when not generating */}
          {reportData && !isGenerating && generatedRows.length > 0 && (
            <>
              {/* Barangay bar graph (shown for any period, primarily helpful for monthly) */}
              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardContent>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    Barangay Reports Bar Graph
                  </h3>
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <canvas ref={barangayChartRef} style={{ width: '100%', height: '320px', display: 'block' }} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                    Tip: Highest total appears on the left. Use filters above to refine by month and other criteria.
                  </div>
                </IonCardContent>
              </IonCard>
              {/* Barangay Cards with Detailed Breakdown - 3 per row */}
              <IonGrid>
                <IonRow>
                  {Object.keys(reportData.byBarangay)
                    .sort((a, b) => a.localeCompare(b))
                    .map((barangay) => {
                      const barangayReports = generatedRows.filter(r => (r.barangay || 'Unknown') === barangay);
                      const totalReports = barangayReports.length;
                      const statusCounts = {
                        pending: barangayReports.filter(r => r.status === 'pending').length,
                        active: barangayReports.filter(r => r.status === 'active').length,
                        resolved: barangayReports.filter(r => r.status === 'resolved').length
                      };
                      const priorityCounts = {
                        critical: barangayReports.filter(r => r.priority === 'critical').length,
                        high: barangayReports.filter(r => r.priority === 'high').length,
                        medium: barangayReports.filter(r => r.priority === 'medium').length,
                        low: barangayReports.filter(r => r.priority === 'low').length
                      };
                      const categoryCounts: { [key: string]: number } = {};
                      barangayReports.forEach(r => {
                        const cat = r.category || 'Others';
                        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                      });

                      // Show all categories, even if 0
                      const allCategories = categoryOptions.length > 0 ? categoryOptions : ['Road Incidents', 'Utility Issues', 'Natural Disasters', 'Infrastructure Problems', 'Public Safety', 'Environmental Issues', 'Others'];

                      return (
                        <IonCol key={barangay} size="12" sizeMd="4">
                          <IonCard style={{ borderRadius: '16px', marginBottom: '20px', height: '100%' }}>
                            <IonCardContent>
                              {/* Barangay Header */}
                              <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                                {barangay} ({totalReports})
                              </h2>

                              {/* Status Section */}
                              <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                                  Status ({totalReports})
                                </h3>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>pending</span>
                                    <IonBadge color="warning" style={{ fontSize: '12px' }}>{statusCounts.pending}</IonBadge>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>active</span>
                                    <IonBadge color="primary" style={{ fontSize: '12px' }}>{statusCounts.active}</IonBadge>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>resolved</span>
                                    <IonBadge color="success" style={{ fontSize: '12px' }}>{statusCounts.resolved}</IonBadge>
                                  </div>
                                </div>
                              </div>

                              {/* Priority Section */}
                              <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                                  Priority ({totalReports})
                                </h3>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>critical</span>
                                    <IonBadge color="danger" style={{ fontSize: '12px' }}>{priorityCounts.critical}</IonBadge>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>high</span>
                                    <IonBadge color="warning" style={{ fontSize: '12px' }}>{priorityCounts.high}</IonBadge>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>medium</span>
                                    <IonBadge color="primary" style={{ fontSize: '12px' }}>{priorityCounts.medium}</IonBadge>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>low</span>
                                    <IonBadge color="success" style={{ fontSize: '12px' }}>{priorityCounts.low}</IonBadge>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#6b7280' }}>prank</span>
                                    <IonBadge color="medium" style={{ fontSize: '12px' }}>{barangayReports.filter(r => r.priority === 'prank').length}</IonBadge>
                                  </div>
                                </div>
                              </div>

                              {/* Category Section - Show all categories even if 0 */}
                              <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                                  Category ({totalReports})
                                </h3>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                  {allCategories
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((category) => {
                                      const count = categoryCounts[category] || 0;
                                      return (
                                        <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                          <span style={{ fontSize: '14px', color: '#6b7280' }}>{category}</span>
                                          <IonBadge color="secondary" style={{ fontSize: '12px' }}>{count}</IonBadge>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </IonCardContent>
                          </IonCard>
                        </IonCol>
                      );
                    })}
                </IonRow>
              </IonGrid>

              <IonButton
                expand="block"
                onClick={downloadReport}
                color="success"
                style={{ marginTop: '20px' }}
              >
                <IonIcon icon={downloadOutline} slot="start" />
                Download Report
              </IonButton>
            </>
          )}

          {/* Empty State - Only show when not generating and no data */}
          {!reportData && !isGenerating && (
            <IonCard style={{ borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
              <IonCardContent>
                <IonIcon icon={documentTextOutline} style={{ fontSize: '64px', color: '#d1d5db', marginBottom: '16px' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', margin: '0 0 8px 0' }}>
                  No Report Generated
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Select a period and generate a report to view analytics
                </p>
              </IonCardContent>
            </IonCard>
          )}
        <IonToast
          isOpen={showNewNotificationToast}
          onDidDismiss={() => setShowNewNotificationToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminAnalytics;

function setShowToast(arg0: boolean) {
  throw new Error('Function not implemented.');
}