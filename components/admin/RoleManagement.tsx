'use client';

import { useState, useEffect } from 'react';
import { 
  SYSTEM_ROLES, 
  Role, 
  UserContext, 
  hasPermission, 
  RESOURCES, 
  ACTIONS,
  createTenantRole 
} from '@/lib/auth/rbac';

interface RoleManagementProps {
  tenantId: string;
  userContext: UserContext;
}

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  assignedAt: string;
  assignedBy: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  role: {
    id: string;
    name: string;
    description: string;
  };
}

export function RoleManagement({ tenantId, userContext }: RoleManagementProps) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssignRole, setShowAssignRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Check if current user can manage roles
  const canManageRoles = hasPermission(userContext, RESOURCES.USER, ACTIONS.MANAGE);

  useEffect(() => {
    if (canManageRoles) {
      loadUserRoles();
      loadAvailableUsers();
    }
  }, [canManageRoles]);

  const loadUserRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/roles/users`, {
        headers: {
          'x-tenant-slug': tenantId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserRoles(data.userRoles);
      } else {
        console.error('Failed to load user roles');
      }
    } catch (error) {
      console.error('Error loading user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch(`/api/v1/users`, {
        headers: {
          'x-tenant-slug': tenantId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const response = await fetch(`/api/v1/roles/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantId,
        },
        body: JSON.stringify({
          userId: selectedUser,
          roleId: selectedRole,
        }),
      });

      if (response.ok) {
        await loadUserRoles();
        setShowAssignRole(false);
        setSelectedUser('');
        setSelectedRole('');
      } else {
        console.error('Failed to assign role');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const handleRevokeRole = async (userRoleId: string) => {
    if (!confirm('Are you sure you want to revoke this role?')) return;

    try {
      const response = await fetch(`/api/v1/roles/revoke/${userRoleId}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-slug': tenantId,
        },
      });

      if (response.ok) {
        await loadUserRoles();
      } else {
        console.error('Failed to revoke role');
      }
    } catch (error) {
      console.error('Error revoking role:', error);
    }
  };

  const getTenantRoles = () => {
    return Object.values(SYSTEM_ROLES).filter(role => 
      role.id !== 'super_admin' // Super admin is not assignable at tenant level
    );
  };

  const getRoleDisplayName = (roleId: string) => {
    const baseRole = Object.values(SYSTEM_ROLES).find(r => r.id === roleId);
    return baseRole?.name || roleId;
  };

  const getRoleDescription = (roleId: string) => {
    const baseRole = Object.values(SYSTEM_ROLES).find(r => r.id === roleId);
    return baseRole?.description || '';
  };

  if (!canManageRoles) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <p>You don't have permission to manage user roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Role Management</h2>
          <p className="text-gray-600">Manage user roles and permissions within your tenant</p>
        </div>
        <button
          onClick={() => setShowAssignRole(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Assign Role
        </button>
      </div>

      {/* Role Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Available Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getTenantRoles().map((role) => (
            <div key={role.id} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{role.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{role.description}</p>
              <div className="mt-2">
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {role.permissions.length} permissions
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Roles List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">User Role Assignments</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading user roles...</p>
          </div>
        ) : userRoles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No role assignments found. Assign roles to users to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Assigned Date</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Assigned By</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userRoles.map((userRole) => (
                  <tr key={userRole.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <div>
                        <div className="font-medium text-gray-900">
                          {userRole.user.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{userRole.user.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div>
                        <div className="font-medium text-gray-900">
                          {getRoleDisplayName(userRole.role.id)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getRoleDescription(userRole.role.id)}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600">
                      {new Date(userRole.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600">
                      {userRole.assignedBy}
                    </td>
                    <td className="py-3 px-6">
                      <button
                        onClick={() => handleRevokeRole(userRole.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={userRole.userId === userContext.userId} // Prevent self-revocation
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Role Modal */}
      {showAssignRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assign Role</h3>
              <button
                onClick={() => {
                  setShowAssignRole(false);
                  setSelectedUser('');
                  setSelectedRole('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Choose a user...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Choose a role...</option>
                  {getTenantRoles().map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRole && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    {getRoleDescription(selectedRole)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignRole(false);
                  setSelectedUser('');
                  setSelectedRole('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRole}
                disabled={!selectedUser || !selectedRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}