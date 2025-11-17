import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import VerifyPhone from '@/components/common/VerifyPhone'
import { verifyPhoneRegistrationAPI } from '@/apis'

function VerifyPhoneRegister() {
  const navigate = useNavigate()
  const location = useLocation()
  const { phone, userId } = location.state || {}

  useEffect(() => {
    if (!phone || !userId) {
      toast.error('Invalid registration session')
      navigate('/')
    }
  }, [phone, userId, navigate])

  const handleVerifySuccess = async (code) => {
    try {
      await verifyPhoneRegistrationAPI(phone, code)
      
      toast.success('Account activated successfully! You can now login.')
      
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (error) {
      console.error('Account activation error:', error)
      throw error
    }
  }

  if (!phone || !userId) {
    return null
  }

  // ✅ Format phone display
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
          title="Activate Your Account"
          description={
            <>
              We've sent a verification code to<br />
              <strong className="text-foreground text-lg">{formatPhoneDisplay(phone)}</strong>
            </>
          }
          autoSend={false}
          submitButtonText="Activate Account"
          showResend={true}
          requireAuth={false}
        />
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          💡 Check your phone for the verification code
        </p>
      </div>
    </div>
  )
}

export default VerifyPhoneRegister