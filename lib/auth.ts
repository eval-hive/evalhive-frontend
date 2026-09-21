import Cookies from 'js-cookie';

export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student';
  schoolId: string | null;
  mustChangePassword: boolean;
  displayName: string;
  avatarUrl?: string | null;
}

export const getAuthToken = () => {
  return Cookies.get('token');
};

export const getUser = (): User | null => {
  const userStr = Cookies.get('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch (e) {
    return null;
  }
};

export const isAuthenticated = () => {
  return !!getAuthToken() && !!getUser();
};

export const getRole = () => {
  const user = getUser();
  return user ? user.role : null;
};

export const loginAuth = (token: string, user: User) => {
  // Use a secure cookie setting in production
  const options = process.env.NODE_ENV === 'production' 
    ? { secure: true, sameSite: 'strict' as const } 
    : {};
    
  Cookies.set('token', token, { ...options, expires: 1 }); // 1 day
  Cookies.set('user', JSON.stringify(user), { ...options, expires: 1 });
};

export const logout = () => {
  Cookies.remove('token');
  Cookies.remove('user');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};
