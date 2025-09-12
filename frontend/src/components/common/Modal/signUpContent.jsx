import { Button } from '@/components/ui/button'
import { CircleUserRound, Lock } from "lucide-react";
import {
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FieldErrorAlert from "../Form/FieldErrorAlert";

function SignUpContent({setIsSignIn}) {
    return (
        <div className='grid grid-cols-1 md:grid-cols-16 h-full'>
            {/* Left image panel = 7/16 */}
            <div className="hidden md:block md:col-span-7 relative h-full">
              <img
                src="/images/banner/banner-account2.jpg"
                alt="cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            {/* Right form panel = 9/16 */}
            <div className="md:col-span-9 h-full overflow-auto p-8 md:p-12">
              <DialogHeader className="mb-10">
                <div className="flex items-start justify-between">
                  <DialogTitle className="text-3xl font-medium">
                    Register
                  </DialogTitle>
                </div>
              </DialogHeader>

              <form>

                <div className='space-y-6 mb-10'>
                  {/* Account */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Account
                  </Label>
                  <div className="relative">
                    <CircleUserRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" placeholder="Email Adress" className="h-12 pl-12 pt-3 pb-3 rounded-full"
                      // {...register('email', {
                      //   required: FIELD_REQUIRED_MESSAGE,
                      //   pattern: {
                      //     value: EMAIL_RULE,
                      //     message: EMAIL_RULE_MESSAGE
                      //   }
                      // })}
                    />
                  </div>
                </div>

                <FieldErrorAlert fieldName={'email'} />

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="Your password" className="h-12 pl-12 pt-3 pb-3 rounded-full"
                      
                    />
                  </div>
                </div>
                <FieldErrorAlert fieldName={'password'} />

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="confirmPassword" type="password" placeholder="Your password" className="h-12 pl-12 pt-3 pb-3 rounded-full"
                      
                    />
                  </div>
                </div>
                <FieldErrorAlert fieldName={'confirmPassword'} />
                </div>

                <Button type="submit" className="h-12 rounded-full text-base w-full">Sign Up</Button>

                <div className="text-center text-sm text-muted-foreground mb-5">
                  Don’t you have an account?
                  <Button type="button" variant="link" className="p-1 text-primary" onClick = {() => setIsSignIn(true)}>Sign In</Button>
                </div>

                <div className="relative py-2 mb-5">
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
    )
}

export default SignUpContent