import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, updateUser } from '@/redux/user/userSlice';
import authorizedAxiosInstance from '@/utils/authorizeAxios';
import { API_ROOT } from '@/utils/constants';

export const useAuth = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Chỉ fetch nếu có token nhưng chưa có user trong Redux
        const accessToken = localStorage.getItem('accessToken') || 
                           document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
        
        if (accessToken && !currentUser) {
          const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/me`);
          if (response.data) {
            dispatch(updateUser(response.data));
          }
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };

    fetchCurrentUser();
  }, [dispatch, currentUser]);

  return { currentUser };
};
