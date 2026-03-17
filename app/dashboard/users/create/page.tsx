import { UserForm } from "@/components/users/user-form"

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Nuevo Usuario</h1>
      <UserForm />
    </div>
  )
}
