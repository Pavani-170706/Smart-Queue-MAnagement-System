import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI, userAPI } from '../../services/api';

const pad = n => String(n).padStart(2, '0');

const formatDate = d =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const today = () => formatDate(new Date());

export default function AppointmentsCalendar() {
  const { user } = useAuth();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(today());
  const [appointments, setAppointments] = useState([]);
  const [monthAppointments, setMonthAppointments] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(false);

  const loadAppointments = async date => {
    if (!user?.userId) return;

    setLoading(true);

    try {
      const [selectedRes, allRes] = await Promise.all([
        appointmentAPI.getDoctorAppointments(user.userId, date),
        appointmentAPI.getAllDoctorAppointments(user.userId)
      ]);

      const data = selectedRes.data.data || [];
      const allData = allRes.data.data || [];

      setAppointments(data);
      setMonthAppointments(allData);

      const ids = [
        ...new Set(
          allData
            .map(a => a.customerId)
            .filter(Boolean)
        )
      ];

      const result = await Promise.all(
        ids.map(async id => {
          try {
            const r = await userAPI.get(id);
            return [id, r.data.data];
          } catch {
            return [id, null];
          }
        })
      );

      setPatients(Object.fromEntries(result));
    } catch (err) {
      console.error('Calendar loading error:', err);
      setAppointments([]);
      setMonthAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments(selectedDate);
  }, [
    user?.userId,
    selectedDate,
    month.getFullYear(),
    month.getMonth()
  ]);

  /*
   * ============================================================
   * DYNAMIC REAL-WORLD CALENDAR
   * ============================================================
   *
   * This automatically calculates the correct weekday for
   * every month and every year.
   *
   * Sunday = 0
   * Monday = 1
   * Tuesday = 2
   * Wednesday = 3
   * Thursday = 4
   * Friday = 5
   * Saturday = 6
   */
  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);

    const startOffset = firstDay.getDay();

    const days = [];

    // Empty cells before the first day
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Actual days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(
        new Date(year, monthIndex, day)
      );
    }

    // Complete the final week
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [month]);

  const appointmentCountByDate = useMemo(() => {
    const map = {};

    monthAppointments.forEach(a => {
      if (a.appointmentDate) {
        map[a.appointmentDate] =
          (map[a.appointmentDate] || 0) + 1;
      }
    });

    return map;
  }, [monthAppointments]);

  const moveMonth = delta => {
    setMonth(
      new Date(
        month.getFullYear(),
        month.getMonth() + delta,
        1
      )
    );
  };

  const selectDay = date => {
    if (!date) return;

    setSelectedDate(formatDate(date));

    if (
      date.getMonth() !== month.getMonth() ||
      date.getFullYear() !== month.getFullYear()
    ) {
      setMonth(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        )
      );
    }
  };

  const patientName = id =>
    patients[id]?.fullName || `Patient #${id}`;

  const statusColor = {
    BOOKED: 'primary',
    CHECKED_IN: 'info',
    WAITING: 'warning text-dark',
    IN_CONSULTATION: 'success',
    COMPLETED: 'secondary',
    CANCELLED: 'danger'
  };

  return (
    <Layout>

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}
      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <h3 className="fw-bold mb-1">
            Appointments Calendar
          </h3>

          <p className="text-muted mb-0">
            View previous, today, and upcoming appointments.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={() => {
            setSelectedDate(today());

            const d = new Date();

            setMonth(
              new Date(
                d.getFullYear(),
                d.getMonth(),
                1
              )
            );
          }}
        >
          <i className="bi bi-calendar-check me-1" />
          Today
        </button>

      </div>

      <div className="row g-4">

        {/* ====================================================
            CALENDAR
        ==================================================== */}
        <div className="col-lg-7">

          <div className="card border-0 shadow-sm">

            {/* MONTH HEADER */}
            <div className="card-header bg-white d-flex justify-content-between align-items-center">

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => moveMonth(-1)}
              >
                <i className="bi bi-chevron-left" />
              </button>

              <h5 className="fw-bold mb-0">
                {month.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h5>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => moveMonth(1)}
              >
                <i className="bi bi-chevron-right" />
              </button>

            </div>

            <div className="card-body">

              {/* ==================================================
                  WEEKDAY HEADER
              ================================================== */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: '4px',
                  marginBottom: '6px'
                }}
              >

                {[
                  'Sun',
                  'Mon',
                  'Tue',
                  'Wed',
                  'Thu',
                  'Fri',
                  'Sat'
                ].map(day => (
                  <div
                    key={day}
                    className="text-center"
                    style={{
                      minWidth: 0
                    }}
                  >
                    <small className="fw-semibold text-muted">
                      {day}
                    </small>
                  </div>
                ))}

              </div>

              {/* ==================================================
                  CALENDAR GRID
              ================================================== */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(7, minmax(0, 1fr))',
                  gap: '4px'
                }}
              >

                {calendarDays.map((date, index) => {

                  {/* Empty calendar cells */}
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        style={{
                          minWidth: 0,
                          height: '86px'
                        }}
                      />
                    );
                  }

                  const key = formatDate(date);

                  const isSelected =
                    key === selectedDate;

                  const isToday =
                    key === today();

                  const isSunday =
                    date.getDay() === 0;

                  const count =
                    appointmentCountByDate[key] || 0;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectDay(date)}
                      title={
                        isSunday
                          ? 'Clinic closed on Sundays'
                          : `View appointments for ${key}`
                      }
                      className={`
                        border
                        rounded-3
                        p-2
                        text-start
                        ${
                          isSelected
                            ? (
                                isSunday
                                  ? 'border-danger bg-danger bg-opacity-10'
                                  : 'border-primary bg-primary bg-opacity-10'
                              )
                            : (
                                isSunday
                                  ? 'bg-danger bg-opacity-10 border-danger border-opacity-25'
                                  : 'bg-white'
                              )
                        }
                      `}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        height: '86px',
                        overflow: 'hidden'
                      }}
                    >

                      {/* DATE NUMBER */}
                      <div
                        className={`
                          fw-semibold
                          ${
                            isSunday
                              ? 'text-danger'
                              : (
                                  isToday
                                    ? 'text-primary'
                                    : ''
                                )
                          }
                        `}
                      >
                        {date.getDate()}
                      </div>

                      {/* APPOINTMENT COUNT
                          Always BELOW the date */}
                      {count > 0 && !isSunday && (
                        <div
                          className="mt-2"
                          style={{
                            maxWidth: '100%',
                            overflow: 'hidden'
                          }}
                        >
                          <span
                            className="badge bg-primary"
                            style={{
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {count} appointment
                            {count > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}

                    </button>
                  );
                })}

              </div>

              {/* ==================================================
                  HELP TEXT
              ================================================== */}
              <div className="mt-3">

                <small className="text-muted">
                  Select any date to view that day's appointments.
                  Past dates remain available for history.
                </small>

              </div>

            </div>
          </div>

        </div>

        {/* ====================================================
            SELECTED DATE / APPOINTMENTS
        ==================================================== */}
        <div className="col-lg-5">

          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white">

              <h6 className="fw-bold mb-1">

                {new Date(
                  `${selectedDate}T12:00:00`
                ).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}

              </h6>

              <small
                className={
                  new Date(
                    `${selectedDate}T12:00:00`
                  ).getDay() === 0
                    ? 'text-danger fw-semibold'
                    : 'text-muted'
                }
              >

                {new Date(
                  `${selectedDate}T12:00:00`
                ).getDay() === 0
                  ? 'Clinic closed on Sundays'
                  : `${appointments.length} appointment(s)`}

              </small>

            </div>

            <div className="card-body">

              {loading ? (

                <div className="text-center py-4">
                  <div className="spinner-border text-primary" />
                </div>

              ) : appointments.length === 0 ? (

                <div className="text-center py-4 text-muted">

                  <i className="bi bi-calendar-x fs-1 d-block mb-2" />

                  No appointments on this date.

                </div>

              ) : (

                appointments.map(a => (

                  <div
                    key={a.id}
                    className="border rounded-3 p-3 mb-3"
                  >

                    <div className="d-flex justify-content-between align-items-start">

                      <div>

                        <div className="fw-bold">
                          {patientName(a.customerId)}
                        </div>

                        <small className="text-muted">
                          Patient #{a.customerId}
                        </small>

                      </div>

                      <span
                        className={`badge bg-${
                          statusColor[a.status] ||
                          'secondary'
                        }`}
                      >
                        {a.status?.replaceAll('_', ' ')}
                      </span>

                    </div>

                    <div
                      className="row mt-2"
                      style={{ fontSize: 13 }}
                    >

                      <div className="col-6">

                        <span className="text-muted">
                          Time
                        </span>

                        <br />

                        <strong>
                          {a.timeSlot}
                        </strong>

                      </div>

                      <div className="col-6">

                        <span className="text-muted">
                          Token
                        </span>

                        <br />

                        <strong>
                          {a.tokenNumber}
                        </strong>

                      </div>

                    </div>

                  </div>

                ))

              )}

            </div>

          </div>

        </div>

      </div>

    </Layout>
  );
}