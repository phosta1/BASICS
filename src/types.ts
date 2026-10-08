// ── Core contact (base fields always present) ─────────────────────────────────
export interface Contact {
  id: number;
  // Personal Information
  first_name: string;         // Given Name
  last_name: string;          // Family Name
  other_names?: string;       // Other Name(s)
  gender?: "male" | "female" | "other";
  date_of_birth?: string;
  place_of_birth?: string;
  email: string;
  phone?: string;
  address?: string;
  // Categorisation
  status: "active" | "dropped off" | "completed" | "not lead";
  is_staff: boolean;          // triggers Staff Data section
  profile_picture_url?: string;
  // Cross-reference
  related_contact_id?: number; // link to another contact
  created_at: string;
}

// Staff-specific fields stored in a separate table
export interface StaffProfile {
  id: number;
  contact_id: number;
  ssnit_number?: string;
  national_id_number?: string;
  national_id_photo_url?: string;
  stanbic_account_number?: string;
  certification_url?: string;
  marital_status?: "single" | "married" | "divorced" | "widowed";
  employment_status?: "contract" | "permanent" | "ambassador";
  start_date?: string;
  end_date?: string;
  emergency_contact?: string;
  // Screening
  arrested_before?: boolean;
  dismissed_for_stealing?: boolean;
  accused_of_abuse?: boolean;
  created_at: string;
}

// ── Admin-defined extra fields for the contact form ───────────────────────────
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "file";

export interface ContactField {
  id: number;
  label: string;
  field_key: string;       // snake_case, used as storage key
  field_type: FieldType;
  options?: string[];      // for select fields
  required: boolean;
  sort_order: number;
  created_at: string;
}

export interface ContactFieldValue {
  id: number;
  contact_id: number;
  field_id: number;
  value: string;           // all stored as text; files stored as Supabase Storage path
  created_at: string;
}

// ── Programs ──────────────────────────────────────────────────────────────────
export interface Program {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface ProgramField {
  id: number;
  program_id: number;
  label: string;
  field_key: string;
  field_type: FieldType;
  options?: string[];
  required: boolean;
  sort_order: number;
  created_at: string;
}

// ── Enrollments ───────────────────────────────────────────────────────────────
export interface Enrollment {
  id: number;
  contact_id: number;
  program_id: number;
  enrolled_at: string;
  // joined fields (not in DB, populated by query)
  program?: Program;
  contact?: Contact;
}

export interface EnrollmentValue {
  id: number;
  enrollment_id: number;
  field_id: number;
  value: string;
  created_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;           // matches auth.users.id
  email: string;
  role: "admin" | "editor" | "viewer";
  created_at: string;
}

// ── Notes ─────────────────────────────────────────────────────────────────────
export interface Note {
  id: number;
  contact_id: number;
  content: string;
  created_at: string;
}

// ── Deal (legacy, kept for compatibility) ─────────────────────────────────────
export interface Deal {
  id: number;
  contact_id: number;
  title: string;
  value: number;
  stage: "prospecting" | "proposal" | "negotiation" | "won" | "lost";
  close_date?: string;
  created_at: string;
}

// ── Sponsors ──────────────────────────────────────────────────────────────────
export interface Sponsor {
  id: number;
  [key: string]: any;  // Dynamic fields based on sponsor_fields schema
  created_at: string;
  updated_at: string;
}

export interface SponsorField {
  id: number;
  label: string;
  field_key: string;       // snake_case, used as storage key
  field_type: FieldType;
  options?: string[];      // for select fields
  required: boolean;
  sort_order: number;
  created_at: string;
}
