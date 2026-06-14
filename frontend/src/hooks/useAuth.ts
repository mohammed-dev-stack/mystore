import { useAuth as useAuthContext } from '../contexts/AuthContext';
import type { AuthContextType } from '../contexts/AuthContext';

// إعادة تصدير الدالة لتسهيل الوصول إليها
export const useAuth = (): AuthContextType => {
  return useAuthContext();
};