import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  })

type RegisterFormInputs = z.infer<typeof registerSchema>

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormInputs>({
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
        const loginRes = await api.post('/auth/login', { identifier: data.email, password: data.password })
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
    <div className="auth-container">
      <div className="auth-card">
        <Link
          to="/"
          className="absolute top-6 left-6 text-muted-foreground hover:text-primary transition-colors flex items-center text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('auth.back')}
        </Link>
        <div className="text-center mb-8 mt-6">
          <Link
            to="/"
            className="text-2xl font-bold text-primary inline-block mb-2"
          >
            NihonThing
          </Link>
          <h1 className="text-xl font-medium text-foreground">{t('auth.register.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.register.subtitle')}</p>
        </div>

        {serverError && (
          <div className="error-alert mb-6">
            <span className="text-sm">{serverError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <label className="label-customer">{t('auth.register.username')}</label>
            <input
              type="text"
              {...register('username')}
              placeholder={t('auth.register.usernamePlaceholder')}
              className={`input-customer py-2 px-4 rounded-md ${errors.username ? 'border-destructive' : ''}`}
            />
            {errors.username && <p className="text-destructive text-sm mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="label-customer">{t('auth.register.email')}</label>
            <input
              type="email"
              {...register('email')}
              placeholder={t('auth.register.emailPlaceholder')}
              className={`input-customer py-2 px-4 rounded-md ${errors.email ? 'border-destructive' : ''}`}
            />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label-customer">{t('auth.register.password')}</label>
            <input
              type="password"
              {...register('password')}
              placeholder={t('auth.register.passwordPlaceholder')}
              className={`input-customer py-2 px-4 rounded-md ${errors.password ? 'border-destructive' : ''}`}
            />
            {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label-customer">{t('auth.register.confirmPassword')}</label>
            <input
              type="password"
              {...register('confirmPassword')}
              placeholder={t('auth.register.passwordPlaceholder')}
              className={`input-customer py-2 px-4 rounded-md ${errors.confirmPassword ? 'border-destructive' : ''}`}
            />
            {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-2.5 flex items-center justify-center rounded-md"
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
          <Link
            to="/login"
            className="text-primary hover:underline font-medium"
          >
            {t('auth.register.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
