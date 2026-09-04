import ResourceManager from '../components/ResourceManager.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const fields = [
  { name: 'title', label: 'Title', required: true, fullWidth: true },
  { name: 'body', label: 'Announcement', type: 'textarea', required: true, fullWidth: true },
  { name: 'date', label: 'Posted date', type: 'date', required: true },
  {
    name: 'priority',
    label: 'Priority',
    type: 'select',
    required: true,
    options: ['high', 'medium', 'low'],
  },
  { name: 'posted_by', label: 'Posted by', required: true },
  { name: 'expires', label: 'Expiry date', type: 'date', required: true },
]

const columns = [
  { key: 'title', label: 'Title' },
  {
    key: 'body',
    label: 'Announcement',
    render: (value) => <span className="clamp-text">{value}</span>,
  },
  { key: 'date', label: 'Posted' },
  { key: 'priority', label: 'Priority', render: (value) => <StatusBadge value={value} /> },
  { key: 'posted_by', label: 'Posted by' },
  { key: 'expires', label: 'Expires' },
]

export default function AnnouncementsPage() {
  return (
    <ResourceManager
      resource="announcements"
      title="Announcements"
      subtitle="Publish and maintain current campus notices and alerts."
      actionLabel="Post announcement"
      fields={fields}
      columns={columns}
      searchFields={['title', 'body', 'posted_by']}
      filters={[
        { name: 'priority', label: 'priorities', options: ['high', 'medium', 'low'] },
      ]}
    />
  )
}
