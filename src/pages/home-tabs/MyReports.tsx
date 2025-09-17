// src/pages/user-tabs/MyReports.tsx
import React, { useState, useEffect } from 'react';
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
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonAlert,
  IonToast,
  IonActionSheet,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonSegment,
  IonSegmentButton
} from '@ionic/react';
import {
  listOutline,
  eyeOutline,
  createOutline,
  trashOutline,
  timeOutline,
  locationOutline,
  closeCircle,
  checkmarkCircleOutline,
  alertCircleOutline,
  warningOutline,
  ellipsisVerticalOutline,
  refreshOutline,
  addOutline
} from 'ionicons/icons';
import { supabase } from '../../utils/supabaseClient';

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
  reporter_email?: string | null; // Add this field
}

const MyReports: React.FC = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<UserReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');

  // Edit form state
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: '',
    barangay: ''
  });

  const hazardCategories = [
    'Road Hazards',
    'Utility Issues', 
    'Natural Disasters',
    'Infrastructure Problems',
    'Public Safety',
    'Environmental Issues',
    'Others'
  ];

  const barangayList = [
    'Damilag', 'Lindaban', 'Alae', 'Maluko', 'Daliring', 
    'Poblacion', 'San Miguel', 'Tankulan', 'Agusan Canyon'
  ];

  useEffect(() => {
    fetchUserReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filter, sortBy]);

  const fetchUserReports = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // FIXED: Query for reports where reporter_email matches user email OR is null (anonymous)
      const { data, error } = await supabase
        .from('hazard_reports')
        .select('*')
        .or(`reporter_email.eq.${user.email},reporter_email.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching user reports:', error);
      setToastMessage('Failed to load your reports');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = reports;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(report => report.status === filter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

    setFilteredReports(filtered);
  };

  const openReportActions = (report: UserReport) => {
    setSelectedReport(report);
    setShowActionSheet(true);
  };

  const viewReport = (report: UserReport) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const editReport = (report: UserReport) => {
    if (report.status !== 'pending') {
      setToastMessage('Only pending reports can be edited');
      setShowToast(true);
      return;
    }

    setSelectedReport(report);
    setEditData({
      title: report.title,
      description: report.description,
      category: report.category,
      priority: report.priority,
      location: report.location,
      barangay: report.barangay
    });
    setShowEditModal(true);
  };

  const updateReport = async () => {
    if (!selectedReport) return;

    try {
      const { error } = await supabase
        .from('hazard_reports')
        .update({
          title: editData.title,
          description: editData.description,
          category: editData.category,
          priority: editData.priority,
          location: editData.location,
          barangay: editData.barangay,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      setToastMessage('Report updated successfully');
      setShowToast(true);
      setShowEditModal(false);
      fetchUserReports();
    } catch (error) {
      setToastMessage('Failed to update report');
      setShowToast(true);
    }
  };

  const deleteReport = async () => {
    if (!selectedReport) return;

    if (selectedReport.status !== 'pending') {
      setToastMessage('Only pending reports can be deleted');
      setShowToast(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('hazard_reports')
        .delete()
        .eq('id', selectedReport.id);

      if (error) throw error;

      setToastMessage('Report deleted successfully');
      setShowToast(true);
      setShowDeleteAlert(false);
      fetchUserReports();
    } catch (error) {
      setToastMessage('Failed to delete report');
      setShowToast(true);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return checkmarkCircleOutline;
      case 'investigating': return alertCircleOutline;
      case 'pending': return timeOutline;
      default: return warningOutline;
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchUserReports();
    event.detail.complete();
  };

  const getStatusCounts = () => {
    return {
      all: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      investigating: reports.filter(r => r.status === 'investigating').length,
      resolved: reports.filter(r => r.status === 'resolved').length
    };
  };

  const counts = getStatusCounts();

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
                    My Reports
                  </IonCardTitle>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {reports.length} total reports
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <IonButton fill="clear" onClick={fetchUserReports}>
                  <IonIcon icon={refreshOutline} color="primary" />
                </IonButton>
                <IonButton fill="clear" routerLink="/it35-lab2/app/home/submit">
                  <IonIcon icon={addOutline} color="primary" />
                </IonButton>
              </div>
            </div>
          </IonCardHeader>
        </IonCard>

        {/* Status Filter Tabs */}
        <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
          <IonCardContent style={{ padding: '16px' }}>
            <IonSegment 
              value={filter} 
              onIonChange={e => setFilter(e.detail.value as any)}
            >
              <IonSegmentButton value="all">
                <IonLabel>
                  All ({counts.all})
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="pending">
                <IonLabel>
                  Pending ({counts.pending})
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="investigating">
                <IonLabel>
                  Active ({counts.investigating})
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="resolved">
                <IonLabel>
                  Resolved ({counts.resolved})
                </IonLabel>
              </IonSegmentButton>
            </IonSegment>

            <div style={{ marginTop: '16px' }}>
              <IonSelect
                value={sortBy}
                onIonChange={e => setSortBy(e.detail.value)}
                interface="popover"
                placeholder="Sort by..."
              >
                <IonSelectOption value="newest">Newest First</IonSelectOption>
                <IonSelectOption value="oldest">Oldest First</IonSelectOption>
                <IonSelectOption value="priority">Priority Level</IonSelectOption>
              </IonSelect>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Reports List */}
        {isLoading ? (
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
              <IonIcon icon={refreshOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading your reports...</p>
            </IonCardContent>
          </IonCard>
        ) : filteredReports.length === 0 ? (
          <IonCard style={{ borderRadius: '16px' }}>
            <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
              <IonIcon icon={listOutline} style={{ fontSize: '48px', color: '#d1d5db' }} />
              <p style={{ color: '#9ca3af', marginTop: '16px', marginBottom: '20px' }}>
                {filter === 'all' ? 'No reports submitted yet' : `No ${filter} reports found`}
              </p>
              {filter === 'all' && (
                <IonButton routerLink="/it35-lab2/app/home/submit">
                  <IonIcon icon={addOutline} slot="start" />
                  Submit First Report
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList style={{ background: 'transparent' }}>
            {filteredReports.map((report) => (
              <IonCard key={report.id} style={{
                borderRadius: '16px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <IonCardContent style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      {/* Status and Priority */}
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
                          <IonIcon icon={getStatusIcon(report.status)} style={{ marginRight: '4px' }} />
                          {report.status.toUpperCase()}
                        </IonChip>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: getPriorityColor(report.priority)
                        }}></div>
                        <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>
                          {report.priority}
                        </span>
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
                          Reported {new Date(report.created_at).toLocaleDateString()}
                          {report.updated_at !== report.created_at && (
                            <span> • Updated {new Date(report.updated_at).toLocaleDateString()}</span>
                          )}
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

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <IonButton 
                          size="small" 
                          fill="outline"
                          onClick={() => viewReport(report)}
                        >
                          <IonIcon icon={eyeOutline} slot="start" />
                          View
                        </IonButton>
                        {report.status === 'pending' && (
                          <>
                            <IonButton 
                              size="small" 
                              fill="outline"
                              color="secondary"
                              onClick={() => editReport(report)}
                            >
                              <IonIcon icon={createOutline} slot="start" />
                              Edit
                            </IonButton>
                            <IonButton 
                              size="small" 
                              fill="outline"
                              color="danger"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowDeleteAlert(true);
                              }}
                            >
                              <IonIcon icon={trashOutline} slot="start" />
                              Delete
                            </IonButton>
                          </>
                        )}
                      </div>
                    </div>

                    {/* More Actions */}
                    <IonButton 
                      fill="clear" 
                      size="small"
                      onClick={() => openReportActions(report)}
                    >
                      <IonIcon icon={ellipsisVerticalOutline} />
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
        <IonContent>
          {selectedReport && (
            <div style={{ padding: '20px' }}>
              {/* Report Header */}
              <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
                    <IonChip 
                      style={{
                        '--background': getStatusColor(selectedReport.status) + '20',
                        '--color': getStatusColor(selectedReport.status),
                        fontWeight: '600'
                      } as any}
                    >
                      <IonIcon icon={getStatusIcon(selectedReport.status)} style={{ marginRight: '4px' }} />
                      {selectedReport.status.toUpperCase()}
                    </IonChip>
                    <IonChip 
                      style={{
                        '--background': getPriorityColor(selectedReport.priority) + '20',
                        '--color': getPriorityColor(selectedReport.priority),
                        fontWeight: '600'
                      } as any}
                    >
                      {selectedReport.priority.toUpperCase()} PRIORITY
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
                  
                  <div style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <p style={{ 
                      color: '#374151', 
                      lineHeight: '1.6',
                      margin: 0,
                      fontSize: '15px'
                    }}>
                      {selectedReport.description}
                    </p>
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Images */}
              {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
                <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                  <IonCardHeader>
                    <IonCardTitle>Evidence Photos</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        {selectedReport.image_urls.map((url, index) => (
                          <IonCol key={index} size="6">
                            <img 
                              src={url} 
                              alt={`Report evidence ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                cursor: 'pointer'
                              }}
                            />
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Admin Response */}
              {selectedReport.admin_response && (
                <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
                  <IonCardHeader>
                    <IonCardTitle style={{ color: '#075985' }}>LDRRMO Response</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <p style={{
                        fontSize: '15px',
                        color: '#0c4a6e',
                        margin: 0,
                        lineHeight: '1.6'
                      }}>{selectedReport.admin_response}</p>
                      {selectedReport.resolved_at && (
                        <p style={{
                          fontSize: '12px',
                          color: '#0369a1',
                          margin: '12px 0 0 0',
                          fontStyle: 'italic'
                        }}>
                          Response provided on {new Date(selectedReport.resolved_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Report Details */}
              <IonCard style={{ borderRadius: '16px' }}>
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
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Priority Level</p>
                        <p style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: getPriorityColor(selectedReport.priority), 
                          margin: '0 0 16px 0',
                          textTransform: 'uppercase'
                        }}>
                          {selectedReport.priority}
                        </p>
                      </IonCol>
                    </IonRow>
                    {selectedReport.coordinates && (
                      <IonRow>
                        <IonCol size="12">
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>GPS Coordinates</p>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontFamily: 'monospace' }}>
                            {selectedReport.coordinates.lat.toFixed(6)}, {selectedReport.coordinates.lng.toFixed(6)}
                          </p>
                        </IonCol>
                      </IonRow>
                    )}
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Edit Report Modal */}
      <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
        <IonContent>
          <div style={{ padding: '20px' }}>
            <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
              <IonCardHeader>
                <IonCardTitle>Report Details</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
                  <IonLabel position="stacked">Title</IonLabel>
                  <IonInput
                    value={editData.title}
                    onIonChange={e => setEditData(prev => ({...prev, title: e.detail.value!}))}
                    maxlength={100}
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
                  <IonLabel position="stacked">Category</IonLabel>
                  <IonSelect
                    value={editData.category}
                    onIonChange={e => setEditData(prev => ({...prev, category: e.detail.value}))}
                    interface="popover"
                  >
                    {hazardCategories.map(category => (
                      <IonSelectOption key={category} value={category}>{category}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
                  <IonLabel position="stacked">Priority</IonLabel>
                  <IonSelect
                    value={editData.priority}
                    onIonChange={e => setEditData(prev => ({...prev, priority: e.detail.value}))}
                    interface="popover"
                  >
                    <IonSelectOption value="low">Low</IonSelectOption>
                    <IonSelectOption value="medium">Medium</IonSelectOption>
                    <IonSelectOption value="high">High</IonSelectOption>
                    <IonSelectOption value="critical">Critical</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
                  <IonLabel position="stacked">Barangay</IonLabel>
                  <IonSelect
                    value={editData.barangay}
                    onIonChange={e => setEditData(prev => ({...prev, barangay: e.detail.value}))}
                    interface="popover"
                  >
                    {barangayList.map(barangay => (
                      <IonSelectOption key={barangay} value={barangay}>{barangay}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                <IonItem style={{ '--border-radius': '12px', marginBottom: '12px' } as any}>
                  <IonLabel position="stacked">Location</IonLabel>
                  <IonInput
                    value={editData.location}
                    onIonChange={e => setEditData(prev => ({...prev, location: e.detail.value!}))}
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px', marginBottom: '20px' } as any}>
                  <IonLabel position="stacked">Description</IonLabel>
                  <IonTextarea
                    value={editData.description}
                    onIonChange={e => setEditData(prev => ({...prev, description: e.detail.value!}))}
                    rows={4}
                    maxlength={500}
                  />
                </IonItem>

                <IonButton 
                  expand="block"
                  onClick={updateReport}
                  style={{
                    '--border-radius': '12px',
                    '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '--color': 'white',
                    marginBottom: '12px'
                  } as any}
                >
                  <IonIcon icon={checkmarkCircleOutline} slot="start" />
                  Update Report
                </IonButton>

                <IonButton 
                  expand="block"
                  fill="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonModal>

      {/* Action Sheet */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header="Report Actions"
        buttons={[
          {
            text: 'View Details',
            icon: eyeOutline,
            handler: () => {
              if (selectedReport) viewReport(selectedReport);
            }
          },
          {
            text: 'Edit Report',
            icon: createOutline,
            handler: () => {
              if (selectedReport) editReport(selectedReport);
            }
          },
          {
            text: 'Delete Report',
            icon: trashOutline,
            role: 'destructive',
            handler: () => {
              setShowDeleteAlert(true);
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />

      {/* Delete Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Delete',
            handler: deleteReport
          }
        ]}
      />

      {/* Toast */}
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

export default MyReports;