import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(1, 'Password is required')
})

type LoginFormInputs = z.infer<typeof loginSchema>

export const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [serverError, setServerError] = useState<string | null>(null)

  // Set when ProtectedRoute bounced them here: that page is where they meant
  // to go, so it wins over the role's own home.
  const from = location.state?.from?.pathname as string | undefined

  const homeForRole = (role?: string) => (role === 'admin' ? '/admin' : role === 'agent' ? '/agent' : '/')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormInputs) => {
    setServerError(null)
    try {
      const response = await api.post('/auth/login', data)
      if (response.data.success) {
        const user = response.data.data.user
        login(response.data.data.token, user)
        navigate(from || homeForRole(user?.role), { replace: true })
      } else {
        setServerError(response.data.message || 'Login failed')
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
          <h1 className="text-xl font-medium text-foreground">{t('auth.login.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.login.subtitle')}</p>
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
            <label className="label-customer">Email or Username</label>
            <input
              type="text"
              {...register('identifier')}
              placeholder="you@example.com or username"
              className={`input-customer py-2 px-4 rounded-md ${errors.identifier ? 'border-destructive' : ''}`}
            />
            {errors.identifier && <p className="text-destructive text-sm mt-1">{errors.identifier.message}</p>}
          </div>

          <div>
            <label className="label-customer">{t('auth.login.password')}</label>
            <input
              type="password"
              {...register('password')}
              placeholder={t('auth.login.passwordPlaceholder')}
              className={`input-customer py-2 px-4 rounded-md ${errors.password ? 'border-destructive' : ''}`}
            />
            {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
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
                <span>{t('auth.login.submit')}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.login.noAccount')}{' '}
          <Link
            to="/register"
            className="text-primary hover:underline font-medium"
          >
            {t('auth.login.create')}
          </Link>
        </p>
      </div>
    </div>
  )
}
