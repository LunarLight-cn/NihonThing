import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LogOut, Menu, X, Home, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface DashboardNavItem {
  name: string
  path: string
  icon: LucideIcon
}

interface Props {
  brand: string
  mobileTitle: string
  roleLabel: string
  navItems: DashboardNavItem[]
  // Links to the other dashboard, shown above "Back to Store".
  crossLinks?: DashboardNavItem[]
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'th', label: 'ภาษาไทย' },
  { code: 'jp', label: '日本語' }
]

// The shell behind /admin and /agent. They differ only in their nav, so the
// chrome lives here once rather than being kept in step by hand.
export const DashboardLayout: React.FC<Props> = ({ brand, mobileTitle, roleLabel, navItems, crossLinks = [] }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  // Mobile only: the sidebar becomes a drawer the hamburger opens.
  const [menuOpen, setMenuOpen] = useState(false)

  const renderLink = (item: DashboardNavItem, active: boolean) => {
    const Icon = item.icon
    return (
      <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)} className={`admin-nav-link ${active ? 'is-active' : ''}`}>
        <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
        <span>{item.name}</span>
      </Link>
    )
  }

  return (
    <div className="dash-shell">
      {menuOpen && <div className="dash-backdrop" onClick={() => setMenuOpen(false)} />}

      <aside className={`dash-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="dash-brand">
          <Link to="/" className="flex-1">{brand}</Link>
          <button onClick={() => setMenuOpen(false)} className="p-1 md:hidden" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="dash-nav">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => renderLink(item, location.pathname === item.path))}
          </nav>
        </div>

        <div className="dash-footer">
          <div className="flex items-center space-x-3 mb-4 px-3">
            <div className="dash-avatar">{user?.username?.charAt(0).toUpperCase() || '?'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{roleLabel}</p>
            </div>
          </div>

          <div className="space-y-2">
            {crossLinks.map((item) => renderLink(item, false))}

            <Link to="/" className="admin-nav-link">
              <Home className="w-5 h-5 text-muted-foreground" />
              <span>{t('admin.backToStore')}</span>
            </Link>

            <div className="group relative">
              <button className="admin-nav-link w-full text-muted-foreground">
                <Globe className="w-5 h-5" />
                <span className="uppercase">{i18n.language}</span>
              </button>
              <div className="dash-lang-menu">
                <div className="p-2 flex flex-col space-y-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => i18n.changeLanguage(lang.code)}
                      className={`dash-lang-option ${i18n.language === lang.code ? 'is-active' : ''}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={logout} className="dash-logout">
              <LogOut className="w-5 h-5" />
              <span>{t('admin.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-mobile-header">
          <span className="text-lg font-bold text-primary">{mobileTitle}</span>
          <button onClick={() => setMenuOpen(true)} className="p-2" aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="dash-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
