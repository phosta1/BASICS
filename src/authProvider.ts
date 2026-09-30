import type { AuthProvider } from "@refinedev/core";
import { supabaseClient } from "./supabaseClient";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error };
    return { success: true, redirectTo: "/" };
  },

  logout: async () => {
    await supabaseClient.auth.signOut();
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) return { authenticated: true };
    return { authenticated: false, redirectTo: "/login" };
  },

  getIdentity: async () => {
    const { data } = await supabaseClient.auth.getUser();
    if (!data.user) return null;
    return {
      id: data.user.id,
      name: data.user.email ?? data.user.id,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.email ?? "User")}&background=random`,
    };
  },

  onError: async (error) => {
    if (error?.status === 401 || error?.status === 403) {
      return { logout: true, redirectTo: "/login", error };
    }
    return { error };
  },
};
