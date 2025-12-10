import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { registerUserAPI } from '@/apis'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, FIELD_REQUIRED_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE } from "@/utils/validators"
import { CircleUserRound, Lock, Mail, Phone } from "lucide-react"
import FieldErrorAlert from "../Form/FieldErrorAlert"
import { LoginWithGoogle } from '../LoginWithGoogle'

function RegisterModal({ open, onOpenChange, onOpenLogin }) {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors }, reset, clearErrors } = useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [contactType, setContactType] = useState('email') // 'email' or 'phone'
  
  const password = watch('password', '')

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset()
      clearErrors()
      setContactType('email')
    }
  }, [open, reset, clearErrors])

  const handleCloseModal = (isOpen) => {
    if (!isOpen) {
      reset()
      clearErrors()
      setContactType('email')
    }
    onOpenChange(isOpen)
  }

  const submitForm = async (data) => {
    setIsLoading(true)
    
    const payload = {
      userName: data.userName,
      password: data.password,
      contactType
    }

    if (contactType === 'email') {
      payload.email = data.email
    } else {
      payload.phone = data.phone
    }

    try {
      const response = await registerUserAPI(payload)
      
      if (response.ok) {
        handleCloseModal(false)
        
        if (contactType === 'phone') {
          // Navigate to phone OTP verification
          navigate('/verify-phone-register', { 
            state: { phone: payload.phone, userId: response.userId } 
          })
        } else {
          // Email - open login modal after register
          setTimeout(() => {
            if (onOpenLogin) onOpenLogin()
          }, 500)
        }
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Registration failed. Please try again!'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginClick = () => {
    handleCloseModal(false)
    if (onOpenLogin) onOpenLogin()
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="p-0 gap-0 rounded-[28px] overflow-hidden border-0 shadow-2xl w-[95vw] lg:w-[900px] max-h-[90vh] sm:max-w-[95vw] lg:max-w-[900px] z-[100]">
        <div className="grid grid-cols-1 md:grid-cols-10 max-h-[90vh]">
          {/* Left side - Image */}
          <div className="hidden md:block md:col-span-4 relative">
            <img
              src="/images/banner/banner-account1.jpg"
              alt="cover"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          {/* Right side - Form */}
          <div className="md:col-span-6 overflow-y-auto">
            <div className="p-6 md:p-8 lg:px-10">
              <DialogHeader className="mt-4 mb-6">
                <DialogTitle className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Create Account
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Create a new account to get started
                </p>
              </DialogHeader>

              {/* Tabs for Email or Phone */}
              <Tabs value={contactType} onValueChange={setContactType} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="phone">
                    <Phone className="w-4 h-4 mr-2" />
                    Phone
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form className="space-y-4" onSubmit={handleSubmit(submitForm)}>
                {/* Email or Phone input based on tab */}
                {contactType === 'email' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-muted-foreground text-sm">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        id="email" 
                        placeholder="your.email@example.com" 
                        className="h-12 pl-11 rounded-full text-base"
                        {...register('email', {
                          required: FIELD_REQUIRED_MESSAGE,
                          pattern: { value: EMAIL_RULE, message: EMAIL_RULE_MESSAGE }
                        })}
                      />
                    </div>
                    <div className="h-5">
                      <FieldErrorAlert errors={errors} fieldName={'email'} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-muted-foreground text-sm">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        placeholder="0912345678" 
                        className="h-12 pl-11 rounded-full text-base"
                        {...register('phone', {
                          required: FIELD_REQUIRED_MESSAGE,
                          pattern: { value: PHONE_RULE, message: PHONE_RULE_MESSAGE }
                        })}
                      />
                    </div>
                    <div className="h-5">
                      <FieldErrorAlert errors={errors} fieldName={'phone'} />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="userName" className="text-muted-foreground text-sm">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <CircleUserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="userName" 
                      placeholder="username" 
                      className="h-12 pl-11 rounded-full text-base"
                      {...register('userName', {
                        required: FIELD_REQUIRED_MESSAGE,
                        minLength: { value: 3, message: 'Username must be at least 3 characters' },
                        maxLength: { value: 50, message: 'Username must not exceed 50 characters' }
                      })}
                    />
                  </div>
                  <div className="h-5">
                    <FieldErrorAlert errors={errors} fieldName={'userName'} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-muted-foreground text-sm">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-12 pl-11 rounded-full text-base"
                      autoComplete="new-password"
                      {...register('password', {
                        required: FIELD_REQUIRED_MESSAGE,
                        pattern: { value: PASSWORD_RULE, message: PASSWORD_RULE_MESSAGE }
                      })}
                    />
                  </div>
                  <div className="h-5">
                    <FieldErrorAlert errors={errors} fieldName={'password'} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-muted-foreground text-sm">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-12 pl-11 rounded-full text-base"
                      autoComplete="new-password"
                      {...register('confirmPassword', {
                        required: FIELD_REQUIRED_MESSAGE,
                        validate: value => value === password || 'Passwords do not match'
                      })}
                    />
                  </div>
                  <div className="h-5">
                    <FieldErrorAlert errors={errors} fieldName={'confirmPassword'} />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="h-12 rounded-full w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Sign Up'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?
                  <Button type="button" variant="link" className="p-1 text-primary" onClick={handleLoginClick}>
                    Sign In
                  </Button>
                </div>

                <div className="relative py-2">
                  <Separator />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-3 text-xs text-muted-foreground">
                    or sign up with
                  </span>
                </div>

                <div className="grid gap-3 pb-4">
                  {/* <Button type="button" variant="outline" className="h-11 rounded-full justify-start gap-3">
                    <img src="/icon/google.jpg" alt="Google" className="h-5 w-5" /> Google
                  </Button> */}
                  <LoginWithGoogle onOpenChange={onOpenChange}/>
                  {/* <Button type="button" variant="outline" className="h-11 rounded-full justify-start gap-3">
                    <img src="/icon/fb.jpg" alt="Facebook" className="h-5 w-5" /> Facebook
                  </Button> */}
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterModal