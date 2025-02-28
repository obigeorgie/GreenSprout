import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { type User, type InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LoginData = Pick<InsertUser, "username" | "password">;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  loginWithGoogle: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  console.log('AuthProvider initializing');

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        console.log('Checking user authentication status');
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        if (res.status === 401) {
          console.log('User not authenticated');
          return null;
        }
        const userData = await res.json();
        console.log('User authenticated:', userData);
        return userData;
      } catch (error) {
        console.error("Auth check error:", error);
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Attempting login with credentials:', { username: credentials.username });
      const res = await apiRequest("POST", "/api/login", credentials);
      return res.json();
    },
    onSuccess: (user: User) => {
      console.log('Login successful:', user);
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log('Attempting registration:', { username: credentials.username });
      const res = await apiRequest("POST", "/api/register", credentials);
      return res.json();
    },
    onSuccess: (user: User) => {
      console.log('Registration successful:', user);
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      console.error('Registration failed:', error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('Attempting logout');
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      console.log('Logout successful');
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginWithGoogle = () => {
    if (isRedirecting) {
      console.log('Already redirecting to Google OAuth');
      return;
    }

    console.log('Redirecting to Google OAuth');
    setIsRedirecting(true);
    window.location.href = '/auth/google';
  };

  console.log('AuthProvider state:', {
    hasUser: !!user,
    isLoading,
    hasError: !!error,
    isRedirecting
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}