import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { medicalAPI } from '../../services/api';

export default function MedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    medicalAPI.getPatientRecords(user.userId).then(res => {
      setRecords(res.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">Medical Records</h3>
        <p className="text-muted">View your health records and prescriptions</p>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-file-earmark-text d-block" />
          <h5>No medical records yet</h5>
          <p>Your consultation records will appear here after your doctor visit</p>
        </div>
      ) : (
        <div className="row g-4">
          {records.map(r => (
            <div key={r.id} className="col-lg-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between">
                  <small className="fw-bold">{r.recordDate}</small>
                  <small className="text-muted">Dr. ID: {r.doctorId}</small>
                </div>
                <div className="card-body">
                  <div className="mb-2"><strong>Symptoms:</strong> <span className="text-muted">{r.symptoms}</span></div>
                  <div className="mb-2"><strong>Diagnosis:</strong> <span className="text-muted">{r.diagnosis}</span></div>
                  {r.medicines && r.medicines.length > 0 && (
                    <div className="mb-2">
                      <strong>Medicines:</strong>
                      <ul className="list-unstyled ms-2 mt-1">
                        {r.medicines.map((m, i) => (
                          <li key={i} className="text-muted" style={{fontSize:13}}>
                            <i className="bi bi-capsule me-1 text-primary" />{m.name} — {m.dosage} ({m.duration})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {r.notes && <div className="mb-2"><strong>Notes:</strong> <span className="text-muted">{r.notes}</span></div>}
                  {r.recommendations && <div className="mb-2"><strong>Recommendations:</strong> <span className="text-muted">{r.recommendations}</span></div>}
                  {r.followUpDate && <div><strong>Follow-up:</strong> <span className="text-muted">{r.followUpDate}</span></div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
