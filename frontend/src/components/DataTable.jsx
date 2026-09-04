export default function DataTable({
  columns,
  records,
  onEdit,
  onDelete,
  renderExtraActions,
  emptyMessage = 'No records found.',
}) {
  if (!records.length) {
    return <div className="empty-state">{emptyMessage}</div>
  }

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.label}>
                  {column.render
                    ? column.render(record[column.key], record)
                    : record[column.key] || '—'}
                </td>
              ))}
              <td className="table-actions" data-label="Actions">
                {renderExtraActions?.(record)}
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => onEdit(record)}
                  aria-label={`Edit ${record.id}`}
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  className="icon-button danger-text"
                  type="button"
                  onClick={() => onDelete(record)}
                  aria-label={`Delete ${record.id}`}
                  title="Delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
