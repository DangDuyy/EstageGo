import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { loginUserAPI } from "@/redux/user/userSlice";
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, FIELD_REQUIRED_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from "@/utils/validators";
import { CircleUserRound, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FieldErrorAlert from "../Form/FieldErrorAlert";

function LoginModal({ open, onOpenChange, onOpenRegister }) {
  const dispatch = useDispatch()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const navigate = useNavigate()

  const submitLogin = (data) => {
    
    const { email, password } = data

    toast.promise(
      dispatch(loginUserAPI({ email, password })),
      { pending: 'Login in...' }
    ).then((res) => {
      if (!res.error) navigate('/')
    })
  }

  const handleRegisterClick = () => {
    onOpenChange(false) // đóng login modal
    if (onOpenRegister) onOpenRegister() // mở register modal
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          p-0 gap-0 rounded-[28px] h-[800px] overflow-hidden border-0 shadow-2xl
          w-[95vw] lg:max-w-[800px] lg:max-h-[600px]
          z-[100]
        "
      >
        {/* dùng 10 cột: 4 (ảnh) + 6 (form) */}
        <div className="grid grid-cols-1 md:grid-cols-10 h-full">
          {/* Left image panel = 4/10 */}
          <div className="hidden md:block md:col-span-4 relative h-full">
            <img
              src="/images/banner/banner-account1.jpg"
              alt="cover"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          {/* Right form panel = 6/10 */}
          <div className="lg:col-span-6 h-full overflow-auto p-8 lg:p-12">
            <DialogHeader className="mb-20">
              <div className="flex items-start justify-between">
                <DialogTitle className="text-4xl font-semibold tracking-tight">
                  Login
                </DialogTitle>
              </div>
            </DialogHeader>

            <form className="space-y-6 lg:space-y-2" onSubmit={handleSubmit(submitLogin)}>
              {/* Account */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">
                  Account
                </Label>
                <div className="relative">
                  <CircleUserRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="email" placeholder="Email Adress" className="h-14 pl-12 rounded-full text-base" 
                    {...register('email', {
                      required: FIELD_REQUIRED_MESSAGE,
                      pattern: {
                        value: EMAIL_RULE,
                        message: EMAIL_RULE_MESSAGE
                      }
                    })}
                  />
                </div>
              </div>

              <FieldErrorAlert errors={errors} fieldName={'email'} />      

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="Your password" className="h-14 pl-12 rounded-full text-base" 
                    {...register('password', {
                      required: FIELD_REQUIRED_MESSAGE,
                      pattern: {
                        value: PASSWORD_RULE,
                        message: PASSWORD_RULE_MESSAGE
                      }
                    })}
                  />
                </div>
              </div>

              <FieldErrorAlert errors={errors} fieldName={'password'} />

              <div className="flex items-center justify-end -mt-2">
                <Button type="button" variant="link" className="px-0 text-muted-foreground">
                  Forgot password
                </Button>
              </div>

              <Button type="submit" className="h-14 rounded-full text-base w-full hover:cursor-pointer">Login</Button>

              <div className="text-center text-sm text-muted-foreground">
                Don't you have an account?
                <Button type="button" variant="link" className="p-1 text-primary" onClick={handleRegisterClick}>Register</Button>
              </div>

              <div className="relative py-2">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-3 text-xs text-muted-foreground">
                  or login with
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button type="button" variant="outline" className="h-12 rounded-full justify-start gap-3">
                  <img src="/icon/google.jpg" alt="Google" className="h-5 w-5" />
                  Google
                </Button>
                <Button type="button" variant="outline" className="h-12 rounded-full justify-start gap-3">
                  <img src="/icon/fb.jpg" alt="Facebook" className="h-5 w-5" />
                  Facebook
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LoginModal;
