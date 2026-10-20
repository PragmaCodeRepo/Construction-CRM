export const outstanding = (record) => Math.max(0, Number(record.amount || 0) - Number(record.paid || 0))
export const openPipeline = (leads) => leads.filter((lead) => !['Won', 'Lost'].includes(lead.stage)).reduce((total, lead) => total + Number(lead.value || 0), 0)
export const activeProjects = (projects) => projects.filter((project) => !['Completed', 'Cancelled'].includes(project.status))
export const overdueInvoices = (invoices, today = new Date()) => invoices.filter((invoice) => invoice.kind === 'Invoice' && outstanding(invoice) > 0 && new Date(`${invoice.dueDate}T23:59:59`) < today)
export const invoiceAging = (invoices) => {
  const buckets = { Current: 0, '1–30 days': 0, '31–60 days': 0, '61+ days': 0 }
  const now = new Date()
  invoices.filter((invoice) => invoice.kind === 'Invoice' && outstanding(invoice) > 0).forEach((invoice) => {
    const due = new Date(`${invoice.dueDate}T00:00:00`)
    const days = Math.floor((new Date(now.toDateString()) - due) / 86400000)
    const key = days <= 0 ? 'Current' : days <= 30 ? '1–30 days' : days <= 60 ? '31–60 days' : '61+ days'
    buckets[key] += outstanding(invoice)
  })
  return buckets
}
export const revisedContract = (project, variations) => project.originalContractValue + variations.filter((variation) => variation.projectId === project.id && variation.status === 'Approved').reduce((sum, variation) => sum + variation.amount, 0)
export const money = (value, currency = 'AUD') => new Intl.NumberFormat('en-AU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0))
export const shortDate = (value) => value ? new Intl.DateTimeFormat('en-AU', { day:'numeric', month:'short', year:'numeric' }).format(new Date(`${value}T00:00:00`)) : '—'
export const daysFromNow = (value) => Math.ceil((new Date(`${value}T00:00:00`) - new Date(new Date().toDateString())) / 86400000)

export const csvDownload = (name, rows) => {
  if (!rows.length) return false
  const columns = Object.keys(rows[0])
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const content = [columns.map(escape).join(','), ...rows.map((row) => columns.map((key) => escape(row[key])).join(','))].join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type:'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
