import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> February 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Who We Are</h2>
            <p className="text-gray-700 mb-4">
              Grow Our Reviews is operated by Welto Digital ("we," "us," or "our"). We provide automated review request services to help businesses collect more Google reviews from their customers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Information (You provide directly):</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Your email address and password</li>
              <li>Business name and Google Reviews URL</li>
              <li>Billing information for subscription payments</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Data (You provide on behalf of your customers):</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Customer names and phone numbers for SMS delivery</li>
              <li>Review responses and ratings submitted by customers</li>
              <li>Feedback messages from customers who provide private feedback</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatically Collected:</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Usage data (features used, pages visited, time spent)</li>
              <li>Device information (browser type, IP address, operating system)</li>
              <li>SMS delivery status and click tracking for review requests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700">
              <li><strong>Service Delivery:</strong> Send SMS review requests, process customer responses, display analytics</li>
              <li><strong>Account Management:</strong> Create and manage your account, process payments, provide customer support</li>
              <li><strong>Service Improvement:</strong> Analyze usage patterns to improve our service features</li>
              <li><strong>Communication:</strong> Send service updates, billing notifications, and customer support</li>
              <li><strong>Legal Compliance:</strong> Comply with applicable laws and protect our rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, rent, or trade your personal information. We may share information in these limited circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li><strong>Service Providers:</strong> Twilio (SMS delivery), Stripe (payment processing), Supabase (data storage), Resend (email delivery)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfer:</strong> In connection with a merger, acquisition, or sale of assets (with notice to you)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Processing Role</h2>
            <p className="text-gray-700 mb-4">
              For customer data you provide (names, phone numbers, reviews), we act as a <strong>data processor</strong> on your behalf. You remain the <strong>data controller</strong> and are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Obtaining proper consent from your customers before using our service</li>
              <li>Ensuring your customers understand their data will be used for review requests</li>
              <li>Handling any data subject requests from your customers</li>
              <li>Complying with applicable data protection laws in your jurisdiction</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights (GDPR Compliance)</h2>
            <p className="text-gray-700 mb-4">If you are located in the European Economic Area, you have the following rights:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us at <a href="mailto:hello@growourreviews.com" className="text-blue-600 hover:text-blue-800">hello@growourreviews.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational measures to protect your information, including encryption in transit and at rest, access controls, and regular security assessments. However, no internet transmission is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-700">
              We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legal compliance, fraud prevention, or legitimate business purposes for up to 7 years.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Transfers</h2>
            <p className="text-gray-700">
              Your information may be transferred to and processed in countries outside your country of residence. We ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy from time to time. We will notify you of any material changes by email or through our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this privacy policy or our data practices, please contact us at:
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