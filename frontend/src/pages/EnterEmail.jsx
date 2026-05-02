// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function EnterEmail() {
//   const [email, setEmail] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const handleVerifyEmail = async (e) => {
//     e.preventDefault();

//     // Validate email
//     if (!email || !/\S+@\S+\.\S+/.test(email)) {
//       setError("Please enter a valid email address.");
//       return;
//     }
//     setError(""); // Clear errors

//     setLoading(true); // Show loading state

//     try {
//       // Call API to verify email and send OTP
//       const response = await fetch("/api/generateOTP", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ email }),
//       });      
//       console.log(response)
//       const data = await response.json();

//       if (response.ok) {
//         // Redirect to ForgetPassPage with email in query
//         router.push(`/pages/forgetpass?email=${encodeURIComponent(email)}`);
//       } else {
//         setError(data.error || "Failed to verify email.");
//       }
//     } catch (err) {
//       setError("An error occurred. Please try again.");
//     } finally {
//       setLoading(false); // Stop loading
//     }
//   };

//   return (
//     <main className="bg-[#f3f4f6] h-screen flex items-center justify-center">
//       <div className="w-full max-w-md bg-white p-6 rounded-md shadow-md">
//         <h1 className="text-2xl font-bold text-center">Enter Your Email</h1>
//         <form onSubmit={handleVerifyEmail} className="mt-4">
//           <label htmlFor="email" className="block text-sm font-medium">
//             Email Address
//           </label>
//           <input
//             id="email"
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//           />

//           {/* Error Message */}
//           {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

//           {/* Loading Spinner */}
//           {loading ? (
//             <div className="w-full flex justify-center mt-4">
//               <div className="w-8 h-8 border-4 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
//             </div>
//           ) : (
//             <button
//               type="submit"
//               className="mt-4 w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700"
//             >
//               Verify Email
//             </button>
//           )}
//         </form>
//       </div>
//     </main>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";

export default function EnterEmail() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerifyEmail = async (e) => {
    e.preventDefault();

    // Validate email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(""); // Clear errors

    setLoading(true); // Show loading state

    try {
      const response = await axiosInstance.post("/generateOTP", { email });
      const data = response.data;

      if (response.status >= 200 && response.status < 300) {
        navigate(`/forgetpass?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.error || "Failed to verify email.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <main className="bg-[#080808] h-screen flex items-center justify-center p-10">
      <div className="grid w-full h-full grid-cols-1 bg-black box-anim md:grid-cols-2 rounded-md shadow-md">
        
        {/* Left Column: Form Section */}
        <div className="bg-black p-6 flex flex-col justify-center items-center md:items-start space-y-4">
          <h1 className="text-3xl font-semibold text-center md:text-left">Enter Your Email</h1>
          <p className="text-xs text-center text-slate-400 md:text-left">
            Enter your email to verify and reset your password.
          </p>
          <p className="text-xs text-center text-slate-500 md:text-left">
            Local password reset emails require `EMAIL_USER` and `EMAIL_PASS` in `backend/.env`.
          </p>
          <form onSubmit={handleVerifyEmail} className="mt-4 w-full max-w-md">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            {/* Loading Spinner */}
            {loading ? (
              <div className="w-full flex justify-center mt-4">
                <div className="w-8 h-8 border-4 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
              </div>
            ) : (
              <button
                type="submit"
                className="mt-4 w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700"
              >
                Verify Email
              </button>
            )}
          </form>
        </div>

        {/* Right Column: Image Section */}
        <div className="relative hidden md:block h-full min-h-[400px]">
          <img className="object-cover w-full h-full" src="/Images/updated.jpg" alt="background" />
        </div>
        
      </div>
    </main>
  );
}
