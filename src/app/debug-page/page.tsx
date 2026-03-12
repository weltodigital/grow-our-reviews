export default function DebugPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-500">
      <div className="text-white text-center p-8">
        <h1 className="text-6xl font-bold mb-4">🚨 DEBUG PAGE</h1>
        <p className="text-2xl mb-4">If you can see this, routing works!</p>
        <p className="text-lg">This is /debug-page</p>
        <p className="text-sm mt-4">No auth, no middleware, just a simple page</p>
      </div>
    </div>
  )
}