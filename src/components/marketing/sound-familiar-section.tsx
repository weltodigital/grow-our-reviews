'use client'

import { getAppUrl } from '@/lib/utils'

export function SoundFamiliarSection() {
  const problems = [
    "You've served hundreds of happy customers this year. You've got 11 Google reviews. The competitor down the road has 60 reviews and is winning all the business, even though you know your service is better.",
    "You keep meaning to ask customers for reviews, but you're already on to the next thing. By the time you remember, the moment's passed and they're long gone.",
    "A customer once left you a 2-star review because of a misunderstanding. It's still sitting there at the top of your Google profile, putting potential customers off before they even contact you.",
    "You've spent thousands on Google Ads, directories, and social media, but you've never invested in the one thing that actually makes people choose you over a competitor: your Google reviews."
  ]

  return (
    <section className="section" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="container mx-auto px-4">
        <div className="section-header">
          <h2>Sound familiar?</h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {problems.map((problem, index) => (
              <div key={index} className="rounded-xl p-6 border-l-4" style={{ backgroundColor: 'var(--bg-secondary)', borderLeftColor: 'var(--status-warning)' }}>
                <p className="text-gray-700 leading-relaxed italic">
                  "{problem}"
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-xl text-gray-900 font-semibold mb-8">
              Grow Our Reviews fixes all of this. Automatically.
            </p>
            <a
              href={getAppUrl('/signup')}
              className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full transition-colors"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
                border: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)'
              }}
            >
              Start Your Free Trial
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}