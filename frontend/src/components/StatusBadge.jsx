export default function StatusBadge({ value }) {
  const label = String(value || 'unknown').replaceAll('_', ' ')
  const normalized = label.toLowerCase()
  let tone = 'neutral'

  if (['available', 'upcoming', 'ongoing', 'submitted', 'graded'].includes(normalized)) {
    tone = 'success'
  } else if (['pending', 'medium', 'full', 'late'].includes(normalized)) {
    tone = 'warning'
  } else if (['high', 'cancelled', 'unavailable'].includes(normalized)) {
    tone = 'danger'
  }

  return <span className={`status-badge status-${tone}`}>{label}</span>
}
