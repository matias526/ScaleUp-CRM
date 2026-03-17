import { type NextRequest, NextResponse } from "next/server"
import { uploadNewsImage } from "@/lib/supabase/storage"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting image upload process")

    const supabase = createRouteHandlerClient<Database>({ cookies })

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] No file provided in request")
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File received:", { name: file.name, type: file.type, size: file.size })

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"]

    const isValidType = allowedTypes.includes(file.type) || (fileExtension && allowedExtensions.includes(fileExtension))

    if (!isValidType) {
      console.log("[v0] Invalid file type:", file.type, "Extension:", fileExtension)
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed." },
        { status: 400 },
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.log("[v0] File too large:", file.size)
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 5MB." }, { status: 400 })
    }

    const result = await uploadNewsImage(file, supabase)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    console.log("[v0] File uploaded successfully to Supabase:", result.url)

    return NextResponse.json({
      success: true,
      filename: result.url,
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json(
      { success: false, error: `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
