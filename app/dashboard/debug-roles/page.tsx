"use client"

import { RoleDebugger } from "@/components/debug/role-debugger"

export default function DebugRolesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Depuración de Roles</h1>
      <RoleDebugger />
    </div>
  )
}
