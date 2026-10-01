import { Authenticated, Refine } from "@refinedev/core";
import {
  ThemedLayoutV2, useNotificationProvider,
} from "@refinedev/antd";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import routerProvider, { NavigateToResource, CatchAllNavigate } from "@refinedev/react-router-v6";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { ConfigProvider, App as AntApp } from "antd";
import {
  TeamOutlined, AppstoreOutlined, SettingOutlined,
  DashboardOutlined, UsergroupAddOutlined, IdcardOutlined,
} from "@ant-design/icons";

import "@refinedev/antd/dist/reset.css";

import { supabaseClient } from "./supabaseClient";
import { authProvider } from "./authProvider";
import { RoleGuard, AdminOnly } from "./components/RoleGuard";
import { BrandLogo } from "./components/BrandComponents";
import { BASICS_THEME } from "./brand";

// Pages
import { Dashboard } from "./pages/dashboard";
import { ContactList, ContactCreate, ContactEdit, ContactShow } from "./pages/contacts";
import { ProgramList, ProgramCreate, ProgramEdit, ProgramShow } from "./pages/programs";
import { EnrollmentCreate, EnrollmentShow } from "./pages/enrollments";
import { ContactFieldAdmin } from "./pages/admin/ContactFieldAdmin";
import { UserManagement } from "./pages/admin/UserManagement";
import { StaffDirectory } from "./pages/staff/StaffDirectory";
import { LoginPage } from "./pages/auth/login";

// ── AppRoutes: rendered INSIDE <Refine>, so all Refine hooks are safe here ────
const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Authenticated area ── */}
      <Route
        element={
          <Authenticated key="auth" fallback={<CatchAllNavigate to="/login" />}>
            <ThemedLayoutV2
              Title={({ collapsed }) => <BrandLogo collapsed={collapsed} />}
            >
              <Outlet />
            </ThemedLayoutV2>
          </Authenticated>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Contacts */}
        <Route path="/contacts">
          <Route index element={<ContactList />} />
          <Route path="create" element={
            <RoleGuard requireEdit>
              <ContactCreate />
            </RoleGuard>
          } />
          <Route path="edit/:id" element={
            <RoleGuard requireEdit>
              <ContactEdit />
            </RoleGuard>
          } />
          <Route path="show/:id" element={<ContactShow />} />
        </Route>

        {/* Programs */}
        <Route path="/programs">
          <Route index element={<ProgramList />} />
          <Route path="create" element={
            <RoleGuard requireEdit>
              <ProgramCreate />
            </RoleGuard>
          } />
          <Route path="edit/:id" element={
            <RoleGuard requireEdit>
              <ProgramEdit />
            </RoleGuard>
          } />
          <Route path="show/:id" element={<ProgramShow />} />
        </Route>

        {/* Staff Directory */}
        <Route path="/staff" element={<StaffDirectory />} />

        {/* Enrollments */}
        <Route path="/enrollments">
          <Route path="create" element={
            <RoleGuard requireEdit>
              <EnrollmentCreate />
            </RoleGuard>
          } />
          <Route path="show/:id" element={<EnrollmentShow />} />
        </Route>

        {/* Admin-only pages */}
        <Route path="/admin/contact-fields" element={
          <AdminOnly>
            <ContactFieldAdmin />
          </AdminOnly>
        } />
        <Route path="/admin/users" element={
          <AdminOnly>
            <UserManagement />
          </AdminOnly>
        } />
      </Route>

      {/* ── Public: Login ── */}
      <Route
        element={
          <Authenticated key="auth-pages" fallback={<Outlet />}>
            <NavigateToResource resource="contacts" />
          </Authenticated>
        }
      >
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
};

// ── Root app: sets up providers and static resources ─────────────────────────
// Resources are defined statically here. Role-based UI hiding is handled
// inside each page component via usePermissions/useRole.
export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={BASICS_THEME}>
        <AntApp>
          <Refine
            dataProvider={dataProvider(supabaseClient)}
            liveProvider={liveProvider(supabaseClient)}
            authProvider={authProvider}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "dashboard",
                list: "/",
                meta: { label: "Dashboard", icon: <DashboardOutlined /> },
              },
              {
                name: "contacts",
                list: "/contacts",
                create: "/contacts/create",
                edit: "/contacts/edit/:id",
                show: "/contacts/show/:id",
                meta: { label: "Contacts", icon: <TeamOutlined /> },
              },
              {
                name: "programs",
                list: "/programs",
                create: "/programs/create",
                edit: "/programs/edit/:id",
                show: "/programs/show/:id",
                meta: { label: "Programs", icon: <AppstoreOutlined /> },
              },
              {
                name: "staff",
                list: "/staff",
                meta: { label: "Staff Directory", icon: <IdcardOutlined /> },
              },
              {
                name: "enrollments",
                create: "/enrollments/create",
                show: "/enrollments/show/:id",
                meta: { hide: true },
              },
              { name: "notes",                meta: { hide: true } },
              { name: "program_fields",       meta: { hide: true } },
              { name: "contact_fields",       meta: { hide: true } },
              { name: "contact_field_values", meta: { hide: true } },
              { name: "enrollment_values",    meta: { hide: true } },
              { name: "user_profiles",        meta: { hide: true } },
              {
                name: "admin_contact_fields",
                list: "/admin/contact-fields",
                meta: { label: "Contact Field Builder", icon: <SettingOutlined /> },
              },
              {
                name: "admin_users",
                list: "/admin/users",
                meta: { label: "User Management", icon: <UsergroupAddOutlined /> },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              liveMode: "auto",
            }}
          >
            <AppRoutes />
          </Refine>
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
