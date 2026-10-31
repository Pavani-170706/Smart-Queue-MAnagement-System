import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { doctorAPI } from '../../services/api';

export default function DoctorSearch() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docRes, specRes, deptRes] = await Promise.all([
        doctorAPI.list(), doctorAPI.specializations(), doctorAPI.departments()
      ]);
      setDoctors(docRes.data.data || []);
      setSpecializations(specRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filtered = doctors.filter(d => {
    const nameMatch = d.user?.fullName?.toLowerCase().includes(search.toLowerCase());
    const specMatch = !specFilter || d.profile?.specialization === specFilter;
    const deptMatch = !deptFilter || d.profile?.department === deptFilter;
    return nameMatch && specMatch && deptMatch;
  });

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">Find Doctors</h3>
        <p className="text-muted">Search by name, specialization, or department</p>
      </div>

      <div className="row g-2 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search" /></span>
            <input type="text" className="form-control" placeholder="Search by doctor name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={specFilter} onChange={e => setSpecFilter(e.target.value)}>
            <option value="">All Specializations</option>
            {specializations.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-stethoscope d-block" />
          <h5>No doctors found</h5>
          <p>Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="row g-4">
          {filtered.map(doc => (
            <div key={doc.profile?.id} className="col-md-6">
              <div className="doctor-card h-100">
                <div className="d-flex gap-3">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{width:56,height:56}}>
                    <i className="bi bi-heart-pulse fs-4" />
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="fw-bold mb-0">{doc.user?.fullName}</h5>
                    <p className="text-primary fw-medium mb-1">{doc.profile?.specialization}</p>
                    <small className="text-muted">{doc.profile?.department}</small>

                    <div className="d-flex flex-wrap gap-3 mt-2">
                      <small className="text-muted"><i className="bi bi-award me-1" />{doc.profile?.experience} yrs exp.</small>
                      <small className="text-muted"><i className="bi bi-geo-alt me-1" />{doc.profile?.room}</small>
                      <small className="text-muted"><i className="bi bi-clock me-1" />{doc.profile?.workingHoursStart?.substring(0,5)} – {doc.profile?.workingHoursEnd?.substring(0,5)}</small>
                    </div>

                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {doc.profile?.workingDays?.split(',').map(day => (
                        <span key={day} className="badge bg-light text-dark" style={{fontSize:10}}>{day.substring(0,3)}</span>
                      ))}
                    </div>

                    <button className="btn btn-primary btn-sm mt-3 w-100" onClick={() => navigate(`/book-appointment?doctorId=${doc.user?.id}`)}>
                      Book Appointment <i className="bi bi-arrow-right ms-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
