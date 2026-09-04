import { useMemo, useState } from 'react'
import useResource from '../hooks/useResource.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import DataTable from './DataTable.jsx'
import FormModal from './FormModal.jsx'
import LoadingState from './LoadingState.jsx'

export default function ResourceManager({
  resource,
  title,
  subtitle,
  actionLabel,
  fields,
  columns,
  searchFields,
  filters = [],
  createDefaults = {},
  renderExtraActions,
}) {
  const api = useResource(resource)
  const [query, setQuery] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const [editingRecord, setEditingRecord] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState(null)

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return api.records.filter((record) => {
      const matchesSearch =
        !normalizedQuery ||
        searchFields.some((field) =>
          String(record[field] ?? '').toLowerCase().includes(normalizedQuery),
        )
      const matchesFilters = filters.every((filter) => {
        const selected = filterValues[filter.name]
        return !selected || String(record[filter.name]) === selected
      })
      return matchesSearch && matchesFilters
    })
  }, [api.records, filterValues, filters, query, searchFields])

  function openCreate() {
    setEditingRecord(null)
    setFormOpen(true)
  }

  function openEdit(record) {
    setEditingRecord(record)
    setFormOpen(true)
  }

  async function saveRecord(values) {
    if (editingRecord) {
      await api.updateRecord(editingRecord.id, values)
    } else {
      await api.createRecord({ ...createDefaults, ...values })
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Campus data manager</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button className="button primary-button" type="button" onClick={openCreate}>
          + {actionLabel}
        </button>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <span className="sr-only">Search {title}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
          />
        </label>
        {filters.map((filter) => (
          <label className="filter-field" key={filter.name}>
            <span className="sr-only">{filter.label}</span>
            <select
              value={filterValues[filter.name] || ''}
              onChange={(event) =>
                setFilterValues((current) => ({
                  ...current,
                  [filter.name]: event.target.value,
                }))
              }
            >
              <option value="">All {filter.label}</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button className="button secondary-button" type="button" onClick={api.reload}>
          Refresh
        </button>
      </div>

      {api.error && (
        <div className="error-banner">
          <span>{api.error}</span>
          <button type="button" onClick={api.reload}>Retry</button>
        </div>
      )}

      {api.loading ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          records={filteredRecords}
          onEdit={openEdit}
          onDelete={setDeletingRecord}
          renderExtraActions={(record) =>
            renderExtraActions?.(record, { reload: api.reload })
          }
          emptyMessage={`No ${title.toLowerCase()} match the current filters.`}
        />
      )}

      <FormModal
        open={formOpen}
        title={editingRecord ? `Edit ${title}` : actionLabel}
        fields={fields}
        initialValues={editingRecord || createDefaults}
        submitLabel={editingRecord ? 'Save changes' : actionLabel}
        onClose={() => setFormOpen(false)}
        onSubmit={saveRecord}
      />

      <ConfirmDialog
        open={Boolean(deletingRecord)}
        title={`Delete ${title.replace(/s$/, '')}?`}
        message="This action removes the record from the live campus backend."
        onClose={() => setDeletingRecord(null)}
        onConfirm={() => api.deleteRecord(deletingRecord.id)}
      />
    </section>
  )
}
