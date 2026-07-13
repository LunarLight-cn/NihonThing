import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { CartSidebar } from './CartSidebar'
import { ShoppingBag, User, LogOut, Menu, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const CustomerLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const { totalItems, setIsCartOpen } = useCart()
  const { t, i18n } = useTranslation()

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="section-container h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight text-primary">NihonThing</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              {t('nav.home')}
            </Link>
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

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex group relative pt-1 pb-1">
              <button className="flex items-center space-x-1 p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-full transition-colors">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{i18n.language}</span>
              </button>
              <div className="absolute top-full right-0 mt-1 w-32 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2 flex flex-col space-y-1">
                  <button
                    onClick={() => i18n.changeLanguage('en')}
                    className={`filter-btn ${i18n.language === 'en' ? 'is-active' : ''}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => i18n.changeLanguage('th')}
                    className={`filter-btn ${i18n.language === 'th' ? 'is-active' : ''}`}
                  >
                    ภาษาไทย
                  </button>
                  <button
                    onClick={() => i18n.changeLanguage('jp')}
                    className={`filter-btn ${i18n.language === 'jp' ? 'is-active' : ''}`}
                  >
                    日本語
                  </button>
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
              <div className="group relative">
                <button className="flex items-center space-x-2 p-2 hover:bg-secondary rounded-full transition-colors">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-primary font-bold">{user.username?.charAt(0).toUpperCase()}</div>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-medium truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-secondary rounded-md">
                      {t('nav.settings')}
                    </Link>
                    <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-secondary rounded-md">
                      {t('nav.myOrders')}
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-primary hover:bg-secondary rounded-md">
                        {t('nav.adminDashboard')}
                      </Link>
                    )}
                    <button
                      onClick={logout}
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
                className="hidden md:flex items-center space-x-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{t('nav.signIn')}</span>
              </Link>
            )}

            <button className="md:hidden p-2">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 mt-12">
        <div className="section-container grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg text-primary mb-4">NihonThing</h3>
            <p className="text-sm text-muted-foreground">{t('footer.description')}</p>
          </div>
          <div>
            <h4 className="font-medium mb-4">{t('footer.shop')}</h4>
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
            <h4 className="font-medium mb-4">{t('footer.support')}</h4>
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
            <h4 className="font-medium mb-4">{t('footer.legal')}</h4>
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
