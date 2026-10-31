import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { queueAPI, appointmentAPI, userAPI } from '../../services/api';
import { subscribeToQueue } from '../../services/websocket';

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function DoctorQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wsActive, setWsActive] = useState(false);

  const loadQueue = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setRefreshing(true);

      const today = getToday();

      const [queueResponse, appointmentResponse] =
        await Promise.all([
          queueAPI.getQueue(user.userId, today),
          appointmentAPI.getDoctorAppointments(
            user.userId,
            today
          )
        ]);

      const queueData = queueResponse.data.data || [];
      const appointmentData =
        appointmentResponse.data.data || [];

      setQueue(queueData);
      setAppointments(appointmentData);

      const patientIds = [
        ...new Set(
          [
            ...queueData.map(token => token.customerId),
            ...appointmentData.map(
              appointment => appointment.customerId
            )
          ].filter(Boolean)
        )
      ];

      const patientResults = await Promise.all(
        patientIds.map(async patientId => {
          try {
            const response =
              await userAPI.get(patientId);

            return [
              patientId,
              response.data.data
            ];
          } catch (error) {
            console.error(
              `Failed to load patient ${patientId}`,
              error
            );

            return [
              patientId,
              null
            ];
          }
        })
      );

      setPatients(
        Object.fromEntries(patientResults)
      );

    } catch (error) {
      console.error(
        'Failed to load doctor queue:',
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!user?.userId) return;

    const unsubscribe = subscribeToQueue(
      user.userId,
      () => {
        setWsActive(true);
        loadQueue();
      }
    );

    return unsubscribe;
  }, [user?.userId, loadQueue]);

  const handleStart = async token => {
    try {
      const response = await queueAPI.startConsultation(token.id);
      if (response.data?.success === false) {
        throw new Error(response.data?.message || 'Failed to start consultation');
      }
      await loadQueue();
      navigate(`/doctor/patients?appointmentId=${token.appointmentId}`);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        error.message ||
        'Failed to start consultation'
      );
    }
  };

  const handleComplete = async tokenId => {
    try {
      await queueAPI.complete(tokenId);
      await loadQueue();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        'Failed to complete consultation'
      );
    }
  };

  const handleSkip = async tokenId => {
    const confirmSkip = window.confirm(
      'Are you sure you want to skip this patient?'
    );

    if (!confirmSkip) return;

    try {
      await queueAPI.skipToken(tokenId);
      await loadQueue();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        'Failed to skip patient'
      );
    }
  };

  const getPatient = customerId => {
    return patients[customerId] || null;
  };

  const getPatientName = customerId => {
    const patient = getPatient(customerId);

    return (
      patient?.fullName ||
      `Patient #${customerId}`
    );
  };

  const getPatientPhone = customerId => {
    const patient = getPatient(customerId);

    return (
      patient?.phone ||
      'Phone not available'
    );
  };

  const getAppointment = appointmentId => {
    return appointments.find(
      appointment =>
        appointment.id === appointmentId
    );
  };

  const activeQueue = queue.filter(
    token =>
      token.status !== 'COMPLETED' &&
      token.status !== 'CANCELLED' &&
      token.status !== 'SKIPPED' &&
      token.status !== 'NO_SHOW'
  );

  const completed = queue.filter(
    token => token.status === 'COMPLETED'
  );

  const waiting = queue.filter(
    token =>
      token.status === 'BOOKED' ||
      token.status === 'CHECKED_IN' ||
      token.status === 'WAITING'
  );

  const currentPatient = queue.find(
    token =>
      token.status === 'IN_CONSULTATION'
  );

  const statusClass = {
    BOOKED: 'bg-primary',
    CHECKED_IN: 'bg-info',
    WAITING: 'bg-warning text-dark',
    IN_CONSULTATION: 'bg-success',
    COMPLETED: 'bg-secondary',
    CANCELLED: 'bg-danger',
    SKIPPED: 'bg-secondary',
    NO_SHOW: 'bg-danger'
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner-border text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <h3 className="fw-bold mb-1">
            Today's Queue
          </h3>

          <p className="text-muted mb-0">
            Manage today's patient appointments and consultations
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">

          {wsActive && (
            <span className="badge bg-success">
              <i className="bi bi-broadcast me-1" />
              Live
            </span>
          )}

          <button
            className="btn btn-sm btn-outline-primary"
            onClick={loadQueue}
            disabled={refreshing}
          >
            <i
              className={`bi ${
                refreshing
                  ? 'bi-arrow-repeat'
                  : 'bi-arrow-clockwise'
              } me-1`}
            />

            Refresh
          </button>

        </div>

      </div>

      <div className="row g-3 mb-4">

        <div className="col-md-3">
          <div className="stat-card">

            <div className="d-flex justify-content-between">

              <div>
                <p
                  className="text-muted mb-1"
                  style={{ fontSize: 13 }}
                >
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

        <div className="col-md-3">
          <div className="stat-card">

            <div className="d-flex justify-content-between">

              <div>
                <p
                  className="text-muted mb-1"
                  style={{ fontSize: 13 }}
                >
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

        <div className="col-md-3">
          <div className="stat-card">

            <div className="d-flex justify-content-between">

              <div>
                <p
                  className="text-muted mb-1"
                  style={{ fontSize: 13 }}
                >
                  In Consultation
                </p>

                <h3 className="fw-bold mb-0">
                  {currentPatient ? 1 : 0}
                </h3>
              </div>

              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-person-video3" />
              </div>

            </div>

          </div>
        </div>

        <div className="col-md-3">
          <div className="stat-card">

            <div className="d-flex justify-content-between">

              <div>
                <p
                  className="text-muted mb-1"
                  style={{ fontSize: 13 }}
                >
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

      {currentPatient && (
        <div className="card border-0 shadow-sm mb-4">

          <div className="card-header bg-success text-white">
            <h6 className="fw-bold mb-0">
              <i className="bi bi-person-video3 me-2" />
              Currently in Consultation
            </h6>
          </div>

          <div className="card-body">

            <div className="row align-items-center">

              <div className="col-md-2 text-center">

                <div
                  className="bg-success text-white rounded-3 d-flex align-items-center justify-content-center fw-bold mx-auto"
                  style={{
                    width: 70,
                    height: 70,
                    fontSize: 18
                  }}
                >
                  {currentPatient.tokenNumber}
                </div>

              </div>

              <div className="col-md-5">

                <h5 className="fw-bold mb-1">
                  {getPatientName(
                    currentPatient.customerId
                  )}
                </h5>

                <p className="text-muted mb-1">
                  <i className="bi bi-telephone me-1" />
                  {getPatientPhone(
                    currentPatient.customerId
                  )}
                </p>

                <small className="text-muted">
                  Patient ID: #
                  {currentPatient.customerId}
                </small>

              </div>

              <div className="col-md-3">

                <small className="text-muted d-block">
                  Appointment Time
                </small>

                <strong>
                  {getAppointment(
                    currentPatient.appointmentId
                  )?.timeSlot || '--'}
                </strong>

              </div>

              <div className="col-md-2 text-end">

                <button
                  className="btn btn-success"
                  onClick={() =>
                    handleComplete(
                      currentPatient.id
                    )
                  }
                >
                  <i className="bi bi-check-lg me-1" />
                  Complete
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white d-flex justify-content-between align-items-center">

          <div>
            <h6 className="fw-bold mb-1">
              Patient Queue
            </h6>

            <small className="text-muted">
              {activeQueue.length} active patient(s)
            </small>
          </div>

          <span className="badge bg-primary">
            {getToday()}
          </span>

        </div>

        <div className="card-body p-0">

          {activeQueue.length === 0 ? (

            <div className="text-center py-5">

              <i
                className="bi bi-people text-muted"
                style={{ fontSize: 48 }}
              />

              <h5 className="mt-3">
                No patients in today's queue
              </h5>

              <p className="text-muted mb-0">
                Patients who book appointments for today
                will appear here automatically.
              </p>

            </div>

          ) : (

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0">

                <thead className="table-light">

                  <tr>
                    <th className="ps-4">
                      Token
                    </th>

                    <th>
                      Patient
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Appointment
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Queue Position
                    </th>

                    <th className="text-end pe-4">
                      Action
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {activeQueue.map(token => {

                    const appointment =
                      getAppointment(
                        token.appointmentId
                      );

                    const isCurrent =
                      token.status ===
                      'IN_CONSULTATION';

                    const canStart =
                      token.status ===
                        'BOOKED' ||
                      token.status ===
                        'WAITING' ||
                      token.status ===
                        'CHECKED_IN';

                    return (

                      <tr key={token.id}>

                        <td className="ps-4">

                          <div
                            className={`rounded-2 d-flex align-items-center justify-content-center fw-bold ${
                              isCurrent
                                ? 'bg-success text-white'
                                : 'bg-primary bg-opacity-10 text-primary'
                            }`}
                            style={{
                              width: 52,
                              height: 42
                            }}
                          >
                            {token.tokenNumber}
                          </div>

                        </td>

                        <td>

                          <div className="fw-semibold">
                            {getPatientName(
                              token.customerId
                            )}
                          </div>

                          <small className="text-muted">
                            Patient #
                            {token.customerId}
                          </small>

                        </td>

                        <td>

                          <small>
                            <i className="bi bi-telephone me-1" />
                            {getPatientPhone(
                              token.customerId
                            )}
                          </small>

                        </td>

                        <td>

                          <div className="fw-semibold">
                            {appointment?.timeSlot || '--'}
                          </div>

                          <small className="text-muted">
                            {appointment?.appointmentDate ||
                              token.tokenDate}
                          </small>

                        </td>

                        <td>

                          <span
                            className={`badge ${
                              statusClass[token.status] ||
                              'bg-secondary'
                            }`}
                          >
                            {token.status
                              ?.replaceAll('_', ' ')}
                          </span>

                        </td>

                        <td>

                          <span className="fw-semibold">
                            #{token.sequenceNumber}
                          </span>

                        </td>

                        <td className="text-end pe-4">

                          <div className="d-flex justify-content-end gap-2">

                            {canStart && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() =>
                                  handleStart(
                                    token
                                  )
                                }
                              >
                                <i className="bi bi-play-fill me-1" />
                                Start
                              </button>
                            )}

                            {(token.status ===
                              'BOOKED' ||
                              token.status ===
                                'WAITING') && (
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  handleSkip(
                                    token.id
                                  )
                                }
                              >
                                Skip
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>

                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {completed.length > 0 && (
        <div className="card border-0 shadow-sm mt-4">

          <div className="card-header bg-white">

            <h6 className="fw-bold mb-0">
              Completed Today
            </h6>

          </div>

          <div className="card-body">

            <div className="row g-3">

              {completed.map(token => {

                const appointment =
                  getAppointment(
                    token.appointmentId
                  );

                return (

                  <div
                    key={token.id}
                    className="col-md-6 col-lg-4"
                  >

                    <div className="border rounded-3 p-3">

                      <div className="d-flex align-items-center">

                        <div
                          className="bg-success bg-opacity-10 text-success rounded-2 d-flex align-items-center justify-content-center fw-bold"
                          style={{
                            width: 45,
                            height: 45
                          }}
                        >
                          {token.tokenNumber}
                        </div>

                        <div className="ms-3">

                          <div className="fw-semibold">
                            {getPatientName(
                              token.customerId
                            )}
                          </div>

                          <small className="text-muted">
                            {appointment?.timeSlot ||
                              '--'}
                          </small>

                        </div>

                        <span className="badge bg-success ms-auto">
                          Completed
                        </span>

                      </div>

                    </div>

                  </div>

                );
              })}

            </div>

          </div>

        </div>
      )}

    </Layout>
  );
}