import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { useAuth } from "@/context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email === "AutoPartBazaar21@gmail.com") {
      navigate("/admindashboard");
      return;
    }

    try {
      await login(email, password);
      navigate("/home", { replace: true });
    } catch {
      setError("Invalid Credentials");
    }
  };

  return (
    <main className="bg-black h-screen flex items-center justify-center p-10">
      <div className="grid w-full h-full grid-cols-1 bg-white box-anim md:grid-cols-2">
        <div className="bg-black text-white flex items-center justify-center flex-col">
          <div className="my-4">
            <h1 className="text-3xl font-semibold">Login</h1>
            <p className="mt-2 text-xs text-slate-400">
              Log in to customize your ride and explore premium car parts
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <Label htmlFor="email">Email*</Label>
            <Input
              className="mt-2 mb-4 bg-transparent rounded-full"
              type="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Label htmlFor="password">Password*</Label>
            <div className="relative">
              <Input
                className="mt-2 mb-4 bg-transparent rounded-full pr-10"
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute top-1/2 right-3 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <AiFillEyeInvisible size={20} className="text-gray-500" />
                ) : (
                  <AiFillEye size={20} className="text-gray-500" />
                )}
              </button>
            </div>

            {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full mt-6 bg-indigo-600 rounded-full hover:bg-indigo-700">
              Login
            </Button>
          </form>
          <p className="text-xs text-slate-200">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-blue-500 hover:text-indigo-600 underline">
              Sign up
            </Link>
          </p>
          <p className="text-xs text-slate-200">
            <Link to="/enter-email" className="text-blue-500 hover:text-indigo-600 underline">
              Forget password
            </Link>
          </p>
        </div>
        <div className="relative hidden md:block h-full min-h-[400px]">
          <img className="object-cover w-full h-full" src="/Images/updated.jpg" alt="bg" />
        </div>
      </div>
    </main>
  );
}
