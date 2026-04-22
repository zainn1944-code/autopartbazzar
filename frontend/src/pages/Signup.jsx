import { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

export default function Signup() {
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    email: "",
    password: "",
    repassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { fullname, phone, email, password, repassword } = formData;

    if (!fullname || !phone || !email || !password || !repassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== repassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordStrengthRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordStrengthRegex.test(password)) {
      setError("Password must contain at least one uppercase letter, one number, and one special character.");
      return;
    }

    const phoneValidationRegex = /^\d{11}$/;
    if (!phoneValidationRegex.test(phone)) {
      setError("Phone number must be exactly 11 digits.");
      return;
    }

    try {
      const { data: existsData } = await axiosInstance.post("/userExists", { email });
      if (existsData.user) {
        setError("User already exists.");
        return;
      }

      await axiosInstance.post("/auth/register", { email, phone, password });
      setSuccess("Signup successful! Please log in.");
      setFormData({ fullname: "", phone: "", email: "", password: "", repassword: "" });
    } catch (err) {
      const msg = err.response?.data?.detail;
      setError(typeof msg === "string" ? msg : err.response?.data?.message || "Something went wrong.");
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleRePasswordVisibility = () => setShowRePassword((prev) => !prev);

  return (
    <main className="bg-black h-screen flex items-center justify-center p-10">
      <div className="grid w-full h-full grid-cols-1 bg-black box-anim md:grid-cols-2">
        <div className="bg-black text-white flex items-center justify-center flex-col mr-20">
          <div className="my-4">
            <h1 className="text-3xl font-semibold">Sign Up</h1>
            <p className="mt-2 text-xs text-slate-400">Register yourself for an amazing experience!</p>
          </div>
          <form onSubmit={handleSubmit}>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            {success && <p className="text-green-500 text-sm mb-2">{success}</p>}

            <Label htmlFor="fullname">Full Name*</Label>
            <Input
              className="mt-1 mb-2 bg-transparent rounded-full"
              type="text"
              id="fullname"
              placeholder="Enter your name"
              value={formData.fullname}
              onChange={handleChange}
            />

            <Label htmlFor="phone">Phone Number*</Label>
            <Input
              className="mt-1 mb-2 bg-transparent rounded-full"
              type="tel"
              id="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
            />

            <Label htmlFor="email">Email*</Label>
            <Input
              className="mt-1 mb-2 bg-transparent rounded-full"
              type="email"
              id="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />

            <Label htmlFor="password">Password*</Label>
            <div className="relative">
              <Input
                className="mt-1 mb-2 bg-transparent rounded-full pr-10"
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute top-1/2 right-3 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <AiFillEyeInvisible size={20} className="text-gray-500" />
                ) : (
                  <AiFillEye size={20} className="text-gray-500" />
                )}
              </button>
            </div>

            <Label htmlFor="repassword">Re-enter Password*</Label>
            <div className="relative">
              <Input
                className="mt-1 mb-2 bg-transparent rounded-full pr-10"
                type={showRePassword ? "text" : "password"}
                id="repassword"
                placeholder="Re-enter password"
                value={formData.repassword}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={toggleRePasswordVisibility}
                className="absolute top-1/2 right-3 transform -translate-y-1/2"
              >
                {showRePassword ? (
                  <AiFillEyeInvisible size={20} className="text-gray-500" />
                ) : (
                  <AiFillEye size={20} className="text-gray-500" />
                )}
              </button>
            </div>

            <Button type="submit" className="w-full mt-6 bg-indigo-600 rounded-full hover:bg-indigo-700">
              Sign up
            </Button>
          </form>
          <p className="mt-4 text-xs text-slate-200">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:text-indigo-600 underline">
              login
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
