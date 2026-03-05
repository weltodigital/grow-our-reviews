'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Upload, CheckCircle, AlertCircle, XCircle, Users } from 'lucide-react'
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

interface ValidatedRow extends CsvRow {
  rowIndex: number
  status: 'valid' | 'error' | 'warning' | 'duplicate'
  errors: string[]
  normalizedPhone: string
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
  { name: 'Sarah Johnson', phone: '+447712345678' },
  { name: 'Mike Williams', phone: '+447798765432' },
  { name: 'Example Customer', phone: '07712345678' }
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
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')

    let normalized = ''
    let isValid = false

    // Check different UK mobile formats
    if (digits.startsWith('07') && digits.length === 11) {
      // UK mobile: 07xxxxxxxxx (11 digits) -> +447xxxxxxxxx
      normalized = `+44${digits.slice(1)}`
      isValid = true
    } else if (digits.startsWith('447') && digits.length === 12) {
      // International format: 447xxxxxxxx (12 digits) -> +447xxxxxxxxx
      normalized = `+${digits}`
      isValid = true
    } else if (digits.startsWith('00447') && digits.length === 14) {
      // International with 00 prefix: 00447xxxxxxxx (14 digits) -> +447xxxxxxxxx
      normalized = `+${digits.slice(3)}`
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

    const existingPhones = response.ok ? await response.json() : { existingPhones: [] }

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

          // Check for existing customers
          if (existingPhones.existingPhones?.includes(normalized)) {
            errors.push('Already sent request in last 30 days')
            status = status === 'error' ? 'error' : 'warning'
          }

          validatedRows.push({
            ...row,
            rowIndex: index + 1,
            status,
            errors,
            normalizedPhone: normalized
          })
          return
        }
      }

      validatedRows.push({
        ...row,
        rowIndex: index + 1,
        status,
        errors,
        normalizedPhone: ''
      })
    })

    return validatedRows
  }, [])

  // Download CSV template
  const downloadTemplate = () => {
    // Add header comment rows for Excel/Google Sheets users
    const csvContent = [
      '# Customer Upload Template for Grow Our Reviews',
      '# IMPORTANT: Format the phone column as TEXT to keep leading zeros',
      '# Or use international format: +44 instead of 07',
      '# Delete these comment lines before uploading',
      '',
      Papa.unparse(EXAMPLE_DATA, { header: true })
    ].join('\n')

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

  // Handle sending requests
  const handleSendRequests = async () => {
    setIsProcessing(true)
    setUploadStep('processing')

    try {
      // Prepare customers data for API
      const customersToSend = validRows.slice(0, canSend).map(row => ({
        name: row.name,
        normalizedPhone: row.normalizedPhone
      }))

      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customers: customersToSend
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

  // Get valid rows for sending
  const validRows = csvData.filter(row => row.status === 'valid' || row.status === 'warning')
  const canSend = Math.min(validRows.length, userStats.requestsRemaining)
  const errorCount = csvData.filter(row => row.status === 'error').length
  const warningCount = csvData.filter(row => row.status === 'warning').length

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
              Upload a list of past customers and send them all a review request. Perfect for catching up on reviews you've missed.
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
                  Get the correct format for your customer list
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
                    <li>• Your file should have two columns: <strong>name</strong> and <strong>phone</strong></li>
                    <li>• Save as .csv (comma separated values)</li>
                    <li>• Maximum 200 rows per upload</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">📱 Phone Number Format (Important!):</h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li><strong>✅ Accepted formats:</strong></li>
                    <li className="ml-4">• <code>07712345678</code> (UK mobile starting with 07)</li>
                    <li className="ml-4">• <code>+447712345678</code> (International format - recommended)</li>
                    <li><strong>⚠️ Excel/Google Sheets users:</strong></li>
                    <li className="ml-4">• Format the phone column as <strong>"Text"</strong> to keep leading zeros</li>
                    <li className="ml-4">• Or use the international format (+44...) to avoid the issue</li>
                    <li className="ml-4">• Or prefix with an apostrophe: <code>'07712345678</code></li>
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

            {/* Step 2: Upload File */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-green-600" />
                  Step 2: Upload Your File
                </CardTitle>
                <CardDescription>
                  Drag and drop your CSV file or click to browse
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
                    Export from your invoicing software or create a simple spreadsheet with customer names and phone numbers.
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
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
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
                      <p className="text-xl font-semibold">{validRows.length}</p>
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
                      <p className="text-sm text-gray-600">Errors</p>
                      <p className="text-xl font-semibold">{errorCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Table */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Data Preview</CardTitle>
                <CardDescription>
                  Review each row for validation issues before proceeding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Row</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Name</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Phone</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Normalized</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 text-gray-600">{row.rowIndex}</td>
                          <td className="py-3 px-2">
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
                            {row.status === 'error' && (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-4 w-4" />
                                <span className="text-xs">Error</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 font-medium">{row.name || '—'}</td>
                          <td className="py-3 px-2 font-mono text-sm">{row.phone || '—'}</td>
                          <td className="py-3 px-2 font-mono text-sm text-gray-600">
                            {row.normalizedPhone || '—'}
                          </td>
                          <td className="py-3 px-2">
                            {row.errors.length > 0 ? (
                              <div className="space-y-1">
                                {row.errors.map((error, errorIndex) => (
                                  <div key={errorIndex} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                    {error}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No issues</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Send Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ready to Send</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{canSend}</div>
                  <div className="text-sm text-gray-500">
                    {canSend === 1 ? 'request' : 'requests'} will be sent
                  </div>
                </div>

                {validRows.length > canSend && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Plan Limit Reached</p>
                        <p className="text-yellow-700 mt-1">
                          You have {validRows.length} valid customers but only {userStats.requestsRemaining} requests remaining this month.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {errorCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800">Errors Found</p>
                        <p className="text-red-700 mt-1">
                          {errorCount} {errorCount === 1 ? 'row has' : 'rows have'} errors and will be skipped.
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
                          {warningCount} {warningCount === 1 ? 'row has' : 'rows have'} warnings but will still be processed.
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
                      `Send ${canSend} Review ${canSend === 1 ? 'Request' : 'Requests'}`
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
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600">{uploadResults?.processed || 0}</div>
                  <div className="text-sm text-gray-500">Customers Added</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{uploadResults?.batches || 0}</div>
                  <div className="text-sm text-gray-500">Sending Batches</div>
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
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }
}