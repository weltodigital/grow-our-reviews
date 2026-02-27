export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          business_name: string | null
          google_review_url: string | null
          phone: string | null
          sms_delay_hours: number
          nudge_enabled: boolean
          nudge_delay_hours: number
          monthly_request_limit: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          business_name?: string | null
          google_review_url?: string | null
          phone?: string | null
          sms_delay_hours?: number
          nudge_enabled?: boolean
          nudge_delay_hours?: number
          monthly_request_limit?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          business_name?: string | null
          google_review_url?: string | null
          phone?: string | null
          sms_delay_hours?: number
          nudge_enabled?: boolean
          nudge_delay_hours?: number
          monthly_request_limit?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      review_requests: {
        Row: {
          id: string
          user_id: string
          customer_id: string
          status: string
          sms_message_sid: string | null
          scheduled_for: string
          sent_at: string | null
          clicked_at: string | null
          nudge_sent: boolean
          nudge_sent_at: string | null
          token: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id: string
          status?: string
          sms_message_sid?: string | null
          scheduled_for: string
          sent_at?: string | null
          clicked_at?: string | null
          nudge_sent?: boolean
          nudge_sent_at?: string | null
          token?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string
          status?: string
          sms_message_sid?: string | null
          scheduled_for?: string
          sent_at?: string | null
          clicked_at?: string | null
          nudge_sent?: boolean
          nudge_sent_at?: string | null
          token?: string
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          review_request_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          review_request_id: string
          user_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          review_request_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
    }
  }
}