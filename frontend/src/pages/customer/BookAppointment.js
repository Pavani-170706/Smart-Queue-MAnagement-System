import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI, appointmentAPI } from '../../services/api';

export default function BookAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const allowedDates = [];
  const now = new Date();
  const formatLocalDate = d => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + i);
    allowedDates.push(formatLocalDate(d));
  }

  useEffect(() => {
    if (doctorId) loadDoctor();
  }, [doctorId]);

  const loadDoctor = async () => {
    try {
      const res = await doctorAPI.get(doctorId);
      setDoctor(res.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadSlots = async (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
    setError('');

    const selected = new Date(`${date}T12:00:00`);
    if (selected.getDay() === 0) {
      setSlots([]);
      setError('Clinic is closed on Sundays. Please select another date.');
      return;
    }

    try {
      const res = await appointmentAPI.getSlots(doctorId, date);
      if (res.data.error) {
        setError(res.data.error);
        setSlots([]);
      } else {
        setSlots(res.data.slots || []);
      }
    } catch (err) { setError(err.response?.data?.message || 'Failed to load slots'); setSlots([]); }
  };

  const handleBook = async () => {
    setBooking(true);
    setError('');
    try {
      const res = await appointmentAPI.book({
        customerId: String(user.userId),
        doctorId: doctorId,
        date: selectedDate,
        timeSlot: selectedSlot
      });
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
    setBooking(false);
  };

  if (loading) return <Layout><div className="loading-spinner"><div className="spinner-border text-primary" /></div></Layout>;

  if (result) {
    return (
      <Layout>
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="text-center mb-4">
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width:64,height:64}}>
                <i className="bi bi-check-lg fs-1" />
              </div>
              <h4 className="fw-bold">Appointment Confirmed!</h4>
            </div>
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4 text-center">
                <div className="token-card mb-3">
                  <p className="text-muted mb-1">Your Token</p>
                  <div className="token-number">{result.tokenNumber}</div>
                </div>
                <div className="row text-start g-3">
                  <div className="col-6"><small className="text-muted d-block">Doctor</small><strong>{result.doctorName}</strong></div>
                  <div className="col-6"><small className="text-muted d-block">Department</small><strong>{result.specialization}</strong></div>
                  <div className="col-4"><small className="text-muted d-block">Date</small><strong>{result.date}</strong></div>
                  <div className="col-4"><small className="text-muted d-block">Time</small><strong>{result.timeSlot}</strong></div>
                  <div className="col-4"><small className="text-muted d-block">Room</small><strong>{result.room}</strong></div>
                  <div className="col-4"><small className="text-muted d-block">Currently Serving</small><strong>{result.currentlyServing}</strong></div>
                  <div className="col-4"><small className="text-muted d-block">People Before</small><strong>{result.peopleBefore}</strong></div>
                  <div className="col-4"><small className="text-muted d-block">Est. Wait</small><strong>{result.estimatedWait} min</strong></div>
                  <div className="col-4"><small className="text-muted d-block">Est. Turn</small><strong>{result.estimatedTurnTime || result.timeSlot}</strong></div>
                </div>
                <div className="d-flex gap-2 mt-4">
                  <button className="btn btn-primary flex-grow-1" onClick={() => navigate('/token-status')}>View Token Status</button>
                  <button className="btn btn-outline-secondary" onClick={() => navigate('/dashboard')}>Dashboard</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4">
        <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => navigate(-1)}><i className="bi bi-arrow-left me-1" />Back</button>
        <h3 className="fw-bold">Book Appointment</h3>
        {doctor && <p className="text-muted">Dr. {doctor.user?.fullName} — {doctor.profile?.specialization}</p>}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-7">
          {/* Date Selection */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white"><h6 className="fw-bold mb-0"><i className="bi bi-calendar3 me-2" />Select Date</h6></div>
            <div className="card-body">
              <div className="d-flex gap-2 flex-wrap">
                {allowedDates.map((d, index) => {
                  const date = new Date(d + 'T12:00:00');
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  const isSunday = date.getDay() === 0;
                  const dateLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 'Day After Tomorrow';
                  return (
                    <button
                      key={d}
                      className={`btn ${selectedDate === d ? (isSunday ? 'btn-danger' : 'btn-primary') : (isSunday ? 'btn-outline-danger' : 'btn-outline-primary')} px-3`}
                      onClick={() => loadSlots(d)}
                    >
                      <small className="d-block">{dateLabel}</small>
                      <strong>{dayName}, {dayNum} {month}</strong>
                      {isSunday && <small className="d-block fw-semibold mt-1">Closed</small>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white"><h6 className="fw-bold mb-0"><i className="bi bi-clock me-2" />Select Time Slot</h6></div>
              <div className="card-body">
                {slots.length === 0 ? (
                  <div className={`text-center py-3 ${selectedDate && new Date(`${selectedDate}T12:00:00`).getDay() === 0 ? 'text-danger' : 'text-muted'}`}>
                    <i className={`bi ${selectedDate && new Date(`${selectedDate}T12:00:00`).getDay() === 0 ? 'bi-calendar-x' : 'bi-clock'} fs-4 d-block mb-2`} />
                    <div>{selectedDate && new Date(`${selectedDate}T12:00:00`).getDay() === 0 ? 'Clinic Closed on Sundays' : 'No available slots for this date'}</div>
                    {selectedDate && new Date(`${selectedDate}T12:00:00`).getDay() === 0 && <small className="text-muted">Please select another available date.</small>}
                  </div>
                ) : (
                  <div className="d-flex gap-2 flex-wrap">
                    {slots.map(s => (
                      <button key={s} className={`btn btn-sm ${selectedSlot === s ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectedSlot(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm sticky-top" style={{top:80}}>
            <div className="card-header bg-white"><h6 className="fw-bold mb-0">Booking Summary</h6></div>
            <div className="card-body">
              {doctor && (
                <div className="d-flex gap-3 mb-3 pb-3 border-bottom">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{width:48,height:48}}>
                    <i className="bi bi-heart-pulse" />
                  </div>
                  <div>
                    <strong>Dr. {doctor.user?.fullName}</strong><br/>
                    <small className="text-muted">{doctor.profile?.specialization} • {doctor.profile?.room}</small>
                  </div>
                </div>
              )}
              <div className="mb-2"><small className="text-muted">Date:</small> <strong>{selectedDate || '—'}</strong></div>
              <div className="mb-3"><small className="text-muted">Time:</small> <strong>{selectedSlot || '—'}</strong></div>
              <button className="btn btn-primary w-100" disabled={!selectedDate || !selectedSlot || booking} onClick={handleBook}>
                {booking ? <><span className="spinner-border spinner-border-sm me-2" />Booking...</> : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
