import Link from "next/link"

export default function TestImagesPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test de imágenes</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Favicon y logos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="border p-4 rounded-md">
              <p className="mb-2">favicon.ico:</p>
              <img src="/favicon.ico" alt="Favicon" className="h-16 w-16" />
            </div>
            <div className="border p-4 rounded-md">
              <p className="mb-2">apple-touch-icon.png:</p>
              <img src="/apple-touch-icon.png" alt="Apple Touch Icon" className="h-16 w-16" />
            </div>
            <div className="border p-4 rounded-md">
              <p className="mb-2">android-chrome-192x192.png:</p>
              <img src="/android-chrome-192x192.png" alt="Android Chrome Icon" className="h-16 w-16" />
            </div>
            <div className="border p-4 rounded-md">
              <p className="mb-2">ScaleUp-colores.png:</p>
              <img src="/ScaleUp-colores.png" alt="ScaleUp Logo" className="h-16 w-auto" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Rutas alternativas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="border p-4 rounded-md">
              <p className="mb-2">Con /public/:</p>
              <img src="/public/favicon.ico" alt="Favicon con /public/" className="h-16 w-16" />
            </div>
            <div className="border p-4 rounded-md">
              <p className="mb-2">Con /images/:</p>
              <img src="/images/scaleup-isotipo-color.jpeg" alt="Isotipo original" className="h-16 w-16" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}
