import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { jwtDecode, type JwtPayload } from "jwt-decode";

export interface CustomJwtPayload extends JwtPayload {
  userId: string;
  email: string
}

interface AuthContextType {
  token: string | null;
  user: any; 
  userId: string | null;
  isAuthenticated: boolean;
  loginUser: (userToken: string, userData: any) => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token") || null);
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("user") || "null"));
  const [userId, setUserId] = useState<string | null>(null);

  const loginUser = (userToken: string, userData: any) => {
    localStorage.setItem("token", userToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setUserId(null); 
    window.location.href = "/";
  };

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        setUserId(decoded.userId || null);
      } catch (err) {
        console.error("Failed to decode token", err);
        logoutUser(); 
      }
    } else {
      setUserId(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        user, 
        loginUser, 
        logoutUser, 
        isAuthenticated: !!token, 
        userId 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
