import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | null; 
}

export const ProtectedRoute = ({ children, requiredRole = "ROLE_ADMIN" }: ProtectedRouteProps) => {
  const storedUser = localStorage.getItem("user");
  const isLoggedIn = sessionStorage.getItem("userLoggedIn") === "true";

  if (!storedUser || !isLoggedIn) {
    Swal.fire("Access Denied", "You must be logged in to access this page.", "error").then(() => {
      window.location.href = "/login";
    });
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    if (requiredRole !== null && requiredRole !== undefined && user.role !== requiredRole) {
      Swal.fire("Access Denied", "You do not have permission to access this page.", "error").then(() => {
        window.location.href = "/dashboard";
      });
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    Swal.fire("Error", "Invalid user data. Please login again.", "error").then(() => {
      localStorage.removeItem("user");
      sessionStorage.removeItem("userLoggedIn");
      window.location.href = "/login";
    });
    return <Navigate to="/login" replace />;
  }
};

