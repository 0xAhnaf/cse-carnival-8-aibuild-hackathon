import { useCallback, useEffect, useState } from 'react'
import { resourceApi } from '../services/api.js'

export default function useResource(resource) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await resourceApi.list(resource)
      setRecords(Array.isArray(result) ? result : [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [resource])

  useEffect(() => {
    const loadTimer = window.setTimeout(reload, 0)
    return () => window.clearTimeout(loadTimer)
  }, [reload])

  async function createRecord(values) {
    const created = await resourceApi.create(resource, values)
    if (created?.id) {
      setRecords((current) => [...current, created])
    } else {
      await reload()
    }
    return created
  }

  async function updateRecord(id, values) {
    const updated = await resourceApi.update(resource, id, values)
    if (updated?.id) {
      setRecords((current) =>
        current.map((record) => (record.id === id ? updated : record)),
      )
    } else {
      await reload()
    }
    return updated
  }

  async function deleteRecord(id) {
    await resourceApi.remove(resource, id)
    setRecords((current) => current.filter((record) => record.id !== id))
  }

  return {
    records,
    loading,
    error,
    setError,
    reload,
    createRecord,
    updateRecord,
    deleteRecord,
  }
}
