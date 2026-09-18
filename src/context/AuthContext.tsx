import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  getStoredToken,
  getStoredUser,
  type AuthUser,
} from "../lib/api";

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [session, setSession] = useState<AuthSession | null>(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    return token && storedUser ? { token, user: storedUser } : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      const token = getStoredToken();
      if (!token) {
        if (mounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
        return;
      }

      try {
        const verifiedUser = await api.auth.getMe();
        if (mounted) {
          setUser(verifiedUser);
          setSession({ token, user: verifiedUser });
        }
      } catch {
        // Token invalid or expired
        api.auth.logout();
        if (mounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void initSession();

    return () => {
      mounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    loading,
    async signIn(email, password) {
      try {
        const result = await api.auth.login(email, password);
        setUser(result.user);
        setSession({ token: result.token, user: result.user });
        return { error: null };
      } catch (err) {
        return {
          error: err instanceof Error ? err : new Error("Sign in failed"),
        };
      }
    },
    async signUp(email, password) {
      try {
        const result = await api.auth.register(email, password);
        setUser(result.user);
        setSession({ token: result.token, user: result.user });
        return { error: null, needsEmailConfirmation: false };
      } catch (err) {
        return {
          error: err instanceof Error ? err : new Error("Registration failed"),
          needsEmailConfirmation: false,
        };
      }
    },
    async resetPassword(email) {
      try {
        await api.auth.resetPassword(email);
        return { error: null };
      } catch (err) {
        return {
          error: err instanceof Error ? err : new Error("Reset password failed"),
        };
      }
    },
    async signOut() {
      api.auth.logout();
      setUser(null);
      setSession(null);
      return { error: null };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
