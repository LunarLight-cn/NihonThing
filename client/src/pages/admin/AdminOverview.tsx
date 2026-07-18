import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api, fetchAllProducts } from '../../services/api'
import { Package, ShoppingCart, Plane, DollarSign, Loader2 } from 'lucide-react'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

export const AdminOverview: React.FC = () => {
  const { t } = useTranslation()

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/orders')
      return res.data.data
    }
  })

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => await fetchAllProducts()
  })

  const { data: trips, isLoading: isLoadingTrips } = useQuery({
    queryKey: ['admin-trips'],
    queryFn: async () => {
      const res = await api.get('/ships')
      return res.data.data
    }
  })

  const isLoading = isLoadingOrders || isLoadingProducts || isLoadingTrips

  // Calculate stats
  const totalOrders = orders?.length || 0
  const totalProducts = products?.length || 0
  const activeTrips = trips?.filter((t: any) => t.status === 'open' || t.status === 'in_transit')?.length || 0

  // Money actually received, not order value: a deposit is 50% of the item
  // total (see getOrderAmountForPayment), so an order that has only paid its
  // deposit contributes half, not its full grand total.
  const totalRevenue =
    orders?.reduce((sum: number, order: any) => {
      if (order.payment_status === 'fully_paid') {
        return sum + (order.grand_total || order.item_price_total || 0)
      }
      if (order.payment_status === 'deposit_paid' || order.payment_status === 'pending_remaining') {
        return sum + (order.item_price_total || 0) * 0.5
      }
      return sum
    }, 0) || 0

  // Recent 5 orders
  const recentOrders = orders ? [...orders].sort((a: any, b: any) => new Date(b.cdate).getTime() - new Date(a.cdate).getTime()).slice(0, 5) : []

  const recentOrderColumns: ColumnDef<any>[] = [
    { accessorKey: 'id', header: t('admin.overview.order_id') },
    {
      accessorKey: 'cdate',
      header: t('admin.overview.date'),
      cell: ({ row }) => new Date(row.original.cdate).toLocaleDateString()
    },
    {
      accessorKey: 'status',
      header: t('admin.overview.status'),
      cell: ({ row }) => <span className="capitalize">{row.original.status.replace('_', ' ')}</span>
    },
    {
      accessorKey: 'payment_status',
      header: t('admin.overview.payment'),
      cell: ({ row }) => <span className="capitalize">{row.original.payment_status.replace('_', ' ')}</span>
    },
    {
      accessorKey: 'grand_total',
      header: t('admin.overview.total'),
      cell: ({ row }) => `฿${row.original.grand_total?.toLocaleString() || 0}`
    }
  ]

  return (
    <div className="admin-page max-w-7xl space-y-8">
      <div>
        <h1 className="admin-page-title mb-2">{t('admin.overview.overview_title')}</h1>
        <p className="text-muted-foreground">{t('admin.overview.overview_welcome')}</p>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stat-card">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('admin.overview.total_revenue')}</p>
                <h3 className="text-2xl font-bold">฿{totalRevenue.toLocaleString()}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('admin.overview.total_orders')}</p>
                <h3 className="text-2xl font-bold">{totalOrders}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('admin.overview.total_products')}</p>
                <h3 className="text-2xl font-bold">{totalProducts}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('admin.overview.active_trips')}</p>
                <h3 className="text-2xl font-bold">{activeTrips}</h3>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card-panel-flush overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">{t('admin.overview.recent_orders')}</h2>
            </div>
            <div className="p-6">
              <DataTable columns={recentOrderColumns} data={recentOrders} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
