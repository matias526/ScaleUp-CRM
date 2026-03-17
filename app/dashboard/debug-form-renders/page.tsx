import { FormRenderDebug } from "@/components/debug/form-render-debug"

export default function DebugFormRendersPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Form Render Debug</h1>
      <FormRenderDebug />
    </div>
  )
}
