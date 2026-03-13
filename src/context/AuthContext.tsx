
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { RegisterData, ICurrentUser } from "../types/interfaces";
import UserService from "../services/userApi";
import { loadThemeColors, resetThemeColors, updateThemeColors } from "../lib/colorUtils";


interface AuthContextType {
  isAuthenticated: boolean;
  isInitialAuthCheck: boolean;
  currentUser: ICurrentUser;
  setCurrentUser: (user: ICurrentUser) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState(true);
  const [currentUser, setCurrentUser] = useState<ICurrentUser>();

  const checkAuth = useCallback(async () => {
    try {
      const userData = await UserService.getCurrentUser();
      setCurrentUser(userData);
      setIsAuthenticated(true);

      const brandingColors = localStorage.getItem("brandingColors");
      if (brandingColors && userData.user.organization?.branding?.colors) {
        updateThemeColors(userData.user.organization.branding.colors);
      } else {
        loadThemeColors();
      }
    } catch (error) {
      setIsAuthenticated(false);
      setCurrentUser(undefined);
      resetThemeColors();
    } finally {
      setIsInitialAuthCheck(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      localStorage.removeItem("brandingColors");
      const res = await UserService.login(email, password);
      setCurrentUser(res);
      setIsAuthenticated(true);
      if (res.user.organization?.branding?.colors) {
        updateThemeColors(res.user.organization.branding.colors);
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await UserService.logout();
      setIsAuthenticated(false);
      setCurrentUser(undefined);
      localStorage.removeItem("brandingColors");
      resetThemeColors(); // Reset CSS variables on logout
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await UserService.register(data);
      return response;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isInitialAuthCheck,
        currentUser: currentUser as ICurrentUser,
        setCurrentUser,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}