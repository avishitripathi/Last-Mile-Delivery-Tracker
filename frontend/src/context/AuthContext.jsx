import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { api, unwrap } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("lastmile_user") || "null"
      );
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(
    Boolean(
      localStorage.getItem("lastmile_token")
    )
  );

  useEffect(() => {

    if (!localStorage.getItem("lastmile_token")) {
      setLoading(false);
      return;
    }

    api.me()
      .then((data) => {

        const current =
          unwrap(data)?.user ||
          unwrap(data);

        if (current) {

          setUser(current);

          localStorage.setItem(
            "lastmile_user",
            JSON.stringify(current)
          );
        }
      })
      .catch(() => {

        localStorage.removeItem(
          "lastmile_token"
        );

        localStorage.removeItem(
          "lastmile_user"
        );

        setUser(null);
      })
      .finally(() => setLoading(false));

  }, []);

  async function login(email, password) {

    const raw = await api.login({
      email,
      password
    });

    const data = unwrap(raw);

    const token =
      data?.token ||
      raw?.token ||
      raw?.accessToken;

    const loggedUser =
      data?.user ||
      raw?.user ||
      data;

    if (!token) {
      throw new Error(
        "Login succeeded but no token was returned by the server."
      );
    }

    localStorage.setItem(
      "lastmile_token",
      token
    );

    localStorage.setItem(
      "lastmile_user",
      JSON.stringify(loggedUser)
    );

    setUser(loggedUser);

    return loggedUser;
  }

  async function register(payload) {

    const raw = await api.register(payload);

    return unwrap(raw);
  }

  function logout() {

    localStorage.removeItem(
      "lastmile_token"
    );

    localStorage.removeItem(
      "lastmile_user"
    );

    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}