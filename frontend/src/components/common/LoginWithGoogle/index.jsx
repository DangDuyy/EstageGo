import { GoogleLogin } from '@react-oauth/google'
import { useDispatch } from 'react-redux'
import { loginWithGoogleAPI } from '@/redux/user/userSlice'
import { toast } from 'react-toastify';

export const LoginWithGoogle = ({ onOpenChange }) => {
    const dispatch = useDispatch();

    return (
        <GoogleLogin
            theme="outline"        // outline | filled_blue | filled_black
            shape="pill"
            onSuccess={(credentialResponse) => {
                // const data = jwtDecode(credentialResponse.credential);
                // console.log("Google User Info:", data);

                // Gửi token về backend verify
                toast.promise(
                    dispatch(loginWithGoogleAPI(credentialResponse.credential)),
                    { pending: 'Logging in...' }
                ).then((res) => {
                    if (!res.error) {
                        if (onOpenChange) onOpenChange(false)
                    }
                })
            }}
            onError={() => {
                console.log("Login Failed");
            }}
        />
    )
}
