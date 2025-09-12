import { Button } from '@/components/ui/button'
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
import SignUpContent from './signUpContent';
import SignInContent from './signInContent';
import { useState } from 'react';

const DialogAuth = ({ open, onOpenChange }) => {
    const [isSignIn, setIsSignIn] = useState(true)
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant='outline'>Sign Up</Button>
            </DialogTrigger>
            <DialogContent className='p-0 gap-0 border-0 rounded-[1rem] shadow-2xl sm:max-w-[55rem] h-auto overflow-hidden'>
                {
                    isSignIn ?
                        <SignInContent setIsSignIn={setIsSignIn} />
                        :
                        <SignUpContent setIsSignIn={setIsSignIn} />
                }

            </DialogContent>
        </Dialog >
    )
}

export default DialogAuth
