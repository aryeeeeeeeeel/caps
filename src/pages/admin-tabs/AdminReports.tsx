import React from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton
} from '@ionic/react';


const AdminReports: React.FC = () => {
  const [reports, setReports] = React.useState([
    { id: 1, title: 'Fallen Tree', status: 'pending', location: 'Main Street', description: 'Large tree blocking the road' },
    { id: 2, title: 'Power Outage', status: 'active', location: 'Downtown', description: 'No electricity in the area' },
    { id: 3, title: 'Water Leak', status: 'resolved', location: 'Park Avenue', description: 'Broken water pipe' }
  ]);
  const [editingReport, setEditingReport] = React.useState<number | null>(null);
  const [editForm, setEditForm] = React.useState({ title: '', description: '' });

  const handleStatusChange = (id: number, newStatus: string) => {
    setReports(reports.map(report => 
      report.id === id ? { ...report, status: newStatus } : report
    ));
  };

  const startEditing = (id: number) => {
    const report = reports.find(r => r.id === id);
    if (report) {
      setEditingReport(id);
      setEditForm({ title: report.title, description: report.description || '' });
    }
  };

  const saveEdit = () => {
    if (editingReport) {
      setReports(reports.map(report => 
        report.id === editingReport 
          ? { ...report, title: editForm.title, description: editForm.description } 
          : report
      ));
      setEditingReport(null);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Reports</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{padding: '16px'}}>
          {reports.map(report => (
            <IonCard key={report.id} style={{marginBottom: '16px', padding: '16px'}}>
              {editingReport === report.id ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  <input 
                    type="text" 
                    value={editForm.title} 
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  />
                  <textarea 
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  />
                  <button onClick={saveEdit}>Save</button>
                  <button onClick={() => setEditingReport(null)}>Cancel</button>
                </div>
              ) : (
                <IonCardContent>
                  <h3>{report.title}</h3>
                  <p>Location: {report.location}</p>
                  <p>Description: {report.description}</p>
                  <div style={{marginTop: '16px', display: 'flex', gap: '8px'}}>
                    <select 
                      value={report.status} 
                      onChange={(e) => handleStatusChange(report.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button onClick={() => startEditing(report.id)}>Edit</button>
                  </div>
                </IonCardContent>
              )}
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminReports;