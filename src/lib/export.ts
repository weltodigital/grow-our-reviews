import type { ReviewRequest } from '@/app/dashboard/requests/page'

export function exportToCSV(data: ReviewRequest[], filename: string = 'review-requests') {
  if (data.length === 0) {
    alert('No data to export')
    return
  }

  // Define CSV headers
  const headers = [
    'Customer Name',
    'Phone Number',
    'Status',
    'Created At',
    'Scheduled For',
    'Sent At',
    'Clicked At',
    'Nudge Sent',
    'Nudge Sent At',
    'Review Link',
  ]

  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(request => [
      `"${request.customer_name}"`,
      `"${request.customer_phone}"`,
      request.status,
      new Date(request.created_at).toISOString(),
      new Date(request.scheduled_for).toISOString(),
      request.sent_at ? new Date(request.sent_at).toISOString() : '',
      request.clicked_at ? new Date(request.clicked_at).toISOString() : '',
      request.nudge_sent ? 'Yes' : 'No',
      request.nudge_sent_at ? new Date(request.nudge_sent_at).toISOString() : '',
      `"${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${request.token}"`
    ].join(','))
  ].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function formatRequestsForExport(requests: ReviewRequest[]): ReviewRequest[] {
  // Sort by created_at descending (newest first)
  return [...requests].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}