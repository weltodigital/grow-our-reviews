import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BlogCTABanner() {
  return (
    <div className="bg-gradient-to-r from-green-50 to-green-50 border border-green-100 rounded-lg p-8 my-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Automate your Google review collection
        </h3>
        <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
          Grow Our Reviews sends your customers a review request after every job. More Google reviews, better local rankings, more work. Try it free for 7 days.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="https://app.growourreviews.com/signup"
            className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          No credit card required
        </p>
      </div>
    </div>
  );
}