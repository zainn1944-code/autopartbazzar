import { ArrowLeftIcon, ArrowRightOnRectangleIcon, HomeIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Shared top bar for all admin panel pages.
 * Provides Back, Dashboard, View Store and a professional Logout button.
 */
export default function AdminHeader() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <Link
            to="/admindashboard"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-red-400"
          >
            <Squares2X2Icon className="h-4 w-4" />
            Dashboard
          </Link>
          <span className="ml-1 hidden text-sm font-semibold text-red-500 sm:inline">Admin Panel</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/home"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <HomeIcon className="h-4 w-4" />
            <span className="hidden sm:inline">View Store</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
