import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Starting users API request")
    const { searchParams } = new URL(request.url)
    const roles = searchParams.get("roles")
    console.log("[v0] Requested roles:", roles)

    const supabase = await createServerClient()

    const query = supabase
      .from("users")
      .select(`
        id,
        email,
        first_name,
        last_name,
        roles:role_id (code),
        is_active
      `)
      .eq("is_active", true)
      .order("first_name", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching users:", error)
      return NextResponse.json({ success: false, message: "Error al obtener usuarios" }, { status: 500 })
    }

    console.log("[v0] Raw data from database:", data)

    let filteredData = data || []
    if (roles) {
      const roleList = roles.split(",").map((role) => role.toLowerCase()) // Convert to lowercase to match DB
      console.log("[v0] Filtering by roles (lowercase):", roleList)
      filteredData = data?.filter((user) => user.roles && roleList.includes(user.roles.code.toLowerCase())) || []
    }

    console.log("[v0] Found users after filtering:", filteredData.length)
    console.log(
      "[v0] Filtered users:",
      filteredData.map((u) => ({
        name: `${u.first_name} ${u.last_name}`,
        role: u.roles?.code,
      })),
    )

    return NextResponse.json({
      success: true,
      users: filteredData,
    })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ success: false, message: "Error inesperado" }, { status: 500 })
  }
}
