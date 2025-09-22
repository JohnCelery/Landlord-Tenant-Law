export type CSVCell = string | number | boolean | null | undefined

const escapeCell = (value: CSVCell): string => {
  if (value === null || typeof value === 'undefined') {
    return ''
  }

  const stringValue = String(value)
  const needsQuotes = /[",\n]/.test(stringValue)
  const escaped = stringValue.replace(/"/g, '""')

  return needsQuotes ? `"${escaped}"` : escaped
}

export const toCSV = (rows: CSVCell[][]): string => {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\n')
}

export const downloadCSV = (filename: string, rows: CSVCell[][]) => {
  const csv = toCSV(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.setAttribute('download', filename)
  anchor.click()

  URL.revokeObjectURL(url)
}
