export default function BlogTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-green-600 mb-4">✅ BLOG ROUTE WORKING!</h1>
        <p className="text-gray-600 text-lg mb-2">This is /blog/test</p>
        <p className="text-gray-500">No authentication required</p>
        <p className="text-sm text-gray-400 mt-4">
          URL: {typeof window !== 'undefined' ? window.location.href : 'Server-side render'}
        </p>
      </div>
    </div>
  )
}