import { useState, useEffect } from "react";
import { X, CheckCircle, LogOut } from "lucide-react";

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  const [stage, setStage] = useState("confirm");

  // Reset stage to "confirm" every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setStage("confirm");
    }
  }, [isOpen]);

  // Only run the logout when we are on success AND modal is still open
  useEffect(() => {
    if (stage === "success" && isOpen) {
      const timer = setTimeout(() => {
        onConfirm?.(); // This will run logout() + router.push("/login")
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, isOpen, onConfirm]);
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center bg-transparent justify-center backdrop-blur-sm px-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl max-w-sm w-full px-6 py-3 animate-in fade-in zoom-in duration-300">
        {stage === "confirm" ? (
          <>
            {/* Confirm Stage */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Log out?</h3>
              <button
                onClick={onClose}
                className="text-gray-400 p-2 hover:bg-gray-100 hover:rounded-full cursor-pointer hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-gray-600 text-sm">
                Are you sure you want to log out of your account?
              </p>
            </div>

            <div className="flex gap-3 py-2 justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm cursor-pointer font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setStage("success")}
                className="px-5 py-2.5 text-sm font-medium cursor-pointer text-white bg-[#155dfc] rounded-lg hover:bg-[#0d44b3] transition duration-200 shadow-md flex items-center gap-2"
              >
                Log Out
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Success Stage */}
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 animate-in zoom-in">
                <CheckCircle className="w-12 h-12 text-green-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Logged out successfully
              </h3>
              <p className="text-gray-500 text-sm">
                Redirecting to login...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}