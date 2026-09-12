// Auto-generated types matching our Supabase schema
// Re-run: npx supabase gen types typescript --local > src/lib/supabase/types.ts
import type { AgeGroup, ChapterType } from '@/core/chapters'

// Chapter ids live in the single registry (src/lib/chapters.ts); re-exported
// here so existing `@/data/supabase/types` imports keep working.
export type { ChapterType } from '@/core/chapters'
export type UserRole    = 'parent' | 'learner' | 'teacher'
export type InviteStatus = 'pending' | 'accepted' | 'expired'
/** Who may act on a learner. ⚠️ `self` is the CHILD's own account — the one role that is not an
 *  adult. Every RLS policy protecting a child reads `learner_access.parent_id = auth.uid()`
 *  regardless of role, which is exactly why a child needs a row here and nothing else. */
export type AccessRole = 'owner' | 'viewer' | 'self'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:           string
          role:         UserRole | null   // null = signed up but hasn't picked Teacher/Parent yet
          display_name: string
          avatar_index: number
          created_at:   string
          updated_at:   string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      learners: {
        Row: {
          id:            string
          display_name:  string
          avatar_index:  number
          age_group:     AgeGroup
          grade_id:      string | null
          /** ⚠️ What the CHILD may play, chosen by the PARENT. `null` = fall through to the age
           *  band's standard set. Deliberately not `grade_chapters`, which is the teacher's own
           *  syllabus and must never decide what a child sees. */
          chapter_ids:   string[] | null
          created_by:    string
          created_at:    string
          updated_at:    string
        }
        Insert: Omit<Database['public']['Tables']['learners']['Row'], 'id' | 'grade_id' | 'chapter_ids' | 'created_at' | 'updated_at'>
          & { grade_id?: string | null; chapter_ids?: string[] | null }
        Update: Partial<Database['public']['Tables']['learners']['Insert']>
      }
      grades: {
        Row: {
          id:         string
          created_by: string
          name:       string
          age_group:  AgeGroup
          /** The code a child types to find their own roster row at first sign-in. A weak secret
           *  and rotatable — see `claim_learner` in 20260912100000_classroom.sql. */
          join_code:  string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['grades']['Row'], 'id' | 'join_code' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['grades']['Insert']>
      }
      grade_chapters: {
        Row: {
          grade_id:   string
          chapter_id: ChapterType
          sort_order: number
        }
        Insert: Database['public']['Tables']['grade_chapters']['Row']
        Update: Partial<Database['public']['Tables']['grade_chapters']['Insert']>
      }
      chapters: {
        Row: {
          id:         string
          name:       string
          emoji:      string
          sort_order: number
          age_groups: AgeGroup[]
        }
        Insert: Database['public']['Tables']['chapters']['Row']
        Update: Partial<Database['public']['Tables']['chapters']['Insert']>
      }
      learner_access: {
        Row: {
          id:          string
          learner_id:  string
          parent_id:   string
          access_role: AccessRole
          granted_at:  string
        }
        Insert: Omit<Database['public']['Tables']['learner_access']['Row'], 'id' | 'granted_at'>
        Update: Partial<Database['public']['Tables']['learner_access']['Insert']>
      }
      learner_invites: {
        Row: {
          id:             string
          learner_id:     string
          invited_by:     string
          invited_email:  string
          status:         InviteStatus
          expires_at:     string
          created_at:     string
        }
        Insert: Omit<Database['public']['Tables']['learner_invites']['Row'], 'id' | 'created_at'>
        // Only `status` is UPDATE-grantable to `authenticated` (migration
        // 20260718103024_harden_invite_accept_columns) — any other column would 403 at
        // runtime, so keep the type narrow enough that tsc catches it first.
        Update: { status: InviteStatus }
      }
      sessions: {
        Row: {
          id:            string
          learner_id:    string
          chapter:       ChapterType
          phase:         'lesson' | 'practice'
          /** ⚠️ NULLABLE since 2026-09-05, and NULL means "unknown", not "now".
           *  It is NOT the session's activity time — use `completed_at`. See docs/data-inventory.md. */
          started_at:    string | null
          completed_at:  string | null
          correct_count: number
          wrong_count:   number
          stars_earned:  number
          xp_earned:     number
          coins_earned:  number
          client_id:     string | null
        }
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'started_at'>
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>
      }
      learner_progress: {
        Row: {
          id:              string
          learner_id:      string
          chapter:         ChapterType
          best_stars:      number
          total_xp:        number
          total_sessions:  number
          last_played_at:  string | null
          /** ⚠️ The adaptive DIFFICULTY tier (1–3) this learner left this chapter on — NOT the XP
           *  level. `learner_stats.current_level` is the XP level, and the two share a name. */
          current_level:   number
          updated_at:      string
        }
        Insert: Omit<Database['public']['Tables']['learner_progress']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['learner_progress']['Insert']>
      }
      learner_stats: {
        Row: {
          learner_id:      string
          total_xp:        number
          total_coins:     number
          current_level:   number
          last_played_at:  string | null
          updated_at:      string
        }
        Insert: Omit<Database['public']['Tables']['learner_stats']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['learner_stats']['Insert']>
      }
      exercises: {
        Row: {
          id:             string
          grade_id:       string
          created_by:     string
          /** A chapter id — the topic is which existing generator to run. */
          topic:          ChapterType
          question_count: number
          /** That chapter's own 1-3 adaptive tier. */
          difficulty:     1 | 2 | 3
          /** `null` = locked. Only the teacher's unlock button sets it. */
          unlocked_at:    string | null
          created_at:     string
        }
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id' | 'unlocked_at' | 'created_at'>
          & { unlocked_at?: string | null }
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>
      }
      exercise_results: {
        Row: {
          id:            string
          exercise_id:   string
          learner_id:    string
          correct_count: number
          wrong_count:   number
          completed_at:  string
        }
        Insert: Omit<Database['public']['Tables']['exercise_results']['Row'], 'id' | 'completed_at'>
        Update: Partial<Database['public']['Tables']['exercise_results']['Insert']>
      }
      learner_state: {
        Row: {
          learner_id:     string
          coins_spent:    number
          owned_items:    string[]
          equipped_items: Record<string, string>
          updated_at:     string
        }
        Insert: Omit<Database['public']['Tables']['learner_state']['Row'], 'updated_at'>
        Update: Partial<Database['public']['Tables']['learner_state']['Insert']>
      }
    }
  }
}

// Convenience row types
export type Profile        = Database['public']['Tables']['profiles']['Row']
export type Learner        = Database['public']['Tables']['learners']['Row']
export type Grade          = Database['public']['Tables']['grades']['Row']
export type Session        = Database['public']['Tables']['sessions']['Row']
export type LearnerProgress = Database['public']['Tables']['learner_progress']['Row']
export type LearnerStats   = Database['public']['Tables']['learner_stats']['Row']
export type LearnerState   = Database['public']['Tables']['learner_state']['Row']
export type Exercise       = Database['public']['Tables']['exercises']['Row']
export type ExerciseResult = Database['public']['Tables']['exercise_results']['Row']

// Invite with optional learner name (joined query result)
export interface InviteWithLearner {
  id:            string
  learner_id:    string
  invited_by:    string
  invited_email: string
  status:        'pending' | 'accepted' | 'expired'
  expires_at:    string
  created_at:    string
  learner_name?: string
}