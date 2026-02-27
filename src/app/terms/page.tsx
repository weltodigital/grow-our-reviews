import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> February 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using the Grow Our Reviews service (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              Grow Our Reviews is an automated review request service that helps businesses collect Google reviews from their customers through SMS communication. The Service includes:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Customer management and SMS review request functionality</li>
              <li>Sentiment-based routing of reviews and feedback</li>
              <li>Analytics and reporting dashboard</li>
              <li>Automated follow-up ("nudge") functionality</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration and Subscription</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Free Trial</h3>
            <p className="text-gray-700 mb-4">
              We offer a 14-day free trial with no credit card required. Trial accounts are limited to 10 SMS requests.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Paid Subscriptions</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Starter Plan:</strong> £49 per month for up to 50 SMS requests</li>
              <li><strong>Growth Plan:</strong> £79 per month for up to 150 SMS requests</li>
            </ul>

            <p className="text-gray-700 mb-4">
              Subscription fees are billed monthly in advance. You are responsible for providing accurate billing information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Send spam or unsolicited messages</li>
              <li>Contact customers without proper consent</li>
              <li>Manipulate or fabricate reviews</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with the Service's operation or security</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Send messages to phone numbers on any Do Not Call registry</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Customer Data and Privacy</h2>
            <p className="text-gray-700 mb-4">
              You are responsible for ensuring you have proper consent to send SMS messages to your customers. You must comply with all applicable data protection and privacy laws, including GDPR where applicable.
            </p>
            <p className="text-gray-700 mb-4">
              We process customer data on your behalf as described in our Privacy Policy. You remain the data controller for any customer information you provide to the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment and Billing</h2>
            <p className="text-gray-700 mb-4">
              Subscription fees are charged monthly in advance. All fees are non-refundable except as expressly stated in these Terms.
            </p>
            <p className="text-gray-700 mb-4">
              If payment fails, we may suspend your account after notice. You remain responsible for any outstanding charges.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cancellation</h2>
            <p className="text-gray-700 mb-4">
              You may cancel your subscription at any time from your account dashboard. Cancellation takes effect at the end of your current billing period.
            </p>
            <p className="text-gray-700 mb-4">
              If you cancel within your first 30 days of paid service, you will receive a full refund.
            </p>
            <p className="text-gray-700 mb-4">
              We may suspend or terminate your account for violation of these Terms or for any reason with reasonable notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, GROW OUR REVIEWS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="text-gray-700 mb-4">
              Our total liability for any claim related to the Service shall not exceed the amount you paid for the Service in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Service Availability</h2>
            <p className="text-gray-700 mb-4">
              While we strive for high availability, we do not guarantee uninterrupted access to the Service. We may perform maintenance or updates that temporarily affect Service availability.
            </p>
            <p className="text-gray-700 mb-4">
              SMS delivery depends on third-party carriers and may be affected by factors outside our control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Service and its content are protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive license to use the Service for its intended purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We may update these Terms from time to time. We will notify you of material changes by email or through the Service. Continued use of the Service constitutes acceptance of updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-700 mt-4">
              <strong>Email:</strong> <a href="mailto:hello@growourreviews.com" className="text-blue-600 hover:text-blue-800">hello@growourreviews.com</a><br/>
              <strong>Address:</strong> Welto Digital, United Kingdom
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  )
}