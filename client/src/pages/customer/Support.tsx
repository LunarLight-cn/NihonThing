import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingAreasMap } from '../../components/home/ShoppingAreasMap'
import { MessageCircle, Bot, PackageSearch, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Support: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Map Section */}
      <ShoppingAreasMap />

      {/* Support Actions Section */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-bold text-foreground tracking-tight mb-4">{t('support.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Line OA (Disabled) */}
            <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center text-center opacity-60 cursor-not-allowed relative overflow-hidden group">
              <div className="absolute top-4 right-4 bg-muted text-muted-foreground text-xs font-semibold px-2 py-1 rounded-md flex items-center">
                <Lock className="w-3 h-3 mr-1" /> {t('support.comingSoon')}
              </div>
              <div className="w-16 h-16 bg-[#06C755]/10 text-[#06C755] rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t('support.lineTitle')}</h3>
              <p className="text-sm text-muted-foreground flex-1">{t('support.lineDesc')}</p>
              <button
                disabled
                className="mt-6 w-full py-2 bg-secondary text-secondary-foreground rounded-lg font-medium cursor-not-allowed"
              >
                {t('support.openLine')}
              </button>
            </div>

            {/* Chatbot (Disabled) */}
            <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center text-center opacity-60 cursor-not-allowed relative overflow-hidden group">
              <div className="absolute top-4 right-4 bg-muted text-muted-foreground text-xs font-semibold px-2 py-1 rounded-md flex items-center">
                <Lock className="w-3 h-3 mr-1" /> {t('support.comingSoon')}
              </div>
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t('support.botTitle')}</h3>
              <p className="text-sm text-muted-foreground flex-1">{t('support.botDesc')}</p>
              <button
                disabled
                className="mt-6 w-full py-2 bg-secondary text-secondary-foreground rounded-lg font-medium cursor-not-allowed"
              >
                {t('support.startChat')}
              </button>
            </div>

            {/* Request Product (Active) */}
            <Link
              to="/request"
              className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center text-center hover:border-primary/50 hover:shadow-lg transition-all group"
            >
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <PackageSearch className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t('support.requestTitle')}</h3>
              <p className="text-sm text-muted-foreground flex-1">{t('support.requestDesc')}</p>
              <div className="mt-6 w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium group-hover:bg-primary/90 transition-colors">{t('support.submitRequest')}</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
