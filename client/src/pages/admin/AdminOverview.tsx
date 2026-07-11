import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Package, ShoppingCart, Plane, DollarSign, Loader2 } from 'lucide-react'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

export const AdminOverview: React.FC = () => {
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/orders')
      return res.data.data
    }
  })

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await api.get('/products')
      return res.data.data
    }
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
  
  // Calculate total revenue (rough estimate for now)
  const totalRevenue = orders?.reduce((sum: number, order: any) => {
    // Only count if payment is made
    if (order.payment_status === 'fully_paid' || order.payment_status === 'deposit_paid') {
      return sum + (order.grand_total || 0)
    }
    return sum
  }, 0) || 0

  // Recent 5 orders
  const recentOrders = orders ? [...orders].sort((a: any, b: any) => new Date(b.cdate).getTime() - new Date(a.cdate).getTime()).slice(0, 5) : []

  const recentOrderColumns: ColumnDef<any>[] = [
    { accessorKey: 'id', header: 'Order ID' },
    {
      accessorKey: 'cdate',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.cdate).toLocaleDateString()
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <span className="capitalize">{row.original.status.replace('_', ' ')}</span>
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment',
      cell: ({ row }) => <span className="capitalize">{row.original.payment_status.replace('_', ' ')}</span>
    },
    {
      accessorKey: 'grand_total',
      header: 'Total',
      cell: ({ row }) => `฿${row.original.grand_total?.toLocaleString() || 0}`
    }
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold">฿{totalRevenue.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <h3 className="text-2xl font-bold">{totalOrders}</h3>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <h3 className="text-2xl font-bold">{totalProducts}</h3>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Trips</p>
                <h3 className="text-2xl font-bold">{activeTrips}</h3>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">Recent Orders</h2>
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
