import { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { Label } from "@/components/ui/label";
import {
  AiFillEye,
  AiFillEyeInvisible,
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
  AiOutlineUser,
  AiOutlinePhone,
  AiOutlineMail,
  AiOutlineLock,
} from "react-icons/ai";

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

  // Two-step signup: "form" collects details + emails an OTP, "otp" verifies it.
  const [step, setStep] = useState("form");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const parseError = (err, fallback = "Something went wrong.") => {
    const msg = err.response?.data?.detail;
    return typeof msg === "string" ? msg : err.response?.data?.message || fallback;
  };

  // Step 1 — validate, then ask the backend to email a verification code.
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

    setSubmitting(true);
    try {
      const { data: existsData } = await axiosInstance.post("/userExists", { email });
      if (existsData.user) {
        setError("User already exists.");
        return;
      }

      await axiosInstance.post("/auth/register", { email, phone, password, name: fullname });
      setStep("otp");
      setSuccess(`We've sent a 4-digit code to ${email}. Enter it below to finish signing up.`);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 — verify the OTP; the account is created only on success.
  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{4}$/.test(otp)) {
      setError("Please enter the 4-digit code from your email.");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post("/auth/register/verify", { email: formData.email, otp });
      setStep("done");
      setSuccess("Account verified and created! Please log in.");
      setFormData({ fullname: "", phone: "", email: "", password: "", repassword: "" });
      setOtp("");
    } catch (err) {
      setError(parseError(err, "Verification failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await axiosInstance.post("/auth/register/resend", { email: formData.email });
      setSuccess("A new verification code has been sent.");
    } catch (err) {
      setError(parseError(err, "Could not resend the code."));
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleRePasswordVisibility = () => setShowRePassword((prev) => !prev);

  return (
    <main className="bg-gray-100 dark:bg-black min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="grid w-full grid-cols-1 md:grid-cols-2 bg-white dark:bg-black box-anim md:h-[85vh]">
        <div className="bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center flex-col px-6 py-10 sm:px-8">
          <div className="my-4 w-full max-w-md">
            <h1 className="text-4xl font-bold tracking-tight">Sign Up</h1>
            <p className="mt-2 text-sm text-slate-400">Register yourself for an amazing experience!</p>
          </div>
          {error && (
            <div className="mb-3 w-full max-w-md flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
              <AiOutlineExclamationCircle className="mt-0.5 shrink-0" size={18} />
              <span className="leading-snug">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-3 w-full max-w-md flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-400">
              <AiOutlineCheckCircle className="mt-0.5 shrink-0" size={18} />
              <span className="leading-snug">{success}</span>
            </div>
          )}

          {step === "form" && (
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            <div>
              <Label htmlFor="fullname" className="text-sm font-medium text-white">Full Name*</Label>
              <div className="relative mt-1.5">
                <AiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full rounded-full border border-gray-600 bg-transparent py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  type="text"
                  id="fullname"
                  placeholder="Enter your name"
                  value={formData.fullname}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-white">Phone Number*</Label>
              <div className="relative mt-1.5">
                <AiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full rounded-full border border-gray-600 bg-transparent py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  type="tel"
                  id="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-white">Email*</Label>
              <div className="relative mt-1.5">
                <AiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full rounded-full border border-gray-600 bg-transparent py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  type="email"
                  id="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="repassword" className="text-sm font-medium text-white">Re-enter Password*</Label>
              <div className="relative mt-1.5">
                <AiOutlineLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full rounded-full border border-gray-600 bg-transparent py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                  type={showRePassword ? "text" : "password"}
                  id="repassword"
                  placeholder="Re-enter password"
                  value={formData.repassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={toggleRePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showRePassword ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-3 w-full rounded-full bg-white py-3.5 text-sm font-semibold text-black transition-colors hover:bg-gray-200 disabled:opacity-60"
            >
              {submitting ? "Sending code..." : "Sign up"}
            </button>
          </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerify} className="w-full max-w-md">
              <Label htmlFor="otp" className="text-sm font-medium text-white">Verification Code*</Label>
              <input
                className="mt-1.5 mb-2 w-full rounded-full border border-gray-600 bg-transparent py-3 px-4 text-center text-lg tracking-[0.6em] text-white placeholder:text-gray-500 placeholder:tracking-[0.6em] focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40"
                type="text"
                inputMode="numeric"
                id="otp"
                placeholder="••••"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 rounded-full bg-white py-3.5 text-sm font-semibold text-black transition-colors hover:bg-gray-200 disabled:opacity-60"
              >
                {submitting ? "Verifying..." : "Verify & Create Account"}
              </button>
              <div className="mt-3 flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setStep("form"); setError(""); setSuccess(""); }} className="text-gray-400 hover:text-white underline">
                  ← Edit details
                </button>
                <button type="button" onClick={handleResend} disabled={submitting} className="text-gray-300 hover:text-white underline disabled:opacity-60">
                  Resend code
                </button>
              </div>
            </form>
          )}

          {step === "done" && (
            <div className="w-full max-w-md text-center">
              <p className="text-sm text-gray-300 mb-4">Your account is ready. 🎉</p>
              <Link to="/login">
                <button className="w-full rounded-full bg-white py-3.5 text-sm font-semibold text-black transition-colors hover:bg-gray-200">Go to Login</button>
              </Link>
            </div>
          )}

          {step !== "done" && (
            <p className="mt-4 text-xs text-slate-200">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-500 hover:text-indigo-600 underline">
                login
              </Link>
            </p>
          )}
        </div>
        <div className="relative hidden md:block h-full min-h-[400px]">
          <img className="object-cover w-full h-full" src="/Images/updated.jpg" alt="bg" />
        </div>
      </div>
    </main>
  );
}
