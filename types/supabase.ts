export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      countries: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      end_customers: {
        Row: {
          id: string
          name: string
          industry: string | null
          website: string | null
          country_id: string | null
          city: string | null
          primary_contact_name: string | null
          primary_contact_email: string | null
          primary_contact_phone: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          website?: string | null
          country_id?: string | null
          city?: string | null
          primary_contact_name?: string | null
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          website?: string | null
          country_id?: string | null
          city?: string | null
          primary_contact_name?: string | null
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "end_customers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          id: string
          opportunity_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string | null
          is_private: boolean
        }
        Insert: {
          id?: string
          opportunity_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string | null
          is_private?: boolean
        }
        Update: {
          id?: string
          opportunity_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string | null
          is_private?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          id: string
          title: string
          description: string | null
          tech_company_id: string
          partner_id: string | null
          end_customer_id: string
          pipeline_stage_id: string
          estimated_value: number | null
          estimated_close_date: string | null
          probability: number | null
          created_by: string
          assigned_to: string | null
          validation_status: string | null
          validation_date: string | null
          validated_by: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string | null
          country: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          tech_company_id: string
          partner_id?: string | null
          end_customer_id: string
          pipeline_stage_id: string
          estimated_value?: number | null
          estimated_close_date?: string | null
          probability?: number | null
          created_by: string
          assigned_to?: string | null
          validation_status?: string | null
          validation_date?: string | null
          validated_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string | null
          country?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          tech_company_id?: string
          partner_id?: string | null
          end_customer_id?: string
          pipeline_stage_id?: string
          estimated_value?: number | null
          estimated_close_date?: string | null
          probability?: number | null
          created_by?: string
          assigned_to?: string | null
          validation_status?: string | null
          validation_date?: string | null
          validated_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string | null
          country?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_end_customer_id_fkey"
            columns: ["end_customer_id"]
            isOneToOne: false
            referencedRelation: "end_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_tech_fields: {
        Row: {
          created_at: string
          field_name: string
          field_type: string
          id: string
          is_required: boolean | null
          options: Json | null
          tech_company_id: string
          updated_at: string | null
          file_config: Json | null
        }
        Insert: {
          created_at?: string
          field_name: string
          field_type: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          tech_company_id: string
          updated_at?: string | null
          file_config?: Json | null
        }
        Update: {
          created_at?: string
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          tech_company_id?: string
          updated_at?: string | null
          file_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_tech_fields_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_tech_values: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          opportunity_tech_field_id: string
          value: string | null
          updated_at: string | null
          value_text: string | null
          value_numeric: number | null
          value_boolean: boolean | null
          value_date: string | null
          value_json: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          opportunity_tech_field_id: string
          value?: string | null
          updated_at?: string | null
          value_text?: string | null
          value_numeric?: number | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_json?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          opportunity_tech_field_id?: string
          value?: string | null
          updated_at?: string | null
          value_text?: string | null
          value_numeric?: number | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_tech_values_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_tech_values_opportunity_tech_field_id_fkey"
            columns: ["opportunity_tech_field_id"]
            isOneToOne: false
            referencedRelation: "opportunity_tech_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_countries: {
        Row: {
          created_at: string
          country_id: string
          id: string
          partner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          country_id: string
          id?: string
          partner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          country_id?: string
          id?: string
          partner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_countries_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_tech_companies: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          tech_company_id: string
          scaleup_manager_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          tech_company_id: string
          scaleup_manager_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          tech_company_id?: string
          scaleup_manager_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_tech_companies_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_tech_companies_scaleup_manager_id_fkey"
            columns: ["scaleup_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_tech_companies_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          code: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
          website: string | null
          address: string | null
          main_country_id: string | null
          city: string | null
          postal_code: string | null
          is_active: boolean
        }
        Insert: {
          created_at?: string
          code: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
          address?: string | null
          main_country_id?: string | null
          city?: string | null
          postal_code?: string | null
          is_active?: boolean
        }
        Update: {
          created_at?: string
          code?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
          address?: string | null
          main_country_id?: string | null
          city?: string | null
          postal_code?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "partners_main_country_id_fkey"
            columns: ["main_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          created_at: string
          id: string
          code: string
          display_order: number
          updated_at: string | null
          name: string
          probability: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          code: string
          display_order: number
          updated_at?: string | null
          name: string
          probability?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          code?: string
          display_order?: number
          updated_at?: string | null
          name?: string
          probability?: number | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          id: string
          code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          opportunity_id: string | null
          tech_company_id: string | null
          assigned_to: string
          assigned_by: string
          due_date: string | null
          status: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          opportunity_id?: string | null
          tech_company_id?: string | null
          assigned_to: string
          assigned_by: string
          due_date?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          opportunity_id?: string | null
          tech_company_id?: string | null
          assigned_to?: string
          assigned_by?: string
          due_date?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_companies: {
        Row: {
          created_at: string
          code: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
          website: string | null
          is_active: boolean
        }
        Insert: {
          created_at?: string
          code: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
          is_active?: boolean
        }
        Update: {
          created_at?: string
          code?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string
          id: string
          key: string
          language: string
          value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          language: string
          value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          language?: string
          value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          partner_id: string | null
          preferred_language: string
          role_id: string
          tech_company_id: string | null
          theme_preference: string
          updated_at: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          partner_id?: string | null
          preferred_language?: string
          role_id: string
          tech_company_id?: string | null
          theme_preference?: string
          updated_at?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          partner_id?: string | null
          preferred_language?: string
          role_id?: string
          tech_company_id?: string | null
          theme_preference?: string
          updated_at?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Row"]

export type Opportunity = Tables<"opportunities">
export type OpportunityInsert = Database["public"]["Tables"]["opportunities"]["Insert"]
