import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ClipboardList, Loader2, Hand, Check, ShoppingBag, PlaneTakeoff, Ship as ShipIcon, X } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useLocalizedName } from '../../utils/localization'
import { getImageUrl } from '../../utils/image'
import { isDepositPaid, orderStatusBadge, paymentStatusBadge } from '../../utils/status'
import { PurchaseModal } from './PurchaseModal'
import type { QueueOrder, QueueItem } from './types'

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '-')

const ItemRow: React.FC<{
  order: QueueOrder
  item: QueueItem
  onBuy: (order: QueueOrder, item: QueueItem) => void
}> = ({ order, item, onBuy }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const qc = useQueryClient()
  const localizedName = useLocalizedName()

  const claim = useMutation({
    mutationFn: (claiming: boolean) =>
      api.post(`/purchases/${claiming ? 'claim' : 'release'}`, { item_ids: [item.id] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-queue'] }),
    onError: (e: any) => alert(e.response?.data?.message || t('agent.queue.claimFailed'))
  })

  const name = item.product ? localizedName(item.product) : item.ticket?.item_name || '-'
  const img = item.product?.img?.[0] || item.ticket?.img
  const mine = item.claimed_by === user?.id
  const options = item.selected_options
    ? Object.entries(item.selected_options).map(([k, v]) => `${k}: ${v}`).join(' · ')
    : null

  return (
    <div className="flex items-center gap-3 border border-border rounded-lg p-3">
      {img ? (
        <img src={getImageUrl(img)} alt={name} className="w-12 h-12 rounded object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded bg-secondary shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground truncate">{name}</p>
        {options && <p className="text-xs text-muted-foreground truncate">{options}</p>}
        <p className="text-xs text-muted-foreground">
          {t('agent.queue.bought', { bought: item.bought_quantity, total: item.quantity })}
          {item.actual_cost_thb > 0 && ` · ฿${item.actual_cost_thb.toLocaleString()}`}
        </p>
      </div>

      {item.is_complete ? (
        <span className="badge badge-success shrink-0">
          <Check className="w-3 h-3 mr-1" />
          {t('agent.queue.complete')}
        </span>
      ) : !isDepositPaid(order.payment_status) ? (
        <span className="badge badge-warning shrink-0">{t('agent.queue.awaitingDeposit')}</span>
      ) : !item.claimed_by ? (
        <button onClick={() => claim.mutate(true)} disabled={claim.isPending} className="btn-secondary shrink-0 text-xs px-3 py-1.5">
          {claim.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hand className="w-3.5 h-3.5 mr-1" />}
          {t('agent.queue.claim')}
        </button>
      ) : mine ? (
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onBuy(order, item)} className="btn-primary text-xs px-3 py-1.5">
            <ShoppingBag className="w-3.5 h-3.5 mr-1" />
            {t('agent.queue.buy')}
          </button>
          <button onClick={() => claim.mutate(false)} disabled={claim.isPending} className="btn-icon" title={t('agent.queue.release')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <span className="badge bg-muted text-muted-foreground shrink-0">
          {t('agent.queue.claimedBy', { name: item.claimedBy?.username || '?' })}
        </span>
      )}
    </div>
  )
}

const OrderCard: React.FC<{ order: QueueOrder; onBuy: (o: QueueOrder, i: QueueItem) => void }> = ({ order, onBuy }) => {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const unclaimed = order.items.filter((i) => !i.claimed_by && !i.is_complete)

  const claimAll = useMutation({
    mutationFn: () => api.post('/purchases/claim', { item_ids: unclaimed.map((i) => i.id) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-queue'] }),
    onError: (e: any) => alert(e.response?.data?.message || t('agent.queue.claimFailed'))
  })

  const balance = order.tentative_total - order.customer_paid_thb

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-foreground flex items-center flex-wrap gap-2">
            {order.order_code || `NT-${order.id}`}
            <span className={`badge ${orderStatusBadge(order.status)}`}>{t(`admin.order.status_${order.status}`)}</span>
            <span className={`badge ${paymentStatusBadge(order.payment_status)}`}>{t(`admin.order.payment_${order.payment_status}`)}</span>
            {order.is_fully_purchased && (
              <span className="badge badge-success">{t('agent.queue.allBought')}</span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {order.user?.username} · {fmtDate(order.cdate)}
          </p>
        </div>

        {order.ship && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
            {order.ship.type === 'sea' ? <ShipIcon className="w-4 h-4" /> : <PlaneTakeoff className="w-4 h-4" />}
            {fmtDate(order.ship.ship_date)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-3 border-b border-border">
        <div>
          <p className="stat-row-label text-xs">{t('agent.queue.tentative')}</p>
          <p className="font-semibold text-foreground">฿{order.tentative_total.toLocaleString()}</p>
        </div>
        <div>
          <p className="stat-row-label text-xs">{t('agent.queue.agentSpent')}</p>
          <p className="font-semibold text-foreground">฿{order.agent_spent_thb.toLocaleString()}</p>
        </div>
        <div>
          <p className="stat-row-label text-xs">{t('agent.queue.customerPaid')}</p>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">฿{order.customer_paid_thb.toLocaleString()}</p>
        </div>
        <div>
          <p className="stat-row-label text-xs">{t('agent.queue.balance')}</p>
          <p className={`font-semibold ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
            ฿{balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {order.items.map((item) => (
          <ItemRow key={item.id} order={order} item={item} onBuy={onBuy} />
        ))}
      </div>

      {unclaimed.length > 1 && isDepositPaid(order.payment_status) && (
        <button onClick={() => claimAll.mutate()} disabled={claimAll.isPending} className="btn-secondary w-full justify-center mt-3 text-sm">
          {claimAll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hand className="w-4 h-4 mr-1.5" />}
          {t('agent.queue.claimAll', { count: unclaimed.length })}
        </button>
      )}
    </div>
  )
}

export const AgentDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [buying, setBuying] = useState<{ order: QueueOrder; item: QueueItem } | null>(null)
  const [filter, setFilter] = useState<'all' | 'mine' | 'unclaimed'>('all')

  const { data: queue, isLoading } = useQuery({
    queryKey: ['agent-queue'],
    queryFn: async () => (await api.get('/purchases/queue')).data.data as QueueOrder[]
  })

  const orders = (queue || []).filter((order) => {
    if (filter === 'mine') return order.items.some((i) => i.claimed_by === user?.id)
    if (filter === 'unclaimed') return order.items.some((i) => !i.claimed_by && !i.is_complete)
    return true
  })

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: t('agent.queue.filterAll') },
    { key: 'mine', label: t('agent.queue.filterMine') },
    { key: 'unclaimed', label: t('agent.queue.filterUnclaimed') }
  ]

  return (
    <div className="admin-page">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="admin-page-title">
          <ClipboardList className="w-8 h-8 mr-3" />
          {t('agent.queue.title')}
        </h1>

        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === f.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">{t('agent.queue.empty')}</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onBuy={(o, i) => setBuying({ order: o, item: i })} />
          ))}
        </div>
      )}

      {buying && <PurchaseModal order={buying.order} item={buying.item} onClose={() => setBuying(null)} />}
    </div>
  )
}
