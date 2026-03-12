export async function generateStaticParams() {
  return [
    { slug: 'test-article' },
  ];
}

export default function TestBlogArticle({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">🧪 DYNAMIC ROUTE TEST</h1>
        <p className="text-gray-600 text-lg mb-2">Slug: {params.slug}</p>
        <p className="text-gray-500">If you can see this, dynamic routes work</p>
      </div>
    </div>
  )
}