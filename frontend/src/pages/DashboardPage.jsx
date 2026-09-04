import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingState from '../components/LoadingState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { resourceApi } from '../services/api.js'

const emptyData = {
  schedules: [],
  rooms: [],
  events: [],
  announcements: [],
  assignments: [],
}

export default function DashboardPage() {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')
    const resources = Object.keys(emptyData)
    const results = await Promise.allSettled(
      resources.map((resource) => resourceApi.list(resource)),
    )

    const nextData = { ...emptyData }
    const failures = []
    results.forEach((result, index) => {
      const resource = resources[index]
      if (result.status === 'fulfilled') {
        nextData[resource] = Array.isArray(result.value) ? result.value : []
      } else {
        failures.push(resource)
      }
    })

    setData(nextData)
    if (failures.length) {
      setError(`Could not load: ${failures.join(', ')}`)
    }
    setLoading(false)
  }

  useEffect(() => {
    const loadTimer = window.setTimeout(loadDashboard, 0)
    return () => window.clearTimeout(loadTimer)
  }, [])

  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
    new Date(),
  )

  const todaySchedules = useMemo(
    () =>
      data.schedules
        .filter((item) => item.day === todayName)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [data.schedules, todayName],
  )

  const highPriority = data.announcements
    .filter((item) => item.priority === 'high')
    .slice(0, 3)

  const upcomingEvents = data.events
    .filter((item) => ['upcoming', 'ongoing'].includes(item.status))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  const pendingAssignments = data.assignments.filter((item) =>
    ['pending', 'late'].includes(item.status),
  )

  const metrics = [
    { label: "Today's classes", value: todaySchedules.length, note: todayName, to: '/schedules' },
    {
      label: 'Available rooms',
      value: data.rooms.filter((item) => item.status === 'available').length,
      note: `${data.rooms.length} total rooms`,
      to: '/rooms',
    },
    {
      label: 'Upcoming events',
      value: upcomingEvents.length,
      note: 'Open campus activities',
      to: '/events',
    },
    {
      label: 'Pending assignments',
      value: pendingAssignments.length,
      note: 'Check upcoming deadlines',
      to: '/assignments',
    },
  ]

  if (loading) return <LoadingState label="Loading the campus dashboard…" />

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Live campus overview</p>
          <h1>Campus dashboard</h1>
          <p>Schedules, rooms, deadlines, and notices in one place.</p>
        </div>
        <Link className="button primary-button" to="/assistant">
          Ask CampusOS AI
        </Link>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={loadDashboard}>Retry</button>
        </div>
      )}

      <div className="metric-grid">
        {metrics.map((metric) => (
          <Link className="metric-card" to={metric.to} key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="content-card content-card-wide">
          <div className="card-heading">
            <div>
              <h2>Today’s schedule</h2>
              <p>{todayName}</p>
            </div>
            <Link to="/schedules">View all</Link>
          </div>
          <div className="compact-list">
            {todaySchedules.length ? (
              todaySchedules.slice(0, 5).map((schedule) => (
                <article key={schedule.id}>
                  <time>{schedule.start_time}</time>
                  <div>
                    <strong>{schedule.course} · {schedule.title}</strong>
                    <p>{schedule.room} · {schedule.instructor}</p>
                  </div>
                  <span className="soft-chip">Section {schedule.section}</span>
                </article>
              ))
            ) : (
              <p className="inline-empty">No classes scheduled for today.</p>
            )}
          </div>
        </section>

        <section className="content-card">
          <div className="card-heading">
            <div>
              <h2>Important announcements</h2>
              <p>High-priority campus updates</p>
            </div>
            <Link to="/announcements">View all</Link>
          </div>
          <div className="notice-list">
            {highPriority.length ? (
              highPriority.map((notice) => (
                <article key={notice.id}>
                  <StatusBadge value={notice.priority} />
                  <strong>{notice.title}</strong>
                  <small>Expires {notice.expires}</small>
                </article>
              ))
            ) : (
              <p className="inline-empty">No high-priority announcements.</p>
            )}
          </div>
        </section>

        <section className="content-card">
          <div className="card-heading">
            <div>
              <h2>Upcoming events</h2>
              <p>Campus activities</p>
            </div>
            <Link to="/events">View all</Link>
          </div>
          <div className="notice-list">
            {upcomingEvents.length ? (
              upcomingEvents.map((event) => (
                <article key={event.id}>
                  <span className="soft-chip">{event.date}</span>
                  <strong>{event.name}</strong>
                  <small>{event.start_time} · {event.venue}</small>
                </article>
              ))
            ) : (
              <p className="inline-empty">No upcoming events.</p>
            )}
          </div>
        </section>

        <section className="content-card ai-shortcut">
          <div className="ai-mark">AI</div>
          <div>
            <h2>CampusOS Assistant</h2>
            <p>Ask about live schedules, deadlines, rooms, and events.</p>
          </div>
          <Link className="button secondary-button" to="/assistant">Open chat</Link>
        </section>
      </div>
    </section>
  )
}
