import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollText } from 'lucide-react'

const SECTIONS = [
  'intro', 'service', 'accounts', 'pricing', 'deposits', 'fees',
  'trips', 'cancellation', 'availability', 'liability', 'privacy', 'changes'
] as const

export const Terms: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="section-container py-12">
      <div className="max-w-3xl mx-auto card-panel p-8 lg:p-10">
        <h1 className="section-title-lg mb-2 flex items-center gap-3">
          <ScrollText className="w-7 h-7 text-primary" />
          {t('terms.title')}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">{t('terms.lastUpdated', { date: new Date('2026-07-19').toLocaleDateString() })}</p>

        <div className="space-y-8 leading-relaxed">
          {SECTIONS.map((key) => (
            <section
              key={key}
              /* The no-refund clause is the one people must not miss. */
              className={key === 'deposits' ? 'border-l-4 border-primary bg-primary/5 rounded-r-xl pl-4 py-3 pr-3' : ''}
            >
              <h2 className="text-lg font-bold text-foreground mb-2">{t(`terms.sections.${key}.title`)}</h2>
              <p className="text-muted-foreground">{t(`terms.sections.${key}.content`)}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
