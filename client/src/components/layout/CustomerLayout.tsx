import React, { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { CartSidebar } from './CartSidebar'
import { NavSearch } from './NavSearch'
import { ShoppingBag, User, LogOut, Menu, X, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const { totalItems, setIsCartOpen } = useCart()
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuSpin, setMenuSpin] = useState(false)
  const [deskMenu, setDeskMenu] = useState<'lang' | 'user' | null>(null)

  const openMenu = () => {
    setMenuOpen(true)
    setMenuSpin(true)
    setTimeout(() => setMenuSpin(false), 300)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Closes an open desktop dropdown when clicking anywhere else */}
      {deskMenu && <div className="fixed inset-0 z-40" onClick={() => setDeskMenu(null)} />}

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="section-container h-16 flex items-center justify-between gap-6">
          <div className="flex items-center shrink-0 relative">
            <button
              onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
              className="md:hidden p-2 -ml-2 mr-1 hover:bg-secondary rounded-full transition-colors"
              aria-label="Menu"
            >
              {menuSpin ? <span className="spinner !w-6 !h-6" /> : menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold tracking-tight text-primary">NihonThing</span>
            </Link>

            {/* Mobile menu - eases down from the button like the profile dropdown */}
            <div className={`md:hidden dropdown-panel left-0 top-full mt-2 w-60 ${menuOpen ? 'is-open' : ''}`}>
              <div className="p-2">
                <Link to="/catalog" onClick={() => setMenuOpen(false)} className="mobile-nav-link">
                  {t('nav.catalog')}
                </Link>
                <span className="block px-4 py-2.5 text-sm font-medium text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
                  {t('nav.chat')}
                </span>
                <Link to="/support" onClick={() => setMenuOpen(false)} className="mobile-nav-link">
                  {t('nav.support')}
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground shrink-0">
            <Link to="/catalog" className="hover:text-foreground transition-colors">
              {t('nav.catalog')}
            </Link>
            <span className="text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
              {t('nav.chat')}
            </span>
            <Link to="/support" className="hover:text-foreground transition-colors">
              {t('nav.support')}
            </Link>
          </nav>

          {/* Search - desktop, center */}
          <div className="hidden md:flex flex-1 justify-center px-4 lg:px-6">
            <NavSearch />
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <div className="block relative pt-1 pb-1">
              <button
                onClick={() => setDeskMenu(deskMenu === 'lang' ? null : 'lang')}
                className="flex items-center gap-1 p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-full transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{i18n.language}</span>
              </button>
              <div className={`dropdown-panel top-full right-0 mt-1 w-32 ${deskMenu === 'lang' ? 'is-open' : ''}`}>
                <div className="p-2 flex flex-col space-y-1">
                  {(['en', 'th', 'jp'] as const).map((lng) => (
                    <button
                      key={lng}
                      onClick={() => { i18n.changeLanguage(lng); setDeskMenu(null) }}
                      className={`filter-btn ${i18n.language === lng ? 'is-active' : ''}`}
                    >
                      {lng === 'en' ? 'English' : lng === 'th' ? 'ภาษาไทย' : '日本語'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 hover:bg-secondary rounded-full transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5 text-foreground" />
              {totalItems > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] flex items-center justify-center rounded-full">{totalItems}</span>}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDeskMenu(deskMenu === 'user' ? null : 'user')}
                  className="flex items-center gap-1 p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-primary font-bold">{user.username?.charAt(0).toUpperCase()}</div>
                </button>
                <div className={`dropdown-panel right-0 mt-2 w-48 ${deskMenu === 'user' ? 'is-open' : ''}`}>
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-medium truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link to="/settings" onClick={() => setDeskMenu(null)} className="block px-4 py-2 text-sm hover:bg-secondary rounded-md">
                      {t('nav.settings')}
                    </Link>
                    <Link to="/orders" onClick={() => setDeskMenu(null)} className="block px-4 py-2 text-sm hover:bg-secondary rounded-md">
                      {t('nav.myOrders')}
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setDeskMenu(null)} className="block px-4 py-2 text-sm text-primary hover:bg-secondary rounded-md">
                        {t('nav.adminDashboard')}
                      </Link>
                    )}
                    {user.role === 'agent' && (
                      <Link to="/agent" onClick={() => setDeskMenu(null)} className="block px-4 py-2 text-sm text-primary hover:bg-secondary rounded-md">
                        {t('nav.agentDashboard')}
                      </Link>
                    )}
                    <button
                      onClick={() => { setDeskMenu(null); logout() }}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-secondary rounded-md flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{t('nav.signIn')}</span>
              </Link>
            )}
          </div>
        </div>

      </header>

      {/* Closes the mobile menu when tapping elsewhere */}
      {menuOpen && <div className="md:hidden fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer - airy, headings as small caps, no heavy card background */}
      <footer className="border-t border-border/60 py-16 mt-16">
        <div className="section-container grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h3 className="font-bold text-xl tracking-tight text-primary mb-4">
              NihonThing<span aria-hidden="true" className="inline-block w-1.5 h-1.5 ml-1 rounded-full bg-primary align-baseline" />
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('footer.description')}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t('footer.shop')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/catalog" className="hover:text-primary">
                  {t('nav.catalog')}
                </Link>
              </li>
              <li>
                <Link to="/request" className="hover:text-primary">
                  {t('nav.customRequest')}
                </Link>
              </li>
              <li>
                <Link to="/areas" className="hover:text-primary">
                  {t('nav.areas')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/support" className="hover:text-primary">
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-primary">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/terms" className="hover:text-primary">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="section-container mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} NihonThing. {t('footer.rights')}
        </div>
      </footer>

      {/* Cart Sidebar */}
      <CartSidebar />
    </div>
  )
}
