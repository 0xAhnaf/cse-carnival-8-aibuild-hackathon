import ResourceManager from '../components/ResourceManager.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const fields = [
  { name: 'course', label: 'Course code', required: true },
  { name: 'course_title', label: 'Course title', required: true, fullWidth: true },
  { name: 'title', label: 'Assignment title', required: true, fullWidth: true },
  { name: 'description', label: 'Description', type: 'textarea', required: true, fullWidth: true },
  { name: 'assigned_date', label: 'Assigned date', type: 'date', required: true },
  { name: 'deadline', label: 'Deadline', type: 'date', required: true },
  { name: 'submission_platform', label: 'Submission platform', required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: ['pending', 'submitted', 'graded', 'late'],
  },
  { name: 'marks', label: 'Marks', type: 'number', min: 0, required: true },
]

const columns = [
  { key: 'course', label: 'Course' },
  { key: 'title', label: 'Assignment' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'submission_platform', label: 'Platform' },
  { key: 'status', label: 'Status', render: (value) => <StatusBadge value={value} /> },
  { key: 'marks', label: 'Marks' },
]

export default function AssignmentsPage() {
  return (
    <ResourceManager
      resource="assignments"
      title="Assignments"
      subtitle="Track coursework, deadlines, submission status, and marks."
      actionLabel="Add assignment"
      fields={fields}
      columns={columns}
      searchFields={['course', 'course_title', 'title', 'description', 'submission_platform']}
      filters={[
        {
          name: 'status',
          label: 'statuses',
          options: ['pending', 'submitted', 'graded', 'late'],
        },
      ]}
    />
  )
}
