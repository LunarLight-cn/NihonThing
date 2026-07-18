import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShoppingCart, Loader2, Receipt } from 'lucide-react'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { useLocalizedName } from '../../utils/localization'
import { getImageUrl } from '../../utils/image'

interface PurchaseRow {
  id: number
  order_id?: number | null
  order_item_id?: number | null
  quantity: number
  actual_cost_jpy: number
  actual_cost_thb: number
  shop_name?: string | null
  receipt_img?: string[] | null
  cdate: string
  order?: { id: number; order_code?: string | null } | null
  orderItem?: { id: number; product?: { name_en: string; name_th?: string; name_jp?: string } | null } | null
  agent?: { id: number; username: string } | null
}

export const AgentPurchases: React.FC = () => {
  const { t } = useTranslation()
  const localizedName = useLocalizedName()

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['agent-purchases'],
    queryFn: async () => (await api.get('/purchases', { params: { mine: 'true' } })).data.data as PurchaseRow[]
  })

  const totalThb = (purchases || []).reduce((sum, p) => sum + (p.actual_cost_thb || 0), 0)

  const columns: ColumnDef<PurchaseRow>[] = [
    {
      accessorKey: 'cdate',
      header: t('agent.purchases.date'),
      cell: ({ row }) => new Date(row.original.cdate).toLocaleDateString()
    },
    {
      id: 'order',
      header: t('agent.purchases.order'),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.order?.order_code || (row.original.order_id ? `NT-${row.original.order_id}` : '-')}</span>
      )
    },
    {
      id: 'item',
      header: t('agent.purchases.item'),
      cell: ({ row }) => {
        const product = row.original.orderItem?.product
        return <span>{product ? localizedName(product) : '-'}</span>
      }
    },
    { accessorKey: 'quantity', header: t('agent.purchases.quantity') },
    {
      accessorKey: 'actual_cost_jpy',
      header: t('agent.purchases.costJpy'),
      cell: ({ row }) => `¥${(row.original.actual_cost_jpy || 0).toLocaleString()}`
    },
    {
      accessorKey: 'actual_cost_thb',
      header: t('agent.purchases.costThb'),
      cell: ({ row }) => <span className="font-semibold">฿{(row.original.actual_cost_thb || 0).toLocaleString()}</span>
    },
    {
      accessorKey: 'shop_name',
      header: t('agent.purchases.shop'),
      cell: ({ row }) => row.original.shop_name || '-'
    },
    {
      id: 'receipt',
      header: t('agent.purchases.receipt'),
      cell: ({ row }) => {
        const imgs = row.original.receipt_img || []
        if (imgs.length === 0) return <span className="text-muted-foreground">-</span>
        return (
          <a href={getImageUrl(imgs[0])} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center text-xs">
            <Receipt className="w-3.5 h-3.5 mr-1" />
            {imgs.length}
          </a>
        )
      }
    }
  ]

  return (
    <div className="admin-page">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="admin-page-title">
          <ShoppingCart className="w-8 h-8 mr-3" />
          {t('agent.purchases.title')}
        </h1>
        <div className="text-right">
          <p className="stat-row-label text-xs">{t('agent.purchases.totalSpent')}</p>
          <p className="text-xl font-bold text-primary">฿{totalThb.toLocaleString()}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={purchases || []} searchKey="shop_name" searchPlaceholder={t('agent.purchases.search')} />
      )}
    </div>
  )
}
