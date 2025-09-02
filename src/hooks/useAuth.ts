import { useAnonymousAuth } from '../contexts/AnonymousAuthContext';

export const useAuth = () => {
  return useAnonymousAuth();
};

export default useAuth;