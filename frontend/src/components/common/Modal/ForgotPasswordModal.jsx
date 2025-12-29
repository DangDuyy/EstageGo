import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FieldErrorAlert from "../Form/FieldErrorAlert";
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, FIELD_REQUIRED_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE } from "@/utils/validators";
import { requestForgotPasswordAPI } from "@/apis";

function ForgotPasswordModal({ open, onOpenChange, onBackToLogin }) {
  const { register, handleSubmit, formState: { errors }, reset, clearErrors } = useForm();
  const [contactType, setContactType] = useState('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      reset();
      clearErrors();
      setContactType('email');
      setIsSubmitting(false);
    }
  }, [open, reset, clearErrors]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    const payload = {
      contactType,
      ...(contactType === 'email' ? { email: data.email } : { phone: data.phone })
    };

    try {
      await requestForgotPasswordAPI(payload);
      
      if (contactType === 'phone') {
        // Redirect to verify page
        onOpenChange(false);
        navigate('/verify-reset-password', { 
          state: { 
            phone: data.phone,
            contactType: 'phone'
          } 
        });
        toast.success('Verification code sent to your phone!');
      } else {
        // For email, just close modal
        onOpenChange(false);
        toast.success('Password reset link sent to your email!');
        toast.info('Please check your email and follow the instructions');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 rounded-[28px] overflow-hidden border-0 shadow-2xl w-[95vw] lg:w-[900px] max-h-[90vh] sm:max-w-[95vw] lg:max-w-[900px] z-[100]">
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
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => {
                      onOpenChange(false);
                      if (onBackToLogin) onBackToLogin();
                    }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <DialogTitle className="text-3xl md:text-4xl font-semibold tracking-tight">
                    Forgot Password
                  </DialogTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-2 ml-11">
                  Enter your email or phone number to reset your password
                </p>
              </DialogHeader>

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

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {contactType === 'email' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-muted-foreground text-sm">
                      Email Address <span className="text-red-500">*</span>
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
                    <p className="text-xs text-muted-foreground pt-2">
                      We'll send you a link to reset your password
                    </p>
                  </div>
                ) : (
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
                    <p className="text-xs text-muted-foreground pt-2">
                      We'll send you a verification code via SMS
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="h-12 rounded-full w-full mt-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Request'}
                </Button>

                <div className="text-center text-sm text-muted-foreground pt-4">
                  Remember your password?
                  <Button 
                    type="button" 
                    variant="link" 
                    className="p-1 text-primary"
                    onClick={() => {
                      onOpenChange(false);
                      if (onBackToLogin) onBackToLogin();
                    }}
                  >
                    Back to Sign In
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

export default ForgotPasswordModal;