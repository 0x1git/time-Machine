import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

// Higher-order component for permission-based rendering
export const withPermission = (permission) => (WrappedComponent) => {
  return function PermissionWrapper(props) {
    const { hasPermission } = usePermissions();

    if (!hasPermission(permission)) {
      return null; // or a "Access Denied" component
    }

    return <WrappedComponent {...props} />;
  };
};

// Higher-order component for role-based rendering
export const withRole = (...roles) => (WrappedComponent) => {
  return function RoleWrapper(props) {
    const { hasAnyRole } = usePermissions();

    if (!hasAnyRole(roles)) {
      return null; // or a "Access Denied" component
    }

    return <WrappedComponent {...props} />;
  };
};

// Component for conditional rendering based on permissions
export const PermissionGate = ({ permission, role, roles, fallback = null, children }) => {
  const permissions = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = permissions.hasPermission(permission);
  } else if (role) {
    hasAccess = permissions.hasRole(role);
  } else if (roles) {
    hasAccess = permissions.hasAnyRole(roles);
  }

  return hasAccess ? children : fallback;
};

// Component for admin-only content
export const AdminOnly = ({ children, fallback = null }) => (
  <PermissionGate role="admin" fallback={fallback}>
    {children}
  </PermissionGate>
);

// Component for manager+ content
export const ManagerPlus = ({ children, fallback = null }) => (
  <PermissionGate roles={['admin', 'manager']} fallback={fallback}>
    {children}
  </PermissionGate>
);

// Component for authenticated content (any role)
export const AuthenticatedOnly = ({ children, fallback = null }) => (
  <PermissionGate roles={['admin', 'manager', 'member']} fallback={fallback}>
    {children}
  </PermissionGate>
);
