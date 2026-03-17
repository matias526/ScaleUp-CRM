import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getTechCompaniesServer() {
  try {
    console.log("SERVER: Iniciando getTechCompaniesServer")

    // Create a server-side Supabase client
    const supabase = createServerComponentClient({ cookies })

    // Execute the query
    console.log("SERVER QUERY:", "supabase.from('tech_companies').select('id, name').order('name')")
    const { data, error } = await supabase.from("tech_companies").select("id, name").order("name")

    if (error) {
      console.error("SERVER ERROR en getTechCompaniesServer:", error)
      return []
    }

    console.log(`SERVER: getTechCompaniesServer obtuvo ${data?.length || 0} registros`)
    return data || []
  } catch (error) {
    console.error("SERVER EXCEPTION en getTechCompaniesServer:", error)
    return []
  }
}
