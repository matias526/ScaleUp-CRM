import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")

    if (!filename) {
      return NextResponse.json({ error: "Filename es requerido" }, { status: 400 })
    }

    const blob = await put(filename, request.body!, {
      access: "public",
    })

    return NextResponse.json({ url: blob.url })
  } catch (error: any) {
    console.error("[v0] Blob upload error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
