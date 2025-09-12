// import { useId } from 'react'

// import { Button } from '@/components/ui/button'
// import { Checkbox } from '@/components/ui/checkbox'
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger
// } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'

// const DialogSignUp = ({ open, onOpenChange }) => {
//   const id = useId()

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <form>
//         <DialogTrigger asChild>
//           <Button variant='outline'>Sign Up</Button>
//         </DialogTrigger>
//         <DialogContent className='to-card bg-gradient-to-b from-green-100 to-40% [background-size:100%_101%] sm:max-w-sm dark:from-green-900'>
//           <DialogHeader className='items-center'>
//             <DialogTitle>Sign Up</DialogTitle>
//             <DialogDescription>Start your 60-day free trial now.</DialogDescription>
//           </DialogHeader>
//           <form className='flex flex-col gap-4'>
//             <div className='grid grid-cols-2 gap-4'>
//               <div className='grid gap-3'>
//                 <Label htmlFor='first-name'>First Name</Label>
//                 <Input id='first-name' name='firstname' placeholder='John' />
//               </div>
//               <div className='grid gap-3'>
//                 <Label htmlFor='last-name'>Last Name</Label>
//                 <Input id='last-name' name='lastname' placeholder='Doe' />
//               </div>
//             </div>
//             <div className='grid gap-3'>
//               <Label htmlFor='email'>Email</Label>
//               <Input type='email' id='email' name='useremail' placeholder='example@gmail.com' />
//             </div>
//             <div className='grid gap-3'>
//               <Label htmlFor='password'>Password</Label>
//               <Input type='password' id='password' name='userpassword' placeholder='Password' />
//             </div>
//             <div className='flex items-center gap-2'>
//               <Checkbox
//                 id={id}
//                 className='focus-visible:ring-green-600/20 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600 dark:text-white dark:focus-visible:ring-green-400/40 dark:data-[state=checked]:border-green-400 dark:data-[state=checked]:bg-green-400'
//                 defaultChecked
//               />
//               <Label htmlFor={id} className='gap-1'>
//                 I agree with
//                 <a href='#' className='underline hover:no-underline'>
//                   condition
//                 </a>
//                 and
//                 <a href='#' className='underline hover:no-underline'>
//                   privacy policy
//                 </a>
//               </Label>
//             </div>
//           </form>
//           <DialogFooter className='pt-4 sm:flex-col'>
//             <Button className='bg-green-600 text-white hover:bg-green-600 focus-visible:ring-green-600 dark:bg-green-400 dark:hover:bg-green-400 dark:focus-visible:ring-green-400'>
//               Start your trial
//             </Button>
//             <div className='before:bg-border after:bg-border flex items-center gap-4 before:h-px before:flex-1 after:h-px after:flex-1'>
//               <span className='text-muted-foreground text-xs'>Or</span>
//             </div>
//             <Button variant='outline'>
//               <img
//                 src='https://cdn.shadcnstudio.com/ss-assets/brand-logo/google-icon.png?width=20&height=20&format=auto'
//                 alt='Google Icon'
//                 className='size-5'
//               />
//               <span className='flex justify-center'>Continue with Google</span>
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </form>
//     </Dialog>
//   )
// }

// export default DialogSignUp



// import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CircleUserRound, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FieldErrorAlert from "../Form/FieldErrorAlert";
import { Separator } from "@/components/ui/separator";

const DialogSignUp = ({ open, onOpenChange }) => {
  // const id = useId()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form>
        <DialogTrigger asChild>
          <Button variant='outline'>Sign Up</Button>
        </DialogTrigger>
        <DialogContent className='p-0 gap-0 border-0 rounded-[1rem] shadow-2xl sm:max-w-[55rem] h-auto overflow-hidden'>
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
                  <Button type="button" variant="link" className="p-1 text-primary">Sign In</Button>
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
      </DialogContent>
    </form>
    </Dialog >
  )
}

export default DialogSignUp
