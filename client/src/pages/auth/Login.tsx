import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormInputs = z.infer<typeof loginSchema>

export const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [serverError, setServerError] = useState<string | null>(null)
  
  const from = location.state?.from?.pathname || '/'

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormInputs) => {
    setServerError(null)
    try {
      const response = await api.post('/auth/login', data)
      if (response.data.success) {
        login(response.data.data.token, response.data.data.user)
        navigate(from, { replace: true })
      } else {
        setServerError(response.data.message || 'Login failed')
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Failed to connect to the server')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8 relative">
        <Link to="/" className="absolute top-6 left-6 text-muted-foreground hover:text-primary transition-colors flex items-center text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('auth.back')}
        </Link>
        <div className="text-center mb-8 mt-6">
          <Link to="/" className="text-2xl font-bold text-primary inline-block mb-2">NihonThing</Link>
          <h1 className="text-xl font-medium text-foreground">{t('auth.login.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.login.subtitle')}</p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start space-x-2 text-destructive">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-sm">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('auth.login.email')}
            </label>
            <input 
              type="email" 
              {...register('email')}
              placeholder={t('auth.login.emailPlaceholder')}
              className={`w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.email ? 'border-destructive' : 'border-border'}`}
            />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('auth.login.password')}
            </label>
            <input 
              type="password" 
              {...register('password')}
              placeholder={t('auth.login.passwordPlaceholder')}
              className={`w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.password ? 'border-destructive' : 'border-border'}`}
            />
            {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{t('auth.login.submit')}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            {t('auth.login.create')}
          </Link>
        </p>
      </div>
    </div>
  )
}
