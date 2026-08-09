import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, ask the backend who's logged in
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/auth/me");
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signup = async (data) => {
    const res = await axios.post("/auth/signup", data);
    setUser(res.data.user);
    return res.data.user;
  };

  const login = async (data) => {
    const res = await axios.post("/auth/login", data);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await axios.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);