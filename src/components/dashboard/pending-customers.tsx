'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, X, Users, CalendarDays } from 'lucide-react'

interface PendingCustomer {
  id: string
  name: string
  phone: string
  created_at: string
}

interface PendingCustomersProps {
  className?: string
}

export function PendingCustomers({ className }: PendingCustomersProps) {
  const [pendingCustomers, setPendingCustomers] = useState<PendingCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingCustomers()
  }, [])

  const fetchPendingCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pending-customers')
      if (response.ok) {
        const data = await response.json()
        setPendingCustomers(data.pendingCustomers || [])
      }
    } catch (error) {
      console.error('Error fetching pending customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const removePendingCustomer = async (customerId: string) => {
    try {
      setRemoving(customerId)
      const response = await fetch(`/api/pending-customers?id=${customerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPendingCustomers(prev => prev.filter(c => c.id !== customerId))
      } else {
        alert('Failed to remove pending customer')
      }
    } catch (error) {
      console.error('Error removing pending customer:', error)
      alert('Error removing pending customer')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pendingCustomers.length === 0) {
    return null // Don't show the card if there are no pending customers
  }

  // Calculate next billing cycle date (1st of next month)
  const today = new Date()
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const nextBillingDate = nextMonth.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Pending Customers
          <span className="text-sm font-normal text-gray-500">
            ({pendingCustomers.length})
          </span>
        </CardTitle>
        <CardDescription>
          Customers saved for next month when your plan resets on {nextBillingDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Automatic Processing</p>
              <p className="text-blue-700">
                These customers will be automatically converted to review requests when your monthly plan resets on {nextBillingDate}.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {pendingCustomers.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{customer.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Added {new Date(customer.created_at).toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removePendingCustomer(customer.id)}
                  disabled={removing === customer.id}
                  className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                >
                  {removing === customer.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {pendingCustomers.length > 5 && (
          <div className="text-xs text-gray-500 text-center">
            Showing all {pendingCustomers.length} pending customers
          </div>
        )}
      </CardContent>
    </Card>
  )
}