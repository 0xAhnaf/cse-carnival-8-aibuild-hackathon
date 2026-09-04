import { useState } from 'react'

export default function ConfirmDialog({ open, title, message, onClose, onConfirm }) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleConfirm() {
    setWorking(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (confirmError) {
      setError(confirmError.message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-card confirm-card"
        role="alertdialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="danger-mark" aria-hidden="true">!</div>
        <h2>{title}</h2>
        <p>{message}</p>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button className="button secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button danger-button" type="button" onClick={handleConfirm} disabled={working}>
            {working ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </section>
    </div>
  )
}
