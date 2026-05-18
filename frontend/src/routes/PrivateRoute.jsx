import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function PrivateRoute({ children, requireRole = null }) {
  const { isAuthenticated, status, user } = useAuth();
  const location = useLocation();

  if (status !== "ready") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
