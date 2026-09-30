// ── Core contact (base fields always present) ─────────────────────────────────
export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "lead" | "active" | "inactive";
  profile_picture_url?: string;
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
