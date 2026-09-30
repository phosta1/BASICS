# Role-Based Access Control (RBAC) System

This CRM application implements a comprehensive role-based access control system with three distinct user roles, each with specific permissions and capabilities.

## User Roles

### 👁️ Viewer Role
**Purpose**: Read-only access for users who need to reference data but shouldn't make changes.

**Permissions**:
- ✅ View all contacts and their details
- ✅ Search and filter contacts, programs, and enrollments
- ✅ View program information and enrollments
- ✅ Access dashboard and reports
- ❌ Cannot create, edit, or delete any data
- ❌ Cannot access admin features

**Use Cases**: 
- Sales team members who need to reference client information
- Customer support staff who need to look up contact details
- Reporting users who need read-only access to data

### ✏️ Editor Role
**Purpose**: Active content management for users who work with contacts and programs daily.

**Permissions**:
- ✅ All viewer permissions (inherits)
- ✅ Create, edit, and delete contacts
- ✅ Create and manage programs
- ✅ Handle program enrollments
- ✅ Add and edit notes
- ✅ Bulk operations on contacts
- ❌ Cannot access user management
- ❌ Cannot modify system configuration
- ❌ Cannot create custom fields

**Use Cases**:
- Account managers who maintain client relationships
- Program coordinators who manage enrollments
- Staff who actively update contact information

### ⚙️ Administrator Role
**Purpose**: Complete system access for users who manage the CRM system and its users.

**Permissions**:
- ✅ All editor permissions (inherits)
- ✅ User management (create, edit roles, deactivate users)
- ✅ Custom field creation and management
- ✅ System configuration access
- ✅ Role assignment and permission management
- ✅ Backend user creation
- ✅ Access to all admin panels

**Use Cases**:
- IT administrators who configure the system
- Business owners who manage user access
- System managers who customize fields and workflows

## Implementation Components

### 1. Permission Hooks

#### `useRole()`
```typescript
const { role, isViewer, canEdit, isAdmin, isLoading } = useRole();
```
Basic role information and convenience booleans.

#### `usePermissions()`
```typescript
const permissions = usePermissions();
// Access specific permissions:
// permissions.contacts.create, permissions.administration.manageUsers, etc.
```
Comprehensive permissions for all CRM features.

### 2. Role Guard Components

#### `<RoleGuard>`
Flexible component for role-based content protection:
```tsx
<RoleGuard requireEdit>
  <ContactEdit />
</RoleGuard>

<RoleGuard allowedRoles={['admin']}>
  <UserManagement />
</RoleGuard>
```

#### Convenience Components
```tsx
<AdminOnly>
  <SystemSettings />
</AdminOnly>

<EditorOrAdmin>
  <CreateContactButton />
</EditorOrAdmin>

<ViewerOrAbove>
  <ContactList />
</ViewerOrAbove>
```

### 3. Action Components

#### `<ActionButtons>`
Permission-aware action buttons:
```tsx
<ActionButtons
  resourceType="contacts"
  onEdit={() => navigate('/contacts/edit/123')}
  onDelete={() => deleteContact(123)}
  onView={() => navigate('/contacts/show/123')}
/>
```

#### `<ActionDropdown>`
Compact dropdown for multiple actions:
```tsx
<ActionDropdown
  resourceType="programs"
  onEdit={() => editProgram()}
  onDelete={() => deleteProgram()}
/>
```

### 4. Role Display Components

#### `<RoleDisplay>`
Shows current user role and detailed permissions:
```tsx
<RoleDisplay showDetails showAlert />
```

#### `<RoleBadge>`
Compact role indicator for headers/toolbars:
```tsx
<RoleBadge />
```

## Database Schema

The role system is backed by the `user_profiles` table:

```sql
create table public.user_profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  role        text        not null default 'viewer'
                check (role in ('admin','editor','viewer')),
  created_at  timestamptz not null default now()
);
```

## Row Level Security (RLS)

The system uses Supabase RLS policies:

- **User Profiles**: Users can read their own profile; admins can read all profiles
- **Content Tables**: All authenticated users have access (frontend enforces role restrictions)
- **Admin Operations**: Backend policies prevent unauthorized modifications

## Usage Examples

### Protecting Routes
```tsx
// In App.tsx
<Route path="/contacts/create" element={
  <RoleGuard requireEdit>
    <ContactCreate />
  </RoleGuard>
} />
```

### Conditional UI Elements
```tsx
const MyComponent = () => {
  const permissions = usePermissions();
  
  return (
    <div>
      {permissions.ui.showCreateButtons && (
        <CreateButton />
      )}
      
      {permissions.isAdmin && (
        <AdminPanel />
      )}
    </div>
  );
};
```

### Permission-aware Lists
```tsx
<List
  headerButtons={permissions.contacts.create ? <CreateButton /> : null}
>
  <Table>
    <Table.Column
      title="Actions"
      render={(_, record) => (
        <Space>
          <ShowButton recordItemId={record.id} />
          {permissions.contacts.edit && (
            <EditButton recordItemId={record.id} />
          )}
          {permissions.contacts.delete && (
            <DeleteButton recordItemId={record.id} />
          )}
        </Space>
      )}
    />
  </Table>
</List>
```

## Setting User Roles

### For Development
```sql
-- Make a user an admin (run in Supabase SQL editor)
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### For Production
Use the User Management interface accessible to administrators:
1. Login as an admin user
2. Navigate to Admin → User Management
3. Find the user and change their role
4. Save changes

## Security Considerations

1. **Frontend Protection**: UI elements are hidden based on roles, but sensitive operations should also be protected at the API level.

2. **Backend Validation**: While RLS policies provide database-level security, additional validation in serverless functions is recommended for critical operations.

3. **Role Inheritance**: The system uses role inheritance (admin > editor > viewer) to simplify permission checks.

4. **Default Role**: New users default to 'viewer' role for security.

## Testing Roles

Use the role demo page at `/role-demo` to test how different features behave with your current role assignment. This page shows:

- Your current role and permissions
- Interactive examples of role-based features
- Permission matrices for each role type

## Migration from Previous Versions

If upgrading from a system that used 'user' instead of 'viewer':

```sql
-- Run this migration
UPDATE public.user_profiles SET role = 'viewer' WHERE role = 'user';
```

The system automatically handles this migration in the schema file.