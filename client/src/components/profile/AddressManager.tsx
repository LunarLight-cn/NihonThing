import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Plus, Edit2, Trash2, MapPin, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SearchableSelect } from './SearchableSelect'

interface Address {
  id: number
  title?: string
  fullname: string
  surname: string
  tel: string
  address_line: string
  subdistrict_id: number
  tag?: string
}

interface Location {
  id: number
  name_th: string
  name_en: string
}

interface AddressManagerProps {
  // Checkout embeds this as an inline add form: no header, no list, form open
  // from the start, and a callback to close/refresh the parent on save.
  hideHeader?: boolean
  hideList?: boolean
  defaultOpen?: boolean
  onSaved?: () => void
  onCancel?: () => void
}

export const AddressManager: React.FC<AddressManagerProps> = ({ hideHeader, hideList, defaultOpen, onSaved, onCancel }) => {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language === 'en'

  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(!!defaultOpen)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    fullname: '',
    surname: '',
    tel: '',
    address_line: '',
    subdistrict_id: 0,
    tag: ''
  })

  // Location Data
  const [provinces, setProvinces] = useState<Location[]>([])
  const [districts, setDistricts] = useState<Location[]>([])
  const [subdistricts, setSubdistricts] = useState<Location[]>([])

  const [selectedProvince, setSelectedProvince] = useState<number>(0)
  const [selectedDistrict, setSelectedDistrict] = useState<number>(0)

  useEffect(() => {
    fetchAddresses()
    fetchProvinces()
  }, [])

  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince)
    } else {
      setDistricts([])
      setSubdistricts([])
    }
  }, [selectedProvince])

  useEffect(() => {
    if (selectedDistrict) {
      fetchSubdistricts(selectedDistrict)
    } else {
      setSubdistricts([])
    }
  }, [selectedDistrict])

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/users/me/addresses')
      if (res.data.success) {
        setAddresses(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch addresses', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProvinces = async () => {
    try {
      const res = await api.get('/locations/provinces?parent_id=1')
      if (res.data.success) setProvinces(res.data.data)
    } catch (error) {
      console.error('Failed to fetch provinces', error)
    }
  }

  const fetchDistricts = async (provinceId: number) => {
    try {
      const res = await api.get('/locations/districts?parent_id=' + provinceId)
      if (res.data.success) setDistricts(res.data.data)
    } catch (error) {
      console.error('Failed to fetch districts', error)
    }
  }

  const fetchSubdistricts = async (districtId: number) => {
    try {
      const res = await api.get('/locations/subdistricts?parent_id=' + districtId)
      if (res.data.success) setSubdistricts(res.data.data)
    } catch (error) {
      console.error('Failed to fetch subdistricts', error)
    }
  }

  const handleAddNew = () => {
    setFormData({
      title: '',
      fullname: '',
      surname: '',
      tel: '',
      address_line: '',
      subdistrict_id: 0,
      tag: ''
    })
    setSelectedProvince(0)
    setSelectedDistrict(0)
    setEditingId(null)
    setIsFormOpen(true)
  }

  const handleEdit = (addr: Address) => {
    setFormData({
      title: addr.title || '',
      fullname: addr.fullname,
      surname: addr.surname,
      tel: addr.tel,
      address_line: addr.address_line,
      subdistrict_id: addr.subdistrict_id,
      tag: addr.tag || ''
    })
    setSelectedProvince(0)
    setSelectedDistrict(0)
    setEditingId(addr.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('settings.deleteConfirm'))) return
    try {
      await api.delete('/users/me/addresses/' + id)
      fetchAddresses()
    } catch (error) {
      console.error('Failed to delete address', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put('/users/me/addresses/' + editingId, formData)
      } else {
        await api.post('/users/me/addresses', formData)
      }
      setIsFormOpen(false)
      fetchAddresses()
      onSaved?.()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save address')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex justify-between items-center border-b border-border pb-4">
          <h2 className="text-xl font-bold flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" />
            {t('settings.manageAddresses')}
          </h2>
          {!isFormOpen && (
            <button
              onClick={handleAddNew}
              className="btn-primary text-sm px-4 py-2 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('settings.addAddress')}
            </button>
          )}
        </div>
      )}

      {isFormOpen ? (
        <form
          onSubmit={handleSubmit}
          /* Plain when embedded (the parent already provides the card), a
             self-contained card on the standalone Settings page. */
          className={hideHeader ? 'space-y-4 relative' : 'card-panel space-y-4 bg-secondary/50 p-6 rounded-lg relative'}
        >
          {!hideHeader && (
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <h3 className="font-bold text-lg mb-4">{editingId ? t('settings.editAddress') : t('settings.newAddress')}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-customer">{t('settings.addressTitle')}</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('settings.addressTitlePlaceholder') || 'Home, Office, etc.'}
                className="input-customer"
              />
            </div>
            <div>
              <label className="label-customer">
                {t('settings.phone')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.tel}
                onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                className="input-customer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-customer">
                {t('settings.firstName')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                className="input-customer"
              />
            </div>
            <div>
              <label className="label-customer">
                {t('settings.lastName')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                className="input-customer"
              />
            </div>
          </div>

          <div>
            <label className="label-customer">
              {t('settings.addressLine')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address_line}
              onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
              className="input-customer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-customer">
                {t('settings.province')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <SearchableSelect
                options={provinces.map((p) => ({ value: p.id, label: isEn ? p.name_en : p.name_th }))}
                value={selectedProvince}
                onChange={setSelectedProvince}
                placeholder={t('settings.selectProvince')}
                required={!editingId}
              />
            </div>
            <div>
              <label className="label-customer">
                {t('settings.district')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <SearchableSelect
                options={districts.map((d) => ({ value: d.id, label: isEn ? d.name_en : d.name_th }))}
                value={selectedDistrict}
                onChange={setSelectedDistrict}
                placeholder={t('settings.selectDistrict')}
                disabled={!selectedProvince}
                required={!editingId}
              />
            </div>
            <div>
              <label className="label-customer">
                {t('settings.subdistrict')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <SearchableSelect
                options={[
                  ...subdistricts.map((s) => ({ value: s.id, label: isEn ? s.name_en : s.name_th })),
                  ...(editingId && formData.subdistrict_id !== 0 && !selectedDistrict ? [{ value: formData.subdistrict_id, label: t('settings.keepLocation') || 'Keep current location' }] : [])
                ]}
                value={formData.subdistrict_id}
                onChange={(val) => setFormData({ ...formData, subdistrict_id: val })}
                placeholder={t('settings.selectSubdistrict')}
                disabled={!selectedDistrict && !editingId}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {(onCancel || !hideList) && (
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); onCancel?.() }}
                className="btn-secondary px-6"
              >
                {t('settings.cancel') || 'Cancel'}
              </button>
            )}
            <button
              type="submit"
              className="btn-primary px-8"
            >
              {t('settings.saveAddress') || 'Save Address'}
            </button>
          </div>
        </form>
      ) : hideList ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">{t('settings.noAddresses') || 'No addresses found. Add one above.'}</div>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className="card-panel p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-primary">{addr.title || 'Address'}</span>
                    {addr.tag && <span className="badge bg-secondary text-secondary-foreground">{addr.tag}</span>}
                  </div>
                  <p className="font-medium">
                    {addr.fullname} {addr.surname}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">{addr.address_line}</p>
                  <p className="text-muted-foreground text-sm">Tel: {addr.tel}</p>
                </div>
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => handleEdit(addr)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
