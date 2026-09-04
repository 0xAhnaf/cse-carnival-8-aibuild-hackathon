import { useState } from 'react'
import FormModal from '../components/FormModal.jsx'
import ResourceManager from '../components/ResourceManager.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { roomApi } from '../services/api.js'

const roomFields = [
  { name: 'room_number', label: 'Room number', required: true, placeholder: '7A01' },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: ['classroom', 'lab', 'seminar'],
  },
  { name: 'capacity', label: 'Capacity', type: 'number', min: 1, required: true },
  {
    name: 'equipment',
    label: 'Equipment',
    type: 'csv',
    required: true,
    fullWidth: true,
    placeholder: 'projector, AC, whiteboard',
  },
  { name: 'floor', label: 'Floor', type: 'number', min: 1, required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: ['available', 'unavailable'],
  },
]

const bookingFields = [
  { name: 'booked_by', label: 'Booked by', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'start_time', label: 'Start time', type: 'time', required: true },
  { name: 'end_time', label: 'End time', type: 'time', required: true },
  { name: 'purpose', label: 'Purpose', required: true, fullWidth: true },
]

export default function RoomsPage() {
  const [bookingRoom, setBookingRoom] = useState(null)
  const [bookingListRoom, setBookingListRoom] = useState(null)
  const [reloadAfterBooking, setReloadAfterBooking] = useState(null)
  const [bookingError, setBookingError] = useState('')

  const columns = [
    { key: 'room_number', label: 'Room' },
    { key: 'type', label: 'Type' },
    { key: 'capacity', label: 'Capacity', render: (value) => `${value} people` },
    {
      key: 'equipment',
      label: 'Equipment',
      render: (value) => (Array.isArray(value) ? value.join(', ') : '—'),
    },
    { key: 'floor', label: 'Floor' },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge value={value} /> },
  ]

  function openBooking(record, reload) {
    setBookingRoom(record)
    setReloadAfterBooking(() => reload)
  }

  async function createBooking(values) {
    await roomApi.book(bookingRoom.id, values)
    await reloadAfterBooking?.()
  }

  async function cancelBooking(roomId, bookingId) {
    setBookingError('')
    try {
      await roomApi.cancel(roomId, bookingId)
      setBookingListRoom(null)
      await reloadAfterBooking?.()
    } catch (error) {
      setBookingError(error.message)
    }
  }

  return (
    <>
      <ResourceManager
        resource="rooms"
        title="Rooms"
        subtitle="Manage facilities, equipment, availability, and room bookings."
        actionLabel="Add room"
        fields={roomFields}
        columns={columns}
        searchFields={['room_number', 'type', 'equipment']}
        createDefaults={{ bookings: [] }}
        filters={[
          { name: 'type', label: 'types', options: ['classroom', 'lab', 'seminar'] },
          { name: 'status', label: 'statuses', options: ['available', 'unavailable'] },
        ]}
        renderExtraActions={(record, { reload }) => (
          <>
            <button
              className="table-button"
              type="button"
              onClick={() => openBooking(record, reload)}
            >
              Book
            </button>
            {record.bookings?.length > 0 && (
              <button
                className="icon-button"
                type="button"
                onClick={() => {
                  setBookingListRoom(record)
                  setReloadAfterBooking(() => reload)
                  setBookingError('')
                }}
              >
                Bookings ({record.bookings.length})
              </button>
            )}
          </>
        )}
      />

      <FormModal
        open={Boolean(bookingRoom)}
        title={`Book ${bookingRoom?.room_number || 'room'}`}
        fields={bookingFields}
        onClose={() => setBookingRoom(null)}
        onSubmit={createBooking}
        submitLabel="Confirm booking"
      />

      {bookingListRoom && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setBookingListRoom(null)}>
          <section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{bookingListRoom.room_number} bookings</h2>
              <button className="icon-close" type="button" onClick={() => setBookingListRoom(null)}>×</button>
            </div>
            <div className="record-list">
              {bookingListRoom.bookings.map((booking) => (
                <article className="record-list-item" key={booking.booking_id}>
                  <div>
                    <strong>{booking.date} · {booking.start_time}–{booking.end_time}</strong>
                    <p>{booking.booked_by} · {booking.purpose}</p>
                  </div>
                  <button
                    className="button danger-button small-button"
                    type="button"
                    onClick={() => cancelBooking(bookingListRoom.id, booking.booking_id)}
                  >
                    Cancel
                  </button>
                </article>
              ))}
            </div>
            {bookingError && <p className="form-error">{bookingError}</p>}
          </section>
        </div>
      )}
    </>
  )
}
