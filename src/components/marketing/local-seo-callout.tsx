import { Button } from '@/components/ui/button'
import { getAppUrl } from '@/lib/utils'

export function LocalSeoCallout() {
  return (
    <section className="py-16 bg-gradient-to-r from-indigo-900 via-blue-800 to-indigo-900">
      <div className="container mx-auto px-4">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">
            Every week without fresh Google reviews is a week your competitors are outranking you.
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Google's local search algorithm updates constantly. Businesses with recent, consistent reviews climb higher. Those without them fall behind. The sooner you start, the sooner your phone rings more.
          </p>
          <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
            <a href={getAppUrl('/signup')}>Start Your Free Trial — It's Free for 14 Days</a>
          </Button>
        </div>
      </div>
    </section>
  )
}