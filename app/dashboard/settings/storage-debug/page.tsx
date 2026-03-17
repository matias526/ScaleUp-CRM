import { StorageDebug } from "@/components/debug/storage-debug"

export default function StorageDebugPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Almacenamiento</h1>
      <StorageDebug />
    </div>
  )
}
