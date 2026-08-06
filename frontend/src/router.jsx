import { createContext, useContext, useEffect, useState, useCallback } from "react";

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [path, setPath] = useState(window.location.pathname || "/");

  useEffect(() => {
    function onPopState() {
      setPath(window.location.pathname || "/");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to) => {
    if (to === window.location.pathname) return;
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used inside a RouterProvider");
  return ctx;
}

/** Renders the first matching route's element. routes: [{ path: "/", element }] */
export function Routes({ routes, notFound }) {
  const { path } = useRouter();
  const match = routes.find((r) => r.path === path);
  if (match) return match.element;
  return notFound || routes[0]?.element || null;
}

export function Link({ to, className, children, onClick, ...rest }) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
