import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Store, Map as MapIcon, Loader2, Plus, Edit2 } from 'lucide-react'
import { api } from '../../services/api'
import { ShoppingAreasMap } from '../../components/home/ShoppingAreasMap'
import { useTranslation } from 'react-i18next'

interface Area {
  id: number
  name_th: string
  name_en: string
  name_jp: string | null
  map_location: string | null
  status: 'active' | 'inactive'
}

interface Shop {
  id: number
  area_id: number
  name_th: string
  name_en: string
  name_jp: string | null
  map_location: string | null
  status: 'active' | 'inactive'
}

export const AdminLocations: React.FC = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'map' | 'shops' | 'areas'>('map')

  // --- Area State ---
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [areaFormData, setAreaFormData] = useState({
    name_en: '',
    name_th: '',
    name_jp: '',
    map_location: '',
    status: 'active'
  })

  // --- Shop State ---
  const [isShopModalOpen, setIsShopModalOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [shopFormData, setShopFormData] = useState({
    area_id: '',
    name_en: '',
    name_th: '',
    name_jp: '',
    map_location: '',
    status: 'active'
  })

  // --- Queries ---
  const { data: areas, isLoading: isAreasLoading } = useQuery({
    queryKey: ['admin', 'areas'],
    queryFn: async () => {
      const res = await api.get('/areas')
      return res.data.data as Area[]
    }
  })

  const { data: shops, isLoading: isShopsLoading } = useQuery({
    queryKey: ['admin', 'shops'],
    queryFn: async () => {
      const res = await api.get('/shops')
      return res.data.data as Shop[]
    }
  })

  // --- Area Mutations ---
  const createAreaMutation = useMutation({
    mutationFn: (data: typeof areaFormData) => api.post('/areas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'areas'] })
      closeAreaModal()
    }
  })

  const updateAreaMutation = useMutation({
    mutationFn: (data: { id: number; payload: typeof areaFormData }) => api.put(`/areas/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'areas'] })
      closeAreaModal()
    }
  })

  // --- Shop Mutations ---
  const createShopMutation = useMutation({
    mutationFn: (data: any) => api.post('/shops', { ...data, area_id: parseInt(data.area_id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] })
      closeShopModal()
    }
  })

  const updateShopMutation = useMutation({
    mutationFn: (data: { id: number; payload: any }) => api.put(`/shops/${data.id}`, { ...data.payload, area_id: parseInt(data.payload.area_id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] })
      closeShopModal()
    }
  })

  // --- Handlers ---
  const openAreaModal = (area?: Area) => {
    if (area) {
      setEditingArea(area)
      setAreaFormData({
        name_en: area.name_en,
        name_th: area.name_th,
        name_jp: area.name_jp || '',
        map_location: area.map_location || '',
        status: area.status || 'active'
      })
    } else {
      setEditingArea(null)
      setAreaFormData({
        name_en: '',
        name_th: '',
        name_jp: '',
        map_location: '',
        status: 'active'
      })
    }
    setIsAreaModalOpen(true)
  }

  const closeAreaModal = () => {
    setIsAreaModalOpen(false)
    setEditingArea(null)
  }

  const openShopModal = (shop?: Shop) => {
    if (shop) {
      setEditingShop(shop)
      setShopFormData({
        area_id: shop.area_id.toString(),
        name_en: shop.name_en,
        name_th: shop.name_th,
        name_jp: shop.name_jp || '',
        map_location: shop.map_location || '',
        status: shop.status || 'active'
      })
    } else {
      setEditingShop(null)
      setShopFormData({
        area_id: areas && areas.length > 0 ? areas[0].id.toString() : '',
        name_en: '',
        name_th: '',
        name_jp: '',
        map_location: '',
        status: 'active'
      })
    }
    setIsShopModalOpen(true)
  }

  const closeShopModal = () => {
    setIsShopModalOpen(false)
    setEditingShop(null)
  }

  const handleAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingArea) {
      updateAreaMutation.mutate({ id: editingArea.id, payload: areaFormData })
    } else {
      createAreaMutation.mutate(areaFormData)
    }
  }

  const handleShopSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingShop) {
      updateShopMutation.mutate({ id: editingShop.id, payload: shopFormData })
    } else {
      createShopMutation.mutate(shopFormData)
    }
  }

  const getAreaName = (areaId: number) => {
    const area = areas?.find((a) => a.id === areaId)
    return area ? area.name_en : 'Unknown'
  }

  return (
    <div className="admin-page space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title">
          <MapPin className="w-8 h-8 mr-3" />
          {t('admin.location.locations_title')}
        </h1>
      </div>

      <div className="flex space-x-4 border-b border-border">
        <button
          onClick={() => setActiveTab('map')}
          className={`tab-btn ${activeTab === 'map' ? 'is-active' : ''}`}
        >
          <MapIcon className="w-4 h-4 inline mr-2" />
          {t('admin.location.tab_map')}
        </button>
        <button
          onClick={() => setActiveTab('shops')}
          className={`tab-btn ${activeTab === 'shops' ? 'is-active' : ''}`}
        >
          <Store className="w-4 h-4 inline mr-2" />
          {t('admin.location.tab_shops')}
        </button>
        <button
          onClick={() => setActiveTab('areas')}
          className={`tab-btn ${activeTab === 'areas' ? 'is-active' : ''}`}
        >
          <MapPin className="w-4 h-4 inline mr-2" />
          {t('admin.location.tab_areas')}
        </button>
      </div>

      {/* --- Map Tab --- */}
      {activeTab === 'map' && (
        <div className="card-panel-flush p-4">
          <ShoppingAreasMap />
        </div>
      )}

      {/* --- Shops Tab --- */}
      {activeTab === 'shops' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{t('admin.location.shops_desc')}</p>
            <button
              onClick={() => openShopModal()}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.location.add_shop')}
            </button>
          </div>

          {isShopsLoading ? (
            <div className="loading-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="table-container">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="table-head">
                    <tr>
                      <th className="table-th">{t('admin.location.id')}</th>
                      <th className="table-th">{t('admin.location.tab_areas')}</th>
                      <th className="table-th">{t('admin.location.name_en')}</th>
                      <th className="table-th">{t('admin.location.name_th')}</th>
                      <th className="table-th">{t('admin.location.name_jp')}</th>
                      <th className="table-th">{t('admin.location.status')}</th>
                      <th className="table-th text-right">{t('admin.location.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shops?.map((shop) => (
                      <tr
                        key={shop.id}
                        className="table-row"
                      >
                        <td className="table-td font-medium text-foreground">#{shop.id}</td>
                        <td className="table-td">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{getAreaName(shop.area_id)}</span>
                        </td>
                        <td className="table-td">{shop.name_en}</td>
                        <td className="table-td">{shop.name_th}</td>
                        <td className="table-td">{shop.name_jp || '-'}</td>
                        <td className="table-td">
                          <select
                            value={shop.status}
                            onChange={(e) => {
                              updateShopMutation.mutate({ id: shop.id, payload: { ...shop, status: e.target.value as 'active' | 'inactive' } })
                            }}
                            className="input-inline-select"
                          >
                            <option value="active">{t('admin.location.status_active')}</option>
                            <option value="inactive">{t('admin.location.status_inactive')}</option>
                          </select>
                        </td>
                        <td className="table-td text-right space-x-2">
                          <button
                            onClick={() => openShopModal(shop)}
                            className="btn-icon"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!shops || shops.length === 0) && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-8 text-center text-muted-foreground"
                        >
                          {t('admin.location.no_shops')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Areas Tab --- */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{t('admin.location.areas_desc')}</p>
            <button
              onClick={() => openAreaModal()}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.location.add_area')}
            </button>
          </div>

          {isAreasLoading ? (
            <div className="loading-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="table-container">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="table-head">
                    <tr>
                      <th className="table-th">{t('admin.location.id')}</th>
                      <th className="table-th">{t('admin.location.name_en')}</th>
                      <th className="table-th">{t('admin.location.name_th')}</th>
                      <th className="table-th">{t('admin.location.name_jp')}</th>
                      <th className="table-th">{t('admin.location.coordinates')}</th>
                      <th className="table-th">{t('admin.location.status')}</th>
                      <th className="table-th text-right">{t('admin.location.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {areas?.map((area) => (
                      <tr
                        key={area.id}
                        className="table-row"
                      >
                        <td className="table-td font-medium text-foreground">#{area.id}</td>
                        <td className="table-td">{area.name_en}</td>
                        <td className="table-td">{area.name_th}</td>
                        <td className="table-td">{area.name_jp || '-'}</td>
                        <td className="table-td">
                          {area.map_location ? (
                            <div className="flex items-center text-primary text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {area.map_location}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="table-td">
                          <select
                            value={area.status}
                            onChange={(e) => {
                              updateAreaMutation.mutate({
                                id: area.id,
                                payload: {
                                  ...area,
                                  name_jp: area.name_jp || '',
                                  map_location: area.map_location || '',
                                  status: e.target.value as 'active' | 'inactive'
                                }
                              })
                            }}
                            className="input-inline-select"
                          >
                            <option value="active">{t('admin.location.status_active')}</option>
                            <option value="inactive">{t('admin.location.status_inactive')}</option>
                          </select>
                        </td>
                        <td className="table-td text-right space-x-2">
                          <button
                            onClick={() => openAreaModal(area)}
                            className="btn-icon"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!areas || areas.length === 0) && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-8 text-center text-muted-foreground"
                        >
                          {t('admin.location.no_areas')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Shop Modal --- */}
      {isShopModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="text-xl font-bold text-foreground">{editingShop ? t('admin.location.edit_shop') : t('admin.location.new_shop')}</h2>
            </div>
            <div className="p-6 overflow-y-auto">
              <form
                id="shop-form"
                onSubmit={handleShopSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="label-modal">{t('admin.location.tab_areas')} *</label>
                  <select
                    required
                    value={shopFormData.area_id}
                    onChange={(e) => setShopFormData({ ...shopFormData, area_id: e.target.value })}
                    className="input-modal"
                  >
                    <option
                      value=""
                      disabled
                    >
                      {t('admin.location.select_area')}
                    </option>
                    {areas?.map((area) => (
                      <option
                        key={area.id}
                        value={area.id}
                      >
                        {area.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-modal">{t('admin.location.shop_name_en')}</label>
                  <input
                    type="text"
                    required
                    value={shopFormData.name_en}
                    onChange={(e) => setShopFormData({ ...shopFormData, name_en: e.target.value })}
                    className="input-modal"
                  />
                </div>
                <div>
                  <label className="label-modal">{t('admin.location.shop_name_th')}</label>
                  <input
                    type="text"
                    required
                    value={shopFormData.name_th}
                    onChange={(e) => setShopFormData({ ...shopFormData, name_th: e.target.value })}
                    className="input-modal"
                  />
                </div>
                <div>
                  <label className="label-modal">{t('admin.location.shop_name_jp')}</label>
                  <input
                    type="text"
                    value={shopFormData.name_jp}
                    onChange={(e) => setShopFormData({ ...shopFormData, name_jp: e.target.value })}
                    className="input-modal"
                  />
                </div>
                <div>
                  <label className="label-modal">{t('admin.location.map_url_coords')}</label>
                  <input
                    type="text"
                    value={shopFormData.map_location}
                    onChange={(e) => setShopFormData({ ...shopFormData, map_location: e.target.value })}
                    className="input-modal"
                  />
                </div>
                <div>
                  <label className="label-modal">{t('admin.location.status')}</label>
                  <select
                    value={shopFormData.status}
                    onChange={(e) => setShopFormData({ ...shopFormData, status: e.target.value as 'active' | 'inactive' })}
                    className="input-modal"
                  >
                    <option value="active">{t('admin.location.status_active')}</option>
                    <option value="inactive">{t('admin.location.status_inactive')}</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={closeShopModal}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('admin.location.cancel')}
              </button>
              <button
                type="submit"
                form="shop-form"
                disabled={createShopMutation.isPending || updateShopMutation.isPending || isAreasLoading}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {(createShopMutation.isPending || updateShopMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingShop ? t('admin.location.save_changes') : t('admin.location.create_shop')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Area Modal --- */}
      {isAreaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="text-xl font-bold text-foreground">{editingArea ? t('admin.location.edit_area') : t('admin.location.new_area')}</h2>
            </div>
            <div className="p-6 overflow-y-auto">
              <form
                id="area-form"
                onSubmit={handleAreaSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="label-modal">{t('admin.location.area_name_en')}</label>
                  <input
                    type="text"
                    required
                    value={areaFormData.name_en}
                    onChange={(e) => setAreaFormData({ ...areaFormData, name_en: e.target.value })}
                    className="input-modal"
                  />
                </div>
                <div>
                  <label className="label-modal">{t('admin.location.area_name_th')}</label>
                  <input
                    type="text"
                    required
                    value={areaFormData.name_th}
                    onChange={(e) => setAreaFormData({ ...areaFormData, name_th: e.target.value })}
                    className="input-modal"
                  />
                </div>
                <div>
                  <label className="label-modal">{t('admin.location.area_name_jp')}</label>
                  <input
                    type="text"
                    value={areaFormData.name_jp}
                    onChange={(e) => setAreaFormData({ ...areaFormData, name_jp: e.target.value })}
                    className="input-modal"
                  />
                </div>
                <div>
                  <label className="label-modal">{t('admin.location.map_coords')}</label>
                  <input
                    type="text"
                    placeholder="e.g. 35.6595,139.7004"
                    value={areaFormData.map_location}
                    onChange={(e) => setAreaFormData({ ...areaFormData, map_location: e.target.value })}
                    className="input-modal"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('admin.location.map_coords_desc')}</p>
                </div>
                <div>
                  <label className="label-modal">{t('admin.location.status')}</label>
                  <select
                    value={areaFormData.status}
                    onChange={(e) => setAreaFormData({ ...areaFormData, status: e.target.value as 'active' | 'inactive' })}
                    className="input-modal"
                  >
                    <option value="active">{t('admin.location.status_active')}</option>
                    <option value="inactive">{t('admin.location.status_inactive')}</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={closeAreaModal}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('admin.location.cancel')}
              </button>
              <button
                type="submit"
                form="area-form"
                disabled={createAreaMutation.isPending || updateAreaMutation.isPending}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {(createAreaMutation.isPending || updateAreaMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingArea ? t('admin.location.save_changes') : t('admin.location.create_area')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
