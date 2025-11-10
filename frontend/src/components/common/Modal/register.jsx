import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { registerUserAPI } from "@/redux/user/userSlice";
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, FIELD_REQUIRED_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from "@/utils/validators";
import { ArrowLeft, CircleUserRound, Lock, Mail, ShieldCheck } from "lucide-react";
import FieldErrorAlert from "../Form/FieldErrorAlert";

// Step constants
const STEPS = {
  EMAIL: 1,
  VERIFY_CODE: 2,
  PASSWORD: 3
};

function RegisterModal({ open, onOpenChange, onOpenLogin }) {
  const dispatch = useDispatch();
  const { register, handleSubmit, watch, formState: { errors }, reset, clearErrors } = useForm();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(STEPS.EMAIL);
  const [registrationData, setRegistrationData] = useState({
    email: '',
    verificationCode: '',
    userName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const password = watch('password', '');

  // Reset form khi chuyển step
  useEffect(() => {
    clearErrors();
    reset();
  }, [currentStep, clearErrors, reset]);

  // Reset form khi đóng modal
  const handleCloseModal = (isOpen) => {
    if (!isOpen) {
      setCurrentStep(STEPS.EMAIL);
      setRegistrationData({ email: '', verificationCode: '', userName: '' });
      reset();
      clearErrors();
    }
    onOpenChange(isOpen);
  };

  // Step 1: Submit email để nhận mã xác thực
  const submitEmail = async (data) => {
    setIsLoading(true);
    try {
      // TODO: Gọi API gửi mã xác thực đến email
      // const response = await dispatch(sendVerificationCodeAPI(data.email));
      
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Mã xác thực đã được gửi đến email của bạn!');
      setRegistrationData({ 
        email: data.email,
        userName: data.userName,
        verificationCode: ''
      });
      setCurrentStep(STEPS.VERIFY_CODE);
    } catch {
      toast.error('Không thể gửi mã xác thực. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Xác thực mã
  const submitVerificationCode = async (data) => {
    setIsLoading(true);
    try {
      // TODO: Gọi API xác thực mã
      // const response = await dispatch(verifyCodeAPI({
      //   email: registrationData.email,
      //   code: data.verificationCode
      // }));
      
      // Giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Giả sử mã đúng (trong thực tế sẽ check từ API)
      if (data.verificationCode === '123456' || data.verificationCode.length === 6) {
        toast.success('Xác thực thành công!');
        setRegistrationData({ 
          ...registrationData, 
          verificationCode: data.verificationCode 
        });
        setCurrentStep(STEPS.PASSWORD);
      } else {
        toast.error('Mã xác thực không chính xác!');
      }
    } catch {
      toast.error('Xác thực thất bại. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Tạo mật khẩu và hoàn tất đăng ký
  const submitPassword = async (data) => {
    setIsLoading(true);
    const payload = {
      email: registrationData.email,
      userName: registrationData.userName,
      password: data.password,
      verificationCode: registrationData.verificationCode
    };

    try {
      const response = await dispatch(registerUserAPI(payload));
      
      if (!response.error) {
        toast.success('Đăng ký thành công! Bạn có thể cập nhật thông tin cá nhân sau.');
        handleCloseModal(false);
        navigate('/');
      } else {
        toast.error('Đăng ký thất bại. Vui lòng thử lại!');
      }
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    handleCloseModal(false);
    if (onOpenLogin) onOpenLogin();
  };

  const handleBack = () => {
    if (currentStep === STEPS.VERIFY_CODE) {
      setCurrentStep(STEPS.EMAIL);
    } else if (currentStep === STEPS.PASSWORD) {
      setCurrentStep(STEPS.VERIFY_CODE);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.EMAIL:
        return (
          <form className="space-y-4" onSubmit={handleSubmit(submitEmail)}>
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
                  defaultValue={registrationData.email}
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
                  defaultValue={registrationData.userName}
                  {...register('userName', {
                    required: FIELD_REQUIRED_MESSAGE,
                    minLength: { value: 3, message: 'Username tối thiểu 3 ký tú' },
                    maxLength: { value: 50, message: 'Username tối đa 50 ký tự' }
                  })}
                />
              </div>
              <div className="h-5">
                <FieldErrorAlert errors={errors} fieldName={'userName'} />
              </div>
            </div>

            <Button 
              type="submit" 
              className="h-12 rounded-full w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Đang gửi...' : 'Tiếp tục'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?
              <Button type="button" variant="link" className="p-1 text-primary" onClick={handleLoginClick}>
                Đăng nhập
              </Button>
            </div>

            <div className="relative py-2">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-3 text-xs text-muted-foreground">
                hoặc đăng ký với
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-4">
              <Button type="button" variant="outline" className="h-11 rounded-full justify-start gap-3">
                <img src="/icon/google.jpg" alt="Google" className="h-5 w-5" /> Google
              </Button>
              <Button type="button" variant="outline" className="h-11 rounded-full justify-start gap-3">
                <img src="/icon/fb.jpg" alt="Facebook" className="h-5 w-5" /> Facebook
              </Button>
            </div>
          </form>
        );

      case STEPS.VERIFY_CODE:
        return (
          <form className="space-y-4" onSubmit={handleSubmit(submitVerificationCode)}>
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">
                Mã xác thực đã được gửi đến
              </p>
              <p className="text-base font-semibold mt-1">{registrationData.email}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="verificationCode" className="text-muted-foreground text-sm">
                Mã xác thực <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="verificationCode" 
                  placeholder="Nhập mã 6 số" 
                  className="h-12 pl-11 rounded-full text-base text-center tracking-widest"
                  maxLength={6}
                  autoComplete="off"
                  {...register('verificationCode', {
                    required: FIELD_REQUIRED_MESSAGE,
                    minLength: { value: 6, message: 'Mã xác thực phải có 6 ký tự' },
                    maxLength: { value: 6, message: 'Mã xác thực phải có 6 ký tự' }
                  })}
                />
              </div>
              <div className="h-5">
                <FieldErrorAlert errors={errors} fieldName={'verificationCode'} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                type="button" 
                variant="outline"
                className="h-12 rounded-full flex-1"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <Button 
                type="submit" 
                className="h-12 rounded-full flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Đang xác thực...' : 'Xác thực'}
              </Button>
            </div>

            <div className="text-center">
              <Button 
                type="button" 
                variant="link" 
                className="text-sm text-primary"
                onClick={() => submitEmail({ email: registrationData.email, userName: registrationData.userName })}
                disabled={isLoading}
              >
                Gửi lại mã
              </Button>
            </div>
          </form>
        );

      case STEPS.PASSWORD:
        return (
          <form className="space-y-4" onSubmit={handleSubmit(submitPassword)}>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Email đã được xác thực thành công!
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-muted-foreground text-sm">
                Mật khẩu <span className="text-red-500">*</span>
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
                Xác nhận mật khẩu <span className="text-red-500">*</span>
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
                    validate: value => value === password || 'Mật khẩu không khớp'
                  })}
                />
              </div>
              <div className="h-5">
                <FieldErrorAlert errors={errors} fieldName={'confirmPassword'} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                type="button" 
                variant="outline"
                className="h-12 rounded-full flex-1"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <Button 
                type="submit" 
                className="h-12 rounded-full flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Bạn có thể cập nhật thông tin cá nhân sau khi đăng ký thành công
            </p>
          </form>
        );

      default:
        return null;
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case STEPS.EMAIL:
        return 'Đăng ký tài khoản';
      case STEPS.VERIFY_CODE:
        return 'Xác thực email';
      case STEPS.PASSWORD:
        return 'Tạo mật khẩu';
      default:
        return 'Đăng ký';
    }
  };

  // Get step description
  const getStepDescription = () => {
    switch (currentStep) {
      case STEPS.EMAIL:
        return 'Nhập email và username để bắt đầu';
      case STEPS.VERIFY_CODE:
        return 'Nhập mã xác thực đã được gửi đến email';
      case STEPS.PASSWORD:
        return 'Tạo mật khẩu cho tài khoản của bạn';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent
        className="
          p-0 gap-0 rounded-[28px] overflow-hidden border-0 shadow-2xl
          w-[95vw] lg:w-[900px]
          max-h-[90vh]
          sm:max-w-[95vw] lg:max-w-[900px]
          z-[100]
        "
      >
        <div className="grid grid-cols-1 md:grid-cols-10 max-h-[90vh]">
          {/* Left image panel */}
          <div className="hidden md:block md:col-span-4 relative">
            <img
              src="/images/banner/banner-account1.jpg"
              alt="cover"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Step indicator overlay */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {[STEPS.EMAIL, STEPS.VERIFY_CODE, STEPS.PASSWORD].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-12 rounded-full transition-all ${
                    currentStep >= step ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right column: header + form scrollable */}
          <div className="md:col-span-6 overflow-y-auto">
            <div className="p-6 md:p-8 lg:px-10">
              {/* Header */}
              <DialogHeader className="mt-4 mb-6">
                <DialogTitle className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {getStepTitle()}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {getStepDescription()}
                </p>
              </DialogHeader>

              {/* Step indicator for mobile */}
              <div className="flex md:hidden gap-2 mb-6 justify-center">
                {[STEPS.EMAIL, STEPS.VERIFY_CODE, STEPS.PASSWORD].map((step) => (
                  <div
                    key={step}
                    className={`h-2 w-12 rounded-full transition-all ${
                      currentStep >= step ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Dynamic form content based on step */}
              {renderStepContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RegisterModal;