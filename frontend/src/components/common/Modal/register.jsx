import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { registerUserAPI } from "@/redux/user/userSlice";
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, FIELD_REQUIRED_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from "@/utils/validators";
import { CircleUserRound, Lock, Mail } from "lucide-react";
import FieldErrorAlert from "../Form/FieldErrorAlert";

function RegisterModal({ open, onOpenChange, onOpenLogin }) {
  const dispatch = useDispatch();
  const { register, handleSubmit, watch, formState: { errors }, reset, clearErrors } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  
  const password = watch('password', '');

  // Reset form khi đóng modal
  useEffect(() => {
    if (!open) {
      reset();
      clearErrors();
    }
  }, [open, reset, clearErrors]);

  const handleCloseModal = (isOpen) => {
    if (!isOpen) {
      reset();
      clearErrors();
    }
    onOpenChange(isOpen);
  };

  const submitForm = async (data) => {
    setIsLoading(true);
    const payload = {
      email: data.email,
      userName: data.userName,
      password: data.password
    };

    try {
      const response = await dispatch(registerUserAPI(payload));
      
      if (!response.error) {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        handleCloseModal(false);
        
        // Chuyển sang trang đăng nhập
        setTimeout(() => {
          if (onOpenLogin) onOpenLogin();
        }, 500);
      } else {
        const errorMessage = response.error?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    handleCloseModal(false);
    if (onOpenLogin) onOpenLogin();
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
          <div className="hidden md:block md:col-span-4 relative">
            <img
              src="/images/banner/banner-account1.jpg"
              alt="cover"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="md:col-span-6 overflow-y-auto">
            <div className="p-6 md:p-8 lg:px-10">
              <DialogHeader className="mt-4 mb-6">
                <DialogTitle className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Đăng ký tài khoản
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Tạo tài khoản mới để trải nghiệm dịch vụ
                </p>
              </DialogHeader>

              <form className="space-y-4" onSubmit={handleSubmit(submitForm)}>
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
                        minLength: { value: 3, message: 'Username tối thiểu 3 ký tự' },
                        maxLength: { value: 50, message: 'Username tối đa 50 ký tự' }
                      })}
                    />
                  </div>
                  <div className="h-5">
                    <FieldErrorAlert errors={errors} fieldName={'userName'} />
                  </div>
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

                <Button 
                  type="submit" 
                  className="h-12 rounded-full w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RegisterModal;