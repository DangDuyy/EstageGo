// =====================================================
// ErrorDialog.jsx - Dialog component với shadcn/ui
// =====================================================
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  XCircle 
} from "lucide-react";

export const ErrorDialog = ({ error, onClose }) => {
  const getIcon = () => {
    const iconClasses = "h-6 w-6";
    
    switch (error.type) {
      case 'error':
        return <XCircle className={`${iconClasses} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClasses} text-yellow-500`} />;
      case 'info':
        return <Info className={`${iconClasses} text-blue-500`} />;
      case 'success':
        return <CheckCircle2 className={`${iconClasses} text-green-500`} />;
      default:
        return <AlertCircle className={`${iconClasses} text-red-500`} />;
    }
  };

  const getHeaderColor = () => {
    switch (error.type) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-red-600';
    }
  };

  return (
    <Dialog open={!!error} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getIcon()}
            <span className={getHeaderColor()}>{error.title}</span>
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {error.message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          {error.action ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  error.action.handler();
                  onClose();
                }}
              >
                {error.action.text}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>
              Đóng
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};