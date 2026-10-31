import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { doctorAPI, adminAPI } from '../../services/api';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState(null);

  useEffect(() => { loadDoctors(); }, []);

  const loadDoctors = async () => {
    try { const res = await doctorAPI.list(); setDoctors(res.data.data || []); } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    if (!csvFile) { alert('Please choose a CSV file first.'); return; }
    const formData = new FormData();
    formData.append('file', csvFile);
    setImporting(true); setImportReport(null);
    try {
      const res = await adminAPI.importDoctorsCsv(formData);
      setImportReport(res.data);
      await loadDoctors();
    } catch (err) {
      setImportReport(err.response?.data || { message: err.message || 'Import failed', failed: 1 });
    } finally { setImporting(false); }
  };

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">Doctor Management</h3>
        <p className="text-muted">Manage doctor profiles and availability</p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h5 className="fw-bold"><i className="bi bi-file-earmark-spreadsheet me-2" />Import doctors from dataset</h5>
          <p className="text-muted small mb-3">Upload the supplied doctors CSV. Existing doctors are matched by email, so importing the same file again will update rather than duplicate records. This dataset contains fictional demo profiles.</p>
          <form onSubmit={handleCsvImport} className="d-flex flex-column flex-md-row gap-2 align-items-md-end">
            <div className="flex-grow-1"><label className="form-label">Doctor CSV file</label><input className="form-control" type="file" accept=".csv,text/csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} required /></div>
            <button className="btn btn-primary" type="submit" disabled={importing}>{importing ? <><span className="spinner-border spinner-border-sm me-2" />Importing...</> : 'Upload and Import'}</button>
          </form>
          {importReport && <div className={`alert mt-3 mb-0 ${Number(importReport.failed || 0) > 0 ? 'alert-warning' : 'alert-success'}`}>
            <strong>{importReport.message || 'Import completed'}</strong>
            {importReport.imported !== undefined && <div>Imported/updated: {importReport.imported} · Failed rows: {importReport.failed || 0}</div>}
            {importReport.errors?.length > 0 && <ul className="mb-0 mt-2">{importReport.errors.slice(0, 8).map((err, i) => <li key={i}>Line {err.line}: {err.message}</li>)}</ul>}
          </div>}
        </div>
      </div>

      <div className="row g-4">
        {doctors.map(d => (
          <div key={d.profile?.id} className="col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex gap-3">
                  <div className="bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center" style={{width:56,height:56}}>
                    <i className="bi bi-heart-pulse fs-4" />
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-0">{d.user?.fullName}</h6>
                    <small className="text-primary fw-medium">{d.profile?.specialization}</small>
                    <div className="row mt-2" style={{fontSize:12}}>
                      <div className="col-6"><span className="text-muted">Dept:</span> {d.profile?.department}</div>
                      <div className="col-6"><span className="text-muted">Room:</span> {d.profile?.room}</div>
                      <div className="col-6"><span className="text-muted">Exp:</span> {d.profile?.experience} yrs</div>
                      <div className="col-12"><span className="text-muted">Qualification:</span> {d.profile?.qualification}</div>
                      <div className="col-6"><span className="text-muted">Max/day:</span> {d.profile?.maxDailyAppointments}</div>
                      <div className="col-6"><span className="text-muted">Consult:</span> {d.profile?.averageConsultationTime} min</div>
                      <div className="col-6"><span className="text-muted">Hours:</span> {d.profile?.workingHoursStart?.substring(0,5)} - {d.profile?.workingHoursEnd?.substring(0,5)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {doctors.length === 0 && <div className="col-12 empty-state"><i className="bi bi-heart-pulse d-block" /><h5>No doctors found</h5></div>}
      </div>
    </Layout>
  );
}
