"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Toast from "@/app/(components)/Toast";
import Image from "next/image";

// ─── Icons ────────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
    <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const FacebookIcon = () => (
    <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

// ─── Slides ───────────────────────────────────────────────────────────────────

const SLIDES = [
    {
        image: '/ads-creative-image.png',
        tag: 'Ads Creatives',
        tagColor: '#1447e6',
        headline: 'Launch ads that\nstop the scroll.',
        sub: 'Generate high-converting creatives for every platform in minutes.',
    },
    {
        image: '/designer-image.png',
        tag: 'Designer Creatives',
        tagColor: '#0ea5e9',
        headline: 'Brand assets that\nlook agency-made.',
        sub: 'Logos, banners, infographics — professional design without the price tag.',
    },
    {
        image: '/social-creatives-image.webp',
        tag: 'Social Creatives',
        tagColor: '#6366f1',
        headline: 'Dominate\nevery feed.',
        sub: "Posts, reels, stories — content your audience can't ignore.",
    },
    {
        image: '/magic-studio-image.webp',
        tag: 'Magic Studio',
        tagColor: '#8b5cf6',
        headline: 'AI that creates\nthe impossible.',
        sub: 'Text to image, text to video, script to voiceover — all in one place.',
    },
];

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 4500);
        return () => clearInterval(t);
    }, []);

    const prev = () => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length);
    const next = () => setCurrent(c => (c + 1) % SLIDES.length);

    const slide = SLIDES[current];

    return (
        <div className="relative hidden lg:block w-1/2 h-full overflow-hidden bg-[#080810]">

            {/* BG image crossfade */}
            <AnimatePresence initial={false}>
                <motion.div
                    key={current}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                >
                    <Image
                        src={slide.image}
                        alt={slide.tag}
                        fill
                        className="object-center"
                        sizes="50vw"
                        priority
                    />
                    {/* layered overlays for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                </motion.div>
            </AnimatePresence>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-7 z-20">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-white/95 rounded-lg grid place-items-center">
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <circle cx="3.5" cy="3.5" r="2.5" fill="#111" opacity="0.9"/>
                            <circle cx="10.5" cy="3.5" r="2.5" fill="#111" opacity="0.45"/>
                            <circle cx="3.5" cy="10.5" r="2.5" fill="#111" opacity="0.45"/>
                            <circle cx="10.5" cy="10.5" r="2.5" fill="#111" opacity="0.9"/>
                        </svg>
                    </div>
                    <span className="text-white font-semibold text-[15px]" style={{ fontFamily: 'Geist, sans-serif' }}>
                        Creative Klux
                    </span>
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-1 text-white/50 hover:text-white/90 text-[12.5px] transition-colors no-underline"
                >
                    <ChevronLeft size={13} />
                    Back to site
                </Link>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 px-8 pb-8 z-20">

                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.45 }}
                    >
                        {/* Tag */}
                        <span
                            className="inline-block px-3 py-1 rounded-full text-[10.5px] font-bold tracking-widest uppercase text-white mb-4"
                            style={{ background: slide.tagColor }}
                        >
                            {slide.tag}
                        </span>

                        {/* Headline */}
                        <h2
                            className="text-white font-bold leading-[1.1] whitespace-pre-line mb-3"
                            style={{ fontSize: 'clamp(30px, 3.2vw, 44px)', fontFamily: 'Geist, sans-serif' }}
                        >
                            {slide.headline}
                        </h2>

                        {/* Sub */}
                        <p className="text-white/55 text-[13.5px] leading-relaxed max-w-[360px] mb-7">
                            {slide.sub}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[7px]">
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className="rounded-full border-none cursor-pointer p-0 transition-all duration-300"
                                style={{
                                    width: i === current ? 22 : 6,
                                    height: 6,
                                    background: i === current ? 'white' : 'rgba(255,255,255,0.25)',
                                }}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={prev}
                            className="w-9 h-9 rounded-full border border-white/15 bg-white/8 hover:bg-white/18 backdrop-blur-md grid place-items-center text-white cursor-pointer transition-colors"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            onClick={next}
                            className="w-9 h-9 rounded-full border border-white/15 bg-white/8 hover:bg-white/18 backdrop-blur-md grid place-items-center text-white cursor-pointer transition-colors"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/8 z-30">
                <motion.div
                    key={current}
                    className="h-full bg-white/50"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 4.5, ease: 'linear' }}
                />
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState({ show: false, message: "" });

    const showToast = (msg) => setToast({ message: msg, show: true });
    const closeToast = () => setToast(p => ({ ...p, show: false }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const msg = await login(email, password);
            showToast(msg);
            setTimeout(() => router.push("/"), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Full viewport, no scroll
        <div className="fixed inset-0 flex flex-row-reverse bg-white overflow-hidden">

            {/* ── LEFT ── */}
            <LeftPanel />

            {/* ── RIGHT ── */}
            <div className="w-full lg:w-1/2 h-full flex flex-col overflow-y-auto">
                <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-12 xl:px-20 py-12">

                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 mb-10 self-start">
                        <img src="/logoblue.svg" alt="Logo" className="w-7 h-7" />
                        <span className="text-lg font-bold text-gray-900">Creative Klux</span>
                    </div>

                    {/* Form card — max width so it doesn't stretch on ultrawide */}
                    <div className="w-full max-w-[400px]">

                        {/* Heading */}
                        <div className="mb-7">
                            <h1
                                className="text-[26px] font-bold text-gray-900 tracking-tight leading-tight mb-1.5"
                                style={{ fontFamily: 'Geist, sans-serif' }}
                            >
                                Welcome back
                            </h1>
                            <p className="text-[13.5px] text-gray-400">
                                Sign in to your Creative Klux account.
                            </p>
                        </div>

                        {/* Social */}
                        <div className="grid grid-cols-2 gap-2.5 mb-5">
                            <button
                                onClick={() => {}}
                                className="flex items-center justify-center gap-2 py-2.5 px-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 text-[13px] font-medium text-gray-700 transition-all cursor-pointer"
                            >
                                <GoogleIcon /> Google
                            </button>
                            <button
                                onClick={() => {}}
                                className="flex items-center justify-center gap-2 py-2.5 px-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 text-[13px] font-medium text-gray-700 transition-all cursor-pointer"
                            >
                                <FacebookIcon /> Facebook
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-[11.5px] text-gray-350 font-medium text-gray-400">or continue with email</span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-3.5">

                            {/* Email */}
                            <div>
                                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Email address</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[13.5px] text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-150 focus:bg-white focus:border-[#1447e6] focus:ring-3 focus:ring-[#1447e6]/10"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[12px] font-medium text-gray-500">Password</label>
                                    <button
                                        type="button"
                                        className="text-[11.5px] text-[#1447e6] font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-[13.5px] text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-150 focus:bg-white focus:border-[#1447e6] focus:ring-3 focus:ring-[#1447e6]/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-350 hover:text-gray-500 bg-transparent border-none cursor-pointer p-0 text-gray-400 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-2 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                                    <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                    </svg>
                                    <p className="text-[12.5px] text-red-600 leading-snug">{error}</p>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full h-11 rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-2 border-none transition-all duration-200 mt-1
                                    ${loading
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-[#1447e6] text-white cursor-pointer hover:bg-[#0f3bbf] active:scale-[0.98] shadow-[0_4px_14px_rgba(20,71,230,0.28)]'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin" />
                                        Signing in…
                                    </>
                                ) : (
                                    <>Sign in <ArrowRight size={14} /></>
                                )}
                            </button>
                        </form>

                        {/* Register */}
                        <p className="mt-5 text-center text-[13px] text-gray-400">
                            Don't have an account?{" "}
                            <Link href="/register" className="text-[#1447e6] font-semibold hover:underline">
                                Create one free
                            </Link>
                        </p>

                        {/* Footer */}
                        <p className="mt-8 text-center text-[11px] text-gray-300">
                            By signing in you agree to our{" "}
                            <Link href="/terms" className="text-gray-400 underline hover:text-gray-600">Terms</Link>
                            {" & "}
                            <Link href="/privacy" className="text-gray-400 underline hover:text-gray-600">Privacy Policy</Link>
                        </p>
                    </div>
                </div>
            </div>

            {toast.show && (
                <Toast
                    message={toast.message}
                    isOpen={toast.show}
                    onClose={closeToast}
                    duration={2000}
                />
            )}
        </div>
    );
}