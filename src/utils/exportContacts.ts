/**
 * exportContacts
 * Exports one or more contacts with ALL their data:
 *   - Base fields (name, email, phone, company, status)
 *   - Admin-defined contact extra fields
 *   - All program enrollments + each program's field answers
 *
 * Output format: flat CSV where each row is one enrollment.
 * A contact enrolled in 3 programs = 3 rows (contact fields repeated).
 * A contact with no enrollments = 1 row with empty program columns.
 *
 * Usage:
 *   await exportContacts([contactId1, contactId2])  // selected contacts
 *   await exportContacts()                           // all contacts
 */

import { supabaseClient } from "../supabaseClient";

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(row: Record<string, unknown>): string {
  return Object.values(row).map(escapeCsv).join(",");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main export function ──────────────────────────────────────────────────────

export async function exportContacts(contactIds?: number[]): Promise<void> {
  // 1. Fetch contacts
  let contactQuery = supabaseClient
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: true });

  if (contactIds && contactIds.length > 0) {
    contactQuery = contactQuery.in("id", contactIds);
  }

  const { data: contacts, error: cErr } = await contactQuery;
  if (cErr) throw new Error(`Failed to fetch contacts: ${cErr.message}`);
  if (!contacts || contacts.length === 0) throw new Error("No contacts to export.");

  const allContactIds = contacts.map((c) => c.id);

  // 2. Fetch contact extra field definitions
  const { data: contactFields } = await supabaseClient
    .from("contact_fields")
    .select("*")
    .order("sort_order", { ascending: true });

  const cFields = contactFields ?? [];

  // 3. Fetch all contact field values for these contacts
  const { data: contactFieldValues } = await supabaseClient
    .from("contact_field_values")
    .select("*")
    .in("contact_id", allContactIds);

  const cfvMap: Record<string, Record<number, string>> = {};
  for (const v of contactFieldValues ?? []) {
    if (!cfvMap[v.contact_id]) cfvMap[v.contact_id] = {};
    cfvMap[v.contact_id][v.field_id] = v.value;
  }

  // 4. Fetch enrollments for these contacts
  const { data: enrollments } = await supabaseClient
    .from("enrollments")
    .select("*")
    .in("contact_id", allContactIds)
    .order("enrolled_at", { ascending: true });

  const allEnrollments = enrollments ?? [];
  const enrollmentIds = allEnrollments.map((e) => e.id);

  // 5. Fetch all programs
  const { data: programs } = await supabaseClient
    .from("programs")
    .select("*");

  const programMap: Record<number, string> = {};
  for (const p of programs ?? []) {
    programMap[p.id] = p.name;
  }

  // 6. Fetch all program field definitions
  const programIds = [...new Set(allEnrollments.map((e) => e.program_id))];
  let programFields: any[] = [];
  if (programIds.length > 0) {
    const { data: pf } = await supabaseClient
      .from("program_fields")
      .select("*")
      .in("program_id", programIds)
      .order("sort_order", { ascending: true });
    programFields = pf ?? [];
  }

  // Group program fields by program_id
  const pfByProgram: Record<number, any[]> = {};
  for (const f of programFields) {
    if (!pfByProgram[f.program_id]) pfByProgram[f.program_id] = [];
    pfByProgram[f.program_id].push(f);
  }

  // 7. Fetch all enrollment values
  let enrollmentValues: any[] = [];
  if (enrollmentIds.length > 0) {
    const { data: ev } = await supabaseClient
      .from("enrollment_values")
      .select("*")
      .in("enrollment_id", enrollmentIds);
    enrollmentValues = ev ?? [];
  }

  // Map: enrollment_id → { field_id: value }
  const evMap: Record<number, Record<number, string>> = {};
  for (const v of enrollmentValues) {
    if (!evMap[v.enrollment_id]) evMap[v.enrollment_id] = {};
    evMap[v.enrollment_id][v.field_id] = v.value;
  }

  // 8. Build the unique set of all program columns across all programs
  // Each program gets its own column namespace: "ProgramName: FieldLabel"
  const programColumnDefs: { programId: number; fieldId: number; header: string }[] = [];
  for (const [pidStr, fields] of Object.entries(pfByProgram)) {
    const pid = Number(pidStr);
    const pName = programMap[pid] ?? `Program ${pid}`;
    for (const f of fields) {
      programColumnDefs.push({
        programId: pid,
        fieldId: f.id,
        header: `${pName}: ${f.label}`,
      });
    }
  }

  // 9. Build header row
  const baseHeaders = [
    "Contact ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Company",
    "Status",
    "Date Added",
    ...cFields.map((f) => f.label),
    // Program section
    "Program Name",
    "Enrolled Date",
    ...programColumnDefs.map((c) => c.header),
  ];

  const rows: string[] = [baseHeaders.join(",")];

  // 10. Build data rows — one row per enrollment (or one blank enrollment row if none)
  for (const contact of contacts) {
    const contactEnrollments = allEnrollments.filter(
      (e) => e.contact_id === contact.id
    );

    const baseContactData: Record<string, unknown> = {
      "Contact ID": contact.id,
      "First Name": contact.first_name,
      "Last Name": contact.last_name,
      Email: contact.email,
      Phone: contact.phone ?? "",
      Company: contact.company ?? "",
      Status: contact.status,
      "Date Added": new Date(contact.created_at).toLocaleDateString(),
    };

    // Add contact extra field values
    for (const f of cFields) {
      baseContactData[f.label] = cfvMap[contact.id]?.[f.id] ?? "";
    }

    if (contactEnrollments.length === 0) {
      // One row, no program data
      const row: Record<string, unknown> = {
        ...baseContactData,
        "Program Name": "",
        "Enrolled Date": "",
      };
      for (const col of programColumnDefs) {
        row[col.header] = "";
      }
      rows.push(rowToCsv(row));
    } else {
      // One row per enrollment
      for (const enrollment of contactEnrollments) {
        const pName = programMap[enrollment.program_id] ?? "";
        const evForEnrollment = evMap[enrollment.id] ?? {};

        const row: Record<string, unknown> = {
          ...baseContactData,
          "Program Name": pName,
          "Enrolled Date": new Date(enrollment.enrolled_at).toLocaleDateString(),
        };

        for (const col of programColumnDefs) {
          // Only fill values for columns belonging to THIS enrollment's program
          if (col.programId === enrollment.program_id) {
            row[col.header] = evForEnrollment[col.fieldId] ?? "";
          } else {
            row[col.header] = "";
          }
        }

        rows.push(rowToCsv(row));
      }
    }
  }

  // 11. Download
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename =
    contactIds && contactIds.length === 1
      ? `contact-${contactIds[0]}-export-${timestamp}.csv`
      : `basics-contacts-export-${timestamp}.csv`;

  downloadCsv(rows.join("\n"), filename);
}
