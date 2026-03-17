export default function SimpleCreatePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Crear Oportunidad - Versión Simple</h1>

      <form className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">Título</label>
          <input type="text" className="w-full p-2 border rounded" placeholder="Título de la oportunidad" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea className="w-full p-2 border rounded" placeholder="Descripción" rows={3} />
        </div>

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Guardar
        </button>
      </form>
    </div>
  )
}
