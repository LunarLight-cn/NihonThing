import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ClipboardList, ShoppingCart, Store, Plane, Ticket, MapPin, LogOut, Home, Globe, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const AgentLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const navItems = [
    { name: t('agent.nav.dashboard'), path: '/agent', icon: ClipboardList },
    { name: t('agent.nav.purchases'), path: '/agent/purchases', icon: ShoppingCart },
    { name: t('agent.nav.catalog'), path: '/agent/catalog', icon: Store },
    { name: t('agent.nav.trips'), path: '/agent/trips', icon: Plane },
    { name: t('agent.nav.tickets'), path: '/agent/tickets', icon: Ticket },
    { name: t('agent.nav.locations'), path: '/agent/locations', icon: MapPin }
  ]

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'th' : i18n.language === 'th' ? 'jp' : 'en'
    i18n.changeLanguage(next)
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <aside className="w-64 bg-card border-r border-border flex flex-col md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/" className="text-xl font-bold text-primary">
            NihonThing Agent
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link key={item.name} to={item.path} className={`admin-nav-link ${isActive ? 'is-active' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border space-y-1">
          <div className="flex items-center space-x-3 mb-4 px-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>

          {user?.role === 'admin' && (
            <Link to="/admin" className="admin-nav-link">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span>{t('agent.nav.adminDashboard')}</span>
            </Link>
          )}
          <Link to="/" className="admin-nav-link">
            <Home className="w-5 h-5 text-muted-foreground" />
            <span>{t('agent.nav.storefront')}</span>
          </Link>
          <button onClick={toggleLanguage} className="admin-nav-link w-full">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span>{i18n.language.toUpperCase()}</span>
          </button>
          <button onClick={logout} className="admin-nav-link w-full text-destructive">
            <LogOut className="w-5 h-5" />
            <span>{t('agent.nav.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
