import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import FieldErrorAlert from "../Form/FieldErrorAlert";
import { FIELD_REQUIRED_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from "@/utils/validators";
import { resetPasswordAPI } from "@/apis";

function ResetPasswordModal({ open, onOpenChange, resetToken, contactType, email, phone }) {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const newPassword = watch('newPassword');

  useEffect(() => {
    if (!open) {
      reset();
      setIsSubmitting(false);
    }
  }, [open, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const payload = {
      resetToken,
      newPassword: data.newPassword,
      contactType,
      ...(contactType === 'email' ? { email } : { phone })
    };

    try {
      await resetPasswordAPI(payload);
      
      toast.success('Password reset successfully! You can now login with your new password.');
      onOpenChange(false);
      
      // Optional: redirect to login or home
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 rounded-[28px] overflow-hidden border-0 shadow-2xl w-[95vw] lg:w-[500px] max-h-[90vh] sm:max-w-[95vw] lg:max-w-[500px] z-[100]">
        <div className="p-6 md:p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-2xl md:text-3xl font-semibold tracking-tight">
                Reset Password
              </DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your new password
            </p>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-muted-foreground text-sm">
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 pl-11 rounded-full text-base"
                  {...register('newPassword', {
                    required: FIELD_REQUIRED_MESSAGE,
                    pattern: { value: PASSWORD_RULE, message: PASSWORD_RULE_MESSAGE }
                  })}
                />
              </div>
              <div className="h-5">
                <FieldErrorAlert errors={errors} fieldName={'newPassword'} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-muted-foreground text-sm">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 pl-11 rounded-full text-base"
                  {...register('confirmPassword', {
                    required: FIELD_REQUIRED_MESSAGE,
                    validate: value => value === newPassword || 'Passwords do not match'
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ResetPasswordModal;