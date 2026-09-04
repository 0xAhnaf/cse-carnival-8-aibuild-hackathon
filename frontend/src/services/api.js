const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
).replace(/\/$/, '')

export const API_PATHS = {
  schedules: '/schedules',
  rooms: '/rooms',
  events: '/events',
  announcements: '/announcements',
  assignments: '/assignments',
  agent: '/agent/chat',
}

function unwrap(payload) {
  if (payload == null) return payload
  if (Object.prototype.hasOwnProperty.call(payload, 'data')) return payload.data
  if (Object.prototype.hasOwnProperty.call(payload, 'items')) return payload.items
  return payload
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const text = await response.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { message: text }
    }
  }

  if (!response.ok) {
    const message =
      payload?.message || payload?.error || `Request failed (${response.status})`
    throw new Error(message)
  }

  return unwrap(payload)
}

export const resourceApi = {
  list(resource) {
    return request(API_PATHS[resource])
  },
  create(resource, values) {
    return request(API_PATHS[resource], {
      method: 'POST',
      body: JSON.stringify(values),
    })
  },
  update(resource, id, values) {
    return request(`${API_PATHS[resource]}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(values),
    })
  },
  remove(resource, id) {
    return request(`${API_PATHS[resource]}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}

export const roomApi = {
  book(roomId, booking) {
    return request(`${API_PATHS.rooms}/${encodeURIComponent(roomId)}/bookings`, {
      method: 'POST',
      body: JSON.stringify(booking),
    })
  },
  cancel(roomId, bookingId) {
    return request(
      `${API_PATHS.rooms}/${encodeURIComponent(roomId)}/bookings/${encodeURIComponent(bookingId)}`,
      { method: 'DELETE' },
    )
  },
}

export const eventApi = {
  register(eventId, student) {
    return request(
      `${API_PATHS.events}/${encodeURIComponent(eventId)}/registrations`,
      { method: 'POST', body: JSON.stringify(student) },
    )
  },
  cancel(eventId, studentId) {
    return request(
      `${API_PATHS.events}/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(studentId)}`,
      { method: 'DELETE' },
    )
  },
}

export const agentApi = {
  chat(message, context = {}) {
    return request(API_PATHS.agent, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    })
  },
}

export { API_BASE_URL }
