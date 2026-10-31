import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI, queueAPI, userAPI } from '../../services/api';
import { subscribeToQueue } from '../../services/websocket';

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const today = getToday();

      const [appointmentRes, queueRes] = await Promise.all([
        appointmentAPI.getDoctorAppointments(user.userId, today),
        queueAPI.getQueue(user.userId, today)
      ]);

      const appointmentData = appointmentRes.data.data || [];
      const queueData = queueRes.data.data || [];

      setAppointments(appointmentData);
      setQueue(queueData);

      const patientIds = [
        ...new Set(
          [...appointmentData, ...queueData]
            .map(item => item.customerId)
            .filter(Boolean)
        )
      ];

      const patientResults = await Promise.all(
        patientIds.map(async id => {
          try {
            const response = await userAPI.get(id);
            return [id, response.data.data];
          } catch {
            return [id, null];
          }
        })
      );

      setPatients(Object.fromEntries(patientResults));
    } catch (error) {
      console.error('Dashboard loading error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!user?.userId) return;

    const unsubscribe = subscribeToQueue(
      user.userId,
      () => loadDashboard()
    );

    return unsubscribe;
  }, [user?.userId, loadDashboard]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner-border text-primary" />
        </div>
      </Layout>
    );
  }

  const waiting = queue.filter(
    token =>
      token.status === 'BOOKED' ||
      token.status === 'CHECKED_IN' ||
      token.status === 'WAITING'
  );

  const completed = queue.filter(
    token => token.status === 'COMPLETED'
  );

  const inConsultation = queue.find(
    token => token.status === 'IN_CONSULTATION'
  );

  const getPatientName = customerId => {
    return patients[customerId]?.fullName || `Patient #${customerId}`;
  };

  const getPatientPhone = customerId => {
    return patients[customerId]?.phone || 'Phone not available';
  };

  const getAppointmentForToken = token => {
    return appointments.find(
      appointment => appointment.id === token.appointmentId
    );
  };

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">
          Welcome, Dr. {user?.fullName?.split(' ').slice(1).join(' ') || user?.fullName}
        </h3>
        <p className="text-muted">
          Today's appointment and queue overview
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="stat-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: 13 }}>
                  Today's Appointments
                </p>
                <h3 className="fw-bold mb-0">
                  {appointments.length}
                </h3>
              </div>
              <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-calendar-check" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stat-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: 13 }}>
                  Waiting
                </p>
                <h3 className="fw-bold mb-0">
                  {waiting.length}
                </h3>
              </div>
              <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-hourglass-split" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stat-card">
            <div className="d-flex justify-content-between">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: 13 }}>
                  Completed
                </p>
                <h3 className="fw-bold mb-0">
                  {completed.length}
                </h3>
              </div>
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-check-circle" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-0">
                  Today's Queue
                </h6>
                <small className="text-muted">
                  {appointments.length} appointment(s) today
                </small>
              </div>

              <Link
                to="/doctor/queue"
                className="btn btn-sm btn-outline-primary"
              >
                View Full Queue
              </Link>
            </div>

            <div className="card-body">

              {inConsultation && (
                <div className="queue-item serving mb-3">

                  <div
                    className="bg-success text-white rounded-2 d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      width: 48,
                      height: 48,
                      fontSize: 13
                    }}
                  >
                    {inConsultation.tokenNumber}
                  </div>

                  <div className="flex-grow-1 ms-3">
                    <small className="fw-semibold">
                      Currently Seeing
                    </small>

                    <div className="fw-bold">
                      {getPatientName(inConsultation.customerId)}
                    </div>

                    <small className="text-muted">
                      {getPatientPhone(inConsultation.customerId)}
                    </small>
                  </div>

                  <span className="badge bg-success">
                    In Consultation
                  </span>
                </div>
              )}

              {waiting.slice(0, 5).map(token => {

                const appointment =
                  getAppointmentForToken(token);

                return (
                  <div
                    key={token.id}
                    className="queue-item mb-2"
                  >

                    <div
                      className="bg-primary bg-opacity-10 text-primary rounded-2 d-flex align-items-center justify-content-center fw-bold"
                      style={{
                        width: 48,
                        height: 48,
                        fontSize: 13
                      }}
                    >
                      {token.tokenNumber}
                    </div>

                    <div className="flex-grow-1 ms-3">

                      <div className="fw-semibold">
                        {getPatientName(token.customerId)}
                      </div>

                      <small className="text-muted">
                        {getPatientPhone(token.customerId)}
                      </small>

                      <div>
                        <small className="text-muted">
                          Token: {token.tokenNumber}
                          {' • '}
                          Time: {appointment?.timeSlot || '--'}
                        </small>
                      </div>

                    </div>

                    <span className="badge bg-warning text-dark">
                      {token.status}
                    </span>

                  </div>
                );
              })}

              {appointments.length === 0 && (
                <div className="text-center py-5">
                  <i
                    className="bi bi-calendar-x text-muted"
                    style={{ fontSize: 40 }}
                  />

                  <h6 className="mt-3">
                    No appointments today
                  </h6>

                  <p className="text-muted mb-0">
                    Patients who book appointments for today
                    will appear here.
                  </p>
                </div>
              )}

              {appointments.length > 0 &&
                queue.length === 0 && (
                  <div className="text-center py-4">
                    <i
                      className="bi bi-hourglass text-warning"
                      style={{ fontSize: 32 }}
                    />

                    <h6 className="mt-2">
                      Appointments found
                    </h6>

                    <p className="text-muted mb-0">
                      Queue token has not been created yet.
                    </p>
                  </div>
                )}

            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white">
              <h6 className="fw-bold mb-0">
                Today's Completed Patients
              </h6>
              <small className="text-muted">
                {completed.length} completed today
              </small>
            </div>

            <div className="card-body">

              {completed.map(token => {
                const appointment = getAppointmentForToken(token);
                const patient = patients[token.customerId];

                return (
                  <div
                    key={token.id}
                    className="border-bottom pb-3 mb-3"
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 42, height: 42 }}
                      >
                        <i className="bi bi-person-check" />
                      </div>

                      <div className="ms-3 flex-grow-1">
                        <div className="fw-semibold">
                          {patient?.fullName || `Patient #${token.customerId}`}
                        </div>
                        <small className="text-muted">
                          {patient?.phone || 'Phone not available'}
                        </small>
                      </div>

                      <span className="badge bg-success">
                        {token.tokenNumber}
                      </span>
                    </div>

                    <div className="mt-2 ms-5 d-flex justify-content-between">
                      <small className="text-muted">
                        <i className="bi bi-clock me-1" />
                        {appointment?.timeSlot || '--'}
                      </small>
                      <small className="text-success fw-semibold">Completed</small>
                    </div>
                  </div>
                );
              })}

              {completed.length === 0 && (
                <p className="text-muted text-center py-3 mb-0">
                  No patients completed today.
                </p>
              )}

            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}