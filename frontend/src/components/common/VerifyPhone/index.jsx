import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, ShieldCheck } from "lucide-react"
import { toast } from 'react-toastify'
import { API_ROOT } from '@/utils/constants'
import axios from 'axios'

function VerifyPhone({ 
  phone, 
  onVerifySuccess,
  title = "Verify Phone Number",
  description = null,
  autoSend = false,
  submitButtonText = "Verify Code",
  showResend = true,
  requireAuth = false
}) {
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [hasInitialSent, setHasInitialSent] = useState(false)

  useEffect(() => {
    if (autoSend && phone && !hasInitialSent) {
      handleSendCode()
      setHasInitialSent(true)
    }
  }, [autoSend, phone, hasInitialSent])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = async () => {
    if (!phone) {
      toast.error('Phone number is required')
      return
    }

    if (countdown > 0) return

    setIsSending(true)

    try {
      const config = {}
      
      if (requireAuth) {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers = {
            Authorization: `Bearer ${token}`
          }
        }
      }

      // ✅ Gửi phone local format (0XXX), backend sẽ convert sang +84
      const response = await axios.post(
        `${API_ROOT}/v1/users/phone/send-code`, 
        { phone },
        config
      )

      if (response.data) {
        toast.success('Verification code sent to your phone!')
        setCountdown(60)
      }
    } catch (error) {
      console.error('Send code error:', error)
      toast.error(error.response?.data?.message || 'Failed to send verification code. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    if (!phone) {
      toast.error('Phone number is required')
      return
    }

    setIsVerifying(true)

    try {
      if (onVerifySuccess) {
        await onVerifySuccess(code)
      }
    } catch (error) {
      console.error('Verify error:', error)
      const errorMessage = error?.response?.data?.message || 'Verification failed'
      toast.error(errorMessage)
    } finally {
      setIsVerifying(false)
    }
  }

  // ✅ Format: 0XXXXXXXXX → 0XXX XXX XXXX (display only)
  const formatPhoneDisplay = (phoneNum) => {
    if (!phoneNum) return ''
    
    // Remove all non-digit characters
    const cleaned = phoneNum.replace(/\D/g, '')
    
    // Format: 0XXX XXX XXXX
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
    }
    
    return phoneNum
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center space-y-3 pb-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription className="text-base">
          {description || (
            <>
              Enter the verification code sent to<br />
              <strong className="text-foreground text-lg">{formatPhoneDisplay(phone)}</strong>
            </>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-2">
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <Phone className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{formatPhoneDisplay(phone)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium">
              Verification Code
            </Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-3xl tracking-[0.5em] font-mono h-14"
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold" 
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? 'Verifying...' : submitButtonText}
          </Button>

          {showResend && (
            <div className="text-center space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={countdown > 0 || isSending}
                className="w-full"
              >
                {countdown > 0 
                  ? `Resend in ${countdown}s` 
                  : isSending 
                    ? 'Sending...' 
                    : 'Resend Code'
                }
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

export default VerifyPhone