import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CircleUserRound, Facebook, Lock, X } from "lucide-react";

function LoginModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          p-0 gap-0 rounded-[28px] h-[800px] overflow-hidden border-0 shadow-2xl
          w-[95vw] lg:w-[1200px]
          sm:max-w-[95vw] lg:max-w-[1200px]
        "
      >
        {/* dùng 10 cột: 4 (ảnh) + 6 (form) */}
        <div className="grid grid-cols-1 md:grid-cols-10 h-full">
          {/* Left image panel = 4/10 */}
          <div className="hidden md:block md:col-span-4 relative h-full">
            <img
              src="/auth.jpg"
              alt="cover"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          {/* Right form panel = 6/10 */}
          <div className="md:col-span-6 h-full overflow-auto p-8 md:p-12">
            <DialogHeader className="mb-20">
              <div className="flex items-start justify-between">
                <DialogTitle className="text-4xl font-semibold tracking-tight">
                  Login
                </DialogTitle>
              </div>
            </DialogHeader>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* Account */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">
                  Account
                </Label>
                <div className="relative">
                  <CircleUserRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="email" placeholder="Your name" className="h-14 pl-12 rounded-full text-base" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="Your password" className="h-14 pl-12 rounded-full text-base" />
                </div>
              </div>

              <div className="flex items-center justify-end -mt-2">
                <Button type="button" variant="link" className="px-0 text-muted-foreground">
                  Forgot password
                </Button>
              </div>

              <Button type="submit" className="h-14 rounded-full text-base w-full">Login</Button>

              <div className="text-center text-sm text-muted-foreground">
                Don’t you have an account?
                <Button type="button" variant="link" className="p-1 text-primary">Register</Button>
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
