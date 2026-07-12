import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
      header: 'Order ID'
    },
    {
      accessorKey: 'cdate',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.cdate).toLocaleDateString()
    },
    {
      accessorKey: 'grand_total',
      header: 'Total',
      cell: ({ row }) => `฿${row.original.grand_total?.toLocaleString() || 0}`
    },
    {
      accessorKey: 'status',
      header: 'Fulfillment Status',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <select
            value={status}
            onChange={(e) => updateStatusMutation.mutate({ id: row.original.id, status: e.target.value })}
            className="input-inline-select"
          >
            <option value="pending">Pending</option>
            <option value="purchasing">Purchasing</option>
            <option value="arrived_th">Arrived TH</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )
      }
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment Status',
      cell: ({ row }) => {
        const pStatus = row.original.payment_status
        return (
          <select
            value={pStatus}
            onChange={(e) => updatePaymentStatusMutation.mutate({ id: row.original.id, payment_status: e.target.value })}
            className="input-inline-select"
          >
            <option value="pending_deposit">Pending Deposit</option>
            <option value="deposit_paid">Deposit Paid</option>
            <option value="pending_remaining">Pending Remaining</option>
            <option value="fully_paid">Fully Paid</option>
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
          Order Management
        </h1>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={orders || []} searchKey="id" searchPlaceholder="Search order ID..." />
      )}
    </div>
  )
}
