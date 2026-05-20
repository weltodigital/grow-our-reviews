import Link from "next/link";
import { InternalLinkCTA } from "@/components/blog/internal-link-cta";

export default function CannonSteelsCaseStudy() {
  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-3">Key Takeaways</h3>
        <ul className="space-y-2 text-blue-800">
          <li>• Cannon Steels went from 23 to 32 Google reviews in one month</li>
          <li>• 9 new five-star reviews from 67 automated requests</li>
          <li>• Google rating improved from 4.7 to 4.8 stars</li>
          <li>• Setup took minutes using the bulk customer upload feature</li>
          <li>• After decades in business, they collected more reviews in a month than in previous years combined</li>
        </ul>
      </div>

      <h2 id="background">The Background</h2>

      <p>Cannon Steels is a London-based steel business that's been operating for decades. Like most established businesses, they had a solid reputation with their customers but almost nothing to show for it on Google. After years in business, they had just 23 Google reviews.</p>

      <p>It wasn't that customers were unhappy. The work was good, the relationships were strong, and word of mouth kept things ticking over. But when it came to Google reviews, the numbers didn't reflect the reality. Max from Cannon Steels had tried asking customers in person for reviews, but it rarely translated into someone actually going home and leaving one.</p>

      <p>The result: a business with decades of happy customers, sitting at 23 reviews while newer competitors were accumulating reviews faster.</p>

      <h2 id="problem">The Problem</h2>

      <p>23 Google reviews after decades in business tells Google very little. When potential customers searched for steel suppliers in London, Cannon Steels was competing against businesses that may have been around for a fraction of the time but had more reviews and more recent activity on their profile.</p>

      <p>The challenge wasn't quality of service. It was the gap between customer satisfaction and public proof of that satisfaction. Happy customers weren't leaving reviews because nobody was asking them in a way that made it easy enough to actually do.</p>

      <p>Max had tried asking in person, but the conversion from "yeah I'll leave you a review" to actually doing it was almost zero. People intend to, then they get in their car, drive home, and it's forgotten.</p>

      <h2 id="what-they-did">What They Did</h2>

      <p>Max signed up to Grow Our Reviews and used the bulk upload feature to import a list of existing customers — people Cannon Steels had worked with who he knew were happy with the service.</p>

      <p>The setup took minutes. He uploaded a CSV of customer names and phone numbers, the system validated them, and 67 review requests were scheduled to go out over the following days. Each customer received a friendly SMS asking if they'd be willing to leave a quick Google review, with a direct link that took them straight to the review page.</p>

      <p>No phone calls. No awkward in-person asks. No chasing. Just an automated text that made it easy for happy customers to do something they were already willing to do.</p>

      <InternalLinkCTA
        text="Want to reach your past customers the same way Cannon Steels did?"
        href="/pricing"
        linkText="Grow Our Reviews"
      />

      <h2 id="results">The Results After One Month</h2>

      <p>The numbers speak for themselves:</p>

      <p><strong>67 review requests sent.</strong> Max uploaded his customer list and the system handled the rest — staggered sending, appropriate timing, one polite request per customer.</p>

      <p><strong>9 new five-star reviews received.</strong> Every single review that came back was 5 stars. No negative reviews, no private feedback needed. The sentiment gate was ready to catch unhappy responses, but none came through — a testament to the quality of Cannon Steels' service.</p>

      <p><strong>Google rating improved from 4.7 to 4.8.</strong> Nine consecutive five-star reviews pushed their average rating up. A 4.8-star rating with 32 reviews looks significantly more trustworthy than a 4.7 with 23.</p>

      <p><strong>Review count grew by 39% in one month.</strong> After decades of accumulating 23 reviews, they added 9 more in a single month. At this rate, they'll double their total review count within a few months.</p>

      <p><strong>Zero effort after initial setup.</strong> Once the bulk upload was done, Max didn't need to do anything. The system sent the requests, the customers responded, and the reviews appeared on Google.</p>

      <h2 id="why-it-matters">Why This Matters</h2>

      <p>Nine reviews might not sound like a lot in isolation. But context matters.</p>

      <p>Going from 23 to 32 reviews is a 39% increase in one month. If Cannon Steels maintains this pace — even at a slower rate with new customers rather than a bulk upload — they'll be at 50+ reviews within a few months and 100+ within a year.</p>

      <p>Every new five-star review strengthens their position in Google's local search results. Google rewards businesses with recent, consistent review activity. A business that went from zero new reviews in months to 9 in a single month sends a strong signal to Google's algorithm that this is an active, trusted business. If you want the detail on how that ranking works, we cover it in our guide to <Link href="/blog/how-google-local-search-works-tradesmen" className="text-blue-600 hover:text-blue-800 underline">how Google decides which businesses to show in local search</Link>.</p>

      <p>The rating increase from 4.7 to 4.8 also matters. Above 4.5 stars, every tenth of a point builds customer confidence. A 4.8-star rating with 32 reviews looks significantly more credible than a 4.7 with 23.</p>

      <h2 id="bigger-picture">The Bigger Picture</h2>

      <p>Cannon Steels' experience illustrates a pattern we see repeatedly. Established businesses with years of happy customers are sitting on a goldmine of potential reviews. Those customers were always willing to leave a review — they just needed to be asked in a way that was easy enough to actually follow through. Timing plays a part too, which is why we wrote about <Link href="/blog/best-time-to-ask-for-google-review" className="text-blue-600 hover:text-blue-800 underline">the best time to ask a customer for a Google review</Link>.</p>

      <p>The bulk upload feature is particularly powerful for businesses in this position. Instead of waiting months to accumulate reviews one by one from new customers, you can reach out to your existing customer base and collect months' worth of reviews in a single burst. That initial boost in review count and recent activity gives your Google profile an immediate lift.</p>

      <p>From there, the habit is simple: after every job, enter the customer's name and number. The system handles the rest.</p>

      <h2 id="whats-next">What's Next for Cannon Steels</h2>

      <p>With 32 reviews and a 4.8-star rating, Cannon Steels is now in a much stronger position for local search visibility. The next milestone is 50 reviews, which puts them ahead of most competitors in their area. If you're wondering where your own target should sit, our guide on <Link href="/blog/how-many-google-reviews-to-rank-locally" className="text-blue-600 hover:text-blue-800 underline">how many Google reviews you need to rank locally</Link> breaks it down.</p>

      <p>Max is now sending review requests to new customers after each job — a process that takes seconds. The bulk upload gave them the initial boost, and consistent requests will keep the momentum going.</p>

      <p>Want results like Cannon Steels? Start collecting Google reviews automatically. It takes minutes to set up and your first new review could arrive within 48 hours.</p>
    </>
  );
}
