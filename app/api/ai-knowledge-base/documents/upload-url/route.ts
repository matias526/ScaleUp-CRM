import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role_id, roles:role_id(code)")
      .eq("id", user.id)
      .single()

    if (userData?.roles?.code !== "Admin") {
      return NextResponse.json({ error: "Solo Admin puede subir documentos" }, { status: 403 })
    }

    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Generar token para que el cliente suba directamente a Blob
        return {
          allowedContentTypes: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Este callback se ejecuta cuando el upload se completa
        console.log("[v0] Blob upload completed:", blob.url)

        // Aquí podrías guardar en la base de datos si quisieras
        // Pero lo haremos desde el cliente para tener más control
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    console.error("[v0] Error in handleUpload:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
