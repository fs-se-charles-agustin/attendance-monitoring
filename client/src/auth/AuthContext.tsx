import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService } from "@/services/auth/auth.service";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "admin";
  totalHours?: number;
  requiredOjtHours?: number;
  companyId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string, requiredOjtHours: number) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const decodeToken = (tok: string): AuthUser | null => {
    try {
      const payload = JSON.parse(atob(tok.split(".")[1]));
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role || "student",
        firstName: payload.firstName || "",
        lastName: payload.lastName || "",
      };
    } catch {
      return null;
    }
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return;
    try {
      const dbUser = await authService.getMe(storedToken);
      setUser({
        id: dbUser._id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
        totalHours: dbUser.totalHours,
        requiredOjtHours: dbUser.requiredOjtHours,
        companyId: dbUser.companyId?._id || dbUser.companyId || null,
      });
    } catch {
      // fallback to token decode
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      const decoded = decodeToken(storedToken);
      if (decoded) {
        setUser(decoded);
        // Enrich with full DB data in background
        authService.getMe(storedToken).then((dbUser) => {
          setUser({
            id: dbUser._id,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            role: dbUser.role,
            totalHours: dbUser.totalHours,
            requiredOjtHours: dbUser.requiredOjtHours,
            companyId: dbUser.companyId?._id || dbUser.companyId || null,
          });
        }).catch(() => {});
      } else {
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    const data = await authService.login({ email, password, rememberMe });
    setToken(data.token);
    localStorage.setItem("token", data.token);
    const decoded = decodeToken(data.token);
    if (decoded) setUser(decoded);
    // Enrich immediately
    try {
      const dbUser = await authService.getMe(data.token);
      setUser({
        id: dbUser._id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
        totalHours: dbUser.totalHours,
        requiredOjtHours: dbUser.requiredOjtHours,
        companyId: dbUser.companyId?._id || dbUser.companyId || null,
      });
    } catch {}
  };

  const signup = async (firstName: string, lastName: string, email: string, password: string, requiredOjtHours: number) => {
    await authService.signup({ firstName, lastName, email, password, requiredOjtHours });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated: !!token, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
