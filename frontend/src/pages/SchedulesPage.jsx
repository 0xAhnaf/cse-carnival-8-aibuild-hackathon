import ResourceManager from '../components/ResourceManager.jsx'

const fields = [
  { name: 'course', label: 'Course code', required: true, placeholder: 'CSE 4113' },
  { name: 'title', label: 'Course title', required: true, fullWidth: true },
  {
    name: 'day',
    label: 'Day',
    type: 'select',
    required: true,
    options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  },
  { name: 'start_time', label: 'Start time', type: 'time', required: true },
  { name: 'end_time', label: 'End time', type: 'time', required: true },
  { name: 'room', label: 'Room', required: true, placeholder: '7A03' },
  { name: 'instructor', label: 'Instructor', required: true },
  { name: 'section', label: 'Section', required: true, placeholder: 'B' },
]

const columns = [
  { key: 'course', label: 'Course' },
  { key: 'title', label: 'Title' },
  { key: 'day', label: 'Day' },
  {
    key: 'start_time',
    label: 'Time',
    render: (value, record) => `${value}–${record.end_time}`,
  },
  { key: 'room', label: 'Room' },
  { key: 'instructor', label: 'Instructor' },
  { key: 'section', label: 'Section' },
]

export default function SchedulesPage() {
  return (
    <ResourceManager
      resource="schedules"
      title="Schedules"
      subtitle="Manage weekly classes, rooms, instructors, and sections."
      actionLabel="Add schedule"
      fields={fields}
      columns={columns}
      searchFields={['course', 'title', 'room', 'instructor', 'section']}
      filters={[
        {
          name: 'day',
          label: 'days',
          options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        },
      ]}
    />
  )
}
