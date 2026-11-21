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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      academic_profiles: {
        Row: {
          attendance_pct: number | null
          attendance_updated_at: string | null
          college: string | null
          course: string | null
          degree: string | null
          department: string | null
          duration_years: number | null
          roll_no: string | null
          start_year: number | null
          total_semesters: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_pct?: number | null
          attendance_updated_at?: string | null
          college?: string | null
          course?: string | null
          degree?: string | null
          department?: string | null
          duration_years?: number | null
          roll_no?: string | null
          start_year?: number | null
          total_semesters?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_pct?: number | null
          attendance_updated_at?: string | null
          college?: string | null
          course?: string | null
          degree?: string | null
          department?: string | null
          duration_years?: number | null
          roll_no?: string | null
          start_year?: number | null
          total_semesters?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          achieved_on: string | null
          category: string | null
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string | null
          id: string
          title: string
          user_id: string
          verified: boolean
        }
        Insert: {
          achieved_on?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          title: string
          user_id: string
          verified?: boolean
        }
        Update: {
          achieved_on?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          title?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      activity_responses: {
        Row: {
          activity_id: string
          assignment: string
          created_at: string
          hours: number | null
          response: string
          user_id: string
        }
        Insert: {
          activity_id: string
          assignment?: string
          created_at?: string
          hours?: number | null
          response: string
          user_id: string
        }
        Update: {
          activity_id?: string
          assignment?: string
          created_at?: string
          hours?: number | null
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_responses_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "volunteer_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      alumni_applications: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string
          current_status: string | null
          designation: string | null
          graduation_year: number | null
          id: string
          linkedin: string | null
          organisation: string | null
          remarks: string | null
          status: string
          user_id: string
          willing_to_mentor: boolean
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string
          current_status?: string | null
          designation?: string | null
          graduation_year?: number | null
          id?: string
          linkedin?: string | null
          organisation?: string | null
          remarks?: string | null
          status?: string
          user_id: string
          willing_to_mentor?: boolean
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string
          current_status?: string | null
          designation?: string | null
          graduation_year?: number | null
          id?: string
          linkedin?: string | null
          organisation?: string | null
          remarks?: string | null
          status?: string
          user_id?: string
          willing_to_mentor?: boolean
        }
        Relationships: []
      }
      alumni_referrals: {
        Row: {
          company: string
          created_at: string
          description: string | null
          id: string
          kind: string
          link: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          link?: string | null
          role: string
          status?: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          link?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          doc_type: string
          file_name: string | null
          file_path: string | null
          id: string
          remarks: string | null
          reviewed_at: string | null
          status: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          doc_type: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          remarks?: string | null
          reviewed_at?: string | null
          status?: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          doc_type?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          remarks?: string | null
          reviewed_at?: string | null
          status?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          address: string | null
          assigned_to: string | null
          board: string | null
          completion_year: number | null
          created_at: string
          decided_at: string | null
          district: string | null
          dob: string | null
          email: string | null
          family_background: string | null
          family_income: number | null
          family_members: number | null
          father_name: string | null
          father_occupation: string | null
          final_decision: string | null
          full_name: string | null
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relation: string | null
          id: string
          interested_course: string | null
          locality: string | null
          marks_obtained: number | null
          mobile: string | null
          mother_name: string | null
          mother_occupation: string | null
          other_preferences: string | null
          percentage: number | null
          pincode: string | null
          preferred_area: string | null
          preferred_stream: string | null
          ref_no: string | null
          school_name: string | null
          stage: string
          stream: string | null
          subjects: string | null
          submitted_at: string | null
          total_marks: number | null
          updated_at: string
          user_id: string
          willing_chennai: boolean | null
          willing_outside_chennai: boolean | null
          willing_relocate: boolean | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          board?: string | null
          completion_year?: number | null
          created_at?: string
          decided_at?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          family_background?: string | null
          family_income?: number | null
          family_members?: number | null
          father_name?: string | null
          father_occupation?: string | null
          final_decision?: string | null
          full_name?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          interested_course?: string | null
          locality?: string | null
          marks_obtained?: number | null
          mobile?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          other_preferences?: string | null
          percentage?: number | null
          pincode?: string | null
          preferred_area?: string | null
          preferred_stream?: string | null
          ref_no?: string | null
          school_name?: string | null
          stage?: string
          stream?: string | null
          subjects?: string | null
          submitted_at?: string | null
          total_marks?: number | null
          updated_at?: string
          user_id: string
          willing_chennai?: boolean | null
          willing_outside_chennai?: boolean | null
          willing_relocate?: boolean | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          board?: string | null
          completion_year?: number | null
          created_at?: string
          decided_at?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          family_background?: string | null
          family_income?: number | null
          family_members?: number | null
          father_name?: string | null
          father_occupation?: string | null
          final_decision?: string | null
          full_name?: string | null
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          interested_course?: string | null
          locality?: string | null
          marks_obtained?: number | null
          mobile?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          other_preferences?: string | null
          percentage?: number | null
          pincode?: string | null
          preferred_area?: string | null
          preferred_stream?: string | null
          ref_no?: string | null
          school_name?: string | null
          stage?: string
          stream?: string | null
          subjects?: string | null
          submitted_at?: string | null
          total_marks?: number | null
          updated_at?: string
          user_id?: string
          willing_chennai?: boolean | null
          willing_outside_chennai?: boolean | null
          willing_relocate?: boolean | null
        }
        Relationships: []
      }
      assessments: {
        Row: {
          created_at: string
          feedback: string | null
          held_on: string | null
          id: string
          kind: string
          max_score: number | null
          score: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          held_on?: string | null
          id?: string
          kind?: string
          max_score?: number | null
          score?: number | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          held_on?: string | null
          id?: string
          kind?: string
          max_score?: number | null
          score?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      career_profiles: {
        Row: {
          career_interests: string | null
          github: string | null
          headline: string | null
          linkedin: string | null
          portfolio: string | null
          preferred_locations: string | null
          preferred_roles: string | null
          resume_name: string | null
          resume_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          career_interests?: string | null
          github?: string | null
          headline?: string | null
          linkedin?: string | null
          portfolio?: string | null
          preferred_locations?: string | null
          preferred_roles?: string | null
          resume_name?: string | null
          resume_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          career_interests?: string | null
          github?: string | null
          headline?: string | null
          linkedin?: string | null
          portfolio?: string | null
          preferred_locations?: string | null
          preferred_roles?: string | null
          resume_name?: string | null
          resume_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          contact_email: string | null
          contact_person: string | null
          created_at: string
          id: string
          industry: string | null
          name: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      document_history: {
        Row: {
          action: string
          created_at: string
          document_id: string
          file_name: string | null
          id: string
          remarks: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          document_id: string
          file_name?: string | null
          id?: string
          remarks?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          document_id?: string
          file_name?: string | null
          id?: string
          remarks?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "application_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attended: boolean
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          attended?: boolean
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          attended?: boolean
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "sangamam_events"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_notes: {
        Row: {
          application_id: string
          author: string | null
          created_at: string
          id: string
          note: string
          stage: string | null
        }
        Insert: {
          application_id: string
          author?: string | null
          created_at?: string
          id?: string
          note: string
          stage?: string | null
        }
        Update: {
          application_id?: string
          author?: string | null
          created_at?: string
          id?: string
          note?: string
          stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          id: string
          kind: string
          mode_detail: string | null
          outcome: string | null
          panel: string | null
          scheduled_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          kind: string
          mode_detail?: string | null
          outcome?: string | null
          panel?: string | null
          scheduled_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          kind?: string
          mode_detail?: string | null
          outcome?: string | null
          panel?: string | null
          scheduled_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_updates: {
        Row: {
          certificate_name: string | null
          certificate_path: string | null
          course_name: string
          created_at: string
          hours: number | null
          id: string
          month: string
          notes: string | null
          platform: string
          status: string
          user_id: string
        }
        Insert: {
          certificate_name?: string | null
          certificate_path?: string | null
          course_name: string
          created_at?: string
          hours?: number | null
          id?: string
          month: string
          notes?: string | null
          platform: string
          status?: string
          user_id: string
        }
        Update: {
          certificate_name?: string | null
          certificate_path?: string | null
          course_name?: string
          created_at?: string
          hours?: number | null
          id?: string
          month?: string
          notes?: string | null
          platform?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      meeting_attendance: {
        Row: {
          meeting_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          meeting_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          meeting_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_rsvps: {
        Row: {
          meeting_id: string
          response: string
          updated_at: string
          user_id: string
        }
        Insert: {
          meeting_id: string
          response: string
          updated_at?: string
          user_id: string
        }
        Update: {
          meeting_id?: string
          response?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_rsvps_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          description: string | null
          group_id: string | null
          id: string
          kind: string
          location: string | null
          mode: string
          organiser_id: string | null
          starts_at: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          kind?: string
          location?: string | null
          mode?: string
          organiser_id?: string | null
          starts_at: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_id?: string | null
          id?: string
          kind?: string
          location?: string | null
          mode?: string
          organiser_id?: string | null
          starts_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organiser_id_fkey"
            columns: ["organiser_id"]
            isOneToOne: false
            referencedRelation: "support_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_observations: {
        Row: {
          category: string | null
          created_at: string
          follow_up: string | null
          id: string
          observation: string
          staff_id: string | null
          student_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          follow_up?: string | null
          id?: string
          observation: string
          staff_id?: string | null
          student_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          follow_up?: string | null
          id?: string
          observation?: string
          staff_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_observations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "support_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender: string
          staff_id: string
          student_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender: string
          staff_id: string
          student_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender?: string
          staff_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "support_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          company_id: string | null
          created_at: string
          deadline: string | null
          description: string | null
          eligible_departments: string | null
          id: string
          kind: string
          location: string | null
          min_cgpa: number | null
          package: string | null
          status: string
          title: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligible_departments?: string | null
          id?: string
          kind?: string
          location?: string | null
          min_cgpa?: number | null
          package?: string | null
          status?: string
          title: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligible_departments?: string | null
          id?: string
          kind?: string
          location?: string | null
          min_cgpa?: number | null
          package?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_applications: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          remarks: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          remarks?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          remarks?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      programme_registrations: {
        Row: {
          attendance: string
          created_at: string
          programme_id: string
          user_id: string
        }
        Insert: {
          attendance?: string
          created_at?: string
          programme_id: string
          user_id: string
        }
        Update: {
          attendance?: string
          created_at?: string
          programme_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_registrations_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "training_programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      pv_assignments: {
        Row: {
          application_id: string
          created_at: string
          findings: string | null
          id: string
          office_decision: string | null
          outcome: string | null
          recommendations: string | null
          status: string
          user_id: string
          visit_date: string | null
          volunteer_id: string | null
          volunteer_name: string | null
          volunteer_phone: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          findings?: string | null
          id?: string
          office_decision?: string | null
          outcome?: string | null
          recommendations?: string | null
          status?: string
          user_id: string
          visit_date?: string | null
          volunteer_id?: string | null
          volunteer_name?: string | null
          volunteer_phone?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          findings?: string | null
          id?: string
          office_decision?: string | null
          outcome?: string | null
          recommendations?: string | null
          status?: string
          user_id?: string
          visit_date?: string | null
          volunteer_id?: string | null
          volunteer_name?: string | null
          volunteer_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pv_assignments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pv_assignments_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      queries: {
        Row: {
          created_at: string
          description: string
          id: string
          responded_at: string | null
          response: string | null
          staff_id: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          responded_at?: string | null
          response?: string | null
          staff_id?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          responded_at?: string | null
          response?: string | null
          staff_id?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "support_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      sangamam_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          status: string
          title: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          status?: string
          title: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          status?: string
          title?: string
          venue?: string | null
        }
        Relationships: []
      }
      semesters: {
        Row: {
          academic_year: string | null
          arrears: number | null
          cgpa: number | null
          completed: boolean
          created_at: string
          exam_status: string
          id: string
          remarks: string | null
          result_file_name: string | null
          result_file_path: string | null
          semester_no: number
          sgpa: number | null
          user_id: string
          verification_status: string
        }
        Insert: {
          academic_year?: string | null
          arrears?: number | null
          cgpa?: number | null
          completed?: boolean
          created_at?: string
          exam_status?: string
          id?: string
          remarks?: string | null
          result_file_name?: string | null
          result_file_path?: string | null
          semester_no: number
          sgpa?: number | null
          user_id: string
          verification_status?: string
        }
        Update: {
          academic_year?: string | null
          arrears?: number | null
          cgpa?: number | null
          completed?: boolean
          created_at?: string
          exam_status?: string
          id?: string
          remarks?: string | null
          result_file_name?: string | null
          result_file_path?: string | null
          semester_no?: number
          sgpa?: number | null
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          evidence_url: string | null
          id: string
          level: string | null
          name: string
          remarks: string | null
          status: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          level?: string | null
          name: string
          remarks?: string | null
          status?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          level?: string | null
          name?: string
          remarks?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      student_groups: {
        Row: {
          anchor1_id: string | null
          anchor2_id: string | null
          batch: string
          college: string
          created_at: string
          id: string
          mentor_id: string | null
          zc_id: string | null
        }
        Insert: {
          anchor1_id?: string | null
          anchor2_id?: string | null
          batch: string
          college: string
          created_at?: string
          id?: string
          mentor_id?: string | null
          zc_id?: string | null
        }
        Update: {
          anchor1_id?: string | null
          anchor2_id?: string | null
          batch?: string
          college?: string
          created_at?: string
          id?: string
          mentor_id?: string | null
          zc_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_groups_anchor1_id_fkey"
            columns: ["anchor1_id"]
            isOneToOne: false
            referencedRelation: "support_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_groups_anchor2_id_fkey"
            columns: ["anchor2_id"]
            isOneToOne: false
            referencedRelation: "support_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_groups_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "support_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_groups_zc_id_fkey"
            columns: ["zc_id"]
            isOneToOne: false
            referencedRelation: "support_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      support_staff: {
        Row: {
          created_at: string
          designation: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          role: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          designation?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          role: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          designation?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: string
          zone?: string | null
        }
        Relationships: []
      }
      tele_verifications: {
        Row: {
          application_id: string
          clarification: string | null
          conducted_at: string
          conducted_by: string
          contacted: boolean
          created_at: string
          id: string
          outcome: string
          remarks: string | null
        }
        Insert: {
          application_id: string
          clarification?: string | null
          conducted_at?: string
          conducted_by: string
          contacted?: boolean
          created_at?: string
          id?: string
          outcome: string
          remarks?: string | null
        }
        Update: {
          application_id?: string
          clarification?: string | null
          conducted_at?: string
          conducted_by?: string
          contacted?: boolean
          created_at?: string
          id?: string
          outcome?: string
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tele_verifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programmes: {
        Row: {
          audience: string | null
          category: string | null
          created_at: string
          description: string | null
          ends_on: string | null
          id: string
          mode: string | null
          schedule: string | null
          starts_on: string | null
          status: string
          title: string
        }
        Insert: {
          audience?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          mode?: string | null
          schedule?: string | null
          starts_on?: string | null
          status?: string
          title: string
        }
        Update: {
          audience?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          mode?: string | null
          schedule?: string | null
          starts_on?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_activities: {
        Row: {
          activity_date: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          location: string | null
          slots: number | null
          status: string
          title: string
        }
        Insert: {
          activity_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          location?: string | null
          slots?: number | null
          status?: string
          title: string
        }
        Update: {
          activity_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          location?: string | null
          slots?: number | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          areas: string | null
          available: boolean
          completed_visits: number
          created_at: string
          district: string | null
          email: string | null
          id: string
          locality: string | null
          name: string
          phone: string | null
          pincode: string | null
        }
        Insert: {
          areas?: string | null
          available?: boolean
          completed_visits?: number
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          locality?: string | null
          name: string
          phone?: string | null
          pincode?: string | null
        }
        Update: {
          areas?: string | null
          available?: boolean
          completed_visits?: number
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          locality?: string | null
          name?: string
          phone?: string | null
          pincode?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      notify: {
        Args: { _body: string; _link: string; _title: string; _user: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student"],
    },
  },
} as const
