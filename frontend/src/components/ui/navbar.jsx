import { useState } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "@/hooks/useTheme";

const navigation = [
  { name: "Home", href: "/home" },
  { name: "Products", href: "/productlist" },
  { name: "3D Garage", href: "/viewmodel" },
  { name: "About", href: "/about" },
  { name: "Contact Us", href: "/contact" },
];

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "text-red-500" : "text-gray-300 hover:text-white"
  }`;

export default function Navbar() {
  const { isAuthenticated, status, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/productlist?q=${encodeURIComponent(q)}` : "/productlist");
  };

  return (
    <Disclosure as="nav" className="border-b border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Mobile hamburger */}
          <div className="flex items-center lg:hidden">
            <DisclosureButton className="group inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/10 hover:text-white focus:outline-none">
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="block h-6 w-6 group-data-[open]:hidden" aria-hidden="true" />
              <XMarkIcon className="hidden h-6 w-6 group-data-[open]:block" aria-hidden="true" />
            </DisclosureButton>
          </div>

          {/* Brand */}
          <Link to="/home" className="flex shrink-0 items-center gap-2">
            <img alt="AutoPartBazaar" src="/Images/Logo.png" className="h-8 w-auto" />
            <span className="hidden text-lg font-bold tracking-tight text-white md:block">
              Auto<span className="text-red-500">Part</span>Bazaar
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => (
              <NavLink key={item.name} to={item.href} className={navLinkClass}>
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Search (desktop) */}
          <form onSubmit={handleSearch} className="relative hidden w-44 lg:block xl:w-64">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for parts..."
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-red-500/50 focus:outline-none"
            />
          </form>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggle}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none"
              title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
            >
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            <Link
              to="/cart"
              className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span className="sr-only">View cart</span>
              <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {status === "loading" ? (
              <p className="animate-pulse px-2 text-sm text-gray-300">...</p>
            ) : isAuthenticated ? (
              <>
                <Link
                  to="/orders"
                  className="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white md:block"
                >
                  My Orders
                </Link>
                <Link
                  to="/profile"
                  className="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white md:block"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      <DisclosurePanel className="border-t border-white/10 lg:hidden">
        <div className="space-y-1 px-4 pb-4 pt-3">
          <form onSubmit={handleSearch} className="relative mb-3">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for parts..."
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-red-500/50 focus:outline-none"
            />
          </form>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white"
            >
              {item.name}
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <Link
                to="/orders"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white"
              >
                My Orders
              </Link>
              <Link
                to="/profile"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white"
              >
                Profile
              </Link>
            </>
          )}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
