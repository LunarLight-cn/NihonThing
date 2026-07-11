import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { Loader2, PackageSearch, Image as ImageIcon, Link as LinkIcon, DollarSign, Store, Tag, RefreshCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export const CustomRequest: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    item_name: '',
    brand: '',
    shop_name: '',
    spec: '',
    img: '',
    external_link: '',
    expected_price: '',
    replacement: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      navigate('/login')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        expected_price: formData.expected_price ? Number(formData.expected_price) : undefined
      }

      await api.post('/tickets', payload)
      setSuccess(true)
      // Reset form
      setFormData({
        item_name: '',
        brand: '',
        shop_name: '',
        spec: '',
        img: '',
        external_link: '',
        expected_price: '',
        replacement: ''
      })
    } catch (err: any) {
      setError(err.response?.data?.message || t('request.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mb-6">
          <PackageSearch className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">{t('request.success')}</h2>
        <button 
          onClick={() => navigate('/orders')}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
        >
          View My Requests
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">{t('request.title')}</h1>
        <p className="text-muted-foreground">{t('request.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm space-y-6">
        
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground flex items-center">
              <PackageSearch className="w-4 h-4 mr-2" />
              {t('request.itemName')}
            </label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              placeholder={t('request.itemNamePlaceholder')}
              required
              className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                {t('request.brand')}
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder={t('request.brandPlaceholder')}
                className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center">
                <Store className="w-4 h-4 mr-2" />
                {t('request.shopName')}
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleChange}
                placeholder={t('request.shopNamePlaceholder')}
                className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">{t('request.spec')}</label>
            <textarea
              name="spec"
              value={formData.spec}
              onChange={handleChange}
              placeholder={t('request.specPlaceholder')}
              rows={3}
              className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" />
              {t('request.img')}
            </label>
            <input
              type="url"
              name="img"
              value={formData.img}
              onChange={handleChange}
              placeholder={t('request.imgPlaceholder')}
              required
              className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            {formData.img && (
              <div className="mt-2 relative w-full h-40 bg-secondary rounded-lg overflow-hidden border border-border">
                <img src={formData.img} alt="Preview" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL' }} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center">
                <LinkIcon className="w-4 h-4 mr-2" />
                {t('request.externalLink')}
              </label>
              <input
                type="url"
                name="external_link"
                value={formData.external_link}
                onChange={handleChange}
                placeholder={t('request.externalLinkPlaceholder')}
                className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                {t('request.expectedPrice')}
              </label>
              <input
                type="number"
                name="expected_price"
                value={formData.expected_price}
                onChange={handleChange}
                placeholder={t('request.expectedPricePlaceholder')}
                min="0"
                className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground flex items-center">
              <RefreshCcw className="w-4 h-4 mr-2" />
              {t('request.replacement')}
            </label>
            <input
              type="text"
              name="replacement"
              value={formData.replacement}
              onChange={handleChange}
              placeholder={t('request.replacementPlaceholder')}
              className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex justify-center items-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t('request.submitting')}
            </>
          ) : (
            t('request.submit')
          )}
        </button>
      </form>
    </div>
  )
}
