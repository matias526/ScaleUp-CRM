import { AuthContextDebug } from "@/components/debug/auth-context-debug"

export default function DebugAuthContextPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Auth Context Debug</h1>
      <AuthContextDebug />
    </div>
  )
}
