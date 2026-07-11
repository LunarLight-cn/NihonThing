import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormInputs = z.infer<typeof registerSchema>

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const { t } = useTranslation()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange'
  })

  const onSubmit = async (data: RegisterFormInputs) => {
    setServerError(null)
    try {
      // Create user
      const response = await api.post('/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password
      })

      if (response.data.success) {
        // Since register on the backend usually returns token or just success, we'll try to log them in automatically
        const loginRes = await api.post('/auth/login', { email: data.email, password: data.password })
        if (loginRes.data.success) {
          login(loginRes.data.data.token, loginRes.data.data.user)
        }
        navigate('/')
      } else {
        setServerError(response.data.message || 'Registration failed')
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
          <h1 className="text-xl font-medium text-foreground">{t('auth.register.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.register.subtitle')}</p>
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
              {t('auth.register.username')}
            </label>
            <input 
              type="text" 
              {...register('username')}
              placeholder={t('auth.register.usernamePlaceholder')}
              className={`w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.username ? 'border-destructive' : 'border-border'}`}
            />
            {errors.username && <p className="text-destructive text-sm mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('auth.register.email')}
            </label>
            <input 
              type="email" 
              {...register('email')}
              placeholder={t('auth.register.emailPlaceholder')}
              className={`w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.email ? 'border-destructive' : 'border-border'}`}
            />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('auth.register.password')}
            </label>
            <input 
              type="password" 
              {...register('password')}
              placeholder={t('auth.register.passwordPlaceholder')}
              className={`w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.password ? 'border-destructive' : 'border-border'}`}
            />
            {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('auth.register.confirmPassword')}
            </label>
            <input 
              type="password" 
              {...register('confirmPassword')}
              placeholder={t('auth.register.passwordPlaceholder')}
              className={`w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${errors.confirmPassword ? 'border-destructive' : 'border-border'}`}
            />
            {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
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
                <span>{t('auth.register.submit')}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            {t('auth.register.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
