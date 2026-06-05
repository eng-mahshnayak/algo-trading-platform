// import { Navigate } from "react-router-dom";
// import { ReactNode } from "react";

// interface ProtectedRouteProps {
//   children: ReactNode;
// }

// export default function ProtectedRoute({ children }: ProtectedRouteProps) {

//   const token = localStorage.getItem("token");

//   if (!token) {
//     return <Navigate to="/" replace />;
//   }

//   return <>{children}</>;
// }


import { Navigate, useLocation } from "react-router-dom";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  
  const location = useLocation();

  // Extract token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    const authToken = params.get("auth_token");  
    const feed_token = params.get('feed_token');
    const refresh_token = params.get('refresh_token');

    if (authToken&&feed_token&&refresh_token) {
      // Save auth_token to localStorage (or any secure storage)
      localStorage.setItem("angel_token", authToken);
       localStorage.setItem("angel_feed_token", feed_token);
        localStorage.setItem("angel_refresh_token", refresh_token);

      // Optionally, remove query params from URL without reload
      const cleanUrl = location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [location]);

  // Check if token exists in localStorage
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
