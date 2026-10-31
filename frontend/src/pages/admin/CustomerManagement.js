import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getCustomers().then(res => {
      setCustomers(res.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">Customer Management</h3>
        <p className="text-muted">View and manage registered customers</p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Gender</th><th>Status</th></tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td className="fw-medium">{c.fullName}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.gender || '—'}</td>
                  <td><span className={`badge ${c.isActive ? 'bg-success' : 'bg-secondary'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-muted">No customers registered</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
