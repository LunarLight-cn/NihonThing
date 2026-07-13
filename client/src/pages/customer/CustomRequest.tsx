import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { Loader2, PackageSearch, Image as ImageIcon, Link as LinkIcon, JapaneseYen, Store, Tag, RefreshCcw, Upload, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export const CustomRequest: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    item_name: '',
    brand: '',
    shop_name: '',
    spec: '',
    img: [] as string[],
    external_link: '',
    expected_price: '',
    replacement: ''
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (formData.img.length >= 3) {
      setUploadError('Maximum 3 images allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only jpeg, png, webp, and gif are allowed')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const form = new FormData()
      form.append('file', file)
      
      const res = await api.post('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setFormData(prev => ({ ...prev, img: [...prev.img, res.data.url] }))
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImg = [...prev.img]
      newImg.splice(index, 1)
      return { ...prev, img: newImg }
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
        img: [],
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
      <div className="section-container py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mb-6">
          <PackageSearch className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">{t('request.success')}</h2>
        <button
          onClick={() => navigate('/orders')}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
        >
          {t('request.viewMyRequests')}
        </button>
      </div>
    )
  }

  return (
    <div className="section-container py-12 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">{t('request.title')}</h1>
        <p className="text-muted-foreground">{t('request.subtitle')}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm space-y-6"
      >
        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-medium">{error}</div>}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="label-customer">
              <PackageSearch className="w-4 h-4 mr-2" />
              {t('request.itemName')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              placeholder={t('request.itemNamePlaceholder')}
              required
              className="input-customer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="label-customer">
                <Tag className="w-4 h-4 mr-2" />
                {t('request.brand')}
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder={t('request.brandPlaceholder')}
                className="input-customer"
              />
            </div>
            <div className="space-y-2">
              <label className="label-customer">
                <Store className="w-4 h-4 mr-2" />
                {t('request.shopName')}
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleChange}
                placeholder={t('request.shopNamePlaceholder')}
                className="input-customer"
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
              className="input-customer resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="label-customer">
              <ImageIcon className="w-4 h-4 mr-2" />
              {t('request.img')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            
            {formData.img.length < 3 && (
              <div className="flex items-center gap-4">
                <label className="cursor-pointer px-4 py-2 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-secondary/80 transition-colors flex items-center justify-center font-medium">
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                {uploadError && <span className="text-destructive text-sm font-medium">{uploadError}</span>}
              </div>
            )}
            
            {/* hidden required field hack for native form validation */}
            <input type="text" className="hidden" required={formData.img.length === 0} />

            {formData.img.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {formData.img.map((imgUrl, index) => (
                  <div key={index} className="relative aspect-square w-full bg-secondary rounded-lg overflow-hidden border border-border group shadow-sm">
                    <img
                      src={imgUrl.startsWith('http') ? imgUrl : import.meta.env.VITE_API_BASE_URL.replace('/api', '') + imgUrl}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/600x600?text=Invalid+Image'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/80 shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="label-customer">
                <LinkIcon className="w-4 h-4 mr-2" />
                {t('request.externalLink')}
              </label>
              <input
                type="url"
                name="external_link"
                value={formData.external_link}
                onChange={handleChange}
                placeholder={t('request.externalLinkPlaceholder')}
                className="input-customer"
              />
            </div>
            <div className="space-y-2">
              <label className="label-customer">
                <JapaneseYen className="w-4 h-4 mr-2" />
                {t('request.expectedPrice')}
              </label>
              <input
                type="number"
                name="expected_price"
                value={formData.expected_price}
                onChange={handleChange}
                placeholder={t('request.expectedPricePlaceholder')}
                min="0"
                className="input-customer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="label-customer">
              <RefreshCcw className="w-4 h-4 mr-2" />
              {t('request.replacement')}
            </label>
            <input
              type="text"
              name="replacement"
              value={formData.replacement}
              onChange={handleChange}
              placeholder={t('request.replacementPlaceholder')}
              className="input-customer"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary-lg flex justify-center items-center"
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
