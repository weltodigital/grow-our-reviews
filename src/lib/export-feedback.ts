import type { FeedbackItem } from '@/app/dashboard/feedback/page'

export function exportFeedbackToCSV(data: FeedbackItem[], filename: string = 'customer-feedback') {
  if (data.length === 0) {
    alert('No feedback data to export')
    return
  }

  // Define CSV headers
  const headers = [
    'Customer Name',
    'Phone Number',
    'Rating',
    'Comment',
    'Received At',
    'Review Request ID',
  ]

  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      `"${item.customer_name}"`,
      `"${item.customer_phone}"`,
      item.rating,
      `"${item.comment || 'No comment provided'}"`,
      new Date(item.created_at).toISOString(),
      item.review_request_id
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

export function formatFeedbackForExport(feedback: FeedbackItem[]): FeedbackItem[] {
  // Sort by created_at descending (newest first)
  return [...feedback].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export function generateFeedbackSummary(feedback: FeedbackItem[]): string {
  if (feedback.length === 0) return 'No feedback data available'

  const totalFeedback = feedback.length
  const averageRating = feedback.reduce((sum, item) => sum + item.rating, 0) / totalFeedback
  const ratingDistribution = {
    1: feedback.filter(f => f.rating === 1).length,
    2: feedback.filter(f => f.rating === 2).length,
    3: feedback.filter(f => f.rating === 3).length,
    4: feedback.filter(f => f.rating === 4).length,
    5: feedback.filter(f => f.rating === 5).length,
  }

  const withComments = feedback.filter(f => f.comment && f.comment.trim()).length
  const commentRate = (withComments / totalFeedback) * 100

  return `
FEEDBACK SUMMARY REPORT
Generated: ${new Date().toLocaleString('en-GB')}

Total Feedback Received: ${totalFeedback}
Average Rating: ${averageRating.toFixed(1)} stars
Feedback with Comments: ${withComments} (${commentRate.toFixed(1)}%)

RATING BREAKDOWN:
1 Star: ${ratingDistribution[1]} (${((ratingDistribution[1] / totalFeedback) * 100).toFixed(1)}%)
2 Stars: ${ratingDistribution[2]} (${((ratingDistribution[2] / totalFeedback) * 100).toFixed(1)}%)
3 Stars: ${ratingDistribution[3]} (${((ratingDistribution[3] / totalFeedback) * 100).toFixed(1)}%)
4 Stars: ${ratingDistribution[4]} (${((ratingDistribution[4] / totalFeedback) * 100).toFixed(1)}%)
5 Stars: ${ratingDistribution[5]} (${((ratingDistribution[5] / totalFeedback) * 100).toFixed(1)}%)

CRITICAL ISSUES (1-2 Stars): ${ratingDistribution[1] + ratingDistribution[2]}
IMPROVEMENT OPPORTUNITIES (3 Stars): ${ratingDistribution[3]}
POSITIVE FEEDBACK (4-5 Stars): ${ratingDistribution[4] + ratingDistribution[5]}
  `.trim()
}