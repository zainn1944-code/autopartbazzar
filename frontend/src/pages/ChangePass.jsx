import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";

export default function NewPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email");

  // Handle change in new password field
  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  // Handle change in confirm password field
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // **Step 1**: Check if passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // **Step 2**: Password strength validation (must have at least one uppercase, one number, and one special character)
    const passwordStrengthRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordStrengthRegex.test(newPassword)) {
      setError("Password must contain at least one uppercase letter, one number, and one special character.");
      return;
    }

    // **Step 3**: Password length validation (at least 8 characters)
    if (newPassword.length < 8) {
      setError("Password should be at least 8 characters long.");
      return;
    }

    setError(""); // Clear previous errors
    setLoading(true); // Start loading

    try {
      const response = await axiosInstance.post("/updatePass", { email, newPassword, confirmPassword });
      const data = response.data;

      if (response.status >= 200 && response.status < 300) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.error || "Failed to reset the password.");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <main className="bg-[#2f3030] h-screen flex items-center justify-center p-10">
      <div className="grid w-full h-full grid-cols-1 bg-white box-anim md:grid-cols-2">
        {/* Left Section */}
        <div className="bg-black text-white flex items-center justify-center flex-col">
          <div className="my-4 text-center">
            <h1 className="text-3xl font-semibold">Set New Password</h1>
            <p className="mt-2 text-xs text-slate-400">
              Enter your new password and confirm it to reset
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            {/* New Password Input */}
            <div className="my-4">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={handleNewPasswordChange}
                className="mt-2 w-full p-3 rounded-full bg-transparent border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Enter new password"
              />
            </div>

            {/* Confirm Password Input */}
            <div className="my-4">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="mt-2 w-full p-3 rounded-full bg-transparent border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Confirm your new password"
              />
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            {/* Success Message */}
            {success && <p className="text-green-500 text-sm mt-2">{success}</p>}

            {/* Show loading spinner while resetting password */}
            {loading ? (
              <div className="w-full flex justify-center mt-4">
                <div className="w-8 h-8 border-4 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full mt-6 bg-indigo-600 rounded-full py-2 text-white font-medium hover:bg-indigo-700"
              >
                Reset Password
              </button>
            )}
          </form>
        </div>

        {/* Right Section (Optional Image) */}
        <div className="relative hidden md:block h-full min-h-[400px]">
          <img className="object-cover w-full h-full" src="/Images/updated.jpg" alt="Background" />
        </div>
      </div>
    </main>
  );
}
