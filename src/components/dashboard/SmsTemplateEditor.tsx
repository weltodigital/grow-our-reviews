'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, RotateCcw, Save } from 'lucide-react'
import SmsPreview from './SmsPreview'
import { updateSmsTemplate } from './settings-actions'
import type { Database } from '@/types/database'

interface SmsTemplateEditorProps {
  profile: Database['public']['Tables']['profiles']['Row']
  initialTemplate?: Database['public']['Tables']['sms_templates']['Row']
  nudgeTemplate?: Database['public']['Tables']['sms_templates']['Row']
  onTemplateUpdated?: () => void
}

const DEFAULT_TEMPLATES = {
  initial: {
    greeting: 'Hi',
    opening_line: 'thx for {business_name}!',
    request_line: 'Review please',
    sign_off: null
  },
  nudge: {
    greeting: 'Hi',
    opening_line: 'thx for {business_name}!',
    request_line: 'Review please',
    sign_off: null
  }
}

export default function SmsTemplateEditor({
  profile,
  initialTemplate,
  nudgeTemplate,
  onTemplateUpdated
}: SmsTemplateEditorProps) {
  // Initial template state
  const [initialGreeting, setInitialGreeting] = useState(initialTemplate?.greeting || DEFAULT_TEMPLATES.initial.greeting)
  const [initialOpeningLine, setInitialOpeningLine] = useState(initialTemplate?.opening_line || DEFAULT_TEMPLATES.initial.opening_line)
  const [initialRequestLine, setInitialRequestLine] = useState(initialTemplate?.request_line || DEFAULT_TEMPLATES.initial.request_line)
  const [initialSignOff, setInitialSignOff] = useState(initialTemplate?.sign_off || DEFAULT_TEMPLATES.initial.sign_off || '')

  // Nudge template state
  const [nudgeGreeting, setNudgeGreeting] = useState(nudgeTemplate?.greeting || DEFAULT_TEMPLATES.nudge.greeting)
  const [nudgeOpeningLine, setNudgeOpeningLine] = useState(nudgeTemplate?.opening_line || DEFAULT_TEMPLATES.nudge.opening_line)
  const [nudgeRequestLine, setNudgeRequestLine] = useState(nudgeTemplate?.request_line || DEFAULT_TEMPLATES.nudge.request_line)
  const [nudgeSignOff, setNudgeSignOff] = useState(nudgeTemplate?.sign_off || DEFAULT_TEMPLATES.nudge.sign_off || '')

  // Form state
  const [isInitialSaving, setIsInitialSaving] = useState(false)
  const [isNudgeSaving, setIsNudgeSaving] = useState(false)
  const [initialError, setInitialError] = useState('')
  const [nudgeError, setNudgeError] = useState('')
  const [initialSuccess, setInitialSuccess] = useState('')
  const [nudgeSuccess, setNudgeSuccess] = useState('')

  const businessName = profile.business_name || 'Your Business'

  // Track changes
  const hasInitialChanges = initialTemplate ? (
    initialGreeting !== initialTemplate.greeting ||
    initialOpeningLine !== initialTemplate.opening_line ||
    initialRequestLine !== initialTemplate.request_line ||
    (initialSignOff || null) !== initialTemplate.sign_off
  ) : true

  const hasNudgeChanges = nudgeTemplate ? (
    nudgeGreeting !== nudgeTemplate.greeting ||
    nudgeOpeningLine !== nudgeTemplate.opening_line ||
    nudgeRequestLine !== nudgeTemplate.request_line ||
    (nudgeSignOff || null) !== nudgeTemplate.sign_off
  ) : true

  const resetInitialTemplate = () => {
    setInitialGreeting(DEFAULT_TEMPLATES.initial.greeting)
    setInitialOpeningLine(DEFAULT_TEMPLATES.initial.opening_line)
    setInitialRequestLine(DEFAULT_TEMPLATES.initial.request_line)
    setInitialSignOff('')
  }

  const resetNudgeTemplate = () => {
    setNudgeGreeting(DEFAULT_TEMPLATES.nudge.greeting)
    setNudgeOpeningLine(DEFAULT_TEMPLATES.nudge.opening_line)
    setNudgeRequestLine(DEFAULT_TEMPLATES.nudge.request_line)
    setNudgeSignOff('')
  }

  const saveInitialTemplate = async () => {
    setIsInitialSaving(true)
    setInitialError('')

    try {
      const result = await updateSmsTemplate({
        type: 'initial',
        greeting: initialGreeting,
        opening_line: initialOpeningLine,
        request_line: initialRequestLine,
        sign_off: initialSignOff.trim() || null
      })

      if (result.error) {
        setInitialError(result.error)
      } else {
        setInitialSuccess('Initial template saved successfully!')
        setTimeout(() => setInitialSuccess(''), 3000)
        onTemplateUpdated?.()
      }
    } catch (error) {
      setInitialError('Something went wrong. Please try again.')
    } finally {
      setIsInitialSaving(false)
    }
  }

  const saveNudgeTemplate = async () => {
    setIsNudgeSaving(true)
    setNudgeError('')

    try {
      const result = await updateSmsTemplate({
        type: 'nudge',
        greeting: nudgeGreeting,
        opening_line: nudgeOpeningLine,
        request_line: nudgeRequestLine,
        sign_off: nudgeSignOff.trim() || null
      })

      if (result.error) {
        setNudgeError(result.error)
      } else {
        setNudgeSuccess('Follow-up template saved successfully!')
        setTimeout(() => setNudgeSuccess(''), 3000)
        onTemplateUpdated?.()
      }
    } catch (error) {
      setNudgeError('Something went wrong. Please try again.')
    } finally {
      setIsNudgeSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Customise Your Messages
        </CardTitle>
        <CardDescription>
          Personalise the SMS your customers receive. The review link is always included automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="initial" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="initial">Review Request</TabsTrigger>
            <TabsTrigger value="nudge">Follow-Up Nudge</TabsTrigger>
          </TabsList>

          {/* Initial Template Tab */}
          <TabsContent value="initial" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="initial-greeting">Greeting</Label>
                  <Input
                    id="initial-greeting"
                    value={initialGreeting}
                    onChange={(e) => setInitialGreeting(e.target.value.slice(0, 20))}
                    placeholder="Hi"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500">
                    This appears before the customer's name. Preview shows: "{initialGreeting} Sarah,"
                  </p>
                  <p className="text-xs text-gray-400">{initialGreeting.length}/20 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial-opening">Opening line</Label>
                  <Input
                    id="initial-opening"
                    value={initialOpeningLine}
                    onChange={(e) => setInitialOpeningLine(e.target.value.slice(0, 150))}
                    placeholder="thanks for choosing {business_name}!"
                    maxLength={150}
                  />
                  <p className="text-xs text-gray-500">
                    This appears right after the customer's name. Use {'{business_name}'} to insert your business name automatically.
                  </p>
                  <p className="text-xs text-gray-400">{initialOpeningLine.length}/150 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial-request">Review request line</Label>
                  <Textarea
                    id="initial-request"
                    value={initialRequestLine}
                    onChange={(e) => setInitialRequestLine(e.target.value.slice(0, 200))}
                    placeholder="If you were happy with our work, we'd really appreciate a quick review — it only takes 30 seconds"
                    maxLength={200}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    This is the main ask. Keep it friendly and short.
                  </p>
                  <p className="text-xs text-gray-400">{initialRequestLine.length}/200 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial-signoff">Sign-off (optional)</Label>
                  <Input
                    id="initial-signoff"
                    value={initialSignOff}
                    onChange={(e) => setInitialSignOff(e.target.value.slice(0, 50))}
                    placeholder="e.g. Cheers, Mike"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">
                    Optional. Add a personal touch.
                  </p>
                  <p className="text-xs text-gray-400">{initialSignOff.length}/50 characters</p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetInitialTemplate}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Reset to default
                  </button>
                </div>

                {initialError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{initialError}</p>
                  </div>
                )}

                {initialSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-600">{initialSuccess}</p>
                  </div>
                )}

                {hasInitialChanges && (
                  <Button
                    onClick={saveInitialTemplate}
                    disabled={isInitialSaving}
                    className="w-full sm:w-auto"
                  >
                    {isInitialSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Template
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Preview */}
              <div>
                <SmsPreview
                  greeting={initialGreeting}
                  openingLine={initialOpeningLine}
                  requestLine={initialRequestLine}
                  signOff={initialSignOff || null}
                  businessName={businessName}
                  templateType="initial"
                />
              </div>
            </div>
          </TabsContent>

          {/* Nudge Template Tab */}
          <TabsContent value="nudge" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nudge-greeting">Greeting</Label>
                  <Input
                    id="nudge-greeting"
                    value={nudgeGreeting}
                    onChange={(e) => setNudgeGreeting(e.target.value.slice(0, 20))}
                    placeholder="Hi"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500">
                    This appears before the customer's name. Preview shows: "{nudgeGreeting} Sarah,"
                  </p>
                  <p className="text-xs text-gray-400">{nudgeGreeting.length}/20 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nudge-request">Follow-up request line</Label>
                  <Textarea
                    id="nudge-request"
                    value={nudgeRequestLine}
                    onChange={(e) => setNudgeRequestLine(e.target.value.slice(0, 200))}
                    placeholder="If you were happy with our work, we'd really appreciate a quick review — it only takes 30 seconds"
                    maxLength={200}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    This is your gentle reminder message. Keep it polite and brief.
                  </p>
                  <p className="text-xs text-gray-400">{nudgeRequestLine.length}/200 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nudge-signoff">Sign-off (optional)</Label>
                  <Input
                    id="nudge-signoff"
                    value={nudgeSignOff}
                    onChange={(e) => setNudgeSignOff(e.target.value.slice(0, 50))}
                    placeholder="e.g. Thanks, Mike"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">
                    Optional. Add a personal touch to your follow-up.
                  </p>
                  <p className="text-xs text-gray-400">{nudgeSignOff.length}/50 characters</p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetNudgeTemplate}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Reset to default
                  </button>
                </div>

                {nudgeError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{nudgeError}</p>
                  </div>
                )}

                {nudgeSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-600">{nudgeSuccess}</p>
                  </div>
                )}

                {hasNudgeChanges && (
                  <Button
                    onClick={saveNudgeTemplate}
                    disabled={isNudgeSaving}
                    className="w-full sm:w-auto"
                  >
                    {isNudgeSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Template
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Preview */}
              <div>
                <SmsPreview
                  greeting={nudgeGreeting}
                  openingLine={nudgeOpeningLine}
                  requestLine={nudgeRequestLine}
                  signOff={nudgeSignOff || null}
                  businessName={businessName}
                  templateType="nudge"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}