import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Users, Shield, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react'

interface UserData {
  id: number
  username: string
  email: string
  role: 'admin' | 'customer' | 'agent'
  cdate: string
}

export const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/users')
      return res.data.data as UserData[]
    }
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number, role: string }) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update role')
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete user. They might have related data.')
    }
  })

  const columns: ColumnDef<UserData>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'username', header: 'Username' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
          row.original.role === 'admin' ? 'bg-purple-100 text-purple-700' :
          row.original.role === 'customer' ? 'bg-blue-100 text-blue-700' :
          'bg-orange-100 text-orange-700'
        }`}>
          {row.original.role}
        </span>
      )
    },
    {
      accessorKey: 'cdate',
      header: 'Joined Date',
      cell: ({ row }) => new Date(row.original.cdate).toLocaleDateString()
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original
        
        return (
          <div className="flex items-center space-x-3">
            <select
              value={user.role}
              onChange={(e) => {
                if (window.confirm(`⚠️ WARNING: Are you sure you want to change ${user.username}'s role to ${e.target.value.toUpperCase()}?`)) {
                  updateRoleMutation.mutate({ id: user.id, role: e.target.value })
                }
              }}
              className="text-xs border border-border rounded p-1 bg-background"
            >
              <option value="customer">Customer</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
            
            <button 
              onClick={() => {
                if (window.confirm(`🚨 DANGER: Are you sure you want to permanently delete user: ${user.username}?`)) {
                  deleteUserMutation.mutate(user.id)
                }
              }}
              className="text-xs text-destructive hover:underline font-medium"
            >
              Delete
            </button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Users className="w-8 h-8 mr-3" />
          User Management
        </h1>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start space-x-3 text-orange-800">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Caution:</strong> Changing a user's role to Admin grants them full access to this dashboard. 
          Deleting a user is permanent and may fail if they have associated orders or tickets.
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <DataTable columns={columns} data={users || []} searchKey="username" searchPlaceholder="Search by username..." />
        </div>
      )}
    </div>
  )
}
