import React from 'react';
import { Result, Spin } from 'antd';
import { useRole } from '../hooks/useRole';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'editor' | 'viewer'>;
  requireEdit?: boolean;  // Shorthand for editor or admin
  requireAdmin?: boolean; // Shorthand for admin only
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requireEdit = false,
  requireAdmin = false,
  fallback,
  showFallback = true,
}) => {
  const { role, canEdit, isAdmin, isLoading } = useRole();

  // Still fetching role — show a spinner rather than a blank page or false 403
  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Role is resolved — now evaluate
  let hasPermission = false;

  if (requireAdmin) {
    hasPermission = !!isAdmin;
  } else if (requireEdit) {
    hasPermission = !!canEdit;
  } else if (allowedRoles) {
    hasPermission = allowedRoles.includes(role as 'admin' | 'editor' | 'viewer');
  } else {
    // No restrictions specified, allow all authenticated users
    hasPermission = true;
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (!showFallback) {
      return null;
    }

    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle={`You need ${requireAdmin ? 'admin' : requireEdit ? 'editor or admin' : 'different'} permissions to access this feature.`}
      />
    );
  }

  return <>{children}</>;
};

// Convenience components for common use cases
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard requireAdmin fallback={fallback}>
    {children}
  </RoleGuard>
);

export const EditorOrAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard requireEdit fallback={fallback}>
    {children}
  </RoleGuard>
);

export const ViewerOrAbove: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard allowedRoles={['viewer', 'editor', 'admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);