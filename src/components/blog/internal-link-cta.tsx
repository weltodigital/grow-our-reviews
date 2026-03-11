import Link from "next/link";
import { Lightbulb } from "lucide-react";

interface InternalLinkCTAProps {
  text: string;
  href: string;
  linkText: string;
}

export function InternalLinkCTA({ text, href, linkText }: InternalLinkCTAProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-6">
      <div className="flex items-start space-x-3">
        <Lightbulb className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-gray-700">
          {text}{" "}
          <Link
            href={href}
            className="text-blue-600 font-medium hover:text-blue-800 underline"
          >
            {linkText}
          </Link>{" "}
          handles review requests automatically after every job.
        </p>
      </div>
    </div>
  );
}