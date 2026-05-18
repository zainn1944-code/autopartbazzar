import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ShoppingCartIcon, Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/context/CartContext.jsx";
import { useTheme } from "@/context/ThemeContext.jsx";

const navigation = [
  { name: "Home", href: "/home" },
  { name: "Products", href: "/productlist" },
  { name: "Contact Us", href: "/contact" },
  { name: "About", href: "/about" },
  { name: "3D Garage", href: "/viewmodel" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const { isAuthenticated, status, logout, user } = useAuth();
  const { cartCount } = useCart();
  const { isDark, toggle } = useTheme();

  return (
    <Disclosure as="nav" className="bg-gray-900 dark:bg-black">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              <XMarkIcon className="hidden h-6 w-6" aria-hidden="true" />
            </DisclosureButton>
          </div>

          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <img alt="Your Company" src="/Images/Logo.png" className="h-auto w-28" />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4 mt-10">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={classNames(
                      "text-gray-300 hover:bg-red-700 hover:text-white",
                      "rounded-md px-3 py-2 text-sm font-medium"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none mr-2"
              title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
            >
              {isDark ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
            <div className="relative">
              <Link to="/cart">
                <button
                  type="button"
                  className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  <span className="sr-only">View cart</span>
                  <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>
            </div>
            <div className="flex space-x-4 ml-4">
              {status === "loading" ? (
                <p className="text-gray-300 text-sm animate-pulse">...</p>
              ) : isAuthenticated ? (
                <>
                  <Link
                    to="/orders"
                    className="text-gray-300 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-300 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Profile
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      to="/admindashboard"
                      className="text-gray-300 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-gray-300 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-300 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="text-gray-300 hover:bg-red-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Signup
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium"
            >
              {item.name}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/orders"
              className="text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium"
            >
              My Orders
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              to="/admindashboard"
              className="text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium"
            >
              Admin
            </Link>
          )}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
