import React from 'react'
import { useTranslation } from 'react-i18next'

export const Privacy: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="section-container py-12">
      <div className="max-w-3xl mx-auto card-panel">
        <h1 className="section-title-lg mb-6">{t('privacy.title')}</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>{t('privacy.lastUpdated', { date: new Date().toLocaleDateString() })}</p>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('privacy.sections.collect.title')}</h2>
            <p>{t('privacy.sections.collect.content')}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('privacy.sections.use.title')}</h2>
            <p>{t('privacy.sections.use.content')}</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('privacy.sections.share.title')}</h2>
            <p>{t('privacy.sections.share.content')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
