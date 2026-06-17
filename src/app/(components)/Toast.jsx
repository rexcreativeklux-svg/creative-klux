// components/Toast.jsx
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

export default function Toast({ message, isOpen, onClose, duration = 2000, type = "success" }) {

    const isError = type === "error";
    const iconColor = isError ? "text-red-600" : "text-green-600";
    const barColor = isError ? "bg-red-600" : "bg-green-600";

    // Auto-close after the specified duration
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}


                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                    }}
                    className="fixed top-6 right-6 z-9999"
                >
                    <div className={`rounded-xl shadow-2xl border px-6 py-4 flex items-center gap-3 min-w-[320px] max-w-md
  ${isError ? "bg-red-50 border-red-200" : "bg-surface border-gray-100"}`}>

                        {/* Success Icon */}
                        <div className="flex-shrink-0">
                            {isError ? (
                                <AlertCircle className={`w-10 h-10 ${iconColor}`} strokeWidth={2} />
                            ) : (
                                <CheckCircle2 className={`w-10 h-10 ${iconColor}`} strokeWidth={2} />
                            )}


                        </div>

                        {/* Message */}
                        <p className="text-gray-600 text-xs font-medium flex-1 pr-4">{message}</p>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress bar – perfectly synced with duration */}
                    <div className="h-1 mt-1 rounded-full px-1 overflow-hidden">
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{
                                duration: 2,
                                ease: "linear",
                            }}
                            style={{ originX: 0 }}
                            className={`h-full w-full ${barColor}`}


                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}