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
  const { data: identity, isLoading: identityLoading } = useGetIdentity<Identity>();

  const { data, isLoading: profileLoading } = useOne<UserProfile>({
    resource: "user_profiles",
    id: identity?.id ?? "",
    queryOptions: { enabled: !!identity?.id },
  });

  // Still loading if: identity hasn't resolved, OR profile fetch is in flight,
  // OR identity resolved but profile data hasn't come back yet.
  const isLoading = identityLoading || profileLoading || (!!identity?.id && !data?.data);

  const role = data?.data?.role ?? "viewer";

  return {
    role,
    isViewer: isLoading ? undefined : role === "viewer",
    canEdit:  isLoading ? undefined : (role === "editor" || role === "admin"),
    isAdmin:  isLoading ? undefined : role === "admin",
    isLoading,
  };
};
