"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // toggle state
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");
    const [licenseCode, setLicenseCode] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmError, setConfirmError] = useState("");
    const [passwordLengthError, setPasswordLengthError] = useState("");
    const [success, setSuccess] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalType, setModalType] = useState("success");




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

    useEffect(() => {
        const timer = setTimeout(() => setPageLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setConfirmError("");
        setPasswordLengthError("")



        if (password.length < 8) {
            setPasswordLengthError("Password must be at least 8 characters long.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setConfirmError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const resMessage = await register(name, email, password);

            setModalMessage(resMessage);
            setModalType("success");
            setShowModal(true);

            setTimeout(() => {
                setShowModal(false); // auto close
                router.push("/"); // redirect only on success
            }, 2000);
        } catch (err) {
            setModalMessage(err.message);
            setModalType("error");
            setShowModal(true);

            setTimeout(() => {
                setShowModal(false); // auto close on error too
            }, 2000);
        }


    };

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row justify-center lg:h-screen ">
            {/* left content */}
            <div className="flex-1 flex flex-col items-center ">

                <div className=" md:pt-10 lg:pt-15 pb-5 flex flex-col gap-4 md:gap-5 lg:gap-10 ">
                    <div className="flex flex-col space-y-5 justify-center items-center">
                        <h1 className="text-6xl flex justify-center font-bold ">Register!</h1>

                        <p className="w-[370px] text-gray-600 flex justify-center items-center text-center">
                            Simplify your workflow and build your productivity with Tuga's app. Get started for free
                        </p>
                    </div>

                    <div className="py-3 md:py-1">
                        <form onSubmit={handleRegister} className="space-y-5 relative w-full">
                            <input
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full py-3 px-5 outline-0 rounded-4xl border border-gray-500 text-black"
                                required
                            />
                            <input
                                placeholder="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full py-3 px-5 outline-0 rounded-4xl border border-gray-500 text-black"
                                required
                            />

                            {/* Password input with toggle */}
                            <div className="relative">
                                <input
                                    placeholder="Password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full py-3 outline-0 px-5 rounded-4xl border border-gray-500 text-black pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2  -translate-y-1/2 text-gray-400 hover:text-black"
                                >
                                    {showPassword ? <EyeOff className="w-5 cursor-pointer h-5" /> : <Eye className="w-5 cursor-pointer h-5" />}
                                </button>

                                {passwordLengthError && <p className="text-red-600 px-4 text-xs mt-1">{passwordLengthError}</p>}
                            </div>

                            {/*Forgot Password input with toggle */}
                            <div className="relative">
                                <input
                                    placeholder="Confirm Password"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full py-3 outline-0 px-5 rounded-4xl border border-gray-500 text-black pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2  -translate-y-1/2 text-gray-400 hover:text-black"
                                >
                                    {/* {showPassword ? <EyeOff className="w-5 cursor-pointer h-5" /> : <Eye className="w-5 cursor-pointer h-5" />} */}
                                </button>

                                {confirmError && <p className="text-red-600 px-4 text-xs mt-1">{confirmError}</p>}
                            </div>

                            <div className="mb-6">
                                <input
                                    type="text"
                                    value={licenseCode}
                                    onChange={(e) => setLicenseCode(e.target.value)}
                                    placeholder="License Code"
                                    className="w-full py-3 px-5 border outline-0  border-gray-500 text-black rounded-4xl "

                                />
                                <p className=" text-[#155dfc] text-xs p-1  px-5 mt-1">Leave (License Code) empty if it's a free trial account.(7 days)</p>
                            </div>

                            <div className="flex text-xs justify-end hover:underline font-medium">
                                Forgot Password?
                            </div>

                            <button
                                type="submit"
                                className="w-full hover:cursor-pointer hover:bg-gray-200 hover:border  hover:text-black py-3 bg-black rounded-4xl transition-all duration-300 text-white font-semibold"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                ) : (
                                    "Register"
                                )}
                            </button>

                            {error && <p className="text-red-500 text-xs px-4 mt-2">{error}</p>}
                            {showModal && (
                                <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                                    <div className="bg-white rounded-lg p-6 flex flex-col max-w-md items-center shadow border border-gray-200 animate-fadeIn">
                                        <div
                                            className={`w-16 h-16 flex items-center justify-center rounded-full mb-4 ${modalType === "success" ? "bg-green-50" : "bg-red-50"
                                                }`}
                                        >
                                            {modalType === "success" ? (
                                                <svg
                                                    className="w-10 h-10 text-green-600 animate-check"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="w-10 h-10 text-red-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>

                                        <p className="text-center py-3 w-[240px]">{modalMessage}</p>
                                    </div>
                                </div>
                            )}



                        </form>
                    </div>

                    <div className="w-full max-w-lg mx-auto">
                        {/* Divider with text */}
                        <div className="relative flex items-center justify-center mb-4">
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

                    <div className="mt-5 flex justify-center text-center">
                        <p className="text-gray-600">
                            Already have an account?{" "}
                            <button
                                onClick={() => router.push("/login")}
                                className="text-black font-semibold hover:cursor-pointer hover:underline"
                            >
                                Login
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* carousel content */}
            <div className="flex-1 hidden lg:flex pt-10 pr-10 h-full">
                <AuthCarousel />
            </div>
        </div>
    );
}
