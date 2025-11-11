import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { verifyUserAPI } from '@/redux/user/userSlice'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'

function VerifyAccountPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyAccount = async () => {
      const token = searchParams.get('token')
      const email = searchParams.get('email')

      console.log('🔍 Verify params:', { token, email })

      if (!token || !email) {
        setStatus('error')
        setMessage('Link xác thực không hợp lệ. Vui lòng kiểm tra lại email của bạn.')
        return
      }

      try {
        await dispatch(verifyUserAPI({ email, token })).unwrap()
        console.log('✅ Verify success')
        
        setStatus('success')
        setMessage('Tài khoản của bạn đã được xác thực thành công!')
        
      } catch (error) {
        console.error('❌ Verify error:', error)
        
        setStatus('error')
        const errorMsg = error?.message || 'Xác thực thất bại. Link có thể đã hết hạn hoặc không hợp lệ.'
        setMessage(errorMsg)
      }
    }

    verifyAccount()
  }, [searchParams, dispatch])

  const handleGoToHome = () => {
    navigate('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-md w-full">
        
        {/* Loading State */}
        {status === 'loading' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <Loader2 className="h-20 w-20 text-blue-500 animate-spin mx-auto relative" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-800">Đang xác thực...</h1>
              <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6 animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-3xl opacity-60 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-5 inline-block">
                <CheckCircle className="h-20 w-20 text-white animate-bounce" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Xác thực thành công!
              </h1>
              <p className="text-gray-600 text-lg">
                {message}
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
              <p className="text-gray-700 flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Bạn có thể đăng nhập ngay bây giờ
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleGoToHome}
                className="w-full h-12 rounded-full text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all group"
              >
                Đến trang chủ
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6 animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full blur-3xl opacity-60"></div>
              <div className="relative bg-gradient-to-br from-red-400 to-rose-500 rounded-full p-5 inline-block">
                <XCircle className="h-20 w-20 text-white" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Xác thực thất bại
              </h1>
              <p className="text-gray-600 text-lg">
                {message}
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-4 border border-red-200">
              <p className="text-sm text-gray-700">
                Nếu bạn cần trợ giúp, vui lòng liên hệ với chúng tôi qua email: 
                <span className="font-semibold text-red-600"> support@estagego.com</span>
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleGoToHome}
                className="w-full h-12 rounded-full text-base font-semibold"
              >
                Về trang chủ
              </Button>
              
              <p className="text-sm text-gray-500">
                Hoặc thử đăng ký lại với email khác
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default VerifyAccountPage