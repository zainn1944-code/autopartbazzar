import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";

export default function ForgetPass() {
  const [otp, setOtp] = useState(new Array(4).fill(""));
  const inputRefs = useRef([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!isNaN(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.some((digit) => digit === "")) {
      setError("Please enter the complete OTP.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axiosInstance.post("/verifyOTP", {
        email,
        otp: otp.join(""),
      });

      const data = response.data;

      if (response.status >= 200 && response.status < 300) {
        setLoading(false);
        navigate(`/changepass?email=${encodeURIComponent(email)}`);
      } else {
        setLoading(false);
        setError(data.error || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || "An error occurred while verifying the OTP.");
    }
  };

  const handleResend = async () => {
    setResendMessage("");
    setError("");
    setOtp(new Array(4).fill(""));

    try {
      const response = await axiosInstance.post("/resendOTP", { email });
      const data = response.data;

      if (response.status >= 200 && response.status < 300) {
        setResendMessage("A new OTP has been sent to your email.");
      } else {
        setError(data.error || "Failed to resend OTP.");
      }
    } catch (err) {
      setError("An error occurred while resending OTP.");
    }
  };

  return (
    <main className="bg-black h-screen flex items-center justify-center p-10">
      <div className="grid w-full h-full grid-cols-1 bg-white box-anim md:grid-cols-2">
        <div className="bg-black text-white flex items-center justify-center flex-col">
          <div className="my-4">
            <h1 className="text-3xl font-semibold">Verify OTP</h1>
            <p className="mt-2 text-xs text-slate-400">Enter the OTP sent to your email.</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex justify-center gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="w-12 h-12 text-center text-xl border border-gray-300 rounded-md text-black"
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            {resendMessage && <p className="text-green-500 text-sm mb-2">{resendMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button type="button" onClick={handleResend} className="w-full mt-2 text-sm text-blue-400 underline">
              Resend OTP
            </button>
          </form>
        </div>
        <div className="relative hidden md:block h-full min-h-[400px]">
          <img className="object-cover w-full h-full" src="/Images/updated.jpg" alt="bg" />
        </div>
      </div>
    </main>
  );
}
