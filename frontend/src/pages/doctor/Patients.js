import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI, medicalAPI, queueAPI, userAPI } from '../../services/api';

export default function DoctorPatients() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const appointmentIdParam = searchParams.get('appointmentId');

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recordSaved, setRecordSaved] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    symptoms: '',
    diagnosis: '',
    notes: '',
    recommendations: '',
    followUpDate: '',
    medicines: []
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user?.userId) {
      loadPatients();
    }
  }, [user]);

  const loadPatients = async () => {
    setLoading(true);

    try {
      const appointmentResponse = await appointmentAPI.getDoctorAppointments(
        user.userId,
        today
      );

      const appointments = appointmentResponse.data?.data || [];

      let queue = [];

      try {
        const queueResponse = await queueAPI.getQueue(user.userId, today);
        queue = queueResponse.data?.data || [];
      } catch (error) {
        console.log('Queue data unavailable');
      }

      const patientIds = [
        ...new Set(
          appointments
            .map(a => a.customerId)
            .filter(id => id !== null && id !== undefined)
        )
      ];

      const patientDetails = await Promise.all(
        patientIds.map(async id => {
          try {
            const response = await userAPI.get(id);
            return response.data?.data || response.data;
          } catch (error) {
            return {
              id,
              fullName: `Patient #${id}`,
              phone: ''
            };
          }
        })
      );

      const patientMap = {};

      patientDetails.forEach(patient => {
        if (patient?.id !== undefined) {
          patientMap[patient.id] = patient;
        }
      });

      const combined = appointments.map(appointment => {
        const patient = patientMap[appointment.customerId] || {};
        const token = queue.find(
          q => q.appointmentId === appointment.id
        );

        return {
          ...appointment,
          patient: {
            id: appointment.customerId,
            fullName:
              patient.fullName ||
              patient.name ||
              `Patient #${appointment.customerId}`,
            phone: patient.phone || '',
            email: patient.email || '',
            gender: patient.gender || ''
          },
          queueToken: token
        };
      });

      setPatients(combined);

      if (appointmentIdParam) {
        const target = combined.find(
          patient => String(patient.id) === String(appointmentIdParam)
        );
        if (target) {
          await loadPatientRecords(target);
        }
      }

      return combined;
    } catch (error) {
      console.error('Failed to load patients', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientRecords = async patient => {
    setSelectedPatient(patient);
    setRecordSaved(false);
    setRecordsLoading(true);
    setMessage('');

    try {
      const response = await medicalAPI.getPatientRecords(
        patient.customerId
      );

      setRecords(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load records', error);
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const refreshSelectedPatient = async appointmentId => {
    const updatedPatients = await loadPatients();
    const updated = updatedPatients?.find(
      patient => patient.id === appointmentId
    );
    if (updated) setSelectedPatient(updated);
  };

  const startConsultation = async () => {
    const tokenId = selectedPatient?.queueToken?.id;
    if (!tokenId) {
      setMessage('Queue token not found for this appointment.');
      return;
    }

    try {
      await queueAPI.startConsultation(tokenId);
      setMessage('Consultation started. You can now add the medical record.');
      await refreshSelectedPatient(selectedPatient.id);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          'Failed to start consultation.'
      );
    }
  };

  const completeConsultation = async () => {
    const tokenId = selectedPatient?.queueToken?.id;
    if (!tokenId) {
      setMessage('Queue token not found for this appointment.');
      return;
    }

    try {
      await queueAPI.complete(tokenId);
      setMessage('Consultation completed successfully.');
      await refreshSelectedPatient(selectedPatient.id);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          'Failed to complete consultation.'
      );
    }
  };

  const handleChange = event => {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value
    }));
  };

  const addMedicine = () => {
    setForm(previous => ({
      ...previous,
      medicines: [
        ...previous.medicines,
        {
          name: '',
          dosage: '',
          duration: ''
        }
      ]
    }));
  };

  const updateMedicine = (index, field, value) => {
    setForm(previous => ({
      ...previous,
      medicines: previous.medicines.map((medicine, i) =>
        i === index
          ? {
              ...medicine,
              [field]: value
            }
          : medicine
      )
    }));
  };

  const removeMedicine = index => {
    setForm(previous => ({
      ...previous,
      medicines: previous.medicines.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setForm({
      symptoms: '',
      diagnosis: '',
      notes: '',
      recommendations: '',
      followUpDate: '',
      medicines: []
    });
  };

  const saveRecord = async event => {
    event.preventDefault();

    if (!selectedPatient) {
      return;
    }

    if (!form.symptoms.trim() || !form.diagnosis.trim()) {
      setMessage('Symptoms and diagnosis are required.');
      return;
    }

    const validMedicines = form.medicines.filter(
      medicine =>
        medicine.name.trim() &&
        medicine.dosage.trim() &&
        medicine.duration.trim()
    );

    setSaving(true);
    setMessage('');

    try {
      const data = {
        patientId: selectedPatient.customerId,
        doctorId: user.userId,
        appointmentId: selectedPatient.id,
        symptoms: form.symptoms,
        diagnosis: form.diagnosis,
        notes: form.notes,
        recommendations: form.recommendations,
        followUpDate: form.followUpDate || null,
        medicines: validMedicines
      };

      const response = await medicalAPI.create(data);

      if (response.data?.success) {
        setMessage('Medical record saved successfully.');
        setRecordSaved(true);

        resetForm();

        const recordsResponse = await medicalAPI.getPatientRecords(
          selectedPatient.customerId
        );

        setRecords(recordsResponse.data?.data || []);
      } else {
        setMessage('Unable to save medical record.');
      }
    } catch (error) {
      console.error('Failed to save medical record', error);
      setMessage(
        error.response?.data?.message ||
          'Failed to save medical record.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Loading patients...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="fw-bold">Patient Records</h3>
        <p className="text-muted mb-0">
          View today's patients and maintain their medical records
        </p>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-bold mb-1">Today's Patients</h5>
                  <small className="text-muted">
                    {patients.length} appointment
                    {patients.length !== 1 ? 's' : ''}
                  </small>
                </div>

                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={loadPatients}
                >
                  <i className="bi bi-arrow-clockwise me-1" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="card-body p-0">
              {patients.length === 0 ? (
                <div className="text-center py-5 px-3">
                  <i className="bi bi-people fs-1 text-muted d-block mb-3" />
                  <h6>No patients today</h6>
                  <p className="text-muted small mb-0">
                    Patients with appointments for today will appear here.
                  </p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {patients.map(patient => {
                    const isSelected =
                      selectedPatient?.id === patient.id;

                    const status =
                      patient.queueToken?.status ||
                      patient.status ||
                      'BOOKED';

                    return (
                      <button
                        key={patient.id}
                        type="button"
                        className={`list-group-item list-group-item-action p-3 ${
                          isSelected ? 'active' : ''
                        }`}
                        onClick={() => loadPatientRecords(patient)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="d-flex gap-3">
                            <div
                              className={`rounded-circle ${
                                isSelected
                                  ? 'bg-white text-primary'
                                  : 'bg-primary text-white'
                              } d-flex align-items-center justify-content-center`}
                              style={{
                                width: '45px',
                                height: '45px',
                                minWidth: '45px'
                              }}
                            >
                              <i className="bi bi-person fs-5" />
                            </div>

                            <div className="text-start">
                              <h6 className="mb-1 fw-bold">
                                {patient.patient.fullName}
                              </h6>

                              <div
                                className={
                                  isSelected
                                    ? 'small text-white-50'
                                    : 'small text-muted'
                                }
                              >
                                {patient.patient.phone ||
                                  'Phone not available'}
                              </div>

                              <div
                                className={
                                  isSelected
                                    ? 'small text-white-50'
                                    : 'small text-muted'
                                }
                              >
                                <i className="bi bi-clock me-1" />
                                {patient.timeSlot}
                              </div>
                            </div>
                          </div>

                          <div className="text-end">
                            <span
                              className={`badge ${
                                isSelected
                                  ? 'bg-white text-primary'
                                  : status === 'COMPLETED'
                                  ? 'bg-success'
                                  : status === 'IN_CONSULTATION'
                                  ? 'bg-warning text-dark'
                                  : 'bg-primary'
                              }`}
                            >
                              {patient.queueToken?.tokenNumber ||
                                patient.tokenNumber ||
                                '—'}
                            </span>

                            <div
                              className={
                                isSelected
                                  ? 'small text-white-50 mt-1'
                                  : 'small text-muted mt-1'
                              }
                            >
                              {status.replaceAll('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          {!selectedPatient ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-person-vcard fs-1 text-primary d-block mb-3" />
                <h5>Select a patient</h5>
                <p className="text-muted mb-0">
                  Select a patient from the list to view their medical
                  history and add a new record.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex gap-3">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: '55px',
                          height: '55px'
                        }}
                      >
                        <i className="bi bi-person fs-4" />
                      </div>

                      <div>
                        <h5 className="fw-bold mb-1">
                          {selectedPatient.patient.fullName}
                        </h5>

                        <div className="text-muted small">
                          Patient ID: #{selectedPatient.customerId}
                        </div>

                        {selectedPatient.patient.phone && (
                          <div className="text-muted small">
                            <i className="bi bi-telephone me-1" />
                            {selectedPatient.patient.phone}
                          </div>
                        )}

                        <div className="text-muted small">
                          <i className="bi bi-calendar3 me-1" />
                          Appointment: {selectedPatient.timeSlot}
                        </div>
                      </div>
                    </div>

                    <div className="text-end">
                      <span className="badge bg-primary d-block mb-2">
                        {selectedPatient.queueToken?.tokenNumber ||
                          selectedPatient.tokenNumber ||
                          '—'}
                      </span>

                      {(() => {
                        const status =
                          selectedPatient.queueToken?.status ||
                          selectedPatient.status ||
                          'BOOKED';

                        if (status === 'IN_CONSULTATION') {
                          return (
                            <span className="badge bg-warning text-dark">
                              <i className="bi bi-person-workspace me-1" />
                              In Consultation
                            </span>
                          );
                        }

                        if (
                          status === 'BOOKED' ||
                          status === 'WAITING' ||
                          status === 'CHECKED_IN'
                        ) {
                          return (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={startConsultation}
                            >
                              <i className="bi bi-play-fill me-1" />
                              Start Consultation
                            </button>
                          );
                        }

                        if (status === 'COMPLETED') {
                          return (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1" />
                              Completed
                            </span>
                          );
                        }

                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white border-0">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-clock-history me-2 text-primary" />
                    Medical History
                  </h5>
                </div>

                <div className="card-body">
                  {recordsLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-primary" />
                      <span className="ms-2 text-muted">
                        Loading records...
                      </span>
                    </div>
                  ) : records.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-file-medical fs-2 text-muted d-block mb-2" />
                      <p className="text-muted mb-0">
                        No medical records found for this patient.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {records.map(record => (
                        <div
                          key={record.id}
                          className="border rounded p-3 mb-3"
                        >
                          <div className="d-flex justify-content-between mb-3">
                            <div>
                              <strong>
                                Record #{record.id}
                              </strong>
                            </div>

                            <small className="text-muted">
                              {record.recordDate}
                            </small>
                          </div>

                          <div className="mb-2">
                            <strong>Symptoms</strong>
                            <p className="text-muted mb-0">
                              {record.symptoms}
                            </p>
                          </div>

                          <div className="mb-2">
                            <strong>Diagnosis</strong>
                            <p className="text-muted mb-0">
                              {record.diagnosis}
                            </p>
                          </div>

                          {record.notes && (
                            <div className="mb-2">
                              <strong>Notes</strong>
                              <p className="text-muted mb-0">
                                {record.notes}
                              </p>
                            </div>
                          )}

                          {record.recommendations && (
                            <div className="mb-2">
                              <strong>Recommendations</strong>
                              <p className="text-muted mb-0">
                                {record.recommendations}
                              </p>
                            </div>
                          )}

                          {record.followUpDate && (
                            <div className="mb-2">
                              <strong>Follow-up</strong>
                              <p className="text-muted mb-0">
                                {record.followUpDate}
                              </p>
                            </div>
                          )}

                          {record.medicines &&
                            record.medicines.length > 0 && (
                              <div className="mt-3">
                                <strong>Medicines</strong>

                                <div className="table-responsive mt-2">
                                  <table className="table table-sm mb-0">
                                    <thead>
                                      <tr>
                                        <th>Medicine</th>
                                        <th>Dosage</th>
                                        <th>Duration</th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {record.medicines.map(
                                        medicine => (
                                          <tr key={medicine.id}>
                                            <td>
                                              {medicine.name}
                                            </td>
                                            <td>
                                              {medicine.dosage}
                                            </td>
                                            <td>
                                              {medicine.duration}
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-file-earmark-plus me-2 text-primary" />
                    Add Medical Record
                  </h5>
                </div>

                <div className="card-body">
                  {message && (
                    <div
                      className={`alert ${
                        message.includes('successfully')
                          ? 'alert-success'
                          : 'alert-danger'
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <form onSubmit={saveRecord}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Symptoms *
                      </label>

                      <textarea
                        className="form-control"
                        name="symptoms"
                        rows="3"
                        value={form.symptoms}
                        onChange={handleChange}
                        placeholder="Enter patient's symptoms"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Diagnosis *
                      </label>

                      <textarea
                        className="form-control"
                        name="diagnosis"
                        rows="3"
                        value={form.diagnosis}
                        onChange={handleChange}
                        placeholder="Enter diagnosis"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Notes
                      </label>

                      <textarea
                        className="form-control"
                        name="notes"
                        rows="3"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Additional clinical notes"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Recommendations
                      </label>

                      <textarea
                        className="form-control"
                        name="recommendations"
                        rows="3"
                        value={form.recommendations}
                        onChange={handleChange}
                        placeholder="Enter recommendations for the patient"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        Follow-up Date
                      </label>

                      <input
                        type="date"
                        className="form-control"
                        name="followUpDate"
                        value={form.followUpDate}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold mb-1">
                          Medicines
                        </h6>
                        <small className="text-muted">
                          Add prescribed medicines for this patient
                        </small>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={addMedicine}
                      >
                        <i className="bi bi-plus-lg me-1" />
                        Add Medicine
                      </button>
                    </div>

                    {form.medicines.length === 0 ? (
                      <div className="border rounded p-3 text-center text-muted mb-4">
                        No medicines added
                      </div>
                    ) : (
                      <div className="mb-4">
                        {form.medicines.map((medicine, index) => (
                          <div
                            key={index}
                            className="border rounded p-3 mb-3"
                          >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <strong>
                                Medicine {index + 1}
                              </strong>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  removeMedicine(index)
                                }
                              >
                                <i className="bi bi-trash" />
                              </button>
                            </div>

                            <div className="row g-3">
                              <div className="col-md-4">
                                <label className="form-label">
                                  Medicine Name
                                </label>

                                <input
                                  type="text"
                                  className="form-control"
                                  value={medicine.name}
                                  onChange={event =>
                                    updateMedicine(
                                      index,
                                      'name',
                                      event.target.value
                                    )
                                  }
                                  placeholder="e.g. Paracetamol"
                                />
                              </div>

                              <div className="col-md-4">
                                <label className="form-label">
                                  Dosage
                                </label>

                                <input
                                  type="text"
                                  className="form-control"
                                  value={medicine.dosage}
                                  onChange={event =>
                                    updateMedicine(
                                      index,
                                      'dosage',
                                      event.target.value
                                    )
                                  }
                                  placeholder="e.g. 500 mg"
                                />
                              </div>

                              <div className="col-md-4">
                                <label className="form-label">
                                  Duration
                                </label>

                                <input
                                  type="text"
                                  className="form-control"
                                  value={medicine.duration}
                                  onChange={event =>
                                    updateMedicine(
                                      index,
                                      'duration',
                                      event.target.value
                                    )
                                  }
                                  placeholder="e.g. 5 days"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={resetForm}
                        disabled={saving}
                      >
                        Clear
                      </button>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg me-2" />
                            Save Medical Record
                          </>
                        )}
                      </button>
                    </div>

                    {selectedPatient.queueToken?.status === 'IN_CONSULTATION' && (
                      <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={completeConsultation}
                          disabled={!recordSaved}
                          title={!recordSaved ? 'Save the medical record before completing the consultation' : 'Complete consultation'}
                        >
                          <i className="bi bi-check-circle me-2" />
                          Complete Consultation
                        </button>
                      </div>
                    )}

                    {selectedPatient.queueToken?.status === 'IN_CONSULTATION' && !recordSaved && (
                      <small className="text-muted d-block text-end mt-2">
                        Save the medical record first, then complete the consultation.
                      </small>
                    )}
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}