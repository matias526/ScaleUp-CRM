import { ContactForm } from "@/components/contacts/contact-form"

export const metadata = {
  title: "Crear Contacto | ScaleUp CRM",
  description: "Crea un nuevo contacto en el sistema",
}

export default function CreateContactPage() {
  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Contacto</h1>
        <p className="text-gray-600">Añade un nuevo contacto al sistema</p>
      </div>

      <div className="max-w-3xl">
        <ContactForm showCancel={true} />
      </div>
    </main>
  )
}
