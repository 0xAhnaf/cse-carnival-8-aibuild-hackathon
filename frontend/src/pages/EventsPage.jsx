import { useState } from 'react'
import FormModal from '../components/FormModal.jsx'
import ResourceManager from '../components/ResourceManager.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { eventApi } from '../services/api.js'

const eventFields = [
  { name: 'name', label: 'Event name', required: true, fullWidth: true },
  { name: 'description', label: 'Description', type: 'textarea', required: true, fullWidth: true },
  { name: 'date', label: 'Start date', type: 'date', required: true },
  { name: 'end_date', label: 'End date', type: 'date', required: true },
  { name: 'start_time', label: 'Start time', type: 'time', required: true },
  { name: 'end_time', label: 'End time', type: 'time', required: true },
  { name: 'venue', label: 'Venue', required: true },
  { name: 'organizer', label: 'Organizer', required: true },
  { name: 'capacity', label: 'Capacity', type: 'number', min: 1, required: true },
  { name: 'status', label: 'Status', type: 'select', required: true, options: ['upcoming', 'ongoing', 'completed', 'cancelled', 'full'] },
]
const registrationFields = [
  { name: 'student_id', label: 'Student ID', required: true, placeholder: '20-40532' },
  { name: 'name', label: 'Student name', required: true },
]

export default function EventsPage() {
  const [registeringEvent, setRegisteringEvent] = useState(null)
  const [registrationsEvent, setRegistrationsEvent] = useState(null)
  const [reloadAfterAction, setReloadAfterAction] = useState(null)
  const [actionError, setActionError] = useState('')
  const columns = [
    { key: 'name', label: 'Event' }, { key: 'date', label: 'Date' },
    { key: 'start_time', label: 'Time', render: (value, record) => `${value}–${record.end_time}` },
    { key: 'venue', label: 'Venue' }, { key: 'organizer', label: 'Organizer' },
    { key: 'registered', label: 'Registration', render: (value, record) => `${value ?? 0}/${record.capacity}` },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge value={value} /> },
  ]

  async function registerStudent(values) { await eventApi.register(registeringEvent.id, values); await reloadAfterAction?.() }
  async function cancelRegistration(eventId, studentId) {
    setActionError('')
    try { await eventApi.cancel(eventId, studentId); setRegistrationsEvent(null); await reloadAfterAction?.() }
    catch (error) { setActionError(error.message) }
  }

  return <>
    <ResourceManager
      resource="events" title="Events" subtitle="Manage campus events, capacity, venues, and registrations."
      actionLabel="Create event" fields={eventFields} columns={columns} searchFields={['name', 'description', 'venue', 'organizer']}
      createDefaults={{ registered: 0, registrations: [], status: 'upcoming' }}
      filters={[{ name: 'status', label: 'statuses', options: ['upcoming', 'ongoing', 'completed', 'cancelled', 'full'] }]}
      renderExtraActions={(record, { reload }) => {
        const registrationClosed = ['full', 'cancelled', 'completed'].includes(record.status) || Number(record.registered) >= Number(record.capacity)
        return <>
          <button className="table-button" type="button" disabled={registrationClosed} title={registrationClosed ? 'Registration is closed' : 'Register for event'} onClick={() => { setRegisteringEvent(record); setReloadAfterAction(() => reload) }}>Register</button>
          {record.registrations?.length > 0 && <button className="icon-button" type="button" onClick={() => { setRegistrationsEvent(record); setReloadAfterAction(() => reload); setActionError('') }}>Attendees ({record.registrations.length})</button>}
        </>
      }}
    />
    <FormModal open={Boolean(registeringEvent)} title={`Register for ${registeringEvent?.name || 'event'}`} fields={registrationFields} onClose={() => setRegisteringEvent(null)} onSubmit={registerStudent} submitLabel="Register" />
    {registrationsEvent && <div className="modal-backdrop" role="presentation" onMouseDown={() => setRegistrationsEvent(null)}>
      <section className="modal-card" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header"><h2>Event registrations</h2><button className="icon-close" type="button" onClick={() => setRegistrationsEvent(null)}>×</button></div>
        <div className="record-list">{registrationsEvent.registrations.map((student) => <article className="record-list-item" key={student.student_id}>
          <div><strong>{student.name}</strong><p>{student.student_id}</p></div>
          <button className="button danger-button small-button" type="button" onClick={() => cancelRegistration(registrationsEvent.id, student.student_id)}>Cancel</button>
        </article>)}</div>
        {actionError && <p className="form-error">{actionError}</p>}
      </section>
    </div>}
  </>
}
