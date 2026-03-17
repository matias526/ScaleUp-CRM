"use client"

import { useAuth } from "@/components/auth/auth-provider"

export function AuthContextDebug() {
  const { user, userInfo, loading, session } = useAuth()

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Auth Context Debug</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">User:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(user, null, 2)}</pre>
        </div>

        <div>
          <h3 className="font-semibold">UserInfo:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(userInfo, null, 2)}</pre>
        </div>

        <div>
          <h3 className="font-semibold">Loading:</h3>
          <p>{loading ? "true" : "false"}</p>
        </div>

        <div>
          <h3 className="font-semibold">Session:</h3>
          <p>{session ? "Exists" : "null"}</p>
        </div>
      </div>
    </div>
  )
}
