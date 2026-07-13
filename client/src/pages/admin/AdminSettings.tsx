import React, { useState } from 'react'
import { Settings, User, Shield, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { AddressManager } from '../../components/profile/AddressManager'
import { useTranslation } from 'react-i18next'

export const AdminSettings: React.FC = () => {
  const { t } = useTranslation()
  const { user, login, token } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'addresses'>('profile')

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
        </div>

        <div className="md:col-span-3 space-y-6">
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
