import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Users, Loader2, ShieldAlert, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface UserData {
  id: number
  username: string
  email: string
  role: 'admin' | 'customer' | 'agent'
  status: 'active' | 'inactive'
  cdate: string
}

export const AdminUsers: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/users')
      return res.data.data as UserData[]
    }
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || t('admin.users.alert_update_role_fail'))
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || t('admin.users.alert_delete_user_fail'))
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || t('admin.users.alert_update_status_fail'))
    }
  })

  const columns: ColumnDef<UserData>[] = [
    { accessorKey: 'id', header: t('admin.users.id') },
    { accessorKey: 'username', header: t('admin.users.username') },
    { accessorKey: 'email', header: t('admin.users.email') },
    {
      accessorKey: 'role',
      header: t('admin.users.role'),
      cell: ({ row }) => (
        <span
          className={`badge ${
            row.original.role === 'admin' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : row.original.role === 'customer' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
          }`}
        >
          {row.original.role}
        </span>
      )
    },
    {
      accessorKey: 'cdate',
      header: t('admin.users.joined_date'),
      cell: ({ row }) => new Date(row.original.cdate).toLocaleDateString()
    },
    {
      accessorKey: 'status',
      header: t('admin.users.status'),
      cell: ({ row }) => (
        <select
          value={row.original.status || 'active'}
          onChange={(e) => updateStatusMutation.mutate({ id: row.original.id, status: e.target.value })}
          className="input-inline-select"
        >
          <option value="active">{t('admin.users.status_active')}</option>
          <option value="inactive">{t('admin.users.status_inactive')}</option>
        </select>
      )
    },
    {
      id: 'actions',
      header: t('admin.users.actions'),
      cell: ({ row }) => {
        const user = row.original

        return (
          <div className="flex items-center space-x-3">
            <select
              value={user.role}
              onChange={(e) => {
                if (window.confirm(t('admin.users.confirm_change_role', { username: user.username, role: e.target.value.toUpperCase() }))) {
                  updateRoleMutation.mutate({ id: user.id, role: e.target.value })
                }
              }}
              className="text-xs border border-border rounded p-1 bg-background"
            >
              <option value="customer">{t('admin.users.role_customer')}</option>
              <option value="agent">{t('admin.users.role_agent')}</option>
              <option value="admin">{t('admin.users.role_admin')}</option>
            </select>

            <button
              onClick={() => {
                if (window.confirm(t('admin.users.confirm_delete_user', { username: user.username }))) {
                  deleteUserMutation.mutate(user.id)
                }
              }}
              className="btn-icon-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title">
          <Users className="w-8 h-8 mr-3" />
          {t('admin.users.users_title')}
        </h1>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start space-x-3 text-amber-700 dark:text-amber-400">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>{t('admin.users.users_caution_title')}</strong> {t('admin.users.users_caution_desc')}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={users || []} searchKey="username" searchPlaceholder={t('admin.users.search_users')} />
      )}
    </div>
  )
}
