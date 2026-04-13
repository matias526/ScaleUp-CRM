return (
  <div className="flex h-screen items-center justify-center bg-slate-100">
    <div className="p-10 bg-white shadow-xl rounded-lg">
      <h1 className="text-2xl font-bold text-blue-600">
        Hello World - Test de Renderizado
      </h1>
      <p className="text-gray-600">
        Si ves esto, el error #185 es por el contenido del formulario.
      </p>
      <pre className="mt-4 p-2 bg-gray-50 text-xs">
        ID Tech Company: {watchTechCompany || 'No seleccionada'}
      </pre>
    </div>
  </div>
);