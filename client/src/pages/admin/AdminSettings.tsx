import React, { useState, useEffect } from 'react'
import { Settings, User, Shield, Loader2, SlidersHorizontal, Save } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { AddressManager } from '../../components/profile/AddressManager'
import { useTranslation } from 'react-i18next'

interface PlatformSettings {
  per_user_item_limit: number
  trip_cutoff_days: number
  weight_tolerance_kg: number
  price_tolerance_thb: number
  unpaid_move_days: number
  overdue_cancel_days: number
  exchange_rate_jpy_thb: number
}

// Global platform rules - applies to every trip/order, not just this admin.
const PlatformSettingsForm: React.FC = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [form, setForm] = useState<PlatformSettings | null>(null)
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data.data as PlatformSettings
  })

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const mutation = useMutation({
    mutationFn: (payload: PlatformSettings) => api.put('/settings', {
      per_user_item_limit: Number(payload.per_user_item_limit),
      trip_cutoff_days: Number(payload.trip_cutoff_days),
      weight_tolerance_kg: Number(payload.weight_tolerance_kg),
      price_tolerance_thb: Number(payload.price_tolerance_thb),
      unpaid_move_days: Number(payload.unpaid_move_days),
      overdue_cancel_days: Number(payload.overdue_cancel_days),
      exchange_rate_jpy_thb: Number(payload.exchange_rate_jpy_thb)
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (e: any) => alert(e.response?.data?.message || 'Failed to save settings')
  })

  if (isLoading || !form) {
    return <div className="loading-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const fields: { key: keyof PlatformSettings; label: string; hint: string; step: string }[] = [
    { key: 'per_user_item_limit', label: t('admin.setting.per_user_item_limit'), hint: t('admin.setting.per_user_item_limit_hint'), step: '1' },
    { key: 'trip_cutoff_days', label: t('admin.setting.trip_cutoff_days'), hint: t('admin.setting.trip_cutoff_days_hint'), step: '1' },
    { key: 'weight_tolerance_kg', label: t('admin.setting.weight_tolerance_kg'), hint: t('admin.setting.weight_tolerance_kg_hint'), step: '0.1' },
    { key: 'price_tolerance_thb', label: t('admin.setting.price_tolerance_thb'), hint: t('admin.setting.price_tolerance_thb_hint'), step: '1' },
    { key: 'unpaid_move_days', label: t('admin.setting.unpaid_move_days'), hint: t('admin.setting.unpaid_move_days_hint'), step: '1' },
    { key: 'overdue_cancel_days', label: t('admin.setting.overdue_cancel_days'), hint: t('admin.setting.overdue_cancel_days_hint'), step: '1' },
    { key: 'exchange_rate_jpy_thb', label: t('admin.setting.exchange_rate_jpy_thb'), hint: t('admin.setting.exchange_rate_jpy_thb_hint'), step: '0.001' }
  ]

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }}
      className="card-panel space-y-6"
    >
      <h2 className="text-xl font-bold flex items-center border-b border-border pb-4">
        <SlidersHorizontal className="w-5 h-5 mr-2 text-primary" />
        {t('admin.setting.platform_title')}
      </h2>
      <p className="text-sm text-muted-foreground -mt-2">{t('admin.setting.platform_desc')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="label-admin text-foreground">{f.label}</label>
            <input
              type="number"
              min="0"
              step={f.step}
              required
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value === '' ? 0 : Number(e.target.value) })}
              className="input-admin text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">{t('admin.setting.saved')}</span>}
        <button type="submit" disabled={mutation.isPending} className="btn-primary px-6 disabled:opacity-50">
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {t('admin.setting.save_changes')}
        </button>
      </div>
    </form>
  )
}

export const AdminSettings: React.FC = () => {
  const { t } = useTranslation()
  const { user, login, token } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'addresses' | 'platform'>('profile')

  const [profileForm, setProfileForm] = useState({
    username: user?.username || ''
  })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    try {
      const res = await api.put('/users/me', profileForm)
      if (res.data.success) {
        alert(t('admin.setting.alert_profile_success'))
        // Update local user state
        if (user) {
          login(token || '', { ...user, username: profileForm.username })
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.setting.alert_profile_fail'))
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert(t('admin.setting.alert_password_mismatch'))
      return
    }

    setIsUpdatingPassword(true)
    try {
      const res = await api.put('/users/me/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      })
      if (res.data.success) {
        alert(t('admin.setting.alert_password_success'))
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      }
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.setting.alert_password_fail'))
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="admin-page-title">
          <Settings className="w-8 h-8 mr-3" />
          {t('admin.setting.settings_title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('admin.setting.settings_desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`sidebar-filter-btn ${activeTab === 'profile' ? 'is-active' : ''}`}
          >
            {t('admin.setting.tab_profile')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`sidebar-filter-btn ${activeTab === 'security' ? 'is-active' : ''}`}
          >
            {t('admin.setting.tab_security')}
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`sidebar-filter-btn ${activeTab === 'addresses' ? 'is-active' : ''}`}
          >
            {t('admin.setting.tab_addresses')}
          </button>
          <button
            onClick={() => setActiveTab('platform')}
            className={`sidebar-filter-btn ${activeTab === 'platform' ? 'is-active' : ''}`}
          >
            {t('admin.setting.tab_platform')}
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeTab === 'platform' && <PlatformSettingsForm />}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="card-panel space-y-6">
              <h2 className="text-xl font-bold flex items-center border-b border-border pb-4">
                <User className="w-5 h-5 mr-2 text-primary" />
                {t('admin.setting.profile_info')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="label-admin text-foreground">{t('admin.setting.username')}</label>
                  <input type="text" required value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} className="input-admin text-foreground" />
                </div>

                <div>
                  <label className="label-admin text-muted-foreground">{t('admin.setting.email')}</label>
                  <input type="email" disabled value={user?.email || ''} className="w-full p-2 border border-border rounded bg-secondary text-muted-foreground cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground mt-1">{t('admin.setting.email_desc')}</p>
                </div>

                <div>
                  <label className="label-admin text-muted-foreground">{t('admin.setting.role')}</label>
                  <input type="text" disabled value={user?.role?.toUpperCase() || ''} className="w-full p-2 border border-border rounded bg-secondary text-primary font-bold cursor-not-allowed" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isUpdatingProfile} className="btn-primary px-6">
                  {isUpdatingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('admin.setting.save_changes')}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordUpdate} className="card-panel space-y-6">
              <h2 className="text-xl font-bold flex items-center border-b border-border pb-4 text-destructive">
                <Shield className="w-5 h-5 mr-2" />
                {t('admin.setting.security_password')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="label-admin text-foreground">{t('admin.setting.current_password')}</label>
                  <input type="password" required value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} className="input-admin text-foreground" />
                </div>
                <div>
                  <label className="label-admin text-foreground">{t('admin.setting.new_password')}</label>
                  <input type="password" required minLength={6} value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="input-admin text-foreground" />
                </div>
                <div>
                  <label className="label-admin text-foreground">{t('admin.setting.confirm_new_password')}</label>
                  <input type="password" required minLength={6} value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} className="input-admin text-foreground" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isUpdatingPassword} className="border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground px-6 py-2 rounded-lg transition-colors flex items-center">
                  {isUpdatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('admin.setting.update_password')}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'addresses' && (
            <div className="card-panel">
              <AddressManager />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
