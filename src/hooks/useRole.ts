/**
 * useRole
 * Returns the current user's role and convenience booleans.
 *
 * Role hierarchy:
 *   viewer  — read-only (search, view contacts, view enrollments)
 *   editor  — viewer + create/edit contacts, enroll in programs, add notes
 *   admin   — editor + program builder, field builder, user management
 *
 * canEdit  = editor OR admin
 * canAdmin = admin only
 */
import { useGetIdentity, useOne } from "@refinedev/core";
import type { UserProfile } from "../types";

interface Identity { id: string; name: string }

export const useRole = () => {
  const { data: identity } = useGetIdentity<Identity>();

  const { data, isLoading } = useOne<UserProfile>({
    resource: "user_profiles",
    id: identity?.id ?? "",
    queryOptions: { enabled: !!identity?.id },
  });

  const role = data?.data?.role ?? "viewer";

  return {
    role,
    isViewer: role === "viewer",
    canEdit:  role === "editor" || role === "admin",
    isAdmin:  role === "admin",
    isLoading,
  };
};
