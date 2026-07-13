import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { ShoppingCart, Loader2 } from 'lucide-react'

interface Order {
  id: number
  user_id: number
  trip_id: number
  status: 'pending' | 'purchasing' | 'arrived_th' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending_deposit' | 'deposit_paid' | 'pending_remaining' | 'fully_paid'
  grand_total: number
  cdate: string
}

export const AdminOrders: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/orders')
      return res.data.data as Order[]
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    }
  })

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ id, payment_status }: { id: number; payment_status: string }) => api.put(`/orders/${id}`, { payment_status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    }
  })

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'id',
      header: t('admin.order.order_id')
    },
    {
      accessorKey: 'cdate',
      header: t('admin.order.date'),
      cell: ({ row }) => new Date(row.original.cdate).toLocaleDateString()
    },
    {
      accessorKey: 'grand_total',
      header: t('admin.order.total'),
      cell: ({ row }) => `฿${row.original.grand_total?.toLocaleString() || 0}`
    },
    {
      accessorKey: 'status',
      header: t('admin.order.fulfillment_status'),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <select
            value={status}
            onChange={(e) => updateStatusMutation.mutate({ id: row.original.id, status: e.target.value })}
            className="input-inline-select"
          >
            <option value="pending">{t('admin.order.status_pending')}</option>
            <option value="purchasing">{t('admin.order.status_purchasing')}</option>
            <option value="arrived_th">{t('admin.order.status_arrived_th')}</option>
            <option value="shipped">{t('admin.order.status_shipped')}</option>
            <option value="delivered">{t('admin.order.status_delivered')}</option>
            <option value="cancelled">{t('admin.order.status_cancelled')}</option>
          </select>
        )
      }
    },
    {
      accessorKey: 'payment_status',
      header: t('admin.order.payment_status'),
      cell: ({ row }) => {
        const pStatus = row.original.payment_status
        return (
          <select
            value={pStatus}
            onChange={(e) => updatePaymentStatusMutation.mutate({ id: row.original.id, payment_status: e.target.value })}
            className="input-inline-select"
          >
            <option value="pending_deposit">{t('admin.order.payment_pending_deposit')}</option>
            <option value="deposit_paid">{t('admin.order.payment_deposit_paid')}</option>
            <option value="pending_remaining">{t('admin.order.payment_pending_remaining')}</option>
            <option value="fully_paid">{t('admin.order.payment_fully_paid')}</option>
          </select>
        )
      }
    }
  ]

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title">
          <ShoppingCart className="w-8 h-8 mr-3" />
          {t('admin.order.orders_title')}
        </h1>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={orders || []} searchKey="id" searchPlaceholder={t('admin.order.search_order_id')} />
      )}
    </div>
  )
}
