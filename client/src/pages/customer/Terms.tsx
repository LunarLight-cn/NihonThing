import React from 'react'
import { useTranslation } from 'react-i18next'

export const Terms: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="section-container py-12">
      <div className="max-w-3xl mx-auto card-panel">
        <h1 className="section-title-lg mb-6">{t('terms.title')}</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>{t('terms.lastUpdated', { date: new Date().toLocaleDateString() })}</p>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('terms.sections.intro.title')}</h2>
            <p>{t('terms.sections.intro.content')}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('terms.sections.preorders.title')}</h2>
            <p>{t('terms.sections.preorders.content')}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('terms.sections.shipping.title')}</h2>
            <p>{t('terms.sections.shipping.content')}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('terms.sections.returns.title')}</h2>
            <p>{t('terms.sections.returns.content')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
