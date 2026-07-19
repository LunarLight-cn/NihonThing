import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Plane, Plus, Loader2, Edit2, Save, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocalizedName } from '../../utils/localization'

type TripFillAxis = 'items' | 'weight' | 'price'
interface TripAxis {
  axis: TripFillAxis
  percent: number
  current: number
  max: number
}
interface Trip {
  id: number
  type: string
  ship_date: string
  close_date: string
  status: 'open' | 'closed' | 'in_transit' | 'arrived'
  // Capacity caps — 0 means that axis is unlimited
  max_cap: number
  current_cap: number
  max_items: number
  current_items: number
  max_price: number
  current_price: number
  axes?: TripAxis[]
  fill?: TripAxis | null
}

interface Country {
  id: number
  name_en: string
  name_th: string | null
  name_jp: string | null
}

export const AdminTrips: React.FC = () => {
  const { t } = useTranslation()
  const localizedName = useLocalizedName()
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [editingTripId, setEditingTripId] = useState<number | null>(null)

  const { data: trips, isLoading } = useQuery({
    queryKey: ['admin-trips'],
    queryFn: async () => {
      const res = await api.get('/ships')
      return res.data.data as Trip[]
    }
  })

  const { data: countries } = useQuery({
    queryKey: ['admin-countries'],
    queryFn: async () => (await api.get('/locations/countries')).data.data as Country[]
  })

  const addTripMutation = useMutation({
    mutationFn: (newTrip: Partial<Trip>) => api.post('/ships', newTrip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] })
      // Customers read trips under ['ships'] (Home schedule, Checkout picker).
      queryClient.invalidateQueries({ queryKey: ['ships'] })
      setIsAdding(false)
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/ships/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] })
      // Customers read trips under ['ships'] (Home schedule, Checkout picker).
      queryClient.invalidateQueries({ queryKey: ['ships'] })
    }
  })

  const editTripMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Trip> }) => api.put(`/ships/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] })
      // Customers read trips under ['ships'] (Home schedule, Checkout picker).
      queryClient.invalidateQueries({ queryKey: ['ships'] })
      setIsAdding(false)
      setEditingTripId(null)
    }
  })

  const columns: ColumnDef<Trip>[] = [
    { accessorKey: 'id', header: t('admin.trips.id') },
    { accessorKey: 'type', header: t('admin.trips.type') },
    {
      accessorKey: 'ship_date',
      header: t('admin.trips.ship_date'),
      cell: ({ row }) => new Date(row.original.ship_date).toLocaleDateString()
    },
    {
      accessorKey: 'close_date',
      header: t('admin.trips.close_date'),
      cell: ({ row }) => (row.original.close_date ? new Date(row.original.close_date).toLocaleDateString() : '-')
    },
    {
      accessorKey: 'status',
      header: t('admin.trips.status'),
      cell: ({ row }) => {
        const status = row.original.status
        // Once a trip has departed its status belongs to the Shipping board
        // (depart/arrive move the orders too) - only open/closed flip here.
        if (status === 'in_transit' || status === 'arrived') {
          return (
            <span className={`badge ${status === 'in_transit' ? 'badge-blue' : 'badge-purple'}`}>
              {t(`admin.trips.status_${status}`)}
            </span>
          )
        }
        return (
          <select
            value={status}
            onChange={(e) => updateStatusMutation.mutate({ id: row.original.id, status: e.target.value })}
            className={`text-xs px-2 py-1 rounded-full font-medium ${status === 'open' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} border-0 cursor-pointer`}
          >
            <option value="open">{t('admin.trips.status_open')}</option>
            <option value="closed">{t('admin.trips.status_closed')}</option>
          </select>
        )
      }
    },
    {
      accessorKey: 'max_cap',
      header: t('admin.trips.capacity'),
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="text-xs space-y-0.5 whitespace-nowrap">
            <div>{r.current_items || 0} / {r.max_items || '∞'} {t('admin.trips.items_unit')}</div>
            <div>{r.current_cap || 0} / {r.max_cap || '∞'} kg</div>
            <div>฿{(r.current_price || 0).toLocaleString()} / {r.max_price ? `฿${r.max_price.toLocaleString()}` : '∞'}</div>
            {r.fill && (
              <div className="font-semibold text-primary">
                {t('admin.trips.fill_pct', { pct: r.fill.percent, axis: t(`admin.trips.axis_${r.fill.axis}`) })}
              </div>
            )}
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: t('admin.trips.actions'),
      cell: ({ row }) => (
        <button
          onClick={() => {
            setNewTripForm({
              type: row.original.type || 'flight',
              ship_date: row.original.ship_date ? new Date(row.original.ship_date).toISOString().split('T')[0] : '',
              close_date: row.original.close_date ? new Date(row.original.close_date).toISOString().split('T')[0] : '',
              max_cap: row.original.max_cap || 0,
              max_items: row.original.max_items || 0,
              max_price: row.original.max_price || 0,
              origin_id: (row.original as any).origin_id || 2,
              destination_id: (row.original as any).destination_id || 1
            })
            setEditingTripId(row.original.id)
            setIsAdding(true)
            // The form renders above the table — bring it into view, otherwise
            // clicking edit on a lower row looks like nothing happened.
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="btn-icon"
          title={t('admin.trips.edit_trip')}
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )
    }
  ]

  const [newTripForm, setNewTripForm] = useState({
    type: 'flight',
    ship_date: '',
    close_date: '',
    max_cap: 30,
    max_items: 0,
    max_price: 0,
    origin_id: 2, // JP
    destination_id: 1 // TH
  })

  // The trip currently being edited — shown in the form header so it's obvious
  // which trip the form belongs to.
  const editingTrip = editingTripId ? trips?.find((tr) => tr.id === editingTripId) : undefined

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTripId) {
      editTripMutation.mutate({ id: editingTripId, payload: newTripForm })
    } else {
      addTripMutation.mutate(newTripForm)
    }
  }

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title">
          <Plane className="w-8 h-8 mr-3" />
          {t('admin.trips.trips_title')}
        </h1>
        <button onClick={() => setIsAdding(!isAdding)} className="btn-primary">
          {isAdding ? <><X className="w-4 h-4 mr-2" /> {t('admin.trips.cancel')}</> : <><Plus className="w-4 h-4 mr-2" /> {t('admin.trips.add_trip')}</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="card-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <h2 className="text-xl font-bold">
              {editingTrip
                ? `${t('admin.trips.edit_trip')} #${editingTrip.id}`
                : t('admin.trips.add_trip')}
            </h2>
            {editingTrip && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="badge badge-info normal-case">
                  {editingTrip.type === 'sea' ? t('admin.trips.sea_freight') : t('admin.trips.flight')}
                </span>
                <span>{t('admin.trips.ship_date')}: {new Date(editingTrip.ship_date).toLocaleDateString()}</span>
                {editingTrip.fill && (
                  <span className="badge badge-muted normal-case">
                    {t('admin.trips.fill_pct', { pct: editingTrip.fill.percent, axis: t(`admin.trips.axis_${editingTrip.fill.axis}`) })}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 form-section-divider">{t('admin.trips.schedule_title')}</div>
            <div>
              <label className="label-admin">{t('admin.trips.type')}</label>
              <select value={newTripForm.type} onChange={(e) => setNewTripForm({ ...newTripForm, type: e.target.value })} className="input-admin">
                <option value="flight">{t('admin.trips.flight')}</option>
                <option value="sea">{t('admin.trips.sea_freight')}</option>
              </select>
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.origin')}</label>
              <select value={newTripForm.origin_id} onChange={(e) => setNewTripForm({ ...newTripForm, origin_id: Number(e.target.value) })} className="input-admin">
                {countries?.map((cty) => <option key={cty.id} value={cty.id}>{localizedName(cty)}</option>)}
              </select>
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.destination')}</label>
              <select value={newTripForm.destination_id} onChange={(e) => setNewTripForm({ ...newTripForm, destination_id: Number(e.target.value) })} className="input-admin">
                {countries?.map((cty) => <option key={cty.id} value={cty.id}>{localizedName(cty)}</option>)}
              </select>
            </div>
            <div className="hidden md:block" />
            <div>
              <label className="label-admin">{t('admin.trips.ship_date')}</label>
              <input type="date" required value={newTripForm.ship_date} onChange={(e) => setNewTripForm({ ...newTripForm, ship_date: e.target.value })} className="input-admin" />
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.close_date')}</label>
              <input type="date" required value={newTripForm.close_date} onChange={(e) => setNewTripForm({ ...newTripForm, close_date: e.target.value })} className="input-admin" />
            </div>

            <div className="md:col-span-2 form-section-divider">{t('admin.trips.caps_title')}</div>
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground -mt-2">{t('admin.trips.caps_hint')}</p>
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.max_items')}</label>
              <input type="number" min="0" step="1" value={newTripForm.max_items} onChange={(e) => setNewTripForm({ ...newTripForm, max_items: Number(e.target.value) })} className="input-admin" />
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.max_price')}</label>
              <input type="number" min="0" step="1" value={newTripForm.max_price} onChange={(e) => setNewTripForm({ ...newTripForm, max_price: Number(e.target.value) })} className="input-admin" />
            </div>
            <div>
              <label className="label-admin">{t('admin.trips.max_cap')}</label>
              <input type="number" step="0.1" value={newTripForm.max_cap} onChange={(e) => setNewTripForm({ ...newTripForm, max_cap: Number(e.target.value) })} className="input-admin" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={addTripMutation.isPending} className="btn-primary px-6">
              {addTripMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('admin.trips.save')}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={trips || []} searchKey="type" searchPlaceholder={t('admin.trips.search_trips')} />
      )}
    </div>
  )
}
