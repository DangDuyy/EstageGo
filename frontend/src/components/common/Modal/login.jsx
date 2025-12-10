import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginUserAPI } from "@/redux/user/userSlice";
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, FIELD_REQUIRED_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE } from "@/utils/validators";
import { CircleUserRound, Lock, Mail, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FieldErrorAlert from "../Form/FieldErrorAlert";
import { LoginWithGoogle } from "../LoginWithGoogle";

function LoginModal({ open, onOpenChange, onOpenRegister }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset, clearErrors } = useForm();
  const [contactType, setContactType] = useState('email'); // 'email' or 'phone'

  // Reset form khi đóng modal
  useEffect(() => {
    if (!open) {
      reset();
      clearErrors();
      setContactType('email');
    }
  }, [open, reset, clearErrors]);

  const submitLogin = (data) => {
    const payload = {
      password: data.password,
      contactType
    }

    if (contactType === 'email') {
      payload.email = data.email
    } else {
      payload.phone = data.phone
    }

    toast.promise(
      dispatch(loginUserAPI(payload)),
      { pending: 'Logging in...' }
    ).then((res) => {
      if (!res.error) {
        onOpenChange(false)
        navigate('/')
      }
    })
  }

  const handleRegisterClick = () => {
    onOpenChange(false)
    if (onOpenRegister) onOpenRegister()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          p-0 gap-0 rounded-[28px] overflow-hidden border-0 shadow-2xl
          w-[95vw] lg:w-[900px] max-h-[90vh] sm:max-w-[95vw] lg:max-w-[900px]
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
          </div>

          {/* Right form panel */}
          <div className="md:col-span-6 overflow-y-auto">
            <div className="p-6 md:p-8 lg:px-10">
              <DialogHeader className="mt-4 mb-6">
                <DialogTitle className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Sign In
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Sign in to continue
                </p>
              </DialogHeader>

              {/* ✅ Tabs for Email or Phone */}
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

              <form className="space-y-4" onSubmit={handleSubmit(submitLogin)}>
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
                  contactType === 'phone' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-muted-foreground text-sm">
                        Phone Number <span className="text-red-500">*</span>
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
                  )
                )}

                {/* Password */}
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

                <div className="flex items-center justify-end">
                  <Button type="button" variant="link" className="px-0 text-sm text-muted-foreground">
                    Forgot password?
                  </Button>
                </div>

                <Button type="submit" className="h-12 rounded-full w-full mt-6">
                  Sign In
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Don't have an account?
                  <Button type="button" variant="link" className="p-1 text-primary" onClick={handleRegisterClick}>
                    Sign Up
                  </Button>
                </div>

                <div className="relative py-2">
                  <Separator />
                  <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-3 text-xs text-muted-foreground">
                    or sign in with
                  </span>
                </div>

                <div className="grid gap-3 pb-4">
                  {/* <Button type="button" variant="outline" className="h-11 rounded-full gap-3">
                    <img src="/icon/google.jpg" alt="Google" className="h-5 w-5" /> Google
                  </Button> */}
                  {/* <Button type="button" variant="outline" className="h-11 rounded-full justify-start gap-3">
                    <img src="/icon/fb.jpg" alt="Facebook" className="h-5 w-5" /> Facebook
                  </Button> */}
                  <LoginWithGoogle onOpenChange={onOpenChange} />
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LoginModal;
