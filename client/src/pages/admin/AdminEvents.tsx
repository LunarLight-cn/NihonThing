import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { DataTable } from '../../components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Calendar, Plus, Loader2, Save, X, Image as ImageIcon, Edit2, Trash2 } from 'lucide-react'

interface EventData {
  id: number
  title_en: string
  title_th: string
  title_jp: string
  desc_en: string
  start_date: string
  end_date: string
  banner_img: string
}

export const AdminEvents: React.FC = () => {
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
    start_date: '',
    end_date: '',
    banner_img: ''
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
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'banner_img',
      header: 'Banner',
      cell: ({ row }) => (
        <div className="w-16 h-10 rounded-md overflow-hidden bg-secondary flex items-center justify-center">
          {row.original.banner_img ? (
            <img src={row.original.banner_img} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      )
    },
    { accessorKey: 'title_en', header: 'Title (EN)' },
    {
      accessorKey: 'start_date',
      header: 'Start Date',
      cell: ({ row }) => new Date(row.original.start_date).toLocaleDateString()
    },
    {
      accessorKey: 'end_date',
      header: 'End Date',
      cell: ({ row }) => (row.original.end_date ? new Date(row.original.end_date).toLocaleDateString() : '-')
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setForm({
                title_en: row.original.title_en || '',
                title_th: row.original.title_th || '',
                title_jp: row.original.title_jp || '',
                desc_en: row.original.desc_en || '',
                start_date: row.original.start_date ? new Date(row.original.start_date).toISOString().split('T')[0] : '',
                end_date: row.original.end_date ? new Date(row.original.end_date).toISOString().split('T')[0] : '',
                banner_img: row.original.banner_img || ''
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
              if (window.confirm('Are you sure you want to delete this event?')) {
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
          Events & Promotions
        </h1>
        <button onClick={() => setIsAdding(!isAdding)} className="btn-primary">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Event'}
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
          <h2 className="text-xl font-bold">{editingEventId ? 'Edit Event' : 'New Event'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-admin">Title (EN)</label>
              <input required type="text" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="input-admin" />
            </div>
            <div>
              <label className="label-admin">Description (EN)</label>
              <input type="text" value={form.desc_en} onChange={(e) => setForm({ ...form, desc_en: e.target.value })} className="input-admin" />
            </div>
            <div>
              <label className="label-admin">Start Date</label>
              <input required type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-admin" />
            </div>
            <div>
              <label className="label-admin">End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-admin" />
            </div>
            <div className="col-span-2">
              <label className="label-admin">Banner Image</label>
              <div className="flex items-center space-x-4">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="file-upload" />
                {isUploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              </div>
              {form.banner_img && (
                <img src={form.banner_img} alt="Preview" className="mt-2 h-32 rounded-md border border-border object-cover" />
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={addEventMutation.isPending || isUploading} className="btn-primary px-6">
              {addEventMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Event
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="loading-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={events || []} searchKey="title_en" searchPlaceholder="Search events..." />
      )}
    </div>
  )
}
