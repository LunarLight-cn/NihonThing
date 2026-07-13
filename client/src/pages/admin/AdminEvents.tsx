import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Calendar, Plus, Loader2, Save, X, Image as ImageIcon, Edit2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SearchableSelect } from '../../components/admin/SearchableSelect'

interface EventData {
  id: number
  title_en: string
  title_th: string
  title_jp: string
  desc_en: string
  desc_th: string
  desc_jp: string
  start_date: string
  end_date: string
  banner_img: string
  trip_id: number | null
  area_id: number | null
  shop_id: number | null
}

interface OptionData {
  id: number
  name_en?: string
  type?: string
  ship_date?: string
}

export const AdminEvents: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const res = await api.get('/events')
      return res.data.data as EventData[]
    }
  })

  const { data: trips } = useQuery({
    queryKey: ['admin-trips-options'],
    queryFn: async () => {
      const res = await api.get('/ships')
      return res.data.data as OptionData[]
    }
  })

  const { data: areas } = useQuery({
    queryKey: ['admin-areas-options'],
    queryFn: async () => {
      const res = await api.get('/areas')
      return res.data.data as OptionData[]
    }
  })

  const { data: shops } = useQuery({
    queryKey: ['admin-shops-options'],
    queryFn: async () => {
      const res = await api.get('/shops')
      return res.data.data as OptionData[]
    }
  })

  const addEventMutation = useMutation({
    mutationFn: (newEvent: Partial<EventData>) => api.post('/events', newEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      setIsAdding(false)
    }
  })

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    }
  })

  const editEventMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EventData> }) => api.put(`/events/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      setIsAdding(false)
      setEditingEventId(null)
    }
  })

  const [form, setForm] = useState({
    title_en: '',
    title_th: '',
    title_jp: '',
    desc_en: '',
    desc_th: '',
    desc_jp: '',
    start_date: '',
    end_date: '',
    banner_img: '',
    trip_id: '' as number | string,
    area_id: '' as number | string,
    shop_id: '' as number | string
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.success) {
        setForm((prev) => ({ ...prev, banner_img: res.data.url }))
      }
    } catch (error) {
      console.error('Upload failed', error)
      alert('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const columns: ColumnDef<EventData>[] = [
    { accessorKey: 'id', header: t('admin.events.id') },
    {
      accessorKey: 'banner_img',
      header: t('admin.events.banner_image'),
      cell: ({ row }) => (
        <div className="w-16 h-10 rounded-md overflow-hidden bg-secondary flex items-center justify-center">
          {row.original.banner_img ? (
            <img
              src={row.original.banner_img}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      )
    },
    { accessorKey: 'title_en', header: t('admin.events.title_en') },
    { accessorKey: 'title_th', header: t('admin.events.title_th') },
    { accessorKey: 'title_jp', header: t('admin.events.title_jp') },
    {
      id: 'trip',
      header: t('admin.events.trip'),
      cell: ({ row }) => {
        const trip = trips?.find((t) => t.id === row.original.trip_id)
        return trip ? `${trip.type} - ${trip.ship_date ? new Date(trip.ship_date).toLocaleDateString() : ''}` : '-'
      }
    },
    {
      id: 'area',
      header: t('admin.events.area'),
      cell: ({ row }) => {
        const area = areas?.find((a) => a.id === row.original.area_id)
        return area ? area.name_en : '-'
      }
    },
    {
      id: 'shop',
      header: t('admin.events.shop'),
      cell: ({ row }) => {
        const shop = shops?.find((s) => s.id === row.original.shop_id)
        return shop ? shop.name_en : '-'
      }
    },
    {
      accessorKey: 'start_date',
      header: t('admin.events.start_date'),
      cell: ({ row }) => new Date(row.original.start_date).toLocaleDateString()
    },
    {
      accessorKey: 'end_date',
      header: t('admin.events.end_date'),
      cell: ({ row }) => (row.original.end_date ? new Date(row.original.end_date).toLocaleDateString() : '-')
    },
    {
      id: 'actions',
      header: t('admin.events.actions'),
      cell: ({ row }) => (
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setForm({
                title_en: row.original.title_en || '',
                title_th: row.original.title_th || '',
                title_jp: row.original.title_jp || '',
                desc_en: row.original.desc_en || '',
                desc_th: row.original.desc_th || '',
                desc_jp: row.original.desc_jp || '',
                start_date: row.original.start_date ? new Date(row.original.start_date).toISOString().split('T')[0] : '',
                end_date: row.original.end_date ? new Date(row.original.end_date).toISOString().split('T')[0] : '',
                banner_img: row.original.banner_img || '',
                trip_id: row.original.trip_id || '',
                area_id: row.original.area_id || '',
                shop_id: row.original.shop_id || ''
              })
              setEditingEventId(row.original.id)
              setIsAdding(true)
            }}
            className="btn-icon"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(t('admin.events.confirm_delete'))) {
                deleteEventMutation.mutate(row.original.id)
              }
            }}
            className="btn-icon-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="admin-page">
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title">
          <Calendar className="w-8 h-8 mr-3" />
          {t('admin.events.events_title')}
        </h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary"
        >
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? t('admin.events.cancel') : t('admin.events.add_event')}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const payload = Object.fromEntries(Object.entries(form).filter(([_, v]) => v !== ''))
            if (editingEventId) {
              editEventMutation.mutate({ id: editingEventId, payload })
            } else {
              addEventMutation.mutate(payload)
            }
          }}
          className="card-panel space-y-4"
        >
          <h2 className="text-xl font-bold">{editingEventId ? t('admin.events.edit_event') : t('admin.events.new_event')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-admin">{t('admin.events.title_en')}</label>
              <input
                required
                type="text"
                value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                className="input-admin"
              />
            </div>
            <div>
              <label className="label-admin">{t('admin.events.title_th')}</label>
              <input
                type="text"
                value={form.title_th}
                onChange={(e) => setForm({ ...form, title_th: e.target.value })}
                className="input-admin"
              />
            </div>
            <div>
              <label className="label-admin">{t('admin.events.title_jp')}</label>
              <input
                type="text"
                value={form.title_jp}
                onChange={(e) => setForm({ ...form, title_jp: e.target.value })}
                className="input-admin"
              />
            </div>
            <div>
              <label className="label-admin">{t('admin.events.desc_en')}</label>
              <input
                type="text"
                value={form.desc_en}
                onChange={(e) => setForm({ ...form, desc_en: e.target.value })}
                className="input-admin"
              />
            </div>
            <div>
              <label className="label-admin">{t('admin.events.desc_th')}</label>
              <input
                type="text"
                value={form.desc_th}
                onChange={(e) => setForm({ ...form, desc_th: e.target.value })}
                className="input-admin"
              />
            </div>
            <div>
              <label className="label-admin">{t('admin.events.desc_jp')}</label>
              <input
                type="text"
                value={form.desc_jp}
                onChange={(e) => setForm({ ...form, desc_jp: e.target.value })}
                className="input-admin"
              />
            </div>
            <div>
              <label className="label-admin">{t('admin.events.start_date')}</label>
              <input
                required
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="input-admin"
              />
            </div>
            <div>
              <label className="label-admin">{t('admin.events.end_date')}</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="input-admin"
              />
            </div>
            <div>
              <label className="label-admin">{t('admin.events.trip')}</label>
              <SearchableSelect
                options={(trips || []).map((t) => ({ id: t.id, label: `${t.type} - ${t.ship_date ? new Date(t.ship_date).toLocaleDateString() : ''}` }))}
                value={form.trip_id}
                onChange={(val) => setForm({ ...form, trip_id: val })}
                placeholder={t('admin.events.select_trip')}
              />
            </div>
            <div>
              <label className="label-admin">{t('admin.events.area')}</label>
              <SearchableSelect
                options={(areas || []).map((a) => ({ id: a.id, label: a.name_en || `Area ${a.id}` }))}
                value={form.area_id}
                onChange={(val) => setForm({ ...form, area_id: val })}
                placeholder={t('admin.events.select_area')}
              />
            </div>
            <div>
              <label className="label-admin">{t('admin.events.shop')}</label>
              <SearchableSelect
                options={(shops || []).filter((s) => !form.area_id || (s as any).area_id === form.area_id).map((s) => ({ id: s.id, label: s.name_en || `Shop ${s.id}` }))}
                value={form.shop_id}
                onChange={(val) => setForm({ ...form, shop_id: val })}
                placeholder={t('admin.events.select_shop')}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="label-admin">{t('admin.events.banner_image')}</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="file-upload"
                />
                {isUploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              </div>
              {form.banner_img && (
                <img
                  src={form.banner_img}
                  alt="Preview"
                  className="mt-2 h-32 rounded-md border border-border object-cover"
                />
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addEventMutation.isPending || isUploading}
              className="btn-primary px-6"
            >
              {addEventMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {t('admin.events.save_event')}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={events || []}
          searchKey="title_en"
          searchPlaceholder={t('admin.events.search_events')}
        />
      )}
    </div>
  )
}
