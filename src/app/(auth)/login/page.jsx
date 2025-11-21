"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import AuthCarousel from "../../components/AuthCarousel";

const GoogleIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const AppleIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
);

const FacebookIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
     const [showModal, setShowModal] = useState(false);
    // const [pageLoading, setPageLoading] = useState(true);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
          
            const resMessage = await login(email, password);

            setSuccess(resMessage);
            setError("");
            setShowModal(true);

           
            setTimeout(() => {
                router.push("/");
            }, 1000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        console.log('Google login clicked');
        // Add Google OAuth logic here
    };

    const handleAppleLogin = () => {
        console.log('Apple login clicked');
        // Add Apple OAuth logic here
    };

    const handleFacebookLogin = () => {
        console.log('Facebook login clicked');
        // Add Facebook OAuth logic here
    };

    // if (pageLoading) {
    //     return (
    //         <div className="flex items-center justify-center h-screen">
    //             <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    //         </div>
    //     );
    // }

    return (

        <div className="flex flex-col lg:flex-row h-screen justify-center">
            {/* Left content (form card) */}
            <div className="flex-1 flex flex-col pt-20 sm:pt-30 items-center ">
                <div className=" flex  space-y-10 flex-col ">
                    <div className="flex flex-col space-y-8 justify-center items-center">
                        <h1 className="text-4xl sm:text-6xl flex justify-center font-bold ">Welcome back !</h1>

                        <p className="w-[370px] text-gray-600 flex justify-center items-center text-center">
                            Simplify your workflow and build your productivity with Tuga's app. Get started for free
                        </p>
                    </div>


                    <div className=" mt-5 lg:w-[500px] ">
                        <form onSubmit={handleSubmit} className="space-y-6 relative w-full">
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full py-3 px-5 rounded-xl outline-0 border border-gray-400 text-gray-900"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            {/* Password input with toggle */}
                            <div className="relative w-full">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    className="w-full py-3 px-5 rounded-xl outline-0 border border-gray-400 text-gray-900 pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                                >
                                    {showPassword ? <EyeOff className="w-5 cursor-pointer h-5" /> : <Eye className="w-5 cursor-pointer h-5" />}
                                </button>
                            </div>

                            <div className="flex text-xs justify-end hover:underline font-medium">
                                Forgot Password?
                            </div>

                            {error && <p className="text-red-500 px-5 ">{error}</p>}

                            <button
                                type="submit"
                                className="w-full hover:cursor-pointer hover:bg-gray-200 hover:border hover:text-black py-3 bg-black rounded-xl transition-all duration-300 text-white font-semibold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                ) : (
                                    "Login"
                                )}
                            </button>

                               {showModal && (
                                <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                                    <div className="bg-white rounded-lg p-20 flex flex-col max-w-lg items-center shadow border border-gray-200 animate-fadeIn">

                                        {/* Animated checkmark */}
                                        <div className="w-16 h-16 flex items-center border justify-center rounded-full bg-green-50 mb-4">
                                            <svg
                                                className="w-10 h-10 text-green-600 animate-check"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>

                                        {/* Success message */}
                                        <p className="text-center py-3 font-semibold">{success}</p>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="w-full mt-10 max-w-lg mx-auto">
                        {/* Divider with text */}
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="flex-grow border-t border-gray-300"></div>
                            <span className="px-4 text-gray-700 text-sm font-medium">
                                or continue with
                            </span>
                            <div className="flex-grow border-t border-gray-300"></div>
                        </div>

                        {/* Social login buttons */}
                        <div className="flex justify-center space-x-6">
                            {/* Google */}
                            <button
                                onClick={handleGoogleLogin}
                                className="w-14 h-14 hover:cursor-pointer bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                aria-label="Continue with Google"
                            >
                                <GoogleIcon />
                            </button>

                            {/* Apple */}
                            <button
                                onClick={handleAppleLogin}
                                className="w-14 h-14 hover:cursor-pointer bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                aria-label="Continue with Apple"
                            >
                                <AppleIcon />
                            </button>

                            {/* Facebook */}
                            <button
                                onClick={handleFacebookLogin}
                                className="w-14 h-14 hover:cursor-pointer bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                aria-label="Continue with Facebook"
                            >
                                <FacebookIcon />
                            </button>
                        </div>
                    </div>

                    <div className="mt-10 sm:mt-20 flex justify-center text-center">
                        Don’t have an account?{" "}
                        <Link href="/register" className="text-[#748b6f] px-1 font-semibold hover:underline">
                            Register
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right content (carousel) */}
            <div className="flex-1 hidden lg:flex p-10 h-full">
                <AuthCarousel />
            </div>
        </div>

    );
}
