import { useState } from 'react'

function initialFormValues(fields, initialValues) {
  return fields.reduce((values, field) => {
    const current = initialValues?.[field.name]
    values[field.name] = Array.isArray(current)
      ? current.join(', ')
      : (current ?? field.defaultValue ?? '')
    return values
  }, {})
}

export default function FormModal({
  open,
  title,
  fields,
  initialValues,
  submitLabel = 'Save',
  onClose,
  onSubmit,
}) {
  if (!open) return null

  return (
    <FormModalContent
      title={title}
      fields={fields}
      initialValues={initialValues}
      submitLabel={submitLabel}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  )
}

function FormModalContent({
  title,
  fields,
  initialValues,
  submitLabel,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(() => initialFormValues(fields, initialValues))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function updateValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = fields.reduce((result, field) => {
      const value = values[field.name]
      if (field.type === 'number') {
        result[field.name] = Number(value)
      } else if (field.type === 'csv') {
        result[field.name] = String(value)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      } else {
        result[field.name] = value
      }
      return result
    }, {})

    try {
      await onSubmit(payload)
      onClose()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="form-modal-title">{title}</h2>
          <button className="icon-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {fields.map((field) => (
              <label
                className={`field ${field.fullWidth ? 'field-full' : ''}`}
                key={field.name}
              >
                <span>{field.label}</span>
                {field.type === 'select' ? (
                  <select
                    value={values[field.name]}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                    required={field.required}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows="4"
                    value={values[field.name]}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type={field.type === 'csv' ? 'text' : field.type || 'text'}
                    value={values[field.name]}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    placeholder={field.placeholder}
                  />
                )}
              </label>
            ))}
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button className="button secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="button primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
