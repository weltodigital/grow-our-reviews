import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/grow-our-reviews-logo.png"
              alt="Grow Our Reviews"
              width={350}
              height={70}
              className="h-16 w-auto"
              priority
            />
          </div>
          <p className="text-gray-600">Turn happy customers into 5-star reviews</p>
        </div>
        {children}
      </div>
    </div>
  )
}