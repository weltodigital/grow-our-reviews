export default function TestMiddlewarePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Middleware Test Page</h1>
        <p className="text-gray-600 mt-4">
          If you can see this page, the middleware bypass is working.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Deployed at: {new Date().toISOString()}
        </p>
      </div>
    </div>
  )
}