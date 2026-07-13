import React, { useState } from 'react'
import { Settings as SettingsIcon, User, Shield, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { AddressManager } from '../../components/profile/AddressManager'
import { useTranslation } from 'react-i18next'

export const Settings: React.FC = () => {
  const { user, login, token } = useAuth()
  const { t } = useTranslation()
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
        alert(t('settings.profileUpdated') || 'Profile updated successfully!')
        if (user) {
          login(token || '', { ...user, username: profileForm.username })
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert(t('settings.passwordMismatch') || 'New passwords do not match!')
      return
    }

    setIsUpdatingPassword(true)
    try {
      const res = await api.put('/users/me/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      })
      if (res.data.success) {
        alert(t('settings.passwordUpdated') || 'Password updated successfully!')
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="section-container py-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-primary" />
          {t('settings.title') || 'Settings & Profile'}
        </h1>
        <p className="text-muted-foreground mt-2">{t('settings.subtitle') || 'Manage your account settings and delivery addresses.'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'}`}
          >
            {t('settings.profile') || 'Profile'}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'security' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'}`}
          >
            {t('settings.security') || 'Security'}
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'addresses' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'}`}
          >
            {t('settings.addresses') || 'Addresses'}
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="card-panel space-y-6 p-6">
              <h2 className="text-xl font-bold flex items-center border-b border-border pb-4">
                <User className="w-5 h-5 mr-2 text-primary" />
                {t('settings.profileInfo') || 'Profile Information'}
              </h2>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="label-customer">{t('settings.username') || 'Username'}</label>
                  <input type="text" required value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} className="input-customer" />
                </div>

                <div>
                  <label className="label-customer">{t('settings.email') || 'Email Address'}</label>
                  <input type="email" disabled value={user?.email || ''} className="input-customer bg-secondary cursor-not-allowed text-muted-foreground" />
                </div>
              </div>

              <div className="pt-4 flex justify-end max-w-md">
                <button type="submit" disabled={isUpdatingProfile} className="btn-primary px-6 flex items-center">
                  {isUpdatingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('settings.save') || 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordUpdate} className="card-panel space-y-6 p-6">
              <h2 className="text-xl font-bold flex items-center border-b border-border pb-4 text-destructive">
                <Shield className="w-5 h-5 mr-2" />
                {t('settings.securityTitle') || 'Security & Password'}
              </h2>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="label-customer">{t('settings.currentPassword') || 'Current Password'}</label>
                  <input type="password" required value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} className="input-customer" />
                </div>
                <div>
                  <label className="label-customer">{t('settings.newPassword') || 'New Password'}</label>
                  <input type="password" required minLength={6} value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="input-customer" />
                </div>
                <div>
                  <label className="label-customer">{t('settings.confirmPassword') || 'Confirm New Password'}</label>
                  <input type="password" required minLength={6} value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} className="input-customer" />
                </div>
              </div>

              <div className="pt-4 flex justify-end max-w-md">
                <button type="submit" disabled={isUpdatingPassword} className="border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground px-6 py-2 rounded-lg transition-colors flex items-center">
                  {isUpdatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('settings.updatePassword') || 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'addresses' && (
            <AddressManager />
          )}
        </div>
      </div>
    </div>
  )
}
