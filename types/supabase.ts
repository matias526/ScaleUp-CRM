export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          end_customer_id: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          linkedin_url: string | null
          notes: string | null
          partner_id: string | null
          phone: string | null
          position: string | null
          preferred_language: string | null
          prospect_id: string | null
          tech_company_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          end_customer_id?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          linkedin_url?: string | null
          notes?: string | null
          partner_id?: string | null
          phone?: string | null
          position?: string | null
          preferred_language?: string | null
          prospect_id?: string | null
          tech_company_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          end_customer_id?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          linkedin_url?: string | null
          notes?: string | null
          partner_id?: string | null
          phone?: string | null
          position?: string | null
          preferred_language?: string | null
          prospect_id?: string | null
          tech_company_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_end_customer_id_fkey"
            columns: ["end_customer_id"]
            isOneToOne: false
            referencedRelation: "end_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospect_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          doc_type: string
          file_url: string
          id: string
          notes: string | null
          parent_id: string
          parent_type: string
          status: string | null
          uploaded_at: string | null
          validated_at: string | null
          verified_by: string | null
        }
        Insert: {
          doc_type: string
          file_url: string
          id?: string
          notes?: string | null
          parent_id: string
          parent_type: string
          status?: string | null
          uploaded_at?: string | null
          validated_at?: string | null
          verified_by?: string | null
        }
        Update: {
          doc_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          parent_id?: string
          parent_type?: string
          status?: string | null
          uploaded_at?: string | null
          validated_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      end_customers: {
        Row: {
          city: string | null
          country_id: string | null
          created_at: string | null
          id: string
          industry_id: string | null
          name: string
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          country_id?: string | null
          created_at?: string | null
          id?: string
          industry_id?: string | null
          name: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          country_id?: string | null
          created_at?: string | null
          id?: string
          industry_id?: string | null
          name?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "end_customers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "end_customers_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      internal_meeting_participants: {
        Row: {
          attended: boolean | null
          created_at: string | null
          id: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          created_at?: string | null
          id?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          created_at?: string | null
          id?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "internal_weekly_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_meeting_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_weekly_meetings: {
        Row: {
          closing_notes: string | null
          created_at: string | null
          created_by: string
          id: string
          meeting_date: string
          previous_meeting_id: string | null
          status: string | null
          updated_at: string | null
          weekly_topic: string | null
        }
        Insert: {
          closing_notes?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          meeting_date: string
          previous_meeting_id?: string | null
          status?: string | null
          updated_at?: string | null
          weekly_topic?: string | null
        }
        Update: {
          closing_notes?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          meeting_date?: string
          previous_meeting_id?: string | null
          status?: string | null
          updated_at?: string | null
          weekly_topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_weekly_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_weekly_meetings_previous_meeting_id_fkey"
            columns: ["previous_meeting_id"]
            isOneToOne: false
            referencedRelation: "internal_weekly_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_conversations: {
        Row: {
          created_at: string | null
          id: string
          tech_company_id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tech_company_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tech_company_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_conversations_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_document_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "kb_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_documents: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_path: string | null
          file_size: number | null
          filename: string
          id: string
          mime_type: string
          processed_at: string | null
          source_type: string
          source_url: string | null
          status: string
          tech_company_id: string
          total_chunks: number | null
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          filename: string
          id?: string
          mime_type: string
          processed_at?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          tech_company_id: string
          total_chunks?: number | null
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          mime_type?: string
          processed_at?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          tech_company_id?: string
          total_chunks?: number | null
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_documents_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          message_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          message_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          message_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "kb_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_learning_examples: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          is_positive: boolean | null
          last_used_at: string | null
          mika_response: string
          query_embedding: string | null
          tech_company_id: string
          times_used: number | null
          user_correction: string
          user_id: string
          user_query: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          is_positive?: boolean | null
          last_used_at?: string | null
          mika_response: string
          query_embedding?: string | null
          tech_company_id: string
          times_used?: number | null
          user_correction: string
          user_id: string
          user_query: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_positive?: boolean | null
          last_used_at?: string | null
          mika_response?: string
          query_embedding?: string | null
          tech_company_id?: string
          times_used?: number | null
          user_correction?: string
          user_id?: string
          user_query?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_learning_examples_tech_company_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_learning_examples_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_learning_examples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "kb_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          question_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          question_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          question_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_attachments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_labels: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_base_question_labels: {
        Row: {
          created_at: string | null
          id: string
          label_id: string
          question_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label_id: string
          question_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_question_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_question_labels_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_questions: {
        Row: {
          answer: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string
          id: string
          is_approved: boolean | null
          last_modified_by: string | null
          question: string
          tech_company_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          answer: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_approved?: boolean | null
          last_modified_by?: string | null
          question: string
          tech_company_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          answer?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_approved?: boolean | null
          last_modified_by?: string | null
          question?: string
          tech_company_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_questions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_questions_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_questions_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_tech_company_approvers: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          tech_company_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          tech_company_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          tech_company_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_tech_company_approvers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_tech_company_approvers_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_tech_company_approvers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_opportunity_reviews: {
        Row: {
          created_at: string | null
          id: string
          marked_by_bdd: boolean | null
          meeting_id: string
          notes: string | null
          opportunity_id: string
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          marked_by_bdd?: boolean | null
          meeting_id: string
          notes?: string | null
          opportunity_id: string
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          marked_by_bdd?: boolean | null
          meeting_id?: string
          notes?: string | null
          opportunity_id?: string
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_opportunity_reviews_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "internal_weekly_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_opportunity_reviews_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_opportunity_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_private: boolean | null
          opportunity_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          opportunity_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          opportunity_id?: string
          updated_at?: string | null
          user_id?: string
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
          assigned_to: string | null
          country: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_customer_id: string | null
          estimated_close_date: string | null
          estimated_value: number | null
          id: string
          is_new_partner: boolean
          partner_id: string | null
          partner_responsible_id: string | null
          pipeline_stage_id: string
          probability: number | null
          prospect_id: string | null
          rejection_reason: string | null
          tech_company_id: string
          title: string
          updated_at: string | null
          validated_by: string | null
          validation_date: string | null
          validation_status: string | null
        }
        Insert: {
          assigned_to?: string | null
          country?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_customer_id?: string | null
          estimated_close_date?: string | null
          estimated_value?: number | null
          id?: string
          is_new_partner?: boolean
          partner_id?: string | null
          partner_responsible_id?: string | null
          pipeline_stage_id: string
          probability?: number | null
          prospect_id?: string | null
          rejection_reason?: string | null
          tech_company_id: string
          title: string
          updated_at?: string | null
          validated_by?: string | null
          validation_date?: string | null
          validation_status?: string | null
        }
        Update: {
          assigned_to?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_customer_id?: string | null
          estimated_close_date?: string | null
          estimated_value?: number | null
          id?: string
          is_new_partner?: boolean
          partner_id?: string | null
          partner_responsible_id?: string | null
          pipeline_stage_id?: string
          probability?: number | null
          prospect_id?: string | null
          rejection_reason?: string | null
          tech_company_id?: string
          title?: string
          updated_at?: string | null
          validated_by?: string | null
          validation_date?: string | null
          validation_status?: string | null
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
            foreignKeyName: "opportunities_partner_responsible_id_fkey"
            columns: ["partner_responsible_id"]
            isOneToOne: false
            referencedRelation: "users"
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
            foreignKeyName: "opportunities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospect_partners"
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
      opportunity_contacts: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          opportunity_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          opportunity_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_tech_fields: {
        Row: {
          created_at: string | null
          display_order: number
          field_name: string
          field_type: string
          file_config: Json | null
          id: string
          is_required: boolean | null
          options: Json | null
          tech_company_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order: number
          field_name: string
          field_type: string
          file_config?: Json | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          tech_company_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          field_name?: string
          field_type?: string
          file_config?: Json | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          tech_company_id?: string
          updated_at?: string | null
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
          created_at: string | null
          id: string
          opportunity_id: string
          opportunity_tech_field_id: string
          updated_at: string | null
          value_boolean: boolean | null
          value_date: string | null
          value_json: Json | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          opportunity_id: string
          opportunity_tech_field_id: string
          updated_at?: string | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_json?: Json | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          opportunity_id?: string
          opportunity_tech_field_id?: string
          updated_at?: string | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_json?: Json | null
          value_numeric?: number | null
          value_text?: string | null
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
      opportunity_tech_values_backup: {
        Row: {
          created_at: string | null
          id: string | null
          opportunity_id: string | null
          opportunity_tech_field_id: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          opportunity_id?: string | null
          opportunity_tech_field_id?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          opportunity_id?: string | null
          opportunity_tech_field_id?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      partner_countries: {
        Row: {
          country_id: string
          created_at: string | null
          id: string
          partner_id: string
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          id?: string
          partner_id: string
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
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
          created_at: string | null
          id: string
          partner_id: string
          scaleup_manager_id: string | null
          tech_company_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          partner_id: string
          scaleup_manager_id?: string | null
          tech_company_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          partner_id?: string
          scaleup_manager_id?: string | null
          tech_company_id?: string
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
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          main_country_id: string | null
          name: string
          postal_code: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          main_country_id?: string | null
          name: string
          postal_code?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          main_country_id?: string | null
          name?: string
          postal_code?: string | null
          updated_at?: string | null
          website?: string | null
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
          code: string
          created_at: string | null
          display_order: number
          id: string
          probability: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          display_order: number
          id?: string
          probability?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          display_order?: number
          id?: string
          probability?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      po_milestones: {
        Row: {
          achieved_at: string | null
          amount: number
          created_at: string | null
          due_date: string | null
          id: string
          invoiced_at: string | null
          paid_at: string | null
          po_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          achieved_at?: string | null
          amount: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoiced_at?: string | null
          paid_at?: string | null
          po_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          achieved_at?: string | null
          amount?: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoiced_at?: string | null
          paid_at?: string | null
          po_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_milestones_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_partners: {
        Row: {
          address: string | null
          code: string | null
          converted_at: string | null
          converted_partner_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          lead_source: string | null
          main_country_id: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          converted_at?: string | null
          converted_partner_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lead_source?: string | null
          main_country_id?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          converted_at?: string | null
          converted_partner_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lead_source?: string | null
          main_country_id?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_partners_converted_partner_id_fkey"
            columns: ["converted_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_partners_main_country_id_fkey"
            columns: ["main_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
        }
        Relationships: []
      }
      pulse_message_template_translations: {
        Row: {
          body_content: string
          display_name: string
          id: string
          language_code: string
          subject: string | null
          template_id: string | null
        }
        Insert: {
          body_content: string
          display_name: string
          id?: string
          language_code: string
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          body_content?: string
          display_name?: string
          id?: string
          language_code?: string
          subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pulse_message_template_translations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pulse_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_message_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          internal_code: string
          is_active: boolean | null
          tech_company_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          internal_code: string
          is_active?: boolean | null
          tech_company_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          internal_code?: string
          is_active?: boolean | null
          tech_company_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pulse_templates_tech_company"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_sent_messages_attachments: {
        Row: {
          attachment_id: string
          created_at: string | null
          id: string
          log_id: string
        }
        Insert: {
          attachment_id: string
          created_at?: string | null
          id?: string
          log_id: string
        }
        Update: {
          attachment_id?: string
          created_at?: string | null
          id?: string
          log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_sent_messages_attachments_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "pulse_message_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_sent_messages_attachments_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "pulse_sent_messages_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_sent_messages_logs: {
        Row: {
          channel: string
          contact_id: string | null
          error_message: string | null
          final_body: string
          final_subject: string | null
          id: string
          language_used: string | null
          opportunity_id: string | null
          sender_id: string | null
          sender_type: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          channel: string
          contact_id?: string | null
          error_message?: string | null
          final_body: string
          final_subject?: string | null
          id?: string
          language_used?: string | null
          opportunity_id?: string | null
          sender_id?: string | null
          sender_type: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          channel?: string
          contact_id?: string | null
          error_message?: string | null
          final_body?: string
          final_subject?: string | null
          id?: string
          language_used?: string | null
          opportunity_id?: string | null
          sender_id?: string | null
          sender_type?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      pulse_template_attachments_join: {
        Row: {
          attachment_id: string
          language_code: string
          template_id: string
        }
        Insert: {
          attachment_id: string
          language_code?: string
          template_id: string
        }
        Update: {
          attachment_id?: string
          language_code?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_template_attachments_join_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "pulse_message_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_template_attachments_join_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pulse_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string | null
          id: string
          opportunity_id: string
          partner_user_id: string | null
          po_number: string
          quote_id: string | null
          shipping_amount: number | null
          status: string | null
          subtotal_amount: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          id?: string
          opportunity_id: string
          partner_user_id?: string | null
          po_number: string
          quote_id?: string | null
          shipping_amount?: number | null
          status?: string | null
          subtotal_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          id?: string
          opportunity_id?: string
          partner_user_id?: string | null
          po_number?: string
          quote_id?: string | null
          shipping_amount?: number | null
          status?: string | null
          subtotal_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string | null
          economical_quote_url: string | null
          expiration_date: string | null
          general_discount_amount: number | null
          id: string
          items: Json | null
          notes: string | null
          opportunity_id: string
          quote_date: string | null
          quote_number: string
          shipping_amount: number | null
          status: string | null
          subtotal_amount: number | null
          technical_quote_url: string | null
          total_amount: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          economical_quote_url?: string | null
          expiration_date?: string | null
          general_discount_amount?: number | null
          id?: string
          items?: Json | null
          notes?: string | null
          opportunity_id: string
          quote_date?: string | null
          quote_number: string
          shipping_amount?: number | null
          status?: string | null
          subtotal_amount?: number | null
          technical_quote_url?: string | null
          total_amount?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          economical_quote_url?: string | null
          expiration_date?: string | null
          general_discount_amount?: number | null
          id?: string
          items?: Json | null
          notes?: string | null
          opportunity_id?: string
          quote_date?: string | null
          quote_number?: string
          shipping_amount?: number | null
          status?: string | null
          subtotal_amount?: number | null
          technical_quote_url?: string | null
          total_amount?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          code: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shippings: {
        Row: {
          actual_shipped_at: string | null
          carrier: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          dimensions: string | null
          estimated_delivery_date: string | null
          estimated_shipping_date: string | null
          id: string
          po_id: string | null
          status: string | null
          street: string | null
          street_number: string | null
          total_weight: number | null
          tracking_number: string | null
          zipcode: string | null
        }
        Insert: {
          actual_shipped_at?: string | null
          carrier?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          dimensions?: string | null
          estimated_delivery_date?: string | null
          estimated_shipping_date?: string | null
          id?: string
          po_id?: string | null
          status?: string | null
          street?: string | null
          street_number?: string | null
          total_weight?: number | null
          tracking_number?: string | null
          zipcode?: string | null
        }
        Update: {
          actual_shipped_at?: string | null
          carrier?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          dimensions?: string | null
          estimated_delivery_date?: string | null
          estimated_shipping_date?: string | null
          id?: string
          po_id?: string | null
          status?: string | null
          street?: string | null
          street_number?: string | null
          total_weight?: number | null
          tracking_number?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shippings_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          comments: string | null
          commitment_status: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_commitment: boolean | null
          meeting_id: string | null
          opportunity_id: string | null
          parent_task_id: string | null
          partner_id: string | null
          priority: string | null
          reviewed_in_meeting_id: string | null
          status: string | null
          task_type_id: string | null
          tech_company_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          comments?: string | null
          commitment_status?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_commitment?: boolean | null
          meeting_id?: string | null
          opportunity_id?: string | null
          parent_task_id?: string | null
          partner_id?: string | null
          priority?: string | null
          reviewed_in_meeting_id?: string | null
          status?: string | null
          task_type_id?: string | null
          tech_company_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          comments?: string | null
          commitment_status?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_commitment?: boolean | null
          meeting_id?: string | null
          opportunity_id?: string | null
          parent_task_id?: string | null
          partner_id?: string | null
          priority?: string | null
          reviewed_in_meeting_id?: string | null
          status?: string | null
          task_type_id?: string | null
          tech_company_id?: string | null
          title?: string
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
            foreignKeyName: "tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "internal_weekly_meetings"
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
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_reviewed_in_meeting_id_fkey"
            columns: ["reviewed_in_meeting_id"]
            isOneToOne: false
            referencedRelation: "internal_weekly_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
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
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string | null
          id: string
          key: string
          language: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          language: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          language?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_email_integrations: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string
          id: string
          is_connected: boolean | null
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_connected?: boolean | null
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_connected?: boolean | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_email_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_terms_acceptance: {
        Row: {
          accepted_at: string
          id: string
          ip_address: string | null
          terms_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          partner_id: string | null
          password_hash: string | null
          phone: string | null
          preferred_language: string | null
          profile_image: string | null
          receive_daily_email: boolean
          role_id: string | null
          tech_company_id: string | null
          theme_preference: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          partner_id?: string | null
          password_hash?: string | null
          phone?: string | null
          preferred_language?: string | null
          profile_image?: string | null
          receive_daily_email?: boolean
          role_id?: string | null
          tech_company_id?: string | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          partner_id?: string | null
          password_hash?: string | null
          phone?: string | null
          preferred_language?: string | null
          profile_image?: string | null
          receive_daily_email?: boolean
          role_id?: string | null
          tech_company_id?: string | null
          theme_preference?: string | null
          updated_at?: string | null
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
      weekly_general_news: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          meeting_id: string
          order_index: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          meeting_id: string
          order_index?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          meeting_id?: string
          order_index?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_general_news_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_general_news_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "internal_weekly_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_report_recipients: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          preferred_language: string | null
          tech_company_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          preferred_language?: string | null
          tech_company_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          preferred_language?: string | null
          tech_company_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_report_recipients_tech_company_id_fkey"
            columns: ["tech_company_id"]
            isOneToOne: false
            referencedRelation: "tech_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_report_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      opportunity_tech_values_view: {
        Row: {
          created_at: string | null
          id: string | null
          opportunity_id: string | null
          opportunity_tech_field_id: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          opportunity_id?: string | null
          opportunity_tech_field_id?: string | null
          updated_at?: string | null
          value?: never
        }
        Update: {
          created_at?: string | null
          id?: string | null
          opportunity_id?: string | null
          opportunity_tech_field_id?: string | null
          updated_at?: string | null
          value?: never
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
    }
    Functions: {
      insert_opportunity_tech_value: {
        Args: {
          p_field_type: string
          p_opportunity_id: string
          p_opportunity_tech_field_id: string
          p_value: string
        }
        Returns: string
      }
      insert_translation: {
        Args: { p_en: string; p_es: string; p_key: string; p_pt: string }
        Returns: undefined
      }
      match_kb_chunks: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
          tech_company_filter: string
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          document_id: string
          filename: string
          id: string
          similarity: number
        }[]
      }
      match_learning_examples: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
          tech_company_filter: string
        }
        Returns: {
          id: string
          mika_response: string
          similarity: number
          user_correction: string
          user_query: string
        }[]
      }
    }
    Enums: {
      contact_department:
        | "marketing"
        | "management"
        | "technical"
        | "administration"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      contact_department: [
        "marketing",
        "management",
        "technical",
        "administration",
        "other",
      ],
    },
  },
} as const
