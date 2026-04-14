'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Upload, CheckCircle, AlertCircle, XCircle, Users, GripVertical, ArrowUp, ArrowDown, Check, Square, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

interface BulkUploadProps {
  user: User
  profile: Database['public']['Tables']['profiles']['Row']
  userStats: {
    requestsSent: number
    monthlyLimit: number
    requestsRemaining: number
  }
}

interface CsvRow {
  name: string
  phone: string
}

interface DuplicateAnalysis {
  phoneNumber: string
  riskLevel: 'none' | 'info' | 'warning' | 'critical'
  canProceed: boolean
  message: string
  reason?: string
}

interface ValidatedRow extends CsvRow {
  rowIndex: number
  status: 'valid' | 'error' | 'warning' | 'critical'
  errors: string[]
  normalizedPhone: string
  duplicateAnalysis?: DuplicateAnalysis
  selected: boolean
  priority: number
}

interface UploadHistory {
  date: string
  customersUploaded: number
  requestsSent: number
  reviewsReceived: number
}

interface UploadBatch {
  created_at: string
  customer_count: number
  requests_sent: number
  requests_completed: number
}

const EXAMPLE_DATA: CsvRow[] = [
  { name: 'Example Customer', phone: '7868287177' }
]

export function BulkUpload({ user, profile, userStats }: BulkUploadProps) {
  const [uploadStep, setUploadStep] = useState<'upload' | 'preview' | 'processing' | 'success'>('upload')
  const [csvData, setCsvData] = useState<ValidatedRow[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [uploadHistory, setUploadHistory] = useState<UploadBatch[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [savePendingCustomers, setSavePendingCustomers] = useState(true)
  const router = useRouter()

  // Fetch upload history
  useEffect(() => {
    const fetchUploadHistory = async () => {
      try {
        const response = await fetch('/api/bulk-upload/history')
        if (response.ok) {
          const data = await response.json()
          setUploadHistory(data.history || [])
        }
      } catch (error) {
        console.error('Error fetching upload history:', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchUploadHistory()
  }, [uploadStep]) // Refetch when upload step changes (to show new uploads)

  // Normalize UK phone numbers to E.164 format
  const normalizePhoneNumber = (phone: string): { normalized: string; isValid: boolean } => {
    // Remove apostrophe prefix if present (Excel text format indicator)
    let cleanPhone = phone.replace(/^'/, '')

    // Remove all non-digits
    const digits = cleanPhone.replace(/\D/g, '')

    let normalized = ''
    let isValid = false

    // Accept UK mobile format: 07xxxxxxxxx (11 digits) or 7xxxxxxxxx (10 digits, missing leading zero)
    if (digits.startsWith('07') && digits.length === 11) {
      // Standard format with leading zero
      normalized = `+44${digits.slice(1)}`
      isValid = true
    } else if (digits.startsWith('7') && digits.length === 10) {
      // Missing leading zero - add it back
      normalized = `+44${digits}`
      isValid = true
    }

    return { normalized, isValid }
  }

  // Validate CSV data
  const validateCsvData = useCallback(async (data: CsvRow[]): Promise<ValidatedRow[]> => {
    const validatedRows: ValidatedRow[] = []
    const phoneNumbers = new Set()

    // Check for existing customers to detect duplicates
    const response = await fetch('/api/customers/check-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumbers: data.map(row => {
          const { normalized } = normalizePhoneNumber(row.phone)
          return normalized
        }).filter(Boolean)
      })
    })

    const duplicateData = response.ok ? await response.json() : { analysis: { details: { blocked: [], warnings: [], info: [], safe: [] } } }

    data.forEach((row, index) => {
      const errors: string[] = []
      let status: ValidatedRow['status'] = 'valid'

      // Validate name
      if (!row.name || row.name.trim().length < 2) {
        errors.push('Name missing or too short')
        status = 'error'
      }

      // Validate phone
      if (!row.phone) {
        errors.push('Phone number missing')
        status = 'error'
      } else {
        const { normalized, isValid } = normalizePhoneNumber(row.phone)

        if (!isValid) {
          errors.push('Invalid UK mobile number')
          status = 'error'
        } else {
          // Check for duplicates within upload
          if (phoneNumbers.has(normalized)) {
            errors.push(`Duplicate phone number (row ${Array.from(phoneNumbers).indexOf(normalized) + 1})`)
            status = status === 'error' ? 'error' : 'warning'
          } else {
            phoneNumbers.add(normalized)
          }

          // Check for duplicate analysis
          const duplicateInfo = findDuplicateInfo(normalized, duplicateData)
          if (duplicateInfo) {
            if (duplicateInfo.riskLevel === 'critical') {
              errors.push(`🚫 ${duplicateInfo.message}`)
              status = 'critical'
            } else if (duplicateInfo.riskLevel === 'warning') {
              errors.push(`⚠️ ${duplicateInfo.message}`)
              status = status === 'error' ? 'error' : 'warning'
            } else if (duplicateInfo.riskLevel === 'info') {
              errors.push(`ℹ️ ${duplicateInfo.message}`)
              if (status !== 'error') {
                status = 'warning'
              }
            }

            validatedRows.push({
              ...row,
              rowIndex: index + 1,
              status,
              errors,
              normalizedPhone: normalized,
              duplicateAnalysis: duplicateInfo,
              selected: status === 'valid' || status === 'warning',
              priority: index + 1
            })
            return
          }

          validatedRows.push({
            ...row,
            rowIndex: index + 1,
            status,
            errors,
            normalizedPhone: normalized,
            selected: status === 'valid' || status === 'warning',
            priority: index + 1
          })
          return
        }
      }

      validatedRows.push({
        ...row,
        rowIndex: index + 1,
        status,
        errors,
        normalizedPhone: '',
        selected: false,
        priority: index + 1
      })
    })

    // Helper function to find duplicate info for a phone number
    function findDuplicateInfo(phoneNumber: string, data: any): DuplicateAnalysis | null {
      const { blocked, warnings, info } = data.analysis?.details || {}

      // Check blocked (critical)
      const blockedItem = blocked?.find((item: any) => item.phoneNumber === phoneNumber)
      if (blockedItem) {
        return {
          phoneNumber,
          riskLevel: 'critical',
          canProceed: false,
          message: blockedItem.message,
          reason: blockedItem.reason
        }
      }

      // Check warnings
      const warningItem = warnings?.find((item: any) => item.phoneNumber === phoneNumber)
      if (warningItem) {
        return {
          phoneNumber,
          riskLevel: 'warning',
          canProceed: true,
          message: warningItem.message,
          reason: warningItem.reason
        }
      }

      // Check info
      const infoItem = info?.find((item: any) => item.phoneNumber === phoneNumber)
      if (infoItem) {
        return {
          phoneNumber,
          riskLevel: 'info',
          canProceed: true,
          message: infoItem.message,
          reason: infoItem.reason
        }
      }

      return null
    }

    return validatedRows
  }, [])

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = Papa.unparse(EXAMPLE_DATA, {
      header: true,
      quotes: false
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customers-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Handle file upload
  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }

    if (uploadedFile.size > 1024 * 1024) { // 1MB limit
      alert('File too large. Maximum size is 1MB')
      return
    }

    setFile(uploadedFile)
    setIsProcessing(true)

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.toLowerCase().trim(),
      complete: async (results) => {
        const data = results.data as any[]

        if (data.length === 0) {
          alert('CSV file is empty')
          setIsProcessing(false)
          return
        }

        if (data.length > 200) {
          alert('Too many rows. Maximum 200 rows per upload')
          setIsProcessing(false)
          return
        }

        // Map to expected format
        const csvRows: CsvRow[] = data.map((row, index) => ({
          name: row.name || '',
          phone: row.phone || ''
        }))

        try {
          const validated = await validateCsvData(csvRows)
          setCsvData(validated)
          setUploadStep('preview')
        } catch (error) {
          console.error('Validation error:', error)
          alert('Error validating data. Please try again.')
        } finally {
          setIsProcessing(false)
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        alert('Error reading CSV file. Please check the format.')
        setIsProcessing(false)
      }
    })
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  // Reset upload
  const resetUpload = () => {
    setUploadStep('upload')
    setCsvData([])
    setFile(null)
    setUploadResults(null)
  }

  // Customer selection helpers
  const toggleCustomerSelection = (index: number) => {
    setCsvData(prevData =>
      prevData.map((row, i) =>
        i === index ? { ...row, selected: !row.selected } : row
      )
    )
  }

  const selectAll = (selectValid = true) => {
    setCsvData(prevData =>
      prevData.map(row => ({
        ...row,
        selected: selectValid ? (row.status === 'valid' || row.status === 'warning') : false
      }))
    )
  }

  const moveCustomer = (fromIndex: number, toIndex: number) => {
    setCsvData(prevData => {
      const newData = [...prevData]
      const [movedItem] = newData.splice(fromIndex, 1)
      newData.splice(toIndex, 0, movedItem)

      // Update priorities
      return newData.map((row, index) => ({
        ...row,
        priority: index + 1
      }))
    })
  }

  const smartSelectCustomers = () => {
    // Auto-select the best customers up to the limit
    const sortedCustomers = [...csvData]
      .filter(row => row.status === 'valid' || row.status === 'warning')
      .sort((a, b) => {
        // Priority: valid > warning, then by original order
        if (a.status === 'valid' && b.status === 'warning') return -1
        if (a.status === 'warning' && b.status === 'valid') return 1
        return a.rowIndex - b.rowIndex
      })

    setCsvData(prevData =>
      prevData.map(row => {
        const shouldSelect = sortedCustomers.indexOf(row) < userStats.requestsRemaining
        return { ...row, selected: shouldSelect && (row.status === 'valid' || row.status === 'warning') }
      })
    )
  }

  // Handle sending requests
  const handleSendRequests = async () => {
    setIsProcessing(true)
    setUploadStep('processing')

    try {
      // Get selected customers
      const selectedCustomers = csvData.filter(row => row.selected && (row.status === 'valid' || row.status === 'warning'))
      const unselectedCustomers = csvData.filter(row => !row.selected && (row.status === 'valid' || row.status === 'warning'))

      // Prepare customers data for API
      const customersToSend = selectedCustomers.map(row => ({
        name: row.name,
        normalizedPhone: row.normalizedPhone
      }))

      const pendingCustomers = savePendingCustomers ? unselectedCustomers.map(row => ({
        name: row.name,
        normalizedPhone: row.normalizedPhone
      })) : []

      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customers: customersToSend,
          pendingCustomers: pendingCustomers,
          savePendingCustomers: savePendingCustomers
        })
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResults(result)
        setUploadStep('success')
      } else {
        throw new Error(result.error || 'Failed to process upload')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to process upload')
    } finally {
      setIsProcessing(false)
    }
  }

  // Get valid rows for sending (exclude critical duplicates)
  const validRows = csvData.filter(row => row.status === 'valid' || row.status === 'warning')
  const selectedRows = csvData.filter(row => row.selected && (row.status === 'valid' || row.status === 'warning'))
  const unselectedValidRows = csvData.filter(row => !row.selected && (row.status === 'valid' || row.status === 'warning'))
  const canSend = Math.min(selectedRows.length, userStats.requestsRemaining)
  const errorCount = csvData.filter(row => row.status === 'error').length
  const warningCount = csvData.filter(row => row.status === 'warning').length
  const criticalCount = csvData.filter(row => row.status === 'critical').length

  if (uploadStep === 'upload') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Send Requests to Previous Customers</h1>
            <p className="text-gray-600">
              Upload a list of past customers and send them all a review request. Just add customer names and phone numbers to a CSV file - phone numbers work with or without the leading zero. Perfect for catching up on reviews you've missed.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Download Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  Step 1: Download CSV Template
                </CardTitle>
                <CardDescription>
                  Get the correct format for your customer list - phone numbers work with or without leading zero
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Format Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Two columns: <strong>name</strong> and <strong>phone</strong></li>
                    <li>• Phone numbers: UK mobile numbers (with or without leading zero)</li>
                    <li>• Save as .csv (comma separated values)</li>
                    <li>• Maximum 200 rows per upload</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">📱 Phone Number Format (REQUIRED):</h4>
                  <div className="bg-white border border-blue-300 rounded p-3 mb-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-900 mb-1">Phone number formats (both work):</p>
                      <div className="space-y-2">
                        <code className="text-xl font-bold text-green-700 bg-green-50 px-3 py-1 rounded block">7868287177</code>
                        <code className="text-xl font-bold text-green-700 bg-green-50 px-3 py-1 rounded block">07868287177</code>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">(With or without leading zero)</p>
                    </div>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li><strong>✅ Easy option (recommended):</strong></li>
                    <li className="ml-4">• Just enter the number: <code>7868287177</code></li>
                    <li className="ml-4">• Excel removes the zero? No problem - we add it back automatically</li>
                    <li><strong>✅ Alternative option:</strong></li>
                    <li className="ml-4">• Type the full number: <code>07868287177</code></li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">name</th>
                        <th className="px-4 py-2 text-left font-medium">phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EXAMPLE_DATA.map((row, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="px-4 py-2">{row.name}</td>
                          <td className="px-4 py-2">{row.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  How Bulk Sending Works
                </CardTitle>
                <CardDescription>
                  Understanding our smart delivery system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">📱 Smart Rate Limiting</h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li><strong>• Batch Size:</strong> Messages are sent in groups of 20 customers</li>
                    <li><strong>• Timing:</strong> Each batch is sent 15 minutes apart</li>
                    <li><strong>• Why:</strong> This prevents your messages from being flagged as spam</li>
                    <li><strong>• Monitoring:</strong> Track progress in real-time on your dashboard</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-3">🕒 Example Timeline</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Upload 100 customers:</strong></p>
                    <p>• Batch 1 (customers 1-20): Sent immediately</p>
                    <p>• Batch 2 (customers 21-40): Sent after 15 minutes</p>
                    <p>• Batch 3 (customers 41-60): Sent after 30 minutes</p>
                    <p>• Batch 4 (customers 61-80): Sent after 45 minutes</p>
                    <p>• Batch 5 (customers 81-100): Sent after 60 minutes</p>
                    <p className="font-medium mt-2">Total time: ~65 minutes for 100 customers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Upload File */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-green-600" />
                  Step 2: Upload Your File
                </CardTitle>
                <CardDescription>
                  Upload your CSV with customer names and phone numbers (we accept phone numbers with or without the leading zero)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {isProcessing ? (
                    <div className="space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                      <p className="text-gray-600">Processing file...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Drop your CSV here or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Maximum file size: 1MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileInput}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">This Month</span>
                    <span className="text-sm text-gray-500">
                      {userStats.requestsSent}/{userStats.monthlyLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (userStats.requestsSent / userStats.monthlyLimit) * 100)}%`
                      }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {userStats.requestsRemaining}
                  </div>
                  <div className="text-sm text-gray-500">requests remaining</div>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <p className="font-medium text-gray-700">Can't find your customers?</p>
                  <p className="text-gray-600">
                    Export from your invoicing software or create a simple spreadsheet with customer names and phone numbers. Don't worry about the leading zero on phone numbers - we handle both formats automatically.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Questions?</p>
                  <p className="text-gray-600">
                    Email us at{' '}
                    <a href="mailto:hello@growourreviews.com" className="text-blue-600 hover:text-blue-700">
                      hello@growourreviews.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upload History */}
            {uploadHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Uploads</CardTitle>
                  <CardDescription>
                    Your bulk upload history from the past 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploadHistory.slice(0, 5).map((upload, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            {upload.customer_count} customers uploaded
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(upload.created_at).toLocaleDateString()} at{' '}
                            {new Date(upload.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600 font-medium">
                            {upload.requests_sent} sent
                          </p>
                          {upload.requests_completed > 0 && (
                            <p className="text-xs text-blue-600">
                              {upload.requests_completed} completed
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {uploadHistory.length > 5 && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Showing 5 most recent uploads
                      </p>
                    )}

                    {loadingHistory && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (uploadStep === 'preview') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={resetUpload}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Upload New File
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review Your Upload</h1>
              <p className="text-gray-600">
                Check the validation results before sending review requests
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Preview Table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Rows</p>
                      <p className="text-xl font-semibold">{csvData.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Valid</p>
                      <p className="text-xl font-semibold">{csvData.filter(row => row.status === 'valid').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Warnings</p>
                      <p className="text-xl font-semibold">{warningCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Blocked</p>
                      <p className="text-xl font-semibold">{criticalCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Errors</p>
                      <p className="text-xl font-semibold">{errorCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Duplicate Protection Summary */}
            {(criticalCount > 0 || warningCount > 0) && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertCircle className="h-5 w-5" />
                    90-Day Duplicate Protection Active
                  </CardTitle>
                  <CardDescription className="text-orange-700">
                    We've checked your upload against customers who received requests in the last 90 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {criticalCount > 0 && (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-red-800">{criticalCount} customers blocked</p>
                          <p className="text-red-700 mt-1">
                            These customers already reviewed, gave feedback, or received recent requests.
                            Sending to them could annoy customers and hurt your reputation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {warningCount > 0 && (
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800">{warningCount} customers flagged with warnings</p>
                          <p className="text-yellow-700 mt-1">
                            These customers can receive requests but may remember previous interactions.
                            Review the details to decide if you want to proceed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Customer Selection Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Selection & Priority</CardTitle>
                <CardDescription>
                  Choose which customers to send requests to and set their priority order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selection Controls */}
                <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
                  <Button size="sm" variant="outline" onClick={() => selectAll(true)}>
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Select All Valid
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => selectAll(false)}>
                    <Square className="h-4 w-4 mr-1" />
                    Deselect All
                  </Button>
                  <Button size="sm" variant="outline" onClick={smartSelectCustomers}>
                    <Check className="h-4 w-4 mr-1" />
                    Smart Select ({userStats.requestsRemaining})
                  </Button>
                </div>

                {/* Credit Limit Info */}
                {selectedRows.length > userStats.requestsRemaining && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Selection Exceeds Credit Limit</p>
                        <p className="text-yellow-700 mt-1">
                          You've selected {selectedRows.length} customers but only have {userStats.requestsRemaining} credits remaining.
                          Only the first {userStats.requestsRemaining} selected will be sent this month.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Customers Option */}
                {unselectedValidRows.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-blue-800">Save Remaining Customers</p>
                        <p className="text-blue-700 text-sm mt-1">
                          {unselectedValidRows.length} unselected valid customers. Save them to send automatically when your plan resets next month?
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={savePendingCustomers}
                          onChange={(e) => setSavePendingCustomers(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-blue-800">Save for next month</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Customer List */}
                <div className="space-y-2">
                  {csvData.map((row, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 border rounded-lg ${
                        row.selected ? 'bg-green-50 border-green-200' :
                        row.status === 'valid' || row.status === 'warning' ? 'bg-gray-50 border-gray-200' :
                        'bg-red-50 border-red-200 opacity-60'
                      }`}
                    >
                      {/* Drag Handle */}
                      <div className="cursor-grab hover:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>

                      {/* Selection Checkbox */}
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          disabled={row.status === 'error' || row.status === 'critical'}
                          onChange={() => toggleCustomerSelection(index)}
                          className="rounded"
                        />
                      </label>

                      {/* Priority Controls */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => index > 0 && moveCustomer(index, index - 1)}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => index < csvData.length - 1 && moveCustomer(index, index + 1)}
                          disabled={index === csvData.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.name}</span>
                          <span className="font-mono text-sm text-gray-600">{row.phone}</span>

                          {/* Status Badge */}
                          {row.status === 'valid' && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Valid</span>
                            </div>
                          )}
                          {row.status === 'warning' && (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">Warning</span>
                            </div>
                          )}
                          {row.status === 'critical' && (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">Blocked</span>
                            </div>
                          )}
                          {row.status === 'error' && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">Error</span>
                            </div>
                          )}
                        </div>

                        {/* Error Messages */}
                        {row.errors.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {row.errors.map((error, errorIndex) => {
                              const isBlocked = error.includes('🚫')
                              const isWarning = error.includes('⚠️')
                              const isInfo = error.includes('ℹ️')

                              return (
                                <div key={errorIndex} className={`text-xs px-2 py-1 rounded ${
                                  isBlocked ? 'text-red-700 bg-red-100 border border-red-200' :
                                  isWarning ? 'text-yellow-700 bg-yellow-100 border border-yellow-200' :
                                  isInfo ? 'text-blue-700 bg-blue-100 border border-blue-200' :
                                  'text-gray-600 bg-gray-50'
                                }`}>
                                  {error}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Selection Order */}
                      {row.selected && (
                        <div className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                          #{csvData.filter((r, i) => i <= index && r.selected).length}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Send Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{canSend}</div>
                  <div className="text-sm text-gray-500">
                    selected {canSend === 1 ? 'customer' : 'customers'} will be sent
                  </div>
                </div>

                {/* Selection Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Selected customers:</span>
                    <span className="font-medium">{selectedRows.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your remaining credits:</span>
                    <span className="font-medium">{userStats.requestsRemaining}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Will be sent this month:</span>
                    <span className="font-medium text-green-600">{canSend}</span>
                  </div>
                  {selectedRows.length > userStats.requestsRemaining && (
                    <div className="flex justify-between text-yellow-600">
                      <span>Excess (next month):</span>
                      <span className="font-medium">{selectedRows.length - userStats.requestsRemaining}</span>
                    </div>
                  )}
                </div>

                {selectedRows.length > userStats.requestsRemaining && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Selection Exceeds Credits</p>
                        <p className="text-yellow-700 mt-1">
                          Only the first {userStats.requestsRemaining} selected customers will be sent this month.
                          The remaining {selectedRows.length - userStats.requestsRemaining} will be processed next month.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {criticalCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800">Blocked Customers</p>
                        <p className="text-red-700 mt-1">
                          {criticalCount} {criticalCount === 1 ? 'customer is' : 'customers are'} blocked due to duplicate protection (already reviewed, gave feedback, or recent requests).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {errorCount > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-gray-800">Data Errors Found</p>
                        <p className="text-gray-700 mt-1">
                          {errorCount} {errorCount === 1 ? 'row has' : 'rows have'} data errors (invalid names/phones) and will be skipped.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {warningCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Warnings</p>
                        <p className="text-yellow-700 mt-1">
                          {warningCount} {warningCount === 1 ? 'row has' : 'rows have'} warnings but will still be processed. Review duplicate protection details above.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    className="w-full"
                    disabled={canSend === 0 || isProcessing}
                    onClick={handleSendRequests}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Send {canSend} Selected {canSend === 1 ? 'Customer' : 'Customers'}
                        {unselectedValidRows.length > 0 && savePendingCustomers && (
                          <span className="block text-xs opacity-90 mt-1">
                            + Save {unselectedValidRows.length} for next month
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sending Schedule</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div>
                  <p className="font-medium text-gray-700">Staggered Delivery</p>
                  <p className="text-gray-600">
                    Messages will be sent in batches of 20 every 15 minutes to avoid spam detection.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Estimated Completion</p>
                  <p className="text-gray-600">
                    {canSend <= 20 ? 'Within 5 minutes' :
                     canSend <= 40 ? 'Within 20 minutes' :
                     canSend <= 60 ? 'Within 35 minutes' :
                     `${Math.ceil((canSend / 20) * 15)} minutes`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (uploadStep === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Upload</h2>
            <p className="text-gray-600">
              Creating customers and scheduling review requests...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (uploadStep === 'success') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">Upload Successful!</h1>
            <p className="text-gray-600 mt-2">
              Your review requests have been scheduled and will be sent automatically
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600">{uploadResults?.processed || 0}</div>
                  <div className="text-sm text-gray-500">Sent This Month</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{uploadResults?.batches || 0}</div>
                  <div className="text-sm text-gray-500">Sending Batches</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">{uploadResults?.pendingSaved || 0}</div>
                  <div className="text-sm text-gray-500">Saved for Next Month</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Messages will be sent in batches of {uploadResults?.batchSize || 20} every {uploadResults?.batchDelayMinutes || 15} minutes</li>
                  <li>• This prevents your messages from being flagged as spam</li>
                  <li>• All messages should be sent within {uploadResults?.estimatedCompletionMinutes || 0} minutes</li>
                  <li>• You can monitor progress on your dashboard</li>
                </ul>
              </div>

              {uploadResults?.estimatedCompletionTime && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    <strong>Estimated completion:</strong>{' '}
                    {new Date(uploadResults.estimatedCompletionTime).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={resetUpload}>
              Upload More Customers
            </Button>
            <Button onClick={() => router.push('/dashboard')} className="text-white">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }
}