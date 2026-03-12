export default function BlogDebugPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-green-600 mb-4">✅ BLOG DEBUG ROUTE WORKING!</h1>
        <p className="text-gray-600 text-lg mb-2">This is /blog/debug</p>
        <p className="text-gray-500">This route works, so the issue is specific to dynamic routes</p>
      </div>
    </div>
  )
}