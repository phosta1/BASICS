/**
 * usePermissions
 * Centralized permission checking for CRM operations.
 * 
 * This hook provides granular permission checks for all CRM operations
 * based on the user's role (viewer, editor, admin).
 */
import { useRole } from './useRole';

export const usePermissions = () => {
  const { role, canEdit, isAdmin, isViewer } = useRole();

  return {
    // Raw role info
    role,
    canEdit,
    isAdmin,
    isViewer,

    // Contact permissions
    contacts: {
      view: true,              // All roles can view contacts
      create: canEdit,         // Editor and Admin can create
      edit: canEdit,           // Editor and Admin can edit
      delete: canEdit,         // Editor and Admin can delete
    },

    // Note permissions
    notes: {
      view: true,              // All roles can view notes
      create: canEdit,         // Editor and Admin can create notes
      edit: canEdit,           // Editor and Admin can edit notes
      delete: canEdit,         // Editor and Admin can delete notes
    },

    // Program permissions
    programs: {
      view: true,              // All roles can view programs
      create: canEdit,         // Editor and Admin can create programs
      edit: canEdit,           // Editor and Admin can edit programs
      delete: canEdit,         // Editor and Admin can delete programs
    },

    // Enrollment permissions
    enrollments: {
      view: true,              // All roles can view enrollments
      create: canEdit,         // Editor and Admin can enroll contacts
      edit: canEdit,           // Editor and Admin can edit enrollments
      delete: canEdit,         // Editor and Admin can delete enrollments
    },

    // Field management permissions (contact and program fields)
    fieldManagement: {
      view: isAdmin,           // Only Admin can view field management
      create: isAdmin,         // Only Admin can create new fields
      edit: isAdmin,           // Only Admin can edit field definitions
      delete: isAdmin,         // Only Admin can delete fields
    },

    // User management permissions
    userManagement: {
      view: isAdmin,           // Only Admin can view user management
      create: isAdmin,         // Only Admin can create users (invite)
      edit: isAdmin,           // Only Admin can change user roles
      delete: isAdmin,         // Only Admin can delete users
    },

    // System administration
    administration: {
      viewSettings: isAdmin,   // Only Admin can view system settings
      manageFields: isAdmin,   // Only Admin can manage custom fields
      manageUsers: isAdmin,    // Only Admin can manage user accounts
      viewReports: canEdit,    // Editor and Admin can view reports
      exportData: canEdit,     // Editor and Admin can export data
    },

    // UI permissions for showing/hiding elements
    ui: {
      showCreateButtons: canEdit,      // Show create buttons for Editor and Admin
      showEditActions: canEdit,        // Show edit actions for Editor and Admin
      showDeleteActions: canEdit,      // Show delete actions for Editor and Admin
      showAdminMenu: isAdmin,          // Show admin menu items for Admin only
      showFieldBuilder: isAdmin,       // Show field builder for Admin only
      showUserManagement: isAdmin,     // Show user management for Admin only
    }
  };
};