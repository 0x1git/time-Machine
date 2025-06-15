import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { currentUser } = useAuth();

  const hasPermission = (permission) => {
    if (!currentUser || !currentUser.permissions) {
      return false;
    }
    return currentUser.permissions[permission] === true;
  };

  const hasRole = (role) => {
    if (!currentUser) {
      return false;
    }
    return currentUser.role === role;
  };

  const hasAnyRole = (roles) => {
    if (!currentUser) {
      return false;
    }
    return roles.includes(currentUser.role);
  };

  const canManageUsers = () => hasPermission('canManageUsers');
  const canViewAllUsers = () => hasPermission('canViewAllUsers');
  const canEditUserRoles = () => hasPermission('canEditUserRoles');
  
  const canManageAllProjects = () => hasPermission('canManageAllProjects');
  const canCreateProjects = () => hasPermission('canCreateProjects');
  const canEditOwnProjects = () => hasPermission('canEditOwnProjects');
  const canDeleteProjects = () => hasPermission('canDeleteProjects');
  const canViewAllProjects = () => hasPermission('canViewAllProjects');
  
  const canManageAllTasks = () => hasPermission('canManageAllTasks');
  const canCreateTasks = () => hasPermission('canCreateTasks');
  const canEditOwnTasks = () => hasPermission('canEditOwnTasks');
  const canDeleteTasks = () => hasPermission('canDeleteTasks');
  
  const canViewAllTimeEntries = () => hasPermission('canViewAllTimeEntries');
  const canEditAllTimeEntries = () => hasPermission('canEditAllTimeEntries');
  const canDeleteTimeEntries = () => hasPermission('canDeleteTimeEntries');
  const canManageBreaks = () => hasPermission('canManageBreaks');
  
  const canManageTeams = () => hasPermission('canManageTeams');
  const canInviteUsers = () => hasPermission('canInviteUsers');
  const canAssignRoles = () => hasPermission('canAssignRoles');
  
  const canViewAllReports = () => hasPermission('canViewAllReports');
  const canViewTeamReports = () => hasPermission('canViewTeamReports');
  const canExportReports = () => hasPermission('canExportReports');
  
  const canManageSettings = () => hasPermission('canManageSettings');
  const canAccessKiosk = () => hasPermission('canAccessKiosk');

  const isAdmin = () => hasRole('admin');
  const isManager = () => hasRole('manager');
  const isMember = () => hasRole('member');
  const isAdminOrManager = () => hasAnyRole(['admin', 'manager']);

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    canManageUsers,
    canViewAllUsers,
    canEditUserRoles,
    canManageAllProjects,
    canCreateProjects,
    canEditOwnProjects,
    canDeleteProjects,
    canViewAllProjects,
    canManageAllTasks,
    canCreateTasks,
    canEditOwnTasks,
    canDeleteTasks,
    canViewAllTimeEntries,
    canEditAllTimeEntries,
    canDeleteTimeEntries,
    canManageBreaks,
    canManageTeams,
    canInviteUsers,
    canAssignRoles,
    canViewAllReports,
    canViewTeamReports,
    canExportReports,
    canManageSettings,
    canAccessKiosk,
    isAdmin,
    isManager,
    isMember,
    isAdminOrManager
  };
};
