export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AdvisorProfileLinkTable = {
  Row: {
    added_by: "UBT" | "Burak" | "Diğer";
    contacted_email: boolean;
    contacted_instagram: boolean;
    contacted_phone: boolean;
    contacted_whatsapp: boolean;
    created_at: string;
    description: string | null;
    email: string | null;
    id: string;
    instagram: string | null;
    link: string | null;
    name: string;
    phone: string | null;
    platform:
      | "Instagram"
      | "LinkedIn"
      | "Twitter (X)"
      | "YouTube"
      | "TikTok"
      | "Facebook"
      | "Reddit"
      | "Discord"
      | "Diğer";
    whatsapp: string | null;
  };
  Insert: {
    added_by?: "UBT" | "Burak" | "Diğer";
    contacted_email?: boolean;
    contacted_instagram?: boolean;
    contacted_phone?: boolean;
    contacted_whatsapp?: boolean;
    created_at?: string;
    description?: string | null;
    email?: string | null;
    id?: string;
    instagram?: string | null;
    link?: string | null;
    name?: string;
    phone?: string | null;
    platform?:
      | "Instagram"
      | "LinkedIn"
      | "Twitter (X)"
      | "YouTube"
      | "TikTok"
      | "Facebook"
      | "Reddit"
      | "Discord"
      | "Diğer";
    whatsapp?: string | null;
  };
  Update: {
    added_by?: "UBT" | "Burak" | "Diğer";
    contacted_email?: boolean;
    contacted_instagram?: boolean;
    contacted_phone?: boolean;
    contacted_whatsapp?: boolean;
    created_at?: string;
    description?: string | null;
    email?: string | null;
    id?: string;
    instagram?: string | null;
    link?: string | null;
    name?: string;
    phone?: string | null;
    platform?:
      | "Instagram"
      | "LinkedIn"
      | "Twitter (X)"
      | "YouTube"
      | "TikTok"
      | "Facebook"
      | "Reddit"
      | "Discord"
      | "Diğer";
    whatsapp?: string | null;
  };
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      direct_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          read_at: string | null;
          recipient_id: string;
          sender_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id: string;
          sender_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id?: string;
          sender_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          profile_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          profile_type?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          profile_type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          auth_provider: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          profile_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auth_provider?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          profile_type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auth_provider?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          profile_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      individual_profile_details: {
        Row: {
          active_city: string | null;
          active_country: string | null;
          control_panel: Json;
          created_at: string;
          detail_card: Json;
          event_count: number;
          follower_count: number;
          following_count: number;
          front_card: Json;
          hometown: string | null;
          job_seeking: boolean;
          mentor_opt_in: boolean;
          phone_verified: boolean;
          presence_status: string;
          profile_settings: Json;
          status_text: string | null;
          tagline: string | null;
          updated_at: string;
          user_id: string;
          visibility_status: string;
        };
        Insert: {
          active_city?: string | null;
          active_country?: string | null;
          control_panel?: Json;
          created_at?: string;
          detail_card?: Json;
          event_count?: number;
          follower_count?: number;
          following_count?: number;
          front_card?: Json;
          hometown?: string | null;
          job_seeking?: boolean;
          mentor_opt_in?: boolean;
          phone_verified?: boolean;
          presence_status?: string;
          profile_settings?: Json;
          status_text?: string | null;
          tagline?: string | null;
          updated_at?: string;
          user_id: string;
          visibility_status?: string;
        };
        Update: {
          active_city?: string | null;
          active_country?: string | null;
          control_panel?: Json;
          created_at?: string;
          detail_card?: Json;
          event_count?: number;
          follower_count?: number;
          following_count?: number;
          front_card?: Json;
          hometown?: string | null;
          job_seeking?: boolean;
          mentor_opt_in?: boolean;
          phone_verified?: boolean;
          presence_status?: string;
          profile_settings?: Json;
          status_text?: string | null;
          tagline?: string | null;
          updated_at?: string;
          user_id?: string;
          visibility_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "individual_profile_details_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          key: string;
          label: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          key: string;
          label: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          key?: string;
          label?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_role_assignments: {
        Row: {
          created_at: string;
          role_id: string;
          updated_at: string;
          updated_by: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role_id: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      role_feature_flags: {
        Row: {
          created_at: string;
          feature_key: string;
          is_enabled: boolean;
          role_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          feature_key: string;
          is_enabled?: boolean;
          role_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          feature_key?: string;
          is_enabled?: boolean;
          role_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "role_feature_flags_feature_key_fkey";
            columns: ["feature_key"];
            isOneToOne: false;
            referencedRelation: "feature_catalog";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "role_feature_flags_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      feature_catalog: {
        Row: {
          created_at: string;
          description: string | null;
          is_active_globally: boolean;
          key: string;
          label: string;
          scope_role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          is_active_globally?: boolean;
          key: string;
          label: string;
          scope_role: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          is_active_globally?: boolean;
          key?: string;
          label?: string;
          scope_role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_feature_defaults: {
        Row: {
          created_at: string;
          feature_key: string;
          is_enabled: boolean;
          profile_type: string;
        };
        Insert: {
          created_at?: string;
          feature_key: string;
          is_enabled?: boolean;
          profile_type: string;
        };
        Update: {
          created_at?: string;
          feature_key?: string;
          is_enabled?: boolean;
          profile_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_feature_defaults_feature_key_fkey";
            columns: ["feature_key"];
            isOneToOne: false;
            referencedRelation: "feature_catalog";
            referencedColumns: ["key"];
          },
        ];
      };
      user_connections: {
        Row: {
          block_reason: string | null;
          created_at: string;
          decided_at: string | null;
          id: string;
          recipient_id: string;
          requester_id: string;
          status: string;
        };
        Insert: {
          block_reason?: string | null;
          created_at?: string;
          decided_at?: string | null;
          id?: string;
          recipient_id: string;
          requester_id: string;
          status?: string;
        };
        Update: {
          block_reason?: string | null;
          created_at?: string;
          decided_at?: string | null;
          id?: string;
          recipient_id?: string;
          requester_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      user_follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      user_feature_overrides: {
        Row: {
          created_at: string;
          feature_key: string;
          is_enabled: boolean;
          reason: string | null;
          updated_at: string;
          updated_by: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feature_key: string;
          is_enabled: boolean;
          reason?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feature_key?: string;
          is_enabled?: boolean;
          reason?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_feature_overrides_feature_key_fkey";
            columns: ["feature_key"];
            isOneToOne: false;
            referencedRelation: "feature_catalog";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "user_feature_overrides_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      attribute_catalog: {
        Row: {
          created_at: string;
          data_type: string;
          description: string | null;
          id: string;
          is_active: boolean;
          is_system: boolean;
          key: string;
          label: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          data_type: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          key: string;
          label: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          data_type?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          key?: string;
          label?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_attribute_rules: {
        Row: {
          attribute_id: string;
          created_at: string;
          id: string;
          is_enabled: boolean;
          is_public_default: boolean;
          is_required: boolean;
          requires_admin_approval_on_change: boolean;
          role_id: string;
          sort_order: number;
          updated_at: string;
          user_can_edit: boolean;
          user_can_hide: boolean;
        };
        Insert: {
          attribute_id: string;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          is_public_default?: boolean;
          is_required?: boolean;
          requires_admin_approval_on_change?: boolean;
          role_id: string;
          sort_order?: number;
          updated_at?: string;
          user_can_edit?: boolean;
          user_can_hide?: boolean;
        };
        Update: {
          attribute_id?: string;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          is_public_default?: boolean;
          is_required?: boolean;
          requires_admin_approval_on_change?: boolean;
          role_id?: string;
          sort_order?: number;
          updated_at?: string;
          user_can_edit?: boolean;
          user_can_hide?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "role_attribute_rules_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attribute_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_attribute_rules_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profile_attributes: {
        Row: {
          approval_status: string;
          approved_at: string | null;
          approved_by: string | null;
          attribute_id: string;
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
          value_json: Json | null;
          value_text: string | null;
          visibility: string;
        };
        Insert: {
          approval_status?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          attribute_id: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
          value_json?: Json | null;
          value_text?: string | null;
          visibility?: string;
        };
        Update: {
          approval_status?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          attribute_id?: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
          value_json?: Json | null;
          value_text?: string | null;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profile_attributes_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attribute_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_profile_attributes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      approval_requests: {
        Row: {
          admin_note: string | null;
          created_at: string;
          id: string;
          payload: Json;
          request_type: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          target_entity_id: string | null;
          target_entity_type: string | null;
          target_feature_key: string | null;
          target_role_key: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          admin_note?: string | null;
          created_at?: string;
          id?: string;
          payload?: Json;
          request_type: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          target_entity_id?: string | null;
          target_entity_type?: string | null;
          target_feature_key?: string | null;
          target_role_key?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          admin_note?: string | null;
          created_at?: string;
          id?: string;
          payload?: Json;
          request_type?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          target_entity_id?: string | null;
          target_entity_type?: string | null;
          target_feature_key?: string | null;
          target_role_key?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "approval_requests_target_feature_key_fkey";
            columns: ["target_feature_key"];
            isOneToOne: false;
            referencedRelation: "feature_catalog";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "approval_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      admin_audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          after_value: Json | null;
          before_value: Json | null;
          created_at: string;
          id: string;
          target_entity_id: string | null;
          target_entity_type: string | null;
          target_user_id: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          after_value?: Json | null;
          before_value?: Json | null;
          created_at?: string;
          id?: string;
          target_entity_id?: string | null;
          target_entity_type?: string | null;
          target_user_id?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          after_value?: Json | null;
          before_value?: Json | null;
          created_at?: string;
          id?: string;
          target_entity_id?: string | null;
          target_entity_type?: string | null;
          target_user_id?: string | null;
        };
        Relationships: [];
      };
      may19_campaign_submissions: {
        Row: {
          city: string;
          consent: boolean;
          country: string;
          created_at: string;
          description: string;
          email: string;
          file_name: string | null;
          full_name: string;
          id: string;
          kind: string;
          link: string | null;
          message: string | null;
          review_notes: string | null;
          social_handle: string | null;
          storage_bucket: string | null;
          storage_path: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          city: string;
          consent?: boolean;
          country: string;
          created_at?: string;
          description: string;
          email: string;
          file_name?: string | null;
          full_name: string;
          id?: string;
          kind: string;
          link?: string | null;
          message?: string | null;
          review_notes?: string | null;
          social_handle?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          city?: string;
          consent?: boolean;
          country?: string;
          created_at?: string;
          description?: string;
          email?: string;
          file_name?: string | null;
          full_name?: string;
          id?: string;
          kind?: string;
          link?: string | null;
          message?: string | null;
          review_notes?: string | null;
          social_handle?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      whatsapp_join_requests: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          landing_id: string;
          note: string | null;
          phone: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          landing_id: string;
          note?: string | null;
          phone?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          landing_id?: string;
          note?: string | null;
          phone?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      whatsapp_landings: {
        Row: {
          admin_approved: boolean;
          admin_contact: string | null;
          admin_name: string | null;
          call_to_action_text: string | null;
          category: string;
          city: string;
          conditions: string | null;
          country: string;
          created_at: string;
          description: string | null;
          group_name: string;
          group_score: number | null;
          hero_image: string | null;
          id: string;
          language: string | null;
          member_count: number | null;
          member_count_updated_at: string | null;
          member_approved: boolean;
          mode: string;
          origin: string | null;
          rejection_reason: string | null;
          slug: string;
          status: string;
          tagline: string | null;
          updated_at: string;
          user_id: string;
          whatsapp_link: string;
        };
        Insert: {
          admin_approved?: boolean;
          admin_contact?: string | null;
          admin_name?: string | null;
          call_to_action_text?: string | null;
          category: string;
          city: string;
          conditions?: string | null;
          country: string;
          created_at?: string;
          description?: string | null;
          group_name: string;
          group_score?: number | null;
          hero_image?: string | null;
          id?: string;
          language?: string | null;
          member_count?: number | null;
          member_count_updated_at?: string | null;
          member_approved?: boolean;
          mode?: string;
          origin?: string | null;
          rejection_reason?: string | null;
          slug: string;
          status?: string;
          tagline?: string | null;
          updated_at?: string;
          user_id: string;
          whatsapp_link: string;
        };
        Update: {
          admin_approved?: boolean;
          admin_contact?: string | null;
          admin_name?: string | null;
          call_to_action_text?: string | null;
          category?: string;
          city?: string;
          conditions?: string | null;
          country?: string;
          created_at?: string;
          description?: string | null;
          group_name?: string;
          group_score?: number | null;
          hero_image?: string | null;
          id?: string;
          language?: string | null;
          member_count?: number | null;
          member_count_updated_at?: string | null;
          member_approved?: boolean;
          mode?: string;
          origin?: string | null;
          rejection_reason?: string | null;
          slug?: string;
          status?: string;
          tagline?: string | null;
          updated_at?: string;
          user_id?: string;
          whatsapp_link?: string;
        };
        Relationships: [];
      };
      surveys: {
        Row: {
          allow_anonymous: boolean;
          allow_multiple_submissions: boolean;
          approved_by: string | null;
          closed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          is_featured: boolean;
          published_at: string | null;
          slug: string;
          starts_at: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          allow_anonymous?: boolean;
          allow_multiple_submissions?: boolean;
          approved_by?: string | null;
          closed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_featured?: boolean;
          published_at?: string | null;
          slug: string;
          starts_at?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          allow_anonymous?: boolean;
          allow_multiple_submissions?: boolean;
          approved_by?: string | null;
          closed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_featured?: boolean;
          published_at?: string | null;
          slug?: string;
          starts_at?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      survey_questions: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_required: boolean;
          options: Json;
          placeholder: string | null;
          question: string;
          sort_order: number;
          survey_id: string;
          type: string;
          updated_at: string;
          validation: Json;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_required?: boolean;
          options?: Json;
          placeholder?: string | null;
          question: string;
          sort_order?: number;
          survey_id: string;
          type: string;
          updated_at?: string;
          validation?: Json;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_required?: boolean;
          options?: Json;
          placeholder?: string | null;
          question?: string;
          sort_order?: number;
          survey_id?: string;
          type?: string;
          updated_at?: string;
          validation?: Json;
        };
        Relationships: [];
      };
      survey_responses: {
        Row: {
          contact_opt_in: boolean;
          created_at: string;
          id: string;
          ip_hash: string | null;
          respondent_email: string | null;
          respondent_name: string | null;
          respondent_user_id: string | null;
          status: string;
          submitted_at: string;
          survey_id: string;
          user_agent: string | null;
        };
        Insert: {
          contact_opt_in?: boolean;
          created_at?: string;
          id?: string;
          ip_hash?: string | null;
          respondent_email?: string | null;
          respondent_name?: string | null;
          respondent_user_id?: string | null;
          status?: string;
          submitted_at?: string;
          survey_id: string;
          user_agent?: string | null;
        };
        Update: {
          contact_opt_in?: boolean;
          created_at?: string;
          id?: string;
          ip_hash?: string | null;
          respondent_email?: string | null;
          respondent_name?: string | null;
          respondent_user_id?: string | null;
          status?: string;
          submitted_at?: string;
          survey_id?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      survey_answers: {
        Row: {
          answer_value: Json;
          created_at: string;
          id: string;
          question_id: string;
          response_id: string;
        };
        Insert: {
          answer_value: Json;
          created_at?: string;
          id?: string;
          question_id: string;
          response_id: string;
        };
        Update: {
          answer_value?: Json;
          created_at?: string;
          id?: string;
          question_id?: string;
          response_id?: string;
        };
        Relationships: [];
      };
      advisor_social_media_links: {
        Row: {
          added_by: "UBT" | "Burak" | "Diğer";
          contacted_email: boolean;
          contacted_instagram: boolean;
          contacted_phone: boolean;
          contacted_whatsapp: boolean;
          created_at: string;
          description: string | null;
          email: string | null;
          id: string;
          instagram: string | null;
          link: string | null;
          name: string;
          phone: string | null;
          platform:
            | "Instagram"
            | "LinkedIn"
            | "Twitter (X)"
            | "YouTube"
            | "TikTok"
            | "Facebook"
            | "Reddit"
            | "Discord"
            | "Diğer";
          whatsapp: string | null;
        };
        Insert: {
          added_by?: "UBT" | "Burak" | "Diğer";
          contacted_email?: boolean;
          contacted_instagram?: boolean;
          contacted_phone?: boolean;
          contacted_whatsapp?: boolean;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          instagram?: string | null;
          link?: string | null;
          name?: string;
          phone?: string | null;
          platform?:
            | "Instagram"
            | "LinkedIn"
            | "Twitter (X)"
            | "YouTube"
            | "TikTok"
            | "Facebook"
            | "Reddit"
            | "Discord"
            | "Diğer";
          whatsapp?: string | null;
        };
        Update: {
          added_by?: "UBT" | "Burak" | "Diğer";
          contacted_email?: boolean;
          contacted_instagram?: boolean;
          contacted_phone?: boolean;
          contacted_whatsapp?: boolean;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          id?: string;
          instagram?: string | null;
          link?: string | null;
          name?: string;
          phone?: string | null;
          platform?:
            | "Instagram"
            | "LinkedIn"
            | "Twitter (X)"
            | "YouTube"
            | "TikTok"
            | "Facebook"
            | "Reddit"
            | "Discord"
            | "Diğer";
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      consultant_social_media_links: AdvisorProfileLinkTable;
      contributor_social_media_links: AdvisorProfileLinkTable;
      expenses: {
        Row: {
          amount: number;
          category: Database["public"]["Enums"]["expense_category"];
          created_at: string;
          created_by: string | null;
          currency: Database["public"]["Enums"]["currency_code"];
          description: string;
          expense_date: string;
          id: string;
          invoice_url: string | null;
          is_virtual_card: boolean;
          note: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"] | null;
          person: Database["public"]["Enums"]["person_type"];
          status: Database["public"]["Enums"]["expense_status"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          category: Database["public"]["Enums"]["expense_category"];
          created_at?: string;
          created_by?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          description: string;
          expense_date: string;
          id?: string;
          invoice_url?: string | null;
          is_virtual_card?: boolean;
          note?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          person: Database["public"]["Enums"]["person_type"];
          status?: Database["public"]["Enums"]["expense_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category?: Database["public"]["Enums"]["expense_category"];
          created_at?: string;
          created_by?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          description?: string;
          expense_date?: string;
          id?: string;
          invoice_url?: string | null;
          is_virtual_card?: boolean;
          note?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          person?: Database["public"]["Enums"]["person_type"];
          status?: Database["public"]["Enums"]["expense_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      incomes: {
        Row: {
          amount: number;
          category: Database["public"]["Enums"]["income_category"];
          created_at: string;
          created_by: string | null;
          currency: Database["public"]["Enums"]["currency_code"];
          description: string;
          id: string;
          income_date: string;
          link: string | null;
          note: string | null;
          source: string;
          status: Database["public"]["Enums"]["income_status"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          category: Database["public"]["Enums"]["income_category"];
          created_at?: string;
          created_by?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          description: string;
          id?: string;
          income_date: string;
          link?: string | null;
          note?: string | null;
          source: string;
          status?: Database["public"]["Enums"]["income_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category?: Database["public"]["Enums"]["income_category"];
          created_at?: string;
          created_by?: string | null;
          currency?: Database["public"]["Enums"]["currency_code"];
          description?: string;
          id?: string;
          income_date?: string;
          link?: string | null;
          note?: string | null;
          source?: string;
          status?: Database["public"]["Enums"]["income_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      influencer_social_media_links: AdvisorProfileLinkTable;
      marquee_items: {
        Row: {
          created_at: string;
          detail_content: string | null;
          id: string;
          image_alt: string | null;
          image_url: string | null;
          is_active: boolean;
          link_enabled: boolean;
          metric_value: string | null;
          news_post_id: number | null;
          published_at: string;
          slug: string | null;
          sort_order: number;
          summary: string;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          detail_content?: string | null;
          id?: string;
          image_alt?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          link_enabled?: boolean;
          metric_value?: string | null;
          news_post_id?: number | null;
          published_at?: string;
          slug?: string | null;
          sort_order?: number;
          summary: string;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          detail_content?: string | null;
          id?: string;
          image_alt?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          link_enabled?: boolean;
          metric_value?: string | null;
          news_post_id?: number | null;
          published_at?: string;
          slug?: string | null;
          sort_order?: number;
          summary?: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      news_posts: {
        Row: {
          category: string | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          id: number;
          image_url: string | null;
          language: string | null;
          original_url: string | null;
          published_at: string | null;
          source_name: string | null;
          source_url: string | null;
          status: string | null;
          summary: string | null;
          title: string;
          unique_hash: string;
        };
        Insert: {
          category?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          id?: never;
          image_url?: string | null;
          language?: string | null;
          original_url?: string | null;
          published_at?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          status?: string | null;
          summary?: string | null;
          title: string;
          unique_hash: string;
        };
        Update: {
          category?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          id?: never;
          image_url?: string | null;
          language?: string | null;
          original_url?: string | null;
          published_at?: string | null;
          source_name?: string | null;
          source_url?: string | null;
          status?: string | null;
          summary?: string | null;
          title?: string;
          unique_hash?: string;
        };
        Relationships: [];
      };
      referral_sources: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      social_media_links: {
        Row: {
          added_by: "UBT" | "Burak" | "Diğer";
          created_at: string;
          description: string | null;
          id: string;
          link: string | null;
          platform:
            | "Instagram"
            | "LinkedIn"
            | "Twitter (X)"
            | "YouTube"
            | "TikTok"
            | "Facebook"
            | "Reddit"
            | "Discord"
            | "Diğer";
        };
        Insert: {
          added_by?: "UBT" | "Burak" | "Diğer";
          created_at?: string;
          description?: string | null;
          id?: string;
          link?: string | null;
          platform?:
            | "Instagram"
            | "LinkedIn"
            | "Twitter (X)"
            | "YouTube"
            | "TikTok"
            | "Facebook"
            | "Reddit"
            | "Discord"
            | "Diğer";
        };
        Update: {
          added_by?: "UBT" | "Burak" | "Diğer";
          created_at?: string;
          description?: string | null;
          id?: string;
          link?: string | null;
          platform?:
            | "Instagram"
            | "LinkedIn"
            | "Twitter (X)"
            | "YouTube"
            | "TikTok"
            | "Facebook"
            | "Reddit"
            | "Discord"
            | "Diğer";
        };
        Relationships: [];
      };
      referral_groups: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      referral_types: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      referral_codes: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          group_code: string;
          group_id: string;
          id: string;
          is_active: boolean;
          is_used: boolean;
          month_num: number;
          note: string | null;
          random_part: string;
          source_code: string;
          source_id: string;
          type_code: string;
          type_id: string;
          used_at: string | null;
          usage_count: number;
          valid_from: string;
          valid_until: string;
          year_short: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          group_code: string;
          group_id: string;
          id?: string;
          is_active?: boolean;
          is_used?: boolean;
          month_num: number;
          note?: string | null;
          random_part: string;
          source_code: string;
          source_id: string;
          type_code: string;
          type_id: string;
          used_at?: string | null;
          usage_count?: number;
          valid_from: string;
          valid_until: string;
          year_short: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          group_code?: string;
          group_id?: string;
          id?: string;
          is_active?: boolean;
          is_used?: boolean;
          month_num?: number;
          note?: string | null;
          random_part?: string;
          source_code?: string;
          source_id?: string;
          type_code?: string;
          type_id?: string;
          used_at?: string | null;
          usage_count?: number;
          valid_from?: string;
          valid_until?: string;
          year_short?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referral_codes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "referral_codes_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "referral_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_codes_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "referral_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_codes_type_id_fkey";
            columns: ["type_id"];
            isOneToOne: false;
            referencedRelation: "referral_types";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_code_usages: {
        Row: {
          email: string | null;
          full_name: string | null;
          id: string;
          referral_code_id: string;
          submission_id: string;
          used_at: string;
        };
        Insert: {
          email?: string | null;
          full_name?: string | null;
          id?: string;
          referral_code_id: string;
          submission_id: string;
          used_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          id?: string;
          referral_code_id?: string;
          submission_id?: string;
          used_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referral_code_usages_referral_code_id_fkey";
            columns: ["referral_code_id"];
            isOneToOne: false;
            referencedRelation: "referral_codes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referral_code_usages_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      submissions: {
        Row: {
          business: string | null;
          category: string | null;
          city: string;
          company_name: string | null;
          contact_email_reached: boolean;
          contact_instagram_reached: boolean;
          contact_phone_reached: boolean;
          contact_whatsapp_reached: boolean;
          consent: boolean;
          contest_interest: boolean | null;
          country: string;
          created_at: string;
          description: string | null;
          document_name: string | null;
          document_url: string | null;
          documents: Json;
          donation_amount: number | null;
          donation_currency: string | null;
          email: string;
          facebook: string | null;
          field: string;
          form_type: string;
          fullname: string;
          id: string;
          instagram: string | null;
          linkedin: string | null;
          notes: string | null;
          offers_needs: string | null;
          phone: string;
          referral_code: string | null;
          referral_code_id: string | null;
          referral_detail: string | null;
          referral_source: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          source_external_id: string | null;
          source_type: "form" | "chatbot" | "wa";
          status: string;
          tiktok: string | null;
          twitter: string | null;
          whatsapp_interest: boolean | null;
          website: string | null;
        };
        Insert: {
          business?: string | null;
          category?: string | null;
          city: string;
          company_name?: string | null;
          contact_email_reached?: boolean;
          contact_instagram_reached?: boolean;
          contact_phone_reached?: boolean;
          contact_whatsapp_reached?: boolean;
          consent?: boolean;
          contest_interest?: boolean | null;
          country: string;
          created_at?: string;
          description?: string | null;
          document_name?: string | null;
          document_url?: string | null;
          documents?: Json;
          donation_amount?: number | null;
          donation_currency?: string | null;
          email: string;
          facebook?: string | null;
          field: string;
          form_type?: string;
          fullname: string;
          id?: string;
          instagram?: string | null;
          linkedin?: string | null;
          notes?: string | null;
          offers_needs?: string | null;
          phone: string;
          referral_code?: string | null;
          referral_code_id?: string | null;
          referral_detail?: string | null;
          referral_source?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_external_id?: string | null;
          source_type?: "form" | "chatbot" | "wa";
          status?: string;
          tiktok?: string | null;
          twitter?: string | null;
          whatsapp_interest?: boolean | null;
          website?: string | null;
        };
        Update: {
          business?: string | null;
          category?: string | null;
          city?: string;
          company_name?: string | null;
          contact_email_reached?: boolean;
          contact_instagram_reached?: boolean;
          contact_phone_reached?: boolean;
          contact_whatsapp_reached?: boolean;
          consent?: boolean;
          contest_interest?: boolean | null;
          country?: string;
          created_at?: string;
          description?: string | null;
          document_name?: string | null;
          document_url?: string | null;
          documents?: Json;
          donation_amount?: number | null;
          donation_currency?: string | null;
          email?: string;
          facebook?: string | null;
          field?: string;
          form_type?: string;
          fullname?: string;
          id?: string;
          instagram?: string | null;
          linkedin?: string | null;
          notes?: string | null;
          offers_needs?: string | null;
          phone?: string;
          referral_code?: string | null;
          referral_code_id?: string | null;
          referral_detail?: string | null;
          referral_source?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_external_id?: string | null;
          source_type?: "form" | "chatbot" | "wa";
          status?: string;
          tiktok?: string | null;
          twitter?: string | null;
          whatsapp_interest?: boolean | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "submissions_referral_code_id_fkey";
            columns: ["referral_code_id"];
            isOneToOne: false;
            referencedRelation: "referral_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      wa_users: {
        Row: {
          category: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          current_step: string | null;
          discovery_source: string | null;
          email: string | null;
          funnel_interest: string | null;
          id: string;
          name: string | null;
          note: string | null;
          occupation_interest: string | null;
          organization: string | null;
          phone: string | null;
          privacy_consent: boolean | null;
          referral_code: string | null;
          registration_completed_at: string | null;
          registration_status: string | null;
          source_type: "wa";
          surname: string | null;
          updated_at: string | null;
          wa_id: string | null;
          whatsapp_group_interest: boolean | null;
        };
        Insert: {
          category?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          current_step?: string | null;
          discovery_source?: string | null;
          email?: string | null;
          funnel_interest?: string | null;
          id?: string;
          name?: string | null;
          note?: string | null;
          occupation_interest?: string | null;
          organization?: string | null;
          phone?: string | null;
          privacy_consent?: boolean | null;
          referral_code?: string | null;
          registration_completed_at?: string | null;
          registration_status?: string | null;
          source_type?: "wa";
          surname?: string | null;
          updated_at?: string | null;
          wa_id?: string | null;
          whatsapp_group_interest?: boolean | null;
        };
        Update: {
          category?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          current_step?: string | null;
          discovery_source?: string | null;
          email?: string | null;
          funnel_interest?: string | null;
          id?: string;
          name?: string | null;
          note?: string | null;
          occupation_interest?: string | null;
          organization?: string | null;
          phone?: string | null;
          privacy_consent?: boolean | null;
          referral_code?: string | null;
          registration_completed_at?: string | null;
          registration_status?: string | null;
          source_type?: "wa";
          surname?: string | null;
          updated_at?: string | null;
          wa_id?: string | null;
          whatsapp_group_interest?: boolean | null;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          created_at: string;
          id: string;
          match_reason: string | null;
          match_score: number | null;
          match_type: string;
          matched_submission_id: string;
          notified_source: boolean;
          notified_target: boolean;
          source_submission_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          match_reason?: string | null;
          match_score?: number | null;
          match_type?: string;
          matched_submission_id: string;
          notified_source?: boolean;
          notified_target?: boolean;
          source_submission_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          match_reason?: string | null;
          match_score?: number | null;
          match_type?: string;
          matched_submission_id?: string;
          notified_source?: boolean;
          notified_target?: boolean;
          source_submission_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_matched_submission_id_fkey";
            columns: ["matched_submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_source_submission_id_fkey";
            columns: ["source_submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_muhasebe_by_category: {
        Row: {
          category: Database["public"]["Enums"]["expense_category"] | null;
          record_count: number | null;
          total_try: number | null;
        };
        Relationships: [];
      };
      v_muhasebe_by_person: {
        Row: {
          paid_try: number | null;
          pending_try: number | null;
          person: Database["public"]["Enums"]["person_type"] | null;
          record_count: number | null;
          total_try: number | null;
        };
        Relationships: [];
      };
      v_muhasebe_cashflow_monthly: {
        Row: {
          baris_try: number | null;
          burak_try: number | null;
          expense_paid_try: number | null;
          expense_pending_try: number | null;
          expense_try: number | null;
          income_collected_try: number | null;
          income_pending_try: number | null;
          income_try: number | null;
          month_num: number | null;
          net_try: number | null;
          ortak_try: number | null;
          year_num: number | null;
        };
        Relationships: [];
      };
      v_muhasebe_kpi: {
        Row: {
          net_position_try: number | null;
          pending_expense_try: number | null;
          pending_income_try: number | null;
          total_expense_try: number | null;
          total_income_try: number | null;
          total_records: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_review_approval_request: {
        Args: { decision: string; note?: string | null; request_id: string };
        Returns: undefined;
      };
      admin_set_attribute_rule: {
        Args: { attribute_key: string; role_key: string; rule_payload: Json };
        Returns: undefined;
      };
      admin_set_feature_global_state: {
        Args: { feature_key: string; is_active_globally: boolean };
        Returns: undefined;
      };
      admin_clear_user_feature_override: {
        Args: { feature_key: string; target_user_id: string };
        Returns: undefined;
      };
      admin_set_user_feature_override_detailed: {
        Args: { feature_key: string; is_enabled: boolean; reason?: string | null; target_user_id: string };
        Returns: undefined;
      };
      admin_set_user_feature_override: {
        Args: { feature_key: string; is_enabled: boolean; target_user_id: string };
        Returns: undefined;
      };
      admin_set_role_feature_flag: {
        Args: { feature_key: string; is_enabled: boolean; role_key: string };
        Returns: undefined;
      };
      admin_set_user_profile_type: {
        Args: { next_profile_type: string; target_user_id: string };
        Returns: undefined;
      };
      admin_set_user_role: {
        Args: { role_key: string; target_user_id: string };
        Returns: undefined;
      };
      get_current_user_features: {
        Args: Record<PropertyKey, never>;
        Returns: {
          feature_key: string;
          is_enabled: boolean;
          source: string;
        }[];
      };
      get_current_user_profile: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_public_directory_profile: {
        Args: { target_user_id: string };
        Returns: Json;
      };
      list_public_directory_profiles: {
        Args: {
          city_filter?: string | null;
          country_filter?: string | null;
          featured_only?: boolean;
          role_filter?: string | null;
          search_text?: string | null;
          verified_only?: boolean;
        };
        Returns: {
          city: string | null;
          country: string | null;
          display_name: string;
          is_featured: boolean;
          is_verified: boolean;
          linkedin_url: string | null;
          profile_image_url: string | null;
          role_key: string;
          role_label: string;
          role_slug: string;
          short_bio: string | null;
          special_attribute_key: string | null;
          special_attribute_label: string | null;
          special_attribute_value: string | null;
          user_id: string;
          website_url: string | null;
          whatsapp: string | null;
        }[];
      };
      submit_feature_request: {
        Args: { feature_key: string; payload?: Json };
        Returns: string;
      };
      submit_role_change_request: {
        Args: { note?: string | null; target_role_key: string };
        Returns: string;
      };
      update_profile_attribute: {
        Args: { attribute_key: string; attribute_value: Json; visibility?: string | null };
        Returns: Json;
      };
      get_submission_documents_bucket_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          bucket_id: string;
          file_count: number;
          file_size_limit: number;
          total_bytes: number;
          usage_ratio: number;
        }[];
      };
      validate_and_bind_referral_code: {
        Args: { input_code: string; reference_time?: string };
        Returns: {
          group_code: string | null;
          message: string | null;
          normalized_code: string | null;
          referral_code_id: string | null;
          source_code: string | null;
          status: string | null;
          type_code: string | null;
          valid_from: string | null;
          valid_until: string | null;
        }[];
      };
    };
    Enums: {
      currency_code: "TRY" | "USD" | "EUR" | "GBP" | "QAR";
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
        | "diger_gider";
      expense_status: "odendi" | "bekliyor" | "iptal";
      income_category:
        | "pilot_gelir"
        | "danismanlik_geliri"
        | "hibe_grant"
        | "yatirim_taahhudu"
        | "demo_geliri"
        | "diger_gelir";
      income_status: "tahsil_edildi" | "bekliyor" | "iptal";
      payment_method:
        | "sanal_kart_burak"
        | "sanal_kart_baris"
        | "kisisel_kart_burak"
        | "kisisel_kart_baris"
        | "havale_eft"
        | "nakit"
        | "diger";
      person_type: "burak" | "baris" | "ortak";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer Insert;
    }
    ? Insert
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer Insert;
      }
      ? Insert
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer Update;
    }
    ? Update
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer Update;
      }
      ? Update
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
