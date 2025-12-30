import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import VerifyPhone from '@/components/common/VerifyPhone'
import { verifyResetCodeAPI } from '@/apis'

function VerifyResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const { phone, contactType } = location.state || {}

  useEffect(() => {
    if (!phone || contactType !== 'phone') {
      toast.error('Invalid reset password session')
      navigate('/')
    }
  }, [phone, contactType, navigate])

  const handleVerifySuccess = async (code) => {
    try {
      const result = await verifyResetCodeAPI({ phone, code })
      
      toast.success('Verification successful!')
      
      // Thêm contactType=phone vào URL
      navigate(`/reset-password?token=${result.resetToken}&phone=${encodeURIComponent(phone)}&contactType=phone`)
    } catch (error) {
      console.error('Verification error:', error)
      throw error
    }
  }

  if (!phone || contactType !== 'phone') {
    return null
  }

  const formatPhoneDisplay = (phoneNum) => {
    if (!phoneNum) return ''
    if (phoneNum.startsWith('+84')) {
      return '0' + phoneNum.slice(3)
    }
    return phoneNum
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <VerifyPhone
          phone={phone}
          onVerifySuccess={handleVerifySuccess}
          title="Verify Reset Code"
          description={
            <>
              We've sent a verification code to<br />
              <strong className="text-foreground text-lg">{formatPhoneDisplay(phone)}</strong>
            </>
          }
          autoSend={false}
          submitButtonText="Verify & Continue"
          showResend={true}
          requireAuth={false}
        />
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          💡 Enter the code to reset your password
        </p>
      </div>
    </div>
  )
}

export default VerifyResetPassword