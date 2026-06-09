export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      _member_backup_20260609: {
        Row: {
          address: string | null
          auth_created_at: string | null
          auth_email: string | null
          auth_meta: Json | null
          auth_provider: string | null
          auth_user_id: string | null
          avatar_url: string | null
          business_description: string | null
          business_name: string | null
          business_sector: string | null
          business_website: string | null
          cv_name: string | null
          cv_path: string | null
          full_name: string | null
          hiring_mode: boolean | null
          is_admin: boolean | null
          is_verified: boolean | null
          is_volunteer_mentor: boolean | null
          mentor_topics: string | null
          mentor_weekly_hours: string | null
          phone: string | null
          phone_verified: boolean | null
          platform_role: string | null
          presentation_name: string | null
          presentation_path: string | null
          profession: string | null
          profile_type: string | null
          school: string | null
          show_on_map: boolean | null
        }
        Insert: {
          address?: string | null
          auth_created_at?: string | null
          auth_email?: string | null
          auth_meta?: Json | null
          auth_provider?: string | null
          auth_user_id?: string | null
          avatar_url?: string | null
          business_description?: string | null
          business_name?: string | null
          business_sector?: string | null
          business_website?: string | null
          cv_name?: string | null
          cv_path?: string | null
          full_name?: string | null
          hiring_mode?: boolean | null
          is_admin?: boolean | null
          is_verified?: boolean | null
          is_volunteer_mentor?: boolean | null
          mentor_topics?: string | null
          mentor_weekly_hours?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          platform_role?: string | null
          presentation_name?: string | null
          presentation_path?: string | null
          profession?: string | null
          profile_type?: string | null
          school?: string | null
          show_on_map?: boolean | null
        }
        Update: {
          address?: string | null
          auth_created_at?: string | null
          auth_email?: string | null
          auth_meta?: Json | null
          auth_provider?: string | null
          auth_user_id?: string | null
          avatar_url?: string | null
          business_description?: string | null
          business_name?: string | null
          business_sector?: string | null
          business_website?: string | null
          cv_name?: string | null
          cv_path?: string | null
          full_name?: string | null
          hiring_mode?: boolean | null
          is_admin?: boolean | null
          is_verified?: boolean | null
          is_volunteer_mentor?: boolean | null
          mentor_topics?: string | null
          mentor_weekly_hours?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          platform_role?: string | null
          presentation_name?: string | null
          presentation_path?: string | null
          profession?: string | null
          profile_type?: string | null
          school?: string | null
          show_on_map?: boolean | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_value: Json | null
          before_value: Json | null
          created_at: string
          id: string
          target_entity_id: string | null
          target_entity_type: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          id?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          id?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      advisor_details: {
        Row: {
          appointment_url: string | null
          consultation_modes: string[]
          created_at: string
          item_id: string
          languages: string[]
          supports_online_consultation: boolean
          updated_at: string
        }
        Insert: {
          appointment_url?: string | null
          consultation_modes?: string[]
          created_at?: string
          item_id: string
          languages?: string[]
          supports_online_consultation?: boolean
          updated_at?: string
        }
        Update: {
          appointment_url?: string | null
          consultation_modes?: string[]
          created_at?: string
          item_id?: string
          languages?: string[]
          supports_online_consultation?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_social_media_links: {
        Row: {
          added_by: string
          contacted_email: boolean
          contacted_instagram: boolean
          contacted_phone: boolean
          contacted_whatsapp: boolean
          created_at: string
          description: string | null
          email: string | null
          id: string
          instagram: string | null
          link: string | null
          name: string
          phone: string | null
          platform: string
          whatsapp: string | null
        }
        Insert: {
          added_by?: string
          contacted_email?: boolean
          contacted_instagram?: boolean
          contacted_phone?: boolean
          contacted_whatsapp?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          link?: string | null
          name?: string
          phone?: string | null
          platform?: string
          whatsapp?: string | null
        }
        Update: {
          added_by?: string
          contacted_email?: boolean
          contacted_instagram?: boolean
          contacted_phone?: boolean
          contacted_whatsapp?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          link?: string | null
          name?: string
          phone?: string | null
          platform?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      afs_attributes: {
        Row: {
          created_at: string
          data_type: string
          default_visibility: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          key: string
          label: string
          sort_order: number
          storage_key: string | null
          storage_strategy: string
          updated_at: string
          validation_schema: Json | null
        }
        Insert: {
          created_at?: string
          data_type: string
          default_visibility?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key: string
          label: string
          sort_order?: number
          storage_key?: string | null
          storage_strategy?: string
          updated_at?: string
          validation_schema?: Json | null
        }
        Update: {
          created_at?: string
          data_type?: string
          default_visibility?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key?: string
          label?: string
          sort_order?: number
          storage_key?: string | null
          storage_strategy?: string
          updated_at?: string
          validation_schema?: Json | null
        }
        Relationships: []
      }
      afs_features: {
        Row: {
          created_at: string
          default_visibility: string
          description: string | null
          feature_type: string
          is_active_globally: boolean
          key: string
          label: string
          metadata: Json
          scope: string
          scope_role: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_visibility?: string
          description?: string | null
          feature_type?: string
          is_active_globally?: boolean
          key: string
          label: string
          metadata?: Json
          scope?: string
          scope_role: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_visibility?: string
          description?: string | null
          feature_type?: string
          is_active_globally?: boolean
          key?: string
          label?: string
          metadata?: Json
          scope?: string
          scope_role?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      afs_sections: {
        Row: {
          component_key: string | null
          created_at: string
          data_source: string
          default_visibility: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          label: string
          metadata: Json
          section_area: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          component_key?: string | null
          created_at?: string
          data_source?: string
          default_visibility?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          label: string
          metadata?: Json
          section_area: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          component_key?: string | null
          created_at?: string
          data_source?: string
          default_visibility?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          metadata?: Json
          section_area?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_email: string | null
          client_id: string
          client_name: string | null
          client_timezone: string
          created_at: string
          duration_minutes: number
          id: string
          meeting_url: string | null
          notes: string | null
          provider_id: string
          provider_kind: string
          scheduled_at: string
          status: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_id: string
          client_name?: string | null
          client_timezone: string
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          notes?: string | null
          provider_id: string
          provider_kind?: string
          scheduled_at: string
          status?: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_id?: string
          client_name?: string | null
          client_timezone?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_url?: string | null
          notes?: string | null
          provider_id?: string
          provider_kind?: string
          scheduled_at?: string
          status?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          payload: Json
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_entity_id: string | null
          target_entity_type: string | null
          target_feature_key: string | null
          target_role_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          payload?: Json
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_feature_key?: string | null
          target_role_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          payload?: Json
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_feature_key?: string | null
          target_role_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_target_feature_key_fkey"
            columns: ["target_feature_key"]
            isOneToOne: false
            referencedRelation: "afs_features"
            referencedColumns: ["key"]
          },
        ]
      }
      business_details: {
        Row: {
          appointment_url: string | null
          created_at: string
          item_id: string
          opening_hours: Json
          price_segment: string | null
          supports_delivery: boolean
          supports_online_booking: boolean
          updated_at: string
        }
        Insert: {
          appointment_url?: string | null
          created_at?: string
          item_id: string
          opening_hours?: Json
          price_segment?: string | null
          supports_delivery?: boolean
          supports_online_booking?: boolean
          updated_at?: string
        }
        Update: {
          appointment_url?: string | null
          created_at?: string
          item_id?: string
          opening_hours?: Json
          price_segment?: string | null
          supports_delivery?: boolean
          supports_online_booking?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cadde_billboard_cards: {
        Row: {
          badge_text: string | null
          card_type: string
          city_id: string | null
          content_mode: string
          country_id: string | null
          created_at: string
          cta_label: string
          cta_url: string
          description: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          sort_order: number
          starts_at: string | null
          status: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          card_type: string
          city_id?: string | null
          content_mode?: string
          country_id?: string | null
          created_at?: string
          cta_label: string
          cta_url: string
          description: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          sort_order?: number
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          card_type?: string
          city_id?: string | null
          content_mode?: string
          country_id?: string | null
          created_at?: string
          cta_label?: string
          cta_url?: string
          description?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          sort_order?: number
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadde_billboard_cards_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cadde_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadde_billboard_cards_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "cadde_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      cadde_cafe_members: {
        Row: {
          cafe_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          cafe_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          cafe_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadde_cafe_members_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cadde_cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      cadde_cafes: {
        Row: {
          city_id: string | null
          content_mode: string
          country_id: string | null
          created_at: string
          ends_at: string
          host_name_override: string | null
          host_user_id: string | null
          id: string
          is_active: boolean
          is_bridge: boolean
          is_free: boolean
          starts_at: string
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          content_mode?: string
          country_id?: string | null
          created_at?: string
          ends_at?: string
          host_name_override?: string | null
          host_user_id?: string | null
          id?: string
          is_active?: boolean
          is_bridge?: boolean
          is_free?: boolean
          starts_at?: string
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          content_mode?: string
          country_id?: string | null
          created_at?: string
          ends_at?: string
          host_name_override?: string | null
          host_user_id?: string | null
          id?: string
          is_active?: boolean
          is_bridge?: boolean
          is_free?: boolean
          starts_at?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadde_cafes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cadde_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadde_cafes_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "cadde_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      cadde_cities: {
        Row: {
          country_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          timezone: string
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          timezone: string
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadde_cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "cadde_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      cadde_countries: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      cadde_post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadde_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "cadde_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      cadde_post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadde_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "cadde_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      cadde_posts: {
        Row: {
          author_avatar_url: string | null
          author_name_override: string | null
          author_role: string | null
          author_user_id: string | null
          body: string
          city_id: string | null
          content_mode: string
          country_id: string | null
          created_at: string
          id: string
          is_bridge: boolean
          pinned: boolean
          post_type: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_name_override?: string | null
          author_role?: string | null
          author_user_id?: string | null
          body: string
          city_id?: string | null
          content_mode?: string
          country_id?: string | null
          created_at?: string
          id?: string
          is_bridge?: boolean
          pinned?: boolean
          post_type?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_name_override?: string | null
          author_role?: string | null
          author_user_id?: string | null
          body?: string
          city_id?: string | null
          content_mode?: string
          country_id?: string | null
          created_at?: string
          id?: string
          is_bridge?: boolean
          pinned?: boolean
          post_type?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadde_posts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cadde_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadde_posts_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "cadde_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      cadde_sponsored_placements: {
        Row: {
          badge_text: string | null
          city_id: string | null
          content_mode: string
          country_id: string | null
          created_at: string
          cta_label: string
          cta_url: string
          description: string
          id: string
          image_url: string | null
          placement_key: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          city_id?: string | null
          content_mode?: string
          country_id?: string | null
          created_at?: string
          cta_label: string
          cta_url: string
          description: string
          id?: string
          image_url?: string | null
          placement_key?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          city_id?: string | null
          content_mode?: string
          country_id?: string | null
          created_at?: string
          cta_label?: string
          cta_url?: string
          description?: string
          id?: string
          image_url?: string | null
          placement_key?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadde_sponsored_placements_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cadde_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadde_sponsored_placements_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "cadde_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_memberships: {
        Row: {
          answer: string | null
          approved: boolean
          cafe_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          approved?: boolean
          cafe_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          approved?: boolean
          cafe_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_memberships_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      cafes: {
        Row: {
          audience_scope: string
          capacity: number | null
          city: string | null
          closes_at: string
          continent: string | null
          country: string | null
          created_at: string
          created_by: string
          duration_hours: number
          entry_question: string | null
          extra_links: Json | null
          id: string
          kind: string
          linkedin_url: string
          member_count: number
          name: string
          open_entry: boolean
          opens_at: string
          referral_code: string | null
          theme: string
        }
        Insert: {
          audience_scope?: string
          capacity?: number | null
          city?: string | null
          closes_at: string
          continent?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          duration_hours?: number
          entry_question?: string | null
          extra_links?: Json | null
          id?: string
          kind?: string
          linkedin_url: string
          member_count?: number
          name: string
          open_entry?: boolean
          opens_at?: string
          referral_code?: string | null
          theme: string
        }
        Update: {
          audience_scope?: string
          capacity?: number | null
          city?: string | null
          closes_at?: string
          continent?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          duration_hours?: number
          entry_question?: string | null
          extra_links?: Json | null
          id?: string
          kind?: string
          linkedin_url?: string
          member_count?: number
          name?: string
          open_entry?: boolean
          opens_at?: string
          referral_code?: string | null
          theme?: string
        }
        Relationships: []
      }
      catalog_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          details: Json
          id: string
          item_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          details?: Json
          id?: string
          item_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          details?: Json
          id?: string
          item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_audit_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          module: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          module: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          module?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_categories_module_fkey"
            columns: ["module"]
            isOneToOne: false
            referencedRelation: "catalog_item_types"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "catalog_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_attribute_overrides: {
        Row: {
          attribute_key: string
          created_at: string
          display_order: number | null
          id: string
          is_enabled: boolean
          item_id: string
          override_label: string | null
          updated_at: string
        }
        Insert: {
          attribute_key: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean
          item_id: string
          override_label?: string | null
          updated_at?: string
        }
        Update: {
          attribute_key?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_enabled?: boolean
          item_id?: string
          override_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_attribute_overrides_attribute_key_fkey"
            columns: ["attribute_key"]
            isOneToOne: false
            referencedRelation: "afs_attributes"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "catalog_item_attribute_overrides_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_attribute_values: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          attribute_id: string
          created_at: string
          id: string
          item_id: string
          updated_at: string
          value_boolean: boolean | null
          value_date: string | null
          value_json: Json | null
          value_jsonb: Json | null
          value_numeric: number | null
          value_text: string | null
          visibility: string
          visibility_override: string | null
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          attribute_id: string
          created_at?: string
          id?: string
          item_id: string
          updated_at?: string
          value_boolean?: boolean | null
          value_date?: string | null
          value_json?: Json | null
          value_jsonb?: Json | null
          value_numeric?: number | null
          value_text?: string | null
          visibility?: string
          visibility_override?: string | null
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          attribute_id?: string
          created_at?: string
          id?: string
          item_id?: string
          updated_at?: string
          value_boolean?: boolean | null
          value_date?: string | null
          value_json?: Json | null
          value_jsonb?: Json | null
          value_numeric?: number | null
          value_text?: string | null
          visibility?: string
          visibility_override?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "afs_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_attributes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_categories: {
        Row: {
          category_id: string
          created_at: string
          is_primary: boolean
          item_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          is_primary?: boolean
          item_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          is_primary?: boolean
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_categories_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_claims: {
        Row: {
          claim_type: string
          created_at: string
          evidence: Json
          id: string
          item_id: string
          note: string | null
          requested_by_user_id: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          claim_type?: string
          created_at?: string
          evidence?: Json
          id?: string
          item_id: string
          note?: string | null
          requested_by_user_id: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          claim_type?: string
          created_at?: string
          evidence?: Json
          id?: string
          item_id?: string
          note?: string | null
          requested_by_user_id?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_claim_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_contacts: {
        Row: {
          contact_type: string
          contact_value: string
          created_at: string
          id: string
          is_primary: boolean
          is_public: boolean
          item_id: string
          label: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          contact_type: string
          contact_value: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          item_id: string
          label?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          contact_type?: string
          contact_value?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          item_id?: string
          label?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_contacts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_favorites: {
        Row: {
          created_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_favorites_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_feature_overrides: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          is_enabled: boolean
          item_id: string
          reason: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          is_enabled?: boolean
          item_id: string
          reason?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          is_enabled?: boolean
          item_id?: string
          reason?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_feature_overrides_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "afs_features"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "catalog_item_feature_overrides_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_languages: {
        Row: {
          created_at: string
          is_primary: boolean
          item_id: string
          language_code: string
          proficiency: string | null
        }
        Insert: {
          created_at?: string
          is_primary?: boolean
          item_id: string
          language_code: string
          proficiency?: string | null
        }
        Update: {
          created_at?: string
          is_primary?: boolean
          item_id?: string
          language_code?: string
          proficiency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_languages_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_links: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          item_id: string
          label: string | null
          link_type: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          item_id: string
          label?: string | null
          link_type: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          item_id?: string
          label?: string | null
          link_type?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_links_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_locations: {
        Row: {
          address_line: string | null
          city: string | null
          country_code: string | null
          created_at: string
          geo: unknown
          id: string
          is_primary: boolean
          item_id: string
          latitude: number | null
          longitude: number | null
          postal_code: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          geo?: unknown
          id?: string
          is_primary?: boolean
          item_id: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          geo?: unknown
          id?: string
          is_primary?: boolean
          item_id?: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_locations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_managers: {
        Row: {
          created_at: string
          id: string
          item_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_memberships_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          id: string
          is_primary: boolean
          is_public: boolean
          item_id: string
          media_type: string
          metadata: Json
          sort_order: number
          storage_bucket: string | null
          storage_path: string | null
          thumbnail_url: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          item_id: string
          media_type: string
          metadata?: Json
          sort_order?: number
          storage_bucket?: string | null
          storage_path?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          item_id?: string
          media_type?: string
          metadata?: Json
          sort_order?: number
          storage_bucket?: string | null
          storage_path?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_media_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_relations: {
        Row: {
          created_at: string
          id: string
          item_id: string
          metadata: Json
          related_item_id: string
          relation_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          metadata?: Json
          related_item_id: string
          relation_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          metadata?: Json
          related_item_id?: string
          relation_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_relations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_relations_related_item_id_fkey"
            columns: ["related_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          item_id: string
          reason: string
          reporter_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          item_id: string
          reason: string
          reporter_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          item_id?: string
          reason?: string
          reporter_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_reports_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_public: boolean
          item_id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          item_id: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          item_id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_reviews_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_roles: {
        Row: {
          catalog_item_id: string
          created_at: string
          id: string
          is_primary: boolean
          role_id: string
          updated_at: string
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          role_id: string
          updated_at?: string
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_roles_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_section_overrides: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_visible: boolean
          item_id: string
          section_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_visible?: boolean
          item_id: string
          section_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_visible?: boolean
          item_id?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_section_overrides_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_section_overrides_section_key_fkey"
            columns: ["section_key"]
            isOneToOne: false
            referencedRelation: "afs_sections"
            referencedColumns: ["key"]
          },
        ]
      }
      catalog_item_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          item_id: string
          service_name: string
          service_slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          item_id: string
          service_name: string
          service_slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          item_id?: string
          service_name?: string
          service_slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_services_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_tags: {
        Row: {
          created_at: string
          id: string
          item_id: string
          tag_label: string
          tag_slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          tag_label: string
          tag_slug: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          tag_label?: string
          tag_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_item_types: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean
          key: string
          label: string
          linked_role_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          key: string
          label: string
          linked_role_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          key?: string
          label?: string
          linked_role_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_types_linked_role_key_fkey"
            columns: ["linked_role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
      }
      catalog_item_verification_records: {
        Row: {
          created_at: string
          evidence: Json
          id: string
          item_id: string
          note: string | null
          provider: string | null
          updated_at: string
          verification_status: string
          verification_type: string
          verified_at: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          evidence?: Json
          id?: string
          item_id: string
          note?: string | null
          provider?: string | null
          updated_at?: string
          verification_status?: string
          verification_type: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          evidence?: Json
          id?: string
          item_id?: string
          note?: string | null
          provider?: string | null
          updated_at?: string
          verification_status?: string
          verification_type?: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_verification_records_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          attributes: Json
          city: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          headline: string | null
          id: string
          is_placeholder: boolean
          is_verified: boolean
          item_type: string
          linked_user_id: string | null
          long_description: string | null
          platform_role_key: string | null
          published_at: string | null
          short_description: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          verification_status: string
          visibility: string
        }
        Insert: {
          attributes?: Json
          city?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          headline?: string | null
          id?: string
          is_placeholder?: boolean
          is_verified?: boolean
          item_type: string
          linked_user_id?: string | null
          long_description?: string | null
          platform_role_key?: string | null
          published_at?: string | null
          short_description?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          verification_status?: string
          visibility?: string
        }
        Update: {
          attributes?: Json
          city?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          headline?: string | null
          id?: string
          is_placeholder?: boolean
          is_verified?: boolean
          item_type?: string
          linked_user_id?: string | null
          long_description?: string | null
          platform_role_key?: string | null
          published_at?: string | null
          short_description?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          verification_status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_item_type_fkey"
            columns: ["item_type"]
            isOneToOne: false
            referencedRelation: "catalog_item_types"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "catalog_items_platform_role_key_fkey"
            columns: ["platform_role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
      }
      catalog_search_documents: {
        Row: {
          category_slugs: string[]
          city: string | null
          country_code: string | null
          embedding: string | null
          filter_data: Json
          item_id: string
          item_type: string
          language_codes: string[]
          search_text: string
          search_vector: unknown
          title: string
          updated_at: string
        }
        Insert: {
          category_slugs?: string[]
          city?: string | null
          country_code?: string | null
          embedding?: string | null
          filter_data?: Json
          item_id: string
          item_type: string
          language_codes?: string[]
          search_text: string
          search_vector?: unknown
          title: string
          updated_at?: string
        }
        Update: {
          category_slugs?: string[]
          city?: string | null
          country_code?: string | null
          embedding?: string | null
          filter_data?: Json
          item_id?: string
          item_type?: string
          language_codes?: string[]
          search_text?: string
          search_vector?: unknown
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_search_documents_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      city_ambassador_applications: {
        Row: {
          city: string
          country: string
          created_at: string
          email: string
          first_week_plan: string | null
          full_name: string
          id: string
          known_professionals: string | null
          motivation: string | null
          organized_events: string | null
          phone: string
          reach_count: number | null
          reach_description: string | null
          status: string
          updated_at: string
          user_id: string
          weekly_hours: string | null
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          email: string
          first_week_plan?: string | null
          full_name: string
          id?: string
          known_professionals?: string | null
          motivation?: string | null
          organized_events?: string | null
          phone: string
          reach_count?: number | null
          reach_description?: string | null
          status?: string
          updated_at?: string
          user_id: string
          weekly_hours?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          email?: string
          first_week_plan?: string | null
          full_name?: string
          id?: string
          known_professionals?: string | null
          motivation?: string | null
          organized_events?: string | null
          phone?: string
          reach_count?: number | null
          reach_description?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          weekly_hours?: string | null
        }
        Relationships: []
      }
      command_center_items: {
        Row: {
          archived_at: string | null
          assignee: string
          category_label: string
          created_at: string
          deleted_at: string | null
          detail: string
          due_date: string | null
          id: string
          item_type: string
          legacy_source_category: string | null
          legacy_source_code: string | null
          legacy_source_date_label: string | null
          legacy_source_title: string | null
          legacy_source_type: string | null
          priority: number
          sort_order: number
          status: string
          title: string
          updated_at: string
          urgent: boolean
        }
        Insert: {
          archived_at?: string | null
          assignee?: string
          category_label?: string
          created_at?: string
          deleted_at?: string | null
          detail: string
          due_date?: string | null
          id?: string
          item_type: string
          legacy_source_category?: string | null
          legacy_source_code?: string | null
          legacy_source_date_label?: string | null
          legacy_source_title?: string | null
          legacy_source_type?: string | null
          priority?: number
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          urgent?: boolean
        }
        Update: {
          archived_at?: string | null
          assignee?: string
          category_label?: string
          created_at?: string
          deleted_at?: string | null
          detail?: string
          due_date?: string | null
          id?: string
          item_type?: string
          legacy_source_category?: string | null
          legacy_source_code?: string | null
          legacy_source_date_label?: string | null
          legacy_source_title?: string | null
          legacy_source_type?: string | null
          priority?: number
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          urgent?: boolean
        }
        Relationships: []
      }
      community_group_details: {
        Row: {
          admin_approved: boolean
          created_at: string
          item_id: string
          join_url: string | null
          language_code: string | null
          member_count: number | null
          platform: string | null
          requires_approval: boolean
          updated_at: string
        }
        Insert: {
          admin_approved?: boolean
          created_at?: string
          item_id: string
          join_url?: string | null
          language_code?: string | null
          member_count?: number | null
          platform?: string | null
          requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          admin_approved?: boolean
          created_at?: string
          item_id?: string
          join_url?: string | null
          language_code?: string | null
          member_count?: number | null
          platform?: string | null
          requires_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_categories: {
        Row: {
          category: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      consultant_social_media_links: {
        Row: {
          added_by: string
          contacted_email: boolean
          contacted_instagram: boolean
          contacted_phone: boolean
          contacted_whatsapp: boolean
          created_at: string
          description: string | null
          email: string | null
          id: string
          instagram: string | null
          link: string | null
          name: string
          phone: string | null
          platform: string
          whatsapp: string | null
        }
        Insert: {
          added_by?: string
          contacted_email?: boolean
          contacted_instagram?: boolean
          contacted_phone?: boolean
          contacted_whatsapp?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          link?: string | null
          name?: string
          phone?: string | null
          platform?: string
          whatsapp?: string | null
        }
        Update: {
          added_by?: string
          contacted_email?: boolean
          contacted_instagram?: boolean
          contacted_phone?: boolean
          contacted_whatsapp?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          link?: string | null
          name?: string
          phone?: string | null
          platform?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          status: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          status?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          status?: string
        }
        Relationships: []
      }
      contributor_social_media_links: {
        Row: {
          added_by: string
          contacted_email: boolean
          contacted_instagram: boolean
          contacted_phone: boolean
          contacted_whatsapp: boolean
          created_at: string
          description: string | null
          email: string | null
          id: string
          instagram: string | null
          link: string | null
          name: string
          phone: string | null
          platform: string
          whatsapp: string | null
        }
        Insert: {
          added_by?: string
          contacted_email?: boolean
          contacted_instagram?: boolean
          contacted_phone?: boolean
          contacted_whatsapp?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          link?: string | null
          name?: string
          phone?: string | null
          platform?: string
          whatsapp?: string | null
        }
        Update: {
          added_by?: string
          contacted_email?: boolean
          contacted_instagram?: boolean
          contacted_phone?: boolean
          contacted_whatsapp?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          link?: string | null
          name?: string
          phone?: string | null
          platform?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      coupon_purchases: {
        Row: {
          business_name: string | null
          business_user_id: string | null
          buyer_email: string | null
          buyer_id: string
          buyer_name: string | null
          coupon_code: string
          coupon_title: string | null
          created_at: string
          currency: string
          id: string
          price: number
          status: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          business_user_id?: string | null
          buyer_email?: string | null
          buyer_id: string
          buyer_name?: string | null
          coupon_code: string
          coupon_title?: string | null
          created_at?: string
          currency?: string
          id?: string
          price?: number
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          business_user_id?: string | null
          buyer_email?: string | null
          buyer_id?: string
          buyer_name?: string | null
          coupon_code?: string
          coupon_title?: string | null
          created_at?: string
          currency?: string
          id?: string
          price?: number
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      duplicate_candidates: {
        Row: {
          confidence: number
          created_at: string
          id: string
          left_item_id: string
          payload: Json
          reason: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          right_item_id: string
          status: string
          updated_at: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          left_item_id: string
          payload?: Json
          reason: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          right_item_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          left_item_id?: string
          payload?: Json
          reason?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          right_item_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_candidates_left_item_id_fkey"
            columns: ["left_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_candidates_right_item_id_fkey"
            columns: ["right_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_rate_limits: {
        Row: {
          client_key: string
          created_at: string
          request_count: number
          scope: string
          updated_at: string
          window_started_at: string
        }
        Insert: {
          client_key: string
          created_at?: string
          request_count?: number
          scope: string
          updated_at?: string
          window_started_at: string
        }
        Update: {
          client_key?: string
          created_at?: string
          request_count?: number
          scope?: string
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      entity_metadata: {
        Row: {
          admin_note: string | null
          created_at: string
          description: string | null
          entity_key: string
          entity_type: string
          id: string
          metadata: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          description?: string | null
          entity_key: string
          entity_type: string
          id?: string
          metadata?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          description?: string | null
          entity_key?: string
          entity_type?: string
          id?: string
          metadata?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      event_details: {
        Row: {
          capacity: number | null
          created_at: string
          ends_at: string | null
          is_online: boolean
          item_id: string
          registration_url: string | null
          starts_at: string | null
          timezone: string | null
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          ends_at?: string | null
          is_online?: boolean
          item_id: string
          registration_url?: string | null
          starts_at?: string | null
          timezone?: string | null
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          ends_at?: string | null
          is_online?: boolean
          item_id?: string
          registration_url?: string | null
          starts_at?: string | null
          timezone?: string | null
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          city: string | null
          country: string | null
          cover_image: string | null
          created_at: string
          description: string
          end_time: string | null
          event_date: string
          featured: boolean
          id: string
          location: string | null
          max_attendees: number | null
          online_url: string | null
          organizer_name: string | null
          organizer_type: string
          price: number | null
          registration_url: string | null
          start_time: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string
          description: string
          end_time?: string | null
          event_date: string
          featured?: boolean
          id?: string
          location?: string | null
          max_attendees?: number | null
          online_url?: string | null
          organizer_name?: string | null
          organizer_type?: string
          price?: number | null
          registration_url?: string | null
          start_time?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string
          end_time?: string | null
          event_date?: string
          featured?: boolean
          id?: string
          location?: string | null
          max_attendees?: number | null
          online_url?: string | null
          organizer_name?: string | null
          organizer_type?: string
          price?: number | null
          registration_url?: string | null
          start_time?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_code"]
          description: string
          expense_date: string
          id: string
          invoice_url: string | null
          is_virtual_card: boolean
          note: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          person: Database["public"]["Enums"]["person_type"]
          status: Database["public"]["Enums"]["expense_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"]
          description: string
          expense_date: string
          id?: string
          invoice_url?: string | null
          is_virtual_card?: boolean
          note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          person: Database["public"]["Enums"]["person_type"]
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string
          expense_date?: string
          id?: string
          invoice_url?: string | null
          is_virtual_card?: boolean
          note?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          person?: Database["public"]["Enums"]["person_type"]
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
        }
        Relationships: []
      }
      feature_definitions: {
        Row: {
          created_at: string
          description: string | null
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      feed_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_role: string | null
          cafe_id: string | null
          city: string | null
          comment_count: number
          content: string
          country: string | null
          created_at: string
          id: string
          image_url: string | null
          like_count: number
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_role?: string | null
          cafe_id?: string | null
          city?: string | null
          comment_count?: number
          content: string
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_role?: string | null
          cafe_id?: string | null
          city?: string | null
          comment_count?: number
          content?: string
          country?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      founding_1000_signups: {
        Row: {
          account_type: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          account_type: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          account_type?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_posts: {
        Row: {
          created_at: string
          created_by: string
          expertise: string | null
          id: string
          image_url: string
          logo_url: string | null
          platforms: string[]
          recipient_name: string
          share_text: string | null
          tagline: string | null
          template_type: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expertise?: string | null
          id?: string
          image_url: string
          logo_url?: string | null
          platforms?: string[]
          recipient_name: string
          share_text?: string | null
          tagline?: string | null
          template_type: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expertise?: string | null
          id?: string
          image_url?: string
          logo_url?: string | null
          platforms?: string[]
          recipient_name?: string
          share_text?: string | null
          tagline?: string | null
          template_type?: string
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      geo_cities: {
        Row: {
          country_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "geo_cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "geo_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_countries: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["income_category"]
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_code"]
          description: string
          id: string
          income_date: string
          link: string | null
          note: string | null
          source: string
          status: Database["public"]["Enums"]["income_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["income_category"]
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"]
          description: string
          id?: string
          income_date: string
          link?: string | null
          note?: string | null
          source: string
          status?: Database["public"]["Enums"]["income_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["income_category"]
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string
          id?: string
          income_date?: string
          link?: string | null
          note?: string | null
          source?: string
          status?: Database["public"]["Enums"]["income_status"]
          updated_at?: string
        }
        Relationships: []
      }
      independent_profiles: {
        Row: {
          address_text: string | null
          announcements_json: Json
          city: string
          contact_email: string | null
          contact_phone: string | null
          country: string
          created_at: string
          cta_json: Json
          description: string
          hero_image_url: string | null
          id: string
          is_published: boolean
          logo_url: string | null
          map_query: string | null
          profile_kind: string
          services_json: Json
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          type_label: string
          updated_at: string
          website_url: string | null
          working_hours: string | null
        }
        Insert: {
          address_text?: string | null
          announcements_json?: Json
          city: string
          contact_email?: string | null
          contact_phone?: string | null
          country: string
          created_at?: string
          cta_json?: Json
          description: string
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          map_query?: string | null
          profile_kind: string
          services_json?: Json
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          type_label?: string
          updated_at?: string
          website_url?: string | null
          working_hours?: string | null
        }
        Update: {
          address_text?: string | null
          announcements_json?: Json
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          cta_json?: Json
          description?: string
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          map_query?: string | null
          profile_kind?: string
          services_json?: Json
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          type_label?: string
          updated_at?: string
          website_url?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      individual_profile_details: {
        Row: {
          active_city: string | null
          active_country: string | null
          control_panel: Json
          created_at: string
          detail_card: Json
          event_count: number
          follower_count: number
          following_count: number
          front_card: Json
          hometown: string | null
          job_seeking: boolean
          mentor_opt_in: boolean
          phone_verified: boolean
          presence_status: string
          profile_settings: Json
          status_text: string | null
          tagline: string | null
          updated_at: string
          user_id: string
          visibility_status: string
        }
        Insert: {
          active_city?: string | null
          active_country?: string | null
          control_panel?: Json
          created_at?: string
          detail_card?: Json
          event_count?: number
          follower_count?: number
          following_count?: number
          front_card?: Json
          hometown?: string | null
          job_seeking?: boolean
          mentor_opt_in?: boolean
          phone_verified?: boolean
          presence_status?: string
          profile_settings?: Json
          status_text?: string | null
          tagline?: string | null
          updated_at?: string
          user_id: string
          visibility_status?: string
        }
        Update: {
          active_city?: string | null
          active_country?: string | null
          control_panel?: Json
          created_at?: string
          detail_card?: Json
          event_count?: number
          follower_count?: number
          following_count?: number
          front_card?: Json
          hometown?: string | null
          job_seeking?: boolean
          mentor_opt_in?: boolean
          phone_verified?: boolean
          presence_status?: string
          profile_settings?: Json
          status_text?: string | null
          tagline?: string | null
          updated_at?: string
          user_id?: string
          visibility_status?: string
        }
        Relationships: []
      }
      influencer_social_media_links: {
        Row: {
          added_by: string
          contacted_email: boolean
          contacted_instagram: boolean
          contacted_phone: boolean
          contacted_whatsapp: boolean
          created_at: string
          description: string | null
          email: string | null
          id: string
          instagram: string | null
          link: string | null
          name: string
          phone: string | null
          platform: string
          whatsapp: string | null
        }
        Insert: {
          added_by?: string
          contacted_email?: boolean
          contacted_instagram?: boolean
          contacted_phone?: boolean
          contacted_whatsapp?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          link?: string | null
          name?: string
          phone?: string | null
          platform?: string
          whatsapp?: string | null
        }
        Update: {
          added_by?: string
          contacted_email?: boolean
          contacted_instagram?: boolean
          contacted_phone?: boolean
          contacted_whatsapp?: boolean
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          link?: string | null
          name?: string
          phone?: string | null
          platform?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      interest_registrations: {
        Row: {
          attachment_urls: string[] | null
          category: string
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          heard_from: string | null
          id: string
          interest_area: string | null
          message: string | null
          name: string | null
          organization: string | null
          phone: string | null
          referral_code: string | null
          role: string | null
          source: string | null
          supply_demand: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          heard_from?: string | null
          id?: string
          interest_area?: string | null
          message?: string | null
          name?: string | null
          organization?: string | null
          phone?: string | null
          referral_code?: string | null
          role?: string | null
          source?: string | null
          supply_demand?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          heard_from?: string | null
          id?: string
          interest_area?: string | null
          message?: string | null
          name?: string | null
          organization?: string | null
          phone?: string | null
          referral_code?: string | null
          role?: string | null
          source?: string | null
          supply_demand?: string | null
        }
        Relationships: []
      }
      item_type_attribute_rules: {
        Row: {
          attribute_id: string
          created_at: string
          editor_can_edit: boolean
          editor_can_hide: boolean
          id: string
          is_enabled: boolean
          is_public_default: boolean
          is_required: boolean
          item_type: string
          requires_admin_approval_on_change: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          editor_can_edit?: boolean
          editor_can_hide?: boolean
          id?: string
          is_enabled?: boolean
          is_public_default?: boolean
          is_required?: boolean
          item_type: string
          requires_admin_approval_on_change?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          editor_can_edit?: boolean
          editor_can_hide?: boolean
          id?: string
          is_enabled?: boolean
          is_public_default?: boolean
          is_required?: boolean
          item_type?: string
          requires_admin_approval_on_change?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_type_attribute_rules_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "afs_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_type_attribute_rules_item_type_fkey"
            columns: ["item_type"]
            isOneToOne: false
            referencedRelation: "catalog_item_types"
            referencedColumns: ["key"]
          },
        ]
      }
      item_type_feature_defaults: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          is_enabled: boolean
          item_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          is_enabled?: boolean
          item_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          is_enabled?: boolean
          item_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_type_feature_defaults_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "feature_definitions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "item_type_feature_defaults_item_type_fkey"
            columns: ["item_type"]
            isOneToOne: false
            referencedRelation: "catalog_item_types"
            referencedColumns: ["key"]
          },
        ]
      }
      item_type_features: {
        Row: {
          configuration: Json
          created_at: string
          feature_key: string
          is_enabled: boolean
          item_type: string
          updated_at: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          feature_key: string
          is_enabled?: boolean
          item_type: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          feature_key?: string
          is_enabled?: boolean
          item_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_type_features_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "feature_definitions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "item_type_features_item_type_fkey"
            columns: ["item_type"]
            isOneToOne: false
            referencedRelation: "catalog_item_types"
            referencedColumns: ["key"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_email: string | null
          applicant_id: string
          applicant_name: string | null
          applicant_phone: string | null
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          id: string
          link_url: string | null
          listing_id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_email?: string | null
          applicant_id: string
          applicant_name?: string | null
          applicant_phone?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          listing_id: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_email?: string | null
          applicant_id?: string
          applicant_name?: string | null
          applicant_phone?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          listing_id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          business_name: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          department: string | null
          description: string | null
          employment_type: string
          expires_at: string | null
          hide_business_name: boolean
          id: string
          location: string | null
          location_type: string
          package: string
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          status: string
          title: string
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          department?: string | null
          description?: string | null
          employment_type?: string
          expires_at?: string | null
          hide_business_name?: boolean
          id?: string
          location?: string | null
          location_type?: string
          package?: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title: string
          total_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          department?: string | null
          description?: string | null
          employment_type?: string
          expires_at?: string | null
          hide_business_name?: boolean
          id?: string
          location?: string | null
          location_type?: string
          package?: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title?: string
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_posting_details: {
        Row: {
          application_email: string | null
          application_url: string | null
          created_at: string
          currency: string | null
          employment_type: string | null
          expires_at: string | null
          item_id: string
          salary_max: number | null
          salary_min: number | null
          updated_at: string
          workplace_mode: string | null
        }
        Insert: {
          application_email?: string | null
          application_url?: string | null
          created_at?: string
          currency?: string | null
          employment_type?: string | null
          expires_at?: string | null
          item_id: string
          salary_max?: number | null
          salary_min?: number | null
          updated_at?: string
          workplace_mode?: string | null
        }
        Update: {
          application_email?: string | null
          application_url?: string | null
          created_at?: string
          currency?: string | null
          employment_type?: string | null
          expires_at?: string | null
          item_id?: string
          salary_max?: number | null
          salary_min?: number | null
          updated_at?: string
          workplace_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_posting_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lansman_registrations: {
        Row: {
          created_at: string
          description: string | null
          first_name: string
          id: string
          initials: string | null
          instagram: string | null
          last_name: string
          linkedin: string | null
          phone: string
          status: string
          twitter: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          first_name: string
          id?: string
          initials?: string | null
          instagram?: string | null
          last_name: string
          linkedin?: string | null
          phone: string
          status?: string
          twitter?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          first_name?: string
          id?: string
          initials?: string | null
          instagram?: string | null
          last_name?: string
          linkedin?: string | null
          phone?: string
          status?: string
          twitter?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      marketplace_listing_details: {
        Row: {
          created_at: string
          currency: string | null
          expires_at: string | null
          item_id: string
          listing_mode: string | null
          price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          item_id: string
          listing_mode?: string | null
          price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          item_id?: string
          listing_mode?: string | null
          price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listing_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      marquee_items: {
        Row: {
          created_at: string
          detail_content: string | null
          external_url: string | null
          id: string
          image_alt: string | null
          image_url: string | null
          is_active: boolean
          link_enabled: boolean
          metric_value: string | null
          news_post_id: number | null
          published_at: string
          slug: string | null
          sort_order: number
          summary: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail_content?: string | null
          external_url?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_active?: boolean
          link_enabled?: boolean
          metric_value?: string | null
          news_post_id?: number | null
          published_at?: string
          slug?: string | null
          sort_order?: number
          summary: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail_content?: string | null
          external_url?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_active?: boolean
          link_enabled?: boolean
          metric_value?: string | null
          news_post_id?: number | null
          published_at?: string
          slug?: string | null
          sort_order?: number
          summary?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          match_reason: string | null
          match_score: number | null
          match_type: string
          matched_submission_id: string
          notified_source: boolean
          notified_target: boolean
          source_submission_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_reason?: string | null
          match_score?: number | null
          match_type?: string
          matched_submission_id: string
          notified_source?: boolean
          notified_target?: boolean
          source_submission_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_reason?: string | null
          match_score?: number | null
          match_type?: string
          matched_submission_id?: string
          notified_source?: boolean
          notified_target?: boolean
          source_submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_matched_submission_id_fkey"
            columns: ["matched_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      may19_campaign_submissions: {
        Row: {
          city: string
          consent: boolean
          country: string
          created_at: string
          description: string
          email: string
          file_name: string | null
          full_name: string
          id: string
          kind: string
          link: string | null
          message: string | null
          review_notes: string | null
          social_handle: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          city: string
          consent?: boolean
          country: string
          created_at?: string
          description: string
          email: string
          file_name?: string | null
          full_name: string
          id?: string
          kind: string
          link?: string | null
          message?: string | null
          review_notes?: string | null
          social_handle?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          city?: string
          consent?: boolean
          country?: string
          created_at?: string
          description?: string
          email?: string
          file_name?: string | null
          full_name?: string
          id?: string
          kind?: string
          link?: string | null
          message?: string | null
          review_notes?: string | null
          social_handle?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      may19_submissions: {
        Row: {
          attachment_urls: string[] | null
          bio: string | null
          city: string | null
          consent: boolean | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          full_name: string | null
          id: string
          kind: string
          link: string | null
          livestream_participation: string | null
          livestream_time_slot: string | null
          livestream_topic: string | null
          message: string | null
          metadata: Json | null
          phone: string | null
          show_on_map: boolean | null
          social_handle: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          bio?: string | null
          city?: string | null
          consent?: boolean | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          kind: string
          link?: string | null
          livestream_participation?: string | null
          livestream_time_slot?: string | null
          livestream_topic?: string | null
          message?: string | null
          metadata?: Json | null
          phone?: string | null
          show_on_map?: boolean | null
          social_handle?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          bio?: string | null
          city?: string | null
          consent?: boolean | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          kind?: string
          link?: string | null
          livestream_participation?: string | null
          livestream_time_slot?: string | null
          livestream_topic?: string | null
          message?: string | null
          metadata?: Json | null
          phone?: string | null
          show_on_map?: boolean | null
          social_handle?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      merge_history: {
        Row: {
          created_at: string
          details: Json
          id: string
          merged_by_user_id: string | null
          source_item_id: string
          target_item_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          merged_by_user_id?: string | null
          source_item_id: string
          target_item_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          merged_by_user_id?: string | null
          source_item_id?: string
          target_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merge_history_source_item_id_fkey"
            columns: ["source_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_history_target_item_id_fkey"
            columns: ["target_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          context_url: string | null
          created_at: string
          id: string
          is_read: boolean
          recipient_kind: string
          recipient_name: string | null
          recipient_slug: string | null
          recipient_user_id: string | null
          sender_id: string
          sender_name: string | null
          subject: string | null
          thread_id: string
        }
        Insert: {
          body: string
          context_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_kind?: string
          recipient_name?: string | null
          recipient_slug?: string | null
          recipient_user_id?: string | null
          sender_id: string
          sender_name?: string | null
          subject?: string | null
          thread_id?: string
        }
        Update: {
          body?: string
          context_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_kind?: string
          recipient_name?: string | null
          recipient_slug?: string | null
          recipient_user_id?: string | null
          sender_id?: string
          sender_name?: string | null
          subject?: string | null
          thread_id?: string
        }
        Relationships: []
      }
      moderation_queue: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          id: string
          item_id: string | null
          payload: Json
          queue_type: string
          reason: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          source_record_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          item_id?: string | null
          payload?: Json
          queue_type: string
          reason: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          source_record_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          item_id?: string | null
          payload?: Json
          queue_type?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          source_record_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      mvp_items: {
        Row: {
          added_by: string
          ayrinti: string | null
          created_at: string
          id: string
          is_seed: boolean
          konu: string
          mvp_level: string
          sub: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string
          ayrinti?: string | null
          created_at?: string
          id?: string
          is_seed?: boolean
          konu: string
          mvp_level?: string
          sub?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string
          ayrinti?: string | null
          created_at?: string
          id?: string
          is_seed?: boolean
          konu?: string
          mvp_level?: string
          sub?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_details: {
        Row: {
          created_at: string
          employee_count: number | null
          founded_year: number | null
          is_nonprofit: boolean | null
          item_id: string
          legal_name: string | null
          metadata: Json
          organization_kind: string | null
          primary_contact_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_count?: number | null
          founded_year?: number | null
          is_nonprofit?: boolean | null
          item_id: string
          legal_name?: string | null
          metadata?: Json
          organization_kind?: string | null
          primary_contact_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_count?: number | null
          founded_year?: number | null
          is_nonprofit?: boolean | null
          item_id?: string
          legal_name?: string | null
          metadata?: Json
          organization_kind?: string | null
          primary_contact_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      person_profile_details: {
        Row: {
          created_at: string
          directory_opt_in: boolean
          interests: string[]
          item_id: string
          linked_profile_id: string | null
          public_bio: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          directory_opt_in?: boolean
          interests?: string[]
          item_id: string
          linked_profile_id?: string | null
          public_bio?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          directory_opt_in?: boolean
          interests?: string[]
          item_id?: string
          linked_profile_id?: string | null
          public_bio?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_profile_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profile_onboarding_imports: {
        Row: {
          activated_at: string | null
          auth_user_id: string | null
          batch_id: string
          created_at: string
          email_normalized: string
          id: string
          invite_sent_at: string | null
          last_error: string | null
          profile_user_id: string | null
          retry_count: number
          snapshot: Json
          source_submission_id: string
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          auth_user_id?: string | null
          batch_id: string
          created_at?: string
          email_normalized: string
          id?: string
          invite_sent_at?: string | null
          last_error?: string | null
          profile_user_id?: string | null
          retry_count?: number
          snapshot?: Json
          source_submission_id: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          auth_user_id?: string | null
          batch_id?: string
          created_at?: string
          email_normalized?: string
          id?: string
          invite_sent_at?: string | null
          last_error?: string | null
          profile_user_id?: string | null
          retry_count?: number
          snapshot?: Json
          source_submission_id?: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_onboarding_imports_source_submission_id_fkey"
            columns: ["source_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          viewer_id?: string | null
        }
        Relationships: []
      }
      referral_code_usages: {
        Row: {
          email: string | null
          full_name: string | null
          id: string
          referral_code_id: string
          submission_id: string
          used_at: string
        }
        Insert: {
          email?: string | null
          full_name?: string | null
          id?: string
          referral_code_id: string
          submission_id: string
          used_at?: string
        }
        Update: {
          email?: string | null
          full_name?: string | null
          id?: string
          referral_code_id?: string
          submission_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_code_usages_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_code_usages_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          group_code: string
          group_id: string
          id: string
          is_active: boolean
          is_used: boolean
          month_num: number
          note: string | null
          random_part: string
          source_code: string
          source_id: string
          type_code: string
          type_id: string
          usage_count: number
          used_at: string | null
          valid_from: string
          valid_until: string
          year_short: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          group_code: string
          group_id: string
          id?: string
          is_active?: boolean
          is_used?: boolean
          month_num: number
          note?: string | null
          random_part: string
          source_code: string
          source_id: string
          type_code: string
          type_id: string
          usage_count?: number
          used_at?: string | null
          valid_from: string
          valid_until: string
          year_short: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          group_code?: string
          group_id?: string
          id?: string
          is_active?: boolean
          is_used?: boolean
          month_num?: number
          note?: string | null
          random_part?: string
          source_code?: string
          source_id?: string
          type_code?: string
          type_id?: string
          usage_count?: number
          used_at?: string | null
          valid_from?: string
          valid_until?: string
          year_short?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "referral_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "referral_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "referral_types"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes_legacy: {
        Row: {
          check_char: string
          code: string
          code_prefix: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_used: boolean
          month_char: string
          note: string | null
          random_part: string
          referral_date: string
          source_char: string
          source_key: string
          type_char: string
          type_key: string
          used_at: string | null
          used_by: string | null
          year_short: string
        }
        Insert: {
          check_char: string
          code: string
          code_prefix: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_used?: boolean
          month_char: string
          note?: string | null
          random_part: string
          referral_date: string
          source_char: string
          source_key: string
          type_char: string
          type_key: string
          used_at?: string | null
          used_by?: string | null
          year_short: string
        }
        Update: {
          check_char?: string
          code?: string
          code_prefix?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_used?: boolean
          month_char?: string
          note?: string | null
          random_part?: string
          referral_date?: string
          source_char?: string
          source_key?: string
          type_char?: string
          type_key?: string
          used_at?: string | null
          used_by?: string | null
          year_short?: string
        }
        Relationships: []
      }
      referral_groups: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      referral_sources: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      referral_types: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      resource_entries: {
        Row: {
          added_by: string
          created_at: string
          department: string | null
          description: string | null
          file_id: string | null
          file_name: string | null
          file_type: string | null
          id: string
          import_batch: string | null
          import_suggestion: string | null
          instagram_url: string | null
          is_hidden: boolean
          is_public_import: boolean | null
          linkedin_url: string | null
          mime_type: string | null
          order_no: number | null
          person_first_name: string | null
          person_last_name: string | null
          person_role: string | null
          privacy_level: string | null
          record_kind: string
          section: string | null
          slug: string | null
          source_folder: string | null
          source_path: string | null
          source_snapshot_date: string | null
          source_subfolder: string | null
          status: string | null
          storage_bucket: string | null
          storage_path: string | null
          subsection: string | null
          tags: string | null
          title: string
          url: string | null
          website_url: string | null
        }
        Insert: {
          added_by?: string
          created_at?: string
          department?: string | null
          description?: string | null
          file_id?: string | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          import_batch?: string | null
          import_suggestion?: string | null
          instagram_url?: string | null
          is_hidden?: boolean
          is_public_import?: boolean | null
          linkedin_url?: string | null
          mime_type?: string | null
          order_no?: number | null
          person_first_name?: string | null
          person_last_name?: string | null
          person_role?: string | null
          privacy_level?: string | null
          record_kind: string
          section?: string | null
          slug?: string | null
          source_folder?: string | null
          source_path?: string | null
          source_snapshot_date?: string | null
          source_subfolder?: string | null
          status?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          subsection?: string | null
          tags?: string | null
          title: string
          url?: string | null
          website_url?: string | null
        }
        Update: {
          added_by?: string
          created_at?: string
          department?: string | null
          description?: string | null
          file_id?: string | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          import_batch?: string | null
          import_suggestion?: string | null
          instagram_url?: string | null
          is_hidden?: boolean
          is_public_import?: boolean | null
          linkedin_url?: string | null
          mime_type?: string | null
          order_no?: number | null
          person_first_name?: string | null
          person_last_name?: string | null
          person_role?: string | null
          privacy_level?: string | null
          record_kind?: string
          section?: string | null
          slug?: string | null
          source_folder?: string | null
          source_path?: string | null
          source_snapshot_date?: string | null
          source_subfolder?: string | null
          status?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          subsection?: string | null
          tags?: string | null
          title?: string
          url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      role_attributes: {
        Row: {
          admin_can_edit: boolean
          attribute_id: string
          created_at: string
          id: string
          is_enabled: boolean
          is_public: boolean
          is_public_default: boolean
          is_required: boolean
          owner_can_edit: boolean
          requires_admin_approval_on_change: boolean
          role_id: string
          sort_order: number
          updated_at: string
          user_can_edit: boolean
          user_can_hide: boolean
          visibility: string
        }
        Insert: {
          admin_can_edit?: boolean
          attribute_id: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          is_public?: boolean
          is_public_default?: boolean
          is_required?: boolean
          owner_can_edit?: boolean
          requires_admin_approval_on_change?: boolean
          role_id: string
          sort_order?: number
          updated_at?: string
          user_can_edit?: boolean
          user_can_hide?: boolean
          visibility?: string
        }
        Update: {
          admin_can_edit?: boolean
          attribute_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          is_public?: boolean
          is_public_default?: boolean
          is_required?: boolean
          owner_can_edit?: boolean
          requires_admin_approval_on_change?: boolean
          role_id?: string
          sort_order?: number
          updated_at?: string
          user_can_edit?: boolean
          user_can_hide?: boolean
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_attribute_rules_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "afs_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_attribute_rules_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_features: {
        Row: {
          created_at: string
          feature_key: string
          is_enabled: boolean
          role_id: string
          updated_at: string
          updated_by: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          is_enabled?: boolean
          role_id: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          is_enabled?: boolean
          role_id?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_feature_flags_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "afs_features"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_feature_flags_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_sections: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          requires_approval: boolean
          role_id: string
          section_id: string
          sort_order: number
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          requires_approval?: boolean
          role_id: string
          section_id: string
          sort_order?: number
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          requires_approval?: boolean
          role_id?: string
          section_id?: string
          sort_order?: number
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_profile_section_rules_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_profile_section_rules_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "afs_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      role_taxonomy_rules: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_enabled: boolean
          is_required: boolean
          role_id: string
          selection_mode: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_enabled?: boolean
          is_required?: boolean
          role_id: string
          selection_mode: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_enabled?: boolean
          is_required?: boolean
          role_id?: string
          selection_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_taxonomy_rules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_taxonomy_rules_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          is_assignable: boolean
          is_directory_visible: boolean
          is_system: boolean
          key: string
          label: string
          metadata: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_assignable?: boolean
          is_directory_visible?: boolean
          is_system?: boolean
          key: string
          label: string
          metadata?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_assignable?: boolean
          is_directory_visible?: boolean
          is_system?: boolean
          key?: string
          label?: string
          metadata?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_proposals: {
        Row: {
          consultant_id: string
          created_at: string
          estimated_duration: string | null
          id: string
          message: string
          payment_terms: string | null
          price: number | null
          request_id: string
          scope: string | null
          status: string | null
        }
        Insert: {
          consultant_id: string
          created_at?: string
          estimated_duration?: string | null
          id?: string
          message: string
          payment_terms?: string | null
          price?: number | null
          request_id: string
          scope?: string | null
          status?: string | null
        }
        Update: {
          consultant_id?: string
          created_at?: string
          estimated_duration?: string | null
          id?: string
          message?: string
          payment_terms?: string | null
          price?: number | null
          request_id?: string
          scope?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          attachment_urls: string[] | null
          budget_max: number | null
          budget_min: number | null
          category: string
          city: string | null
          country: string | null
          created_at: string
          description: string
          id: string
          preferred_time: string | null
          status: string | null
          subcategory: string | null
          title: string
          updated_at: string
          urgency: string | null
          user_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          category: string
          city?: string | null
          country?: string | null
          created_at?: string
          description: string
          id?: string
          preferred_time?: string | null
          status?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string
          urgency?: string | null
          user_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string
          id?: string
          preferred_time?: string | null
          status?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string
          urgency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          brand_name: string | null
          email_header_html: string | null
          favicon_url: string | null
          id: number
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          brand_name?: string | null
          email_header_html?: string | null
          favicon_url?: string | null
          id?: number
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          brand_name?: string | null
          email_header_html?: string | null
          favicon_url?: string | null
          id?: number
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_media_links: {
        Row: {
          added_by: string
          created_at: string
          description: string | null
          id: string
          link: string | null
          platform: string
        }
        Insert: {
          added_by?: string
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          platform?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          description?: string | null
          id?: string
          link?: string | null
          platform?: string
        }
        Relationships: []
      }
      source_records: {
        Row: {
          created_at: string
          external_id: string
          id: string
          imported_at: string
          item_id: string
          last_seen_at: string | null
          raw_snapshot: Json
          source_type: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          imported_at?: string
          item_id: string
          last_seen_at?: string | null
          raw_snapshot?: Json
          source_type: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          imported_at?: string
          item_id?: string
          last_seen_at?: string | null
          raw_snapshot?: Json
          source_type?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_records_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          business: string | null
          category: string | null
          city: string
          company_name: string | null
          consent: boolean
          contact_email_reached: boolean
          contact_instagram_reached: boolean
          contact_phone_reached: boolean
          contact_whatsapp_reached: boolean
          contest_interest: boolean | null
          country: string
          created_at: string
          description: string | null
          document_name: string | null
          document_url: string | null
          documents: Json
          donation_amount: number | null
          donation_currency: string | null
          email: string
          facebook: string | null
          field: string
          form_type: string
          fullname: string
          id: string
          instagram: string | null
          linkedin: string | null
          notes: string | null
          notification_sent_at: string | null
          offers_needs: string | null
          onboarding_key: string | null
          phone: string
          referral_code: string | null
          referral_code_id: string | null
          referral_detail: string | null
          referral_source: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_external_id: string | null
          source_type: string
          status: string
          tiktok: string | null
          twitter: string | null
          user_id: string | null
          website: string | null
          whatsapp_interest: boolean | null
        }
        Insert: {
          business?: string | null
          category?: string | null
          city: string
          company_name?: string | null
          consent?: boolean
          contact_email_reached?: boolean
          contact_instagram_reached?: boolean
          contact_phone_reached?: boolean
          contact_whatsapp_reached?: boolean
          contest_interest?: boolean | null
          country: string
          created_at?: string
          description?: string | null
          document_name?: string | null
          document_url?: string | null
          documents?: Json
          donation_amount?: number | null
          donation_currency?: string | null
          email: string
          facebook?: string | null
          field: string
          form_type?: string
          fullname: string
          id?: string
          instagram?: string | null
          linkedin?: string | null
          notes?: string | null
          notification_sent_at?: string | null
          offers_needs?: string | null
          onboarding_key?: string | null
          phone: string
          referral_code?: string | null
          referral_code_id?: string | null
          referral_detail?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_external_id?: string | null
          source_type?: string
          status?: string
          tiktok?: string | null
          twitter?: string | null
          user_id?: string | null
          website?: string | null
          whatsapp_interest?: boolean | null
        }
        Update: {
          business?: string | null
          category?: string | null
          city?: string
          company_name?: string | null
          consent?: boolean
          contact_email_reached?: boolean
          contact_instagram_reached?: boolean
          contact_phone_reached?: boolean
          contact_whatsapp_reached?: boolean
          contest_interest?: boolean | null
          country?: string
          created_at?: string
          description?: string | null
          document_name?: string | null
          document_url?: string | null
          documents?: Json
          donation_amount?: number | null
          donation_currency?: string | null
          email?: string
          facebook?: string | null
          field?: string
          form_type?: string
          fullname?: string
          id?: string
          instagram?: string | null
          linkedin?: string | null
          notes?: string | null
          notification_sent_at?: string | null
          offers_needs?: string | null
          onboarding_key?: string | null
          phone?: string
          referral_code?: string | null
          referral_code_id?: string | null
          referral_detail?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_external_id?: string | null
          source_type?: string
          status?: string
          tiktok?: string | null
          twitter?: string | null
          user_id?: string | null
          website?: string | null
          whatsapp_interest?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_answers: {
        Row: {
          answer_value: Json
          created_at: string
          id: string
          question_id: string
          response_id: string
        }
        Insert: {
          answer_value: Json
          created_at?: string
          id?: string
          question_id: string
          response_id: string
        }
        Update: {
          answer_value?: Json
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          options: Json
          placeholder: string | null
          question: string
          sort_order: number
          survey_id: string
          type: string
          updated_at: string
          validation: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          options?: Json
          placeholder?: string | null
          question: string
          sort_order?: number
          survey_id: string
          type: string
          updated_at?: string
          validation?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          options?: Json
          placeholder?: string | null
          question?: string
          sort_order?: number
          survey_id?: string
          type?: string
          updated_at?: string
          validation?: Json
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          contact_opt_in: boolean
          created_at: string
          id: string
          ip_hash: string | null
          respondent_email: string | null
          respondent_name: string | null
          respondent_user_id: string | null
          status: string
          submitted_at: string
          survey_id: string
          user_agent: string | null
        }
        Insert: {
          contact_opt_in?: boolean
          created_at?: string
          id?: string
          ip_hash?: string | null
          respondent_email?: string | null
          respondent_name?: string | null
          respondent_user_id?: string | null
          status?: string
          submitted_at?: string
          survey_id: string
          user_agent?: string | null
        }
        Update: {
          contact_opt_in?: boolean
          created_at?: string
          id?: string
          ip_hash?: string | null
          respondent_email?: string | null
          respondent_name?: string | null
          respondent_user_id?: string | null
          status?: string
          submitted_at?: string
          survey_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          allow_anonymous: boolean
          allow_multiple_submissions: boolean
          approved_by: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_featured: boolean
          published_at: string | null
          slug: string
          starts_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_anonymous?: boolean
          allow_multiple_submissions?: boolean
          approved_by?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          slug: string
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_anonymous?: boolean
          allow_multiple_submissions?: boolean
          approved_by?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          slug?: string
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      taxonomy_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          label: string
          metadata: Json
          selection_mode: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          label: string
          metadata?: Json
          selection_mode: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          metadata?: Json
          selection_mode?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      taxonomy_options: {
        Row: {
          created_at: string
          description: string | null
          group_id: string
          id: string
          is_active: boolean
          key: string
          label: string
          metadata: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          metadata?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          metadata?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      turkish_mission_relations: {
        Row: {
          child_mission_slug: string
          created_at: string
          id: string
          parent_mission_slug: string
          relation_type: string
          scraped_at: string
          source_key: string
          source_url: string
          updated_at: string
        }
        Insert: {
          child_mission_slug: string
          created_at?: string
          id?: string
          parent_mission_slug: string
          relation_type?: string
          scraped_at?: string
          source_key: string
          source_url: string
          updated_at?: string
        }
        Update: {
          child_mission_slug?: string
          created_at?: string
          id?: string
          parent_mission_slug?: string
          relation_type?: string
          scraped_at?: string
          source_key?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turkish_mission_relations_child_mission_slug_fkey"
            columns: ["child_mission_slug"]
            isOneToOne: false
            referencedRelation: "turkish_missions"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "turkish_mission_relations_parent_mission_slug_fkey"
            columns: ["parent_mission_slug"]
            isOneToOne: false
            referencedRelation: "turkish_missions"
            referencedColumns: ["slug"]
          },
        ]
      }
      turkish_mission_units: {
        Row: {
          address: string | null
          created_at: string
          emails: Json
          faxes: Json
          id: string
          jurisdiction: string | null
          mission_slug: string
          phones: Json
          raw_snapshot: Json
          scraped_at: string
          source_key: string
          source_url: string
          unit_name: string
          unit_type: string
          updated_at: string
          websites: Json
        }
        Insert: {
          address?: string | null
          created_at?: string
          emails?: Json
          faxes?: Json
          id?: string
          jurisdiction?: string | null
          mission_slug: string
          phones?: Json
          raw_snapshot?: Json
          scraped_at?: string
          source_key: string
          source_url: string
          unit_name: string
          unit_type?: string
          updated_at?: string
          websites?: Json
        }
        Update: {
          address?: string | null
          created_at?: string
          emails?: Json
          faxes?: Json
          id?: string
          jurisdiction?: string | null
          mission_slug?: string
          phones?: Json
          raw_snapshot?: Json
          scraped_at?: string
          source_key?: string
          source_url?: string
          unit_name?: string
          unit_type?: string
          updated_at?: string
          websites?: Json
        }
        Relationships: [
          {
            foreignKeyName: "turkish_mission_units_mission_slug_fkey"
            columns: ["mission_slug"]
            isOneToOne: false
            referencedRelation: "turkish_missions"
            referencedColumns: ["slug"]
          },
        ]
      }
      turkish_missions: {
        Row: {
          address: string | null
          appointment_url: string | null
          city: string | null
          city_normalized: string | null
          consular_call_center: string | null
          contact_fields: Json
          country: string | null
          country_code: string | null
          created_at: string
          data_completeness_score: number
          emails: Json
          emergency_phones: Json
          faxes: Json
          id: string
          jurisdiction: string | null
          last_verified_at: string
          mission_name: string
          mission_name_normalized: string | null
          mission_type: string
          office_hours_structured: Json
          parent_mission_slug: string | null
          parser_confidence: number
          phones: Json
          raw_snapshot: Json
          scraped_at: string
          slug: string
          source_hash: string | null
          source_url: string
          status: string
          updated_at: string
          verification_status: string
          website_url: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          appointment_url?: string | null
          city?: string | null
          city_normalized?: string | null
          consular_call_center?: string | null
          contact_fields?: Json
          country?: string | null
          country_code?: string | null
          created_at?: string
          data_completeness_score?: number
          emails?: Json
          emergency_phones?: Json
          faxes?: Json
          id?: string
          jurisdiction?: string | null
          last_verified_at?: string
          mission_name: string
          mission_name_normalized?: string | null
          mission_type: string
          office_hours_structured?: Json
          parent_mission_slug?: string | null
          parser_confidence?: number
          phones?: Json
          raw_snapshot?: Json
          scraped_at?: string
          slug: string
          source_hash?: string | null
          source_url: string
          status?: string
          updated_at?: string
          verification_status?: string
          website_url?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          appointment_url?: string | null
          city?: string | null
          city_normalized?: string | null
          consular_call_center?: string | null
          contact_fields?: Json
          country?: string | null
          country_code?: string | null
          created_at?: string
          data_completeness_score?: number
          emails?: Json
          emergency_phones?: Json
          faxes?: Json
          id?: string
          jurisdiction?: string | null
          last_verified_at?: string
          mission_name?: string
          mission_name_normalized?: string | null
          mission_type?: string
          office_hours_structured?: Json
          parent_mission_slug?: string | null
          parser_confidence?: number
          phones?: Json
          raw_snapshot?: Json
          scraped_at?: string
          slug?: string
          source_hash?: string | null
          source_url?: string
          status?: string
          updated_at?: string
          verification_status?: string
          website_url?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          block_reason: string | null
          created_at: string
          decided_at: string | null
          id: string
          recipient_id: string
          requester_id: string
          status: string
        }
        Insert: {
          block_reason?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
        }
        Update: {
          block_reason?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      user_feature_overrides: {
        Row: {
          created_at: string
          feature_key: string
          is_enabled: boolean
          reason: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          is_enabled: boolean
          reason?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          is_enabled?: boolean
          reason?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feature_overrides_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "afs_features"
            referencedColumns: ["key"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_profile_attributes: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          attribute_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          value_json: Json | null
          value_text: string | null
          visibility: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          attribute_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          value_json?: Json | null
          value_text?: string | null
          visibility?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          attribute_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          value_json?: Json | null
          value_text?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "afs_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          created_at: string
          role_id: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          role_id: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          role_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_taxonomy_selections: {
        Row: {
          created_at: string
          group_id: string
          id: string
          option_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          option_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          option_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_taxonomy_selections_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_taxonomy_selections_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_users: {
        Row: {
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          current_step: string | null
          discovery_source: string | null
          email: string | null
          funnel_interest: string | null
          id: string
          name: string | null
          note: string | null
          occupation_interest: string | null
          organization: string | null
          phone: string | null
          privacy_consent: boolean | null
          referral_code: string | null
          registration_completed_at: string | null
          registration_status: string | null
          source_type: string
          surname: string | null
          updated_at: string | null
          wa_id: string | null
          whatsapp_group_interest: boolean | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_step?: string | null
          discovery_source?: string | null
          email?: string | null
          funnel_interest?: string | null
          id?: string
          name?: string | null
          note?: string | null
          occupation_interest?: string | null
          organization?: string | null
          phone?: string | null
          privacy_consent?: boolean | null
          referral_code?: string | null
          registration_completed_at?: string | null
          registration_status?: string | null
          source_type?: string
          surname?: string | null
          updated_at?: string | null
          wa_id?: string | null
          whatsapp_group_interest?: boolean | null
        }
        Update: {
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_step?: string | null
          discovery_source?: string | null
          email?: string | null
          funnel_interest?: string | null
          id?: string
          name?: string | null
          note?: string | null
          occupation_interest?: string | null
          organization?: string | null
          phone?: string | null
          privacy_consent?: boolean | null
          referral_code?: string | null
          registration_completed_at?: string | null
          registration_status?: string | null
          source_type?: string
          surname?: string | null
          updated_at?: string | null
          wa_id?: string | null
          whatsapp_group_interest?: boolean | null
        }
        Relationships: []
      }
      welcome_pack_orders: {
        Row: {
          adults: number
          arrival_date: string
          children: number
          city: string
          country: string
          created_at: string
          has_pet: boolean
          id: string
          mentor_type: string | null
          needs_airport_transfer: boolean
          needs_baby_seat: boolean
          needs_car_rental: boolean
          needs_flight_discount: boolean
          needs_mentor: boolean
          needs_sim_card: boolean
          notes: string | null
          pet_details: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adults?: number
          arrival_date: string
          children?: number
          city: string
          country: string
          created_at?: string
          has_pet?: boolean
          id?: string
          mentor_type?: string | null
          needs_airport_transfer?: boolean
          needs_baby_seat?: boolean
          needs_car_rental?: boolean
          needs_flight_discount?: boolean
          needs_mentor?: boolean
          needs_sim_card?: boolean
          notes?: string | null
          pet_details?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adults?: number
          arrival_date?: string
          children?: number
          city?: string
          country?: string
          created_at?: string
          has_pet?: boolean
          id?: string
          mentor_type?: string | null
          needs_airport_transfer?: boolean
          needs_baby_seat?: boolean
          needs_car_rental?: boolean
          needs_flight_discount?: boolean
          needs_mentor?: boolean
          needs_sim_card?: boolean
          notes?: string | null
          pet_details?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      welcome_pack_proposals: {
        Row: {
          category: string
          created_at: string
          details: string | null
          id: string
          message: string
          order_id: string
          price: number | null
          provider_id: string
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          details?: string | null
          id?: string
          message: string
          order_id: string
          price?: number | null
          provider_id: string
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          details?: string | null
          id?: string
          message?: string
          order_id?: string
          price?: number | null
          provider_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "welcome_pack_proposals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "welcome_pack_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_join_requests: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          landing_id: string
          note: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          landing_id: string
          note?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          landing_id?: string
          note?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_join_requests_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_landings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_landing_editors: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          landing_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          landing_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          landing_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_landing_editors_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_landings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_landings: {
        Row: {
          admin_approved: boolean
          admin_contact: string | null
          admin_name: string | null
          call_to_action_text: string | null
          category: string
          city: string
          conditions: string | null
          country: string
          created_at: string
          description: string | null
          group_name: string
          group_score: number | null
          hero_image: string | null
          id: string
          language: string | null
          member_approved: boolean
          member_count: number | null
          member_count_updated_at: string | null
          mode: string
          origin: string | null
          rejection_reason: string | null
          slug: string
          status: string
          tagline: string | null
          updated_at: string
          user_id: string | null
          whatsapp_link: string
        }
        Insert: {
          admin_approved?: boolean
          admin_contact?: string | null
          admin_name?: string | null
          call_to_action_text?: string | null
          category: string
          city: string
          conditions?: string | null
          country: string
          created_at?: string
          description?: string | null
          group_name: string
          group_score?: number | null
          hero_image?: string | null
          id?: string
          language?: string | null
          member_approved?: boolean
          member_count?: number | null
          member_count_updated_at?: string | null
          mode?: string
          origin?: string | null
          rejection_reason?: string | null
          slug: string
          status?: string
          tagline?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_link: string
        }
        Update: {
          admin_approved?: boolean
          admin_contact?: string | null
          admin_name?: string | null
          call_to_action_text?: string | null
          category?: string
          city?: string
          conditions?: string | null
          country?: string
          created_at?: string
          description?: string | null
          group_name?: string
          group_score?: number | null
          hero_image?: string | null
          id?: string
          language?: string | null
          member_approved?: boolean
          member_count?: number | null
          member_count_updated_at?: string | null
          mode?: string
          origin?: string | null
          rejection_reason?: string | null
          slug?: string
          status?: string
          tagline?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_link?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      v_muhasebe_by_category: {
        Row: {
          category: Database["public"]["Enums"]["expense_category"] | null
          record_count: number | null
          total_try: number | null
        }
        Relationships: []
      }
      v_muhasebe_by_person: {
        Row: {
          paid_try: number | null
          pending_try: number | null
          person: Database["public"]["Enums"]["person_type"] | null
          record_count: number | null
          total_try: number | null
        }
        Relationships: []
      }
      v_muhasebe_cashflow_monthly: {
        Row: {
          baris_try: number | null
          burak_try: number | null
          expense_paid_try: number | null
          expense_pending_try: number | null
          expense_try: number | null
          income_collected_try: number | null
          income_pending_try: number | null
          income_try: number | null
          month_num: number | null
          net_try: number | null
          ortak_try: number | null
          year_num: number | null
        }
        Relationships: []
      }
      v_muhasebe_kpi: {
        Row: {
          net_position_try: number | null
          pending_expense_try: number | null
          pending_income_try: number | null
          total_expense_try: number | null
          total_income_try: number | null
          total_records: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_approve_catalog_claim: {
        Args: { p_claim_id: string }
        Returns: Json
      }
      admin_change_catalog_item_role: {
        Args: { p_item_id: string; p_reason?: string; p_role_key: string }
        Returns: Json
      }
      admin_clear_user_feature_override: {
        Args: { feature_key: string; target_user_id: string }
        Returns: undefined
      }
      admin_delete_catalog_item_attribute_override: {
        Args: { p_attribute_key: string; p_item_id: string }
        Returns: undefined
      }
      admin_delete_catalog_item_feature_override: {
        Args: { p_feature_key: string; p_item_id: string }
        Returns: undefined
      }
      admin_delete_catalog_item_section_override: {
        Args: { p_item_id: string; p_section_key: string }
        Returns: undefined
      }
      admin_grant_catalog_editor: {
        Args: { p_item_id: string; p_target_user_id: string }
        Returns: undefined
      }
      admin_grant_catalog_item_access: {
        Args: {
          p_access_level: string
          p_is_primary_owner?: boolean
          p_item_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      admin_grant_whatsapp_landing_editor: {
        Args: { p_landing_id: string; p_user_id: string }
        Returns: string
      }
      admin_list_catalog_claims: {
        Args: { p_item_id?: string; p_status?: string }
        Returns: {
          claim_type: string
          created_at: string
          id: string
          item_id: string
          item_title: string
          note: string
          requested_by_user_id: string
          requester_email: string
          requester_full_name: string
          reviewed_at: string
          reviewed_by_user_id: string
          reviewer_full_name: string
          status: string
        }[]
      }
      admin_list_catalog_item_access: {
        Args: { p_item_id: string }
        Returns: {
          access_level: string
          created_at: string
          email: string
          full_name: string
          status: string
          user_id: string
        }[]
      }
      admin_list_catalog_profiles: {
        Args: {
          p_access_role?: string
          p_city?: string
          p_country_code?: string
          p_item_type?: string
          p_query?: string
          p_role_key?: string
        }
        Returns: {
          created_at: string
          editor_count: number
          item_id: string
          item_type: string
          owner_count: number
          platform_role_key: string
          primary_city: string
          primary_country_code: string
          role_label: string
          slug: string
          status: string
          title: string
          verification_status: string
          visibility: string
        }[]
      }
      admin_list_member_catalog_profiles: {
        Args: {
          p_from?: string
          p_provider?: string
          p_query?: string
          p_sort?: string
          p_to?: string
        }
        Returns: {
          auth_provider: string
          created_at: string
          email: string
          full_name: string
          item_id: string
          profile_type: string
          user_id: string
        }[]
      }
      admin_list_unified_records: {
        Args: {
          p_city?: string
          p_country_code?: string
          p_item_type?: string
          p_kind?: string
          p_page?: number
          p_page_size?: number
          p_platform_role_key?: string
          p_query?: string
          p_status?: string
          p_verification_status?: string
        }
        Returns: {
          category_labels: string[]
          created_at: string
          email: string
          id: string
          item_type: string
          kind: string
          platform_role_key: string
          primary_city: string
          primary_country_code: string
          profile_type: string
          slug: string
          source_types: string[]
          status: string
          summary: string
          title: string
          total_count: number
          updated_at: string
          verification_status: string
          visibility: string
        }[]
      }
      admin_reject_catalog_claim: {
        Args: { p_claim_id: string; p_review_note?: string }
        Returns: Json
      }
      admin_remove_catalog_item_editor: {
        Args: { p_item_id: string; p_role?: string; p_user_id: string }
        Returns: undefined
      }
      admin_repair_catalog_item_role: {
        Args: { p_item_id: string; p_reason: string; p_role_key: string }
        Returns: Json
      }
      admin_replace_resource_entries_from_csv: {
        Args: { batch_id: string; expected_count: number; payload: Json }
        Returns: {
          inserted_count: number
        }[]
      }
      admin_review_approval_request: {
        Args: { decision: string; note?: string; request_id: string }
        Returns: undefined
      }
      admin_revoke_catalog_editor: {
        Args: { p_item_id: string; p_target_user_id: string }
        Returns: undefined
      }
      admin_revoke_catalog_item_access: {
        Args: { p_item_id: string; p_user_id: string }
        Returns: undefined
      }
      admin_revoke_whatsapp_landing_editor: {
        Args: { p_assignment_id: string }
        Returns: undefined
      }
      admin_search_profiles: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          email: string
          full_name: string
          id: string
        }[]
      }
      admin_set_attribute_rule: {
        Args: { attribute_key: string; role_key: string; rule_payload: Json }
        Returns: undefined
      }
      admin_set_catalog_item_attribute: {
        Args: {
          p_attribute_key: string
          p_item_id: string
          p_value: Json
          p_visibility?: string
        }
        Returns: undefined
      }
      admin_set_catalog_item_editor: {
        Args: { p_item_id: string; p_role?: string; p_user_id: string }
        Returns: undefined
      }
      admin_set_catalog_item_feature_override: {
        Args: {
          p_feature_key: string
          p_is_enabled: boolean
          p_item_id: string
          p_reason?: string
        }
        Returns: undefined
      }
      admin_set_catalog_item_role: {
        Args: { p_item_id: string; p_role_key: string }
        Returns: undefined
      }
      admin_set_feature_global_state: {
        Args: { feature_key: string; is_active_globally: boolean }
        Returns: undefined
      }
      admin_set_member_catalog_role: {
        Args: { p_item_id: string; p_role_key: string }
        Returns: undefined
      }
      admin_set_role_feature_flag: {
        Args: { feature_key: string; is_enabled: boolean; role_key: string }
        Returns: undefined
      }
      admin_set_taxonomy_option_active: {
        Args: { is_active: boolean; option_key: string }
        Returns: undefined
      }
      admin_set_user_feature_override: {
        Args: {
          feature_key: string
          is_enabled: boolean
          target_user_id: string
        }
        Returns: undefined
      }
      admin_set_user_feature_override_detailed: {
        Args: {
          feature_key: string
          is_enabled: boolean
          reason?: string
          target_user_id: string
        }
        Returns: undefined
      }
      admin_set_user_profile_type: {
        Args: { next_profile_type: string; target_user_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: { role_key: string; target_user_id: string }
        Returns: undefined
      }
      admin_update_catalog_item_access: {
        Args: { p_access_level: string; p_item_id: string; p_user_id: string }
        Returns: undefined
      }
      admin_update_user_profile_attribute: {
        Args: {
          attribute_key: string
          attribute_value: Json
          target_user_id: string
          visibility?: string
        }
        Returns: Json
      }
      admin_update_user_taxonomy_selection: {
        Args: {
          group_key: string
          option_keys: string[]
          target_user_id: string
        }
        Returns: Json
      }
      admin_upsert_catalog_item_attribute_override: {
        Args: {
          p_attribute_key: string
          p_display_order?: number
          p_is_enabled?: boolean
          p_item_id: string
          p_override_label?: string
        }
        Returns: undefined
      }
      admin_upsert_catalog_item_feature_override: {
        Args: {
          p_feature_key: string
          p_is_enabled?: boolean
          p_item_id: string
        }
        Returns: undefined
      }
      admin_upsert_catalog_item_section_override: {
        Args: {
          p_display_order?: number
          p_is_visible?: boolean
          p_item_id: string
          p_section_key: string
        }
        Returns: undefined
      }
      admin_upsert_entity_metadata: {
        Args: {
          p_admin_note?: string
          p_description?: string
          p_entity_key: string
          p_entity_type: string
        }
        Returns: undefined
      }
      admin_upsert_role_profile_section_rule: {
        Args: {
          is_enabled: boolean
          requires_approval?: boolean
          role_key: string
          section_key: string
          sort_order?: number
        }
        Returns: undefined
      }
      admin_upsert_role_taxonomy_rule: {
        Args: {
          group_key: string
          is_enabled: boolean
          is_required: boolean
          role_key: string
          selection_mode: string
        }
        Returns: undefined
      }
      can_administer_catalog_item: {
        Args: { p_item_id: string; p_user_id?: string }
        Returns: boolean
      }
      can_edit_catalog_item: {
        Args: { p_item_id: string; p_user_id?: string }
        Returns: boolean
      }
      can_manage_catalog_item_editors: {
        Args: { p_item_id: string; p_user_id?: string }
        Returns: boolean
      }
      can_view_catalog_item: {
        Args: { p_item_id: string; p_user_id?: string }
        Returns: boolean
      }
      catalog_create_duplicate_candidates_for_item: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      catalog_delete_item_for_source: {
        Args: { p_external_id: string; p_source_type: string }
        Returns: undefined
      }
      catalog_item_is_publicly_visible: {
        Args: { p_item_id: string }
        Returns: boolean
      }
      catalog_rebuild_search_document: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      catalog_rebuild_search_documents_for_category: {
        Args: { p_category_id: string }
        Returns: undefined
      }
      catalog_refresh_all_search_documents: { Args: never; Returns: undefined }
      catalog_reset_item_projection: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      catalog_search_normalize: {
        Args: { input_text: string }
        Returns: string
      }
      catalog_slugify: { Args: { input_text: string }; Returns: string }
      catalog_sync_event: { Args: { p_event_id: string }; Returns: string }
      catalog_sync_independent_profile: {
        Args: { p_profile_id: string }
        Returns: string
      }
      catalog_sync_job_listing: {
        Args: { p_listing_id: string }
        Returns: string
      }
      catalog_sync_turkish_mission: {
        Args: { p_mission_id: string }
        Returns: string
      }
      catalog_sync_whatsapp_landing: {
        Args: { p_landing_id: string }
        Returns: string
      }
      catalog_upsert_owner_membership: {
        Args: { p_item_id: string; p_user_id: string }
        Returns: undefined
      }
      catalog_upsert_source_item: {
        Args: {
          p_attributes?: Json
          p_created_by_user_id: string
          p_external_id: string
          p_headline: string
          p_item_type: string
          p_long_description: string
          p_platform_role_key?: string
          p_published_at: string
          p_raw_snapshot?: Json
          p_short_description: string
          p_slug: string
          p_source_type: string
          p_source_url?: string
          p_status: string
          p_title: string
          p_verification_status: string
          p_visibility: string
        }
        Returns: string
      }
      catalog_user_can_edit_item: {
        Args: { p_item_id: string; p_user_id: string }
        Returns: boolean
      }
      catalog_user_can_manage_item: {
        Args: {
          p_allowed_roles?: string[]
          p_item_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      complete_current_profile_onboarding_activation: {
        Args: never
        Returns: Json
      }
      current_user_can_edit_whatsapp_landing: {
        Args: { p_landing_id: string }
        Returns: boolean
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_ambassador_referral_code: { Args: never; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_catalog_item_profile: { Args: { p_item_id: string }; Returns: Json }
      get_catalog_item_public_profile: {
        Args: { p_slug: string }
        Returns: Json
      }
      get_catalog_item_rules: { Args: { p_item_id: string }; Returns: Json }
      get_current_member_catalog_profile: { Args: never; Returns: Json }
      get_current_profile_onboarding_activation: { Args: never; Returns: Json }
      get_current_user_dashboard: {
        Args: never
        Returns: {
          description: string
          feature_key: string
          feature_type: string
          is_enabled: boolean
          label: string
          scope: string
          sort_order: number
          source: string
        }[]
      }
      get_current_user_editable_whatsapp_landing: {
        Args: { p_slug: string }
        Returns: {
          admin_approved: boolean
          admin_contact: string | null
          admin_name: string | null
          call_to_action_text: string | null
          category: string
          city: string
          conditions: string | null
          country: string
          created_at: string
          description: string | null
          group_name: string
          group_score: number | null
          hero_image: string | null
          id: string
          language: string | null
          member_approved: boolean
          member_count: number | null
          member_count_updated_at: string | null
          mode: string
          origin: string | null
          rejection_reason: string | null
          slug: string
          status: string
          tagline: string | null
          updated_at: string
          user_id: string | null
          whatsapp_link: string
        }[]
        SetofOptions: {
          from: "*"
          to: "whatsapp_landings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_current_user_features: {
        Args: never
        Returns: {
          feature_key: string
          is_enabled: boolean
          source: string
        }[]
      }
      get_current_user_profile: { Args: never; Returns: Json }
      get_flat_roles: {
        Args: never
        Returns: {
          description: string
          key: string
          label: string
          sort_order: number
        }[]
      }
      get_my_editable_catalog_items: {
        Args: never
        Returns: {
          access_level: string
          created_at: string
          is_primary_owner: boolean
          item_id: string
          item_type: string
          platform_role_key: string
          slug: string
          title: string
        }[]
      }
      get_public_catalog_item_profile: {
        Args: { p_slug: string }
        Returns: Json
      }
      get_public_directory_profile: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_public_independent_profile: {
        Args: { p_slug: string }
        Returns: Json
      }
      get_public_profile_sections: {
        Args: { target_user_id: string }
        Returns: {
          component_name: string
          content: Json
          label: string
          section_area: string
          section_key: string
          sort_order: number
        }[]
      }
      get_role_form_schema: { Args: { p_role_key: string }; Returns: Json }
      get_role_management_bundle: {
        Args: { p_role_key: string }
        Returns: Json
      }
      get_submission_documents_bucket_stats: {
        Args: never
        Returns: {
          bucket_id: string
          file_count: number
          file_size_limit: number
          total_bytes: number
          usage_ratio: number
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      is_admin: { Args: { uid: string }; Returns: boolean }
      is_admin_user: { Args: { check_user_id: string }; Returns: boolean }
      is_moderator: { Args: { uid: string }; Returns: boolean }
      list_member_catalog_names: {
        Args: { p_user_ids: string[] }
        Returns: {
          full_name: string
          user_id: string
        }[]
      }
      list_public_directory_profiles: {
        Args: {
          city_filter?: string
          country_filter?: string
          featured_only?: boolean
          role_filter?: string
          search_text?: string
          verified_only?: boolean
        }
        Returns: {
          city: string
          country: string
          display_name: string
          is_featured: boolean
          is_verified: boolean
          linkedin_url: string
          profile_image_url: string
          role_key: string
          role_label: string
          role_slug: string
          short_bio: string
          special_attribute_key: string
          special_attribute_label: string
          special_attribute_value: string
          user_id: string
          website_url: string
          whatsapp: string
        }[]
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      normalize_profile_onboarding_email: {
        Args: { input_email: string }
        Returns: string
      }
      notify_followers: {
        Args: {
          _author_id: string
          _message: string
          _related_id: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      resolve_approval_request_type: {
        Args: { p_feature_key: string }
        Returns: string
      }
      review_catalog_claim_request: {
        Args: {
          decision: string
          review_note?: string
          target_claim_request_id: string
        }
        Returns: Json
      }
      search_catalog: {
        Args: {
          category_slugs?: string[]
          city_filter?: string
          country_filter?: string
          item_types?: string[]
          language_filters?: string[]
          limit_count?: number
          offset_count?: number
          search_query: string
          verified_only?: boolean
        }
        Returns: {
          category_slugs: string[]
          city: string
          country_code: string
          filter_data: Json
          headline: string
          item_id: string
          item_type: string
          language_codes: string[]
          score: number
          short_description: string
          slug: string
          thumbnail_url: string
          title: string
          verification_status: string
        }[]
      }
      search_directory_catalog: {
        Args: {
          p_city?: string
          p_country_code?: string
          p_featured_only?: boolean
          p_role_key?: string
          p_search_text?: string
        }
        Returns: {
          city: string
          country: string
          description: string
          image_url: string
          is_claimable: boolean
          is_featured: boolean
          is_verified: boolean
          item_id: string
          item_type: string
          role_key: string
          role_label: string
          slug: string
          special_label: string
          special_value: string
          title: string
        }[]
      }
      set_catalog_search_embedding: {
        Args: { next_embedding: string; target_item_id: string }
        Returns: undefined
      }
      set_current_member_catalog_role: {
        Args: { p_role_key: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      submit_catalog_claim_request: {
        Args: {
          claim_type?: string
          evidence?: Json
          note?: string
          target_item_id: string
        }
        Returns: {
          claim_type: string
          created_at: string
          evidence: Json
          id: string
          item_id: string
          note: string | null
          requested_by_user_id: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "catalog_item_claims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_feature_request: {
        Args: { feature_key: string; payload?: Json }
        Returns: string
      }
      submit_role_change_request: {
        Args: { note?: string; target_role_key: string }
        Returns: string
      }
      sync_member_catalog_role_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      unaccent: { Args: { "": string }; Returns: string }
      unlockrows: { Args: { "": string }; Returns: number }
      update_catalog_item_attribute: {
        Args: {
          p_attribute_key: string
          p_item_id: string
          p_value: Json
          p_visibility?: string
        }
        Returns: Json
      }
      update_catalog_item_editor_content: {
        Args: {
          attributes_patch?: Json
          next_headline?: string
          next_long_description?: string
          next_short_description?: string
          target_item_id: string
        }
        Returns: {
          attributes: Json
          city: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          headline: string | null
          id: string
          is_placeholder: boolean
          is_verified: boolean
          item_type: string
          linked_user_id: string | null
          long_description: string | null
          platform_role_key: string | null
          published_at: string | null
          short_description: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          verification_status: string
          visibility: string
        }
        SetofOptions: {
          from: "*"
          to: "catalog_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_current_user_editable_whatsapp_landing: {
        Args: {
          p_admin_contact: string
          p_admin_name: string
          p_call_to_action_text: string
          p_category: string
          p_city: string
          p_conditions: string
          p_country: string
          p_description: string
          p_group_name: string
          p_hero_image: string
          p_landing_id: string
          p_language: string
          p_member_count: number
          p_member_count_updated_at: string
          p_origin: string
          p_whatsapp_link: string
        }
        Returns: {
          admin_approved: boolean
          admin_contact: string | null
          admin_name: string | null
          call_to_action_text: string | null
          category: string
          city: string
          conditions: string | null
          country: string
          created_at: string
          description: string | null
          group_name: string
          group_score: number | null
          hero_image: string | null
          id: string
          language: string | null
          member_approved: boolean
          member_count: number | null
          member_count_updated_at: string | null
          mode: string
          origin: string | null
          rejection_reason: string | null
          slug: string
          status: string
          tagline: string | null
          updated_at: string
          user_id: string | null
          whatsapp_link: string
        }
        SetofOptions: {
          from: "*"
          to: "whatsapp_landings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_profile_attribute: {
        Args: {
          attribute_key: string
          attribute_value: Json
          visibility?: string
        }
        Returns: Json
      }
      update_profile_avatar: {
        Args: { next_avatar_url: string }
        Returns: Json
      }
      update_user_taxonomy_selection: {
        Args: { group_key: string; option_keys: string[] }
        Returns: Json
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      validate_and_bind_referral_code: {
        Args: { input_code: string; reference_time?: string }
        Returns: {
          message: string
          normalized_code: string
          referral_code_id: string
          status: string
        }[]
      }
      validate_profile_onboarding_referral_source: {
        Args: { input_value: string }
        Returns: string
      }
      write_admin_audit_log: {
        Args: {
          p_action: string
          p_after_value?: Json
          p_before_value?: Json
          p_target_entity_id?: string
          p_target_entity_type?: string
          p_target_user_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      currency_code: "TRY" | "USD" | "EUR" | "GBP" | "QAR"
      expense_category:
        | "yazilim_araclar"
        | "hosting_sunucu"
        | "alan_adi_ssl"
        | "pazarlama_reklam"
        | "hukuki_danismanlik"
        | "muhasebe_finans"
        | "seyahat_ulasim"
        | "ofis_kirtasiye"
        | "maas_ucret"
        | "esop_hisse"
        | "banka_komisyon"
        | "diger_gider"
      expense_status: "odendi" | "bekliyor" | "iptal"
      income_category:
        | "pilot_gelir"
        | "danismanlik_geliri"
        | "hibe_grant"
        | "yatirim_taahhudu"
        | "demo_geliri"
        | "diger_gelir"
      income_status: "tahsil_edildi" | "bekliyor" | "iptal"
      payment_method:
        | "sanal_kart_burak"
        | "sanal_kart_baris"
        | "kisisel_kart_burak"
        | "kisisel_kart_baris"
        | "havale_eft"
        | "nakit"
        | "diger"
      person_type: "burak" | "baris" | "ortak"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      currency_code: ["TRY", "USD", "EUR", "GBP", "QAR"],
      expense_category: [
        "yazilim_araclar",
        "hosting_sunucu",
        "alan_adi_ssl",
        "pazarlama_reklam",
        "hukuki_danismanlik",
        "muhasebe_finans",
        "seyahat_ulasim",
        "ofis_kirtasiye",
        "maas_ucret",
        "esop_hisse",
        "banka_komisyon",
        "diger_gider",
      ],
      expense_status: ["odendi", "bekliyor", "iptal"],
      income_category: [
        "pilot_gelir",
        "danismanlik_geliri",
        "hibe_grant",
        "yatirim_taahhudu",
        "demo_geliri",
        "diger_gelir",
      ],
      income_status: ["tahsil_edildi", "bekliyor", "iptal"],
      payment_method: [
        "sanal_kart_burak",
        "sanal_kart_baris",
        "kisisel_kart_burak",
        "kisisel_kart_baris",
        "havale_eft",
        "nakit",
        "diger",
      ],
      person_type: ["burak", "baris", "ortak"],
    },
  },
} as const

