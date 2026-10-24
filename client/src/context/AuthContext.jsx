import { createContext, useContext, useState, useEffect } from "react";
import {
  getMeApi,
  verifyOtpApi,
  verifyRegisterOtpApi,
  logoutApi,
} from "../services/authApi";
import Loader from "../components/common/Loader";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("airbnb_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("airbnb_token") || null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore network errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("airbnb_token");
      localStorage.removeItem("airbnb_user");
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("airbnb_token");
      if (storedToken) {
        try {
          const res = await getMeApi();
          const currentUser = res?.data?.user || res?.user || res?.data;
          setUser(currentUser);
          localStorage.setItem("airbnb_user", JSON.stringify(currentUser));
        } catch {
          await logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginWithOtp = async (email, code) => {
    const res = await verifyOtpApi(email, code);
    const authUser = res?.data?.user || res?.user;
    const authToken = res?.data?.token || res?.token;

    setToken(authToken);
    setUser(authUser);
    localStorage.setItem("airbnb_token", authToken);
    localStorage.setItem("airbnb_user", JSON.stringify(authUser));
    return res;
  };

  const registerWithOtp = async (name, email, code) => {
    const res = await verifyRegisterOtpApi(name, email, code);
    const authUser = res?.data?.user || res?.user;
    const authToken = res?.data?.token || res?.token;

    setToken(authToken);
    setUser(authUser);
    localStorage.setItem("airbnb_token", authToken);
    localStorage.setItem("airbnb_user", JSON.stringify(authUser));
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        role: user?.role,
        loginWithOtp,
        registerWithOtp,
        logout,
      }}
    >
      {loading ? <Loader fullScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};