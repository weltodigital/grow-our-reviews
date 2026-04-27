import { NavBubble } from '@/components/navigation/NavBubble'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBubble />
      <main className="section" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="section-header">
            <h1>Cookie Policy</h1>
          </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> April 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and analyzing how you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
            <p className="text-gray-700 mb-4">
              Grow Our Reviews uses cookies for the following purposes:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Essential Cookies (Required)</h3>
            <p className="text-gray-700 mb-2">
              These cookies are necessary for the website to function properly:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Authentication cookies:</strong> Keep you logged into your account</li>
              <li><strong>Security cookies:</strong> Protect against cross-site request forgery</li>
              <li><strong>Session cookies:</strong> Remember your preferences during your visit</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics Cookies (Optional)</h3>
            <p className="text-gray-700 mb-2">
              These help us understand how visitors use our website:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Microsoft Clarity:</strong> Records anonymised session replays and heatmaps so we can see where visitors get stuck and improve the experience</li>
              <li><strong>Performance monitoring:</strong> Identify and fix technical issues</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Marketing Cookies (Optional)</h3>
            <p className="text-gray-700 mb-2">
              These help us measure the effectiveness of our advertising:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Meta (Facebook) Pixel:</strong> Tracks which visitors arrived from our Meta ad campaigns and which of them go on to sign up, so we can measure return on ad spend</li>
              <li><strong>Conversion tracking:</strong> Understand which marketing sources drive signups</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Third-Party Cookies</h2>
            <p className="text-gray-700 mb-4">
              We use some third-party services that may place their own cookies on your device:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li><strong>Microsoft Clarity:</strong> Session replay and heatmap analytics. Microsoft processes this data on our behalf — see <a href="https://privacy.microsoft.com/en-gb/privacystatement" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent)' }}>Microsoft&apos;s privacy statement</a> for details.</li>
              <li><strong>Meta (Facebook) Pixel:</strong> Ad attribution and conversion tracking. Loaded only after you accept marketing cookies — see <a href="https://www.facebook.com/policy.php" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent)' }}>Meta&apos;s data policy</a>.</li>
              <li><strong>Stripe:</strong> For secure payment processing</li>
              <li><strong>Supabase:</strong> For authentication and data storage</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cookie Consent</h2>
            <p className="text-gray-700 mb-4">
              When you first visit our website, we will ask for your consent before loading any analytics or marketing cookies. You can:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li><strong>Accept</strong> — allow Microsoft Clarity and the Meta Pixel to load</li>
              <li><strong>Reject</strong> — only the strictly necessary cookies will be used; no analytics or marketing trackers will load</li>
            </ul>
            <p className="text-gray-700 mt-4">
              You can change your decision at any time by clicking the &ldquo;Cookie Preferences&rdquo; link in our website footer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Managing Cookies</h2>
            <p className="text-gray-700 mb-4">
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>View what cookies are stored on your device</li>
              <li>Delete existing cookies</li>
              <li>Block cookies from specific websites</li>
              <li>Block all cookies (may affect website functionality)</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Please note that blocking essential cookies may prevent you from using certain features of our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookie Details</h2>
            <p className="text-gray-700 mb-4">
              Here are the specific cookies we use:
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-900">Cookie Name</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-900">Purpose</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-900">Duration</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-900">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">supabase-auth-token</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Keeps you logged in</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">1 hour</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Essential</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">consent-v1 (localStorage)</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Remembers your cookie consent decision</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Until you clear it</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Essential</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">_clck</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Microsoft Clarity persistent user ID</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">1 year</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Analytics</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">_clsk</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Microsoft Clarity session ID</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">1 day</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Analytics</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">_fbp</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Meta (Facebook) Pixel — identifies your browser to attribute ad conversions</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">3 months</td>
                    <td className="border border-gray-200 px-4 py-2 text-gray-700">Marketing</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Updates to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this cookie policy from time to time to reflect changes in our practices or for legal reasons. We will notify you of any significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about our use of cookies, please contact us:
            </p>
            <p className="text-gray-700 mt-4">
              <strong>Email:</strong> <a href="mailto:hello@growourreviews.com" className="hover:underline" style={{ color: 'var(--accent)' }}>hello@growourreviews.com</a><br/>
              <strong>Address:</strong> Welto Digital, United Kingdom
            </p>
          </section>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  )
}