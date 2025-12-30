import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, CheckCircle, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { resetPasswordAPI } from '@/apis'
import { FIELD_REQUIRED_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from "@/utils/validators"
import FieldErrorAlert from '@/components/common/Form/FieldErrorAlert'

// Helper function to format phone display
const formatPhoneDisplay = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
}

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')
  
  // Determine contact type based on which parameter exists
  const contactType = phone ? 'phone' : email ? 'email' : null
  const contactValue = phone || email
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const newPassword = watch('newPassword')

  useEffect(() => {
    const validateToken = async () => {
      if (!token || !contactType || !contactValue) {
        toast.error('Invalid reset password link')
        setIsValidating(false)
        setTimeout(() => navigate('/'), 2000)
        return
      }

      // Token validation happens on submit, just check if params exist
      setIsValidToken(true)
      setIsValidating(false)
    }

    validateToken()
  }, [token, contactType, contactValue, navigate])

  const onSubmit = async (data) => {
    setIsSubmitting(true)

    const payload = {
      resetToken: token,
      newPassword: data.newPassword,
      contactType: contactType
    }

    // Add email or phone based on contactType
    if (contactType === 'email') {
      payload.email = email
    } else if (contactType === 'phone') {
      payload.phone = phone
    }

    try {
      await resetPasswordAPI(payload)
      
      toast.success('Password reset successfully! You can now login with your new password.')
      
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Invalid Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription className="text-base">
            Enter your new password for<br />
            <strong className="text-foreground">
              {contactType === 'phone' ? formatPhoneDisplay(phone) : email}
            </strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 pl-11 rounded-full text-base"
                  autoFocus
                  {...register('newPassword', {
                    required: FIELD_REQUIRED_MESSAGE,
                    pattern: { value: PASSWORD_RULE, message: PASSWORD_RULE_MESSAGE }
                  })}
                />
              </div>
              <div className="h-5">
                <FieldErrorAlert errors={errors} fieldName={'newPassword'} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 pl-11 rounded-full text-base"
                  {...register('confirmPassword', {
                    required: FIELD_REQUIRED_MESSAGE,
                    validate: value => value === newPassword || 'Passwords do not match'
                  })}
                />
              </div>
              <div className="h-5">
                <FieldErrorAlert errors={errors} fieldName={'confirmPassword'} />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPasswordPage