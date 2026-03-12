export default function BlogTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Test Page</h1>
        <p className="text-gray-600">If you can see this page without login, the blog should work too.</p>
        <p className="text-sm text-gray-500 mt-4">This page is NOT excluded from middleware</p>
      </div>
    </div>
  )
}