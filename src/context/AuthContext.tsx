"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  auth,
  onAuthStateChanged,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  logout as firebaseLogout,
  resetPassword,
  User,
} from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await loginWithEmail(email, password);
  };

  const loginGoogle = async () => {
    await loginWithGoogle();
  };

  const register = async (email: string, password: string, name: string) => {
    await registerWithEmail(email, password, name);
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const forgotPassword = async (email: string) => {
    await resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginGoogle,
        register,
        logout,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
