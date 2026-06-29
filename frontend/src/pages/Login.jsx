import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import {
  AiFillEye,
  AiFillEyeInvisible,
  AiOutlineMail,
  AiOutlineLock,
  AiOutlineExclamationCircle,
} from "react-icons/ai";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const nextUser = await login(email, password);
      const nextPath =
        location.state?.from ||
        (nextUser?.role === "admin" ? "/admindashboard" : "/home");
      navigate(nextPath, { replace: true });
    } catch {
      setError("Invalid Credentials");
    }
  };

  return (
    <main className="bg-gray-100 dark:bg-black min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="grid w-full grid-cols-1 md:grid-cols-2 bg-white dark:bg-black box-anim md:h-[85vh]">
        <div className="bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center flex-col px-6 py-10 sm:px-8">
          <div className="my-4 w-full max-w-md">
            <h1 className="text-4xl font-bold tracking-tight">Login</h1>
            <p className="mt-2 text-sm text-slate-400">
              Log in to customize your ride and explore premium car parts
            </p>
          </div>

          {error && (
            <div className="mb-3 w-full max-w-md flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
              <AiOutlineExclamationCircle className="mt-0.5 shrink-0" size={18} />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-white">Email*</Label>
              <div className="relative mt-1.5">
                <AiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full rounded-full border border-gray-600 bg-transparent py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  type="email"
                  id="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-white">Password*</Label>
              <div className="relative mt-1.5">
                <AiOutlineLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full rounded-full border border-gray-600 bg-transparent py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-3 w-full rounded-full bg-white py-3.5 text-sm font-semibold text-black transition-colors hover:bg-gray-200"
            >
              Login
            </button>
          </form>

          <div className="mt-4 w-full max-w-md text-center space-y-1">
            <p className="text-xs text-slate-300">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 underline">
                Sign up
              </Link>
            </p>
            <p className="text-xs">
              <Link to="/enter-email" className="text-blue-400 hover:text-blue-300 underline">
                Forget password
              </Link>
            </p>
          </div>
        </div>

        <div className="relative hidden md:block h-full min-h-[400px]">
          <img className="object-cover w-full h-full" src="/Images/updated.jpg" alt="bg" />
        </div>
      </div>
    </main>
  );
}
