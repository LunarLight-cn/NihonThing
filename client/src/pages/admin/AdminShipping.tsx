import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Send, Loader2, PlaneTakeoff, Ship as ShipIcon, ArrowRightLeft, Ban, Anchor } from 'lucide-react'
import { api } from '../../services/api'
import { orderStatusBadge, paymentStatusBadge } from '../../utils/status'

interface BoardOrder {
  id: number
  order_code?: string | null
  status: string
  payment_status: string
  item_price_total?: number
  user?: { id: number; username: string } | null
  items: { id: number; quantity: number }[]
}

interface BoardTrip {
  id: number
  type: string
  ship_date: string
  status: string
  orders: BoardOrder[]
  ready_count: number
  unpaid_count: number
  shipped_count: number
}

interface Board {
  unpaid_move_days: number
  overdue_cancel_days: number
  trips: BoardTrip[]
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString()

export const AdminShipping: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [report, setReport] = useState<string | null>(null)

  const { data: board, isLoading } = useQuery({
    queryKey: ['admin-shipping'],
    queryFn: async () => (await api.get('/shipping/board')).data.data as Board
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-shipping'] })
    qc.invalidateQueries({ queryKey: ['admin-orders'] })
    qc.invalidateQueries({ queryKey: ['admin-trips'] })
    qc.invalidateQueries({ queryKey: ['ships'] })
    qc.invalidateQueries({ queryKey: ['my-orders'] })
  }

  const act = useMutation({
    mutationFn: async ({ url }: { url: string; describe: (data: any) => string }) => (await api.post(url)).data.data,
    onSuccess: (data, vars) => {
      setReport(vars.describe(data))
      refresh()
    },
    onError: (e: any) => setReport(e.response?.data?.message || t('admin.shipping.actionFailed'))
  })

  const confirmThen = (message: string, url: string, describe: (data: any) => string) => {
    if (!confirm(message)) return
    act.mutate({ url, describe })
  }

  return (
    <div className="admin-page">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="admin-page-title">
          <Send className="w-8 h-8 mr-3" />
          {t('admin.shipping.title')}
        </h1>

        <div className="flex gap-2">
          <button
            onClick={() =>
              confirmThen(
                t('admin.shipping.confirmMoveUnpaid', { days: board?.unpaid_move_days ?? '-' }),
                '/shipping/move-unpaid',
                (rows) => t('admin.shipping.movedReport', { count: rows.length })
              )
            }
            disabled={act.isPending}
            className="btn-secondary"
          >
            <ArrowRightLeft className="w-4 h-4 mr-1.5" />
            {t('admin.shipping.moveUnpaid')}
          </button>
          <button
            onClick={() =>
              confirmThen(
                t('admin.shipping.confirmCancelOverdue', { days: board?.overdue_cancel_days ?? '-' }),
                '/shipping/cancel-overdue',
                (rows) => t('admin.shipping.cancelledReport', { count: rows.length })
              )
            }
            disabled={act.isPending}
            className="btn-secondary text-destructive"
          >
            <Ban className="w-4 h-4 mr-1.5" />
            {t('admin.shipping.cancelOverdue')}
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('admin.shipping.rules', {
          moveDays: board?.unpaid_move_days ?? '-',
          cancelDays: board?.overdue_cancel_days ?? '-'
        })}
      </p>

      {report && <div className="bg-primary/5 border border-primary/20 text-sm rounded-lg px-4 py-3">{report}</div>}

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !board || board.trips.length === 0 ? (
        <div className="empty-state">{t('admin.shipping.empty')}</div>
      ) : (
        <div className="space-y-4">
          {board.trips.map((trip) => (
            <div key={trip.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  {trip.type === 'sea' ? <ShipIcon className="w-5 h-5 text-primary" /> : <PlaneTakeoff className="w-5 h-5 text-primary" />}
                  {t('admin.shipping.tripLabel', { id: trip.id, date: fmtDate(trip.ship_date) })}
                  <span className={`badge ${trip.status === 'in_transit' ? 'badge-blue' : trip.status === 'open' ? 'badge-success' : 'badge-muted'}`}>
                    {t(`admin.trips.status_${trip.status}`)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {t('admin.shipping.counts', { ready: trip.ready_count, unpaid: trip.unpaid_count, shipped: trip.shipped_count })}
                  </span>
                  {trip.status !== 'in_transit' ? (
                    <button
                      onClick={() =>
                        confirmThen(
                          t('admin.shipping.confirmDepart', { unpaid: trip.unpaid_count }),
                          `/shipping/trips/${trip.id}/depart`,
                          (r) => t('admin.shipping.departReport', { shipped: r.shipped, left: r.left_behind })
                        )
                      }
                      disabled={act.isPending || trip.ready_count === 0}
                      className="btn-primary text-sm px-3 py-1.5"
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      {t('admin.shipping.depart')}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        confirmThen(
                          t('admin.shipping.confirmArrive'),
                          `/shipping/trips/${trip.id}/arrive`,
                          (r) => t('admin.shipping.arriveReport', { count: r.arrived })
                        )
                      }
                      disabled={act.isPending}
                      className="btn-primary text-sm px-3 py-1.5"
                    >
                      <Anchor className="w-4 h-4 mr-1.5" />
                      {t('admin.shipping.arrive')}
                    </button>
                  )}
                </div>
              </div>

              {trip.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('admin.shipping.noOrders')}</p>
              ) : (
                <div className="space-y-1.5">
                  {trip.orders.map((order) => (
                    <div key={order.id} className="flex flex-wrap items-center gap-2 text-sm border border-border rounded-lg px-3 py-2">
                      <span className="font-mono text-xs">{order.order_code || `NT-${order.id}`}</span>
                      <span className="text-muted-foreground">{order.user?.username}</span>
                      <span className="text-muted-foreground">
                        {t('admin.shipping.itemCount', { count: order.items.reduce((s, i) => s + (i.quantity || 0), 0) })}
                      </span>
                      <span className="ml-auto flex gap-1.5">
                        <span className={`badge ${orderStatusBadge(order.status)}`}>{t(`admin.order.status_${order.status}`)}</span>
                        <span className={`badge ${paymentStatusBadge(order.payment_status)}`}>{t(`admin.order.payment_${order.payment_status}`)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
