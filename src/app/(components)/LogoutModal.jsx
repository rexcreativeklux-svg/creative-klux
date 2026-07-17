import { useState, useEffect } from "react";
import { X, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * LogoutModal
 * -----------
 * Confirmation dialog for signing out. When the user confirms:
 *   1. The "Log Out" button flips to a disabled "Logging out…" spinner state.
 *   2. Every dismiss control (close ✕, Cancel, and the confirm button itself)
 *      is disabled so the user can't interact while the request is in flight.
 *   3. On success we surface a Sonner success toast; on failure we toast the
 *      error feedback instead and re-enable the dialog so the user can retry.
 *
 * The actual sign-out lives in `onConfirm` (see Sidebar → handleLogout). It is
 * awaited here so this modal fully owns the loading + toast UX. `onConfirm`
 * must NOT close the modal itself and should let errors propagate so we can
 * catch them and toast the failure.
 *
 * @param {boolean}  isOpen     - Whether the modal is visible.
 * @param {Function} onClose    - Dismisses the modal (confirm stage only).
 * @param {Function} onConfirm  - Async sign-out action (logout + redirect).
 */
export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Always reopen in a clean, interactive state — never stuck mid-logout.
  useEffect(() => {
    if (isOpen) setIsLoggingOut(false);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (isLoggingOut) return; // guard against rapid double-clicks

    setIsLoggingOut(true);
    try {
      await onConfirm?.(); // runs logout() + router.push("/login")
      console.log("✅ Logout successful");
      toast.success("Logged out successfully");
      // Navigation unmounts this modal, so we intentionally leave the button
      // in its disabled loading state until the redirect completes.
    } catch (err) {
      console.error("❌ Logout failed:", err);
      toast.error(
        err?.message || "Something went wrong while logging out. Please try again.",
      );
      setIsLoggingOut(false); // re-enable so the user can retry or cancel
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center bg-transparent justify-center backdrop-blur-sm px-4">
      <div className="bg-surface border border-gray-200 rounded-xl shadow-xl max-w-sm w-full px-6 py-3 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Log out?</h3>
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            aria-label="Close"
            className={`text-gray-400 p-2 transition ${
              isLoggingOut
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer hover:bg-gray-100 hover:rounded-full hover:text-gray-600"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-gray-600 text-sm">
            Are you sure you want to log out of your account?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 py-2 justify-end">
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            className={`px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition duration-200 ${
              isLoggingOut
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-gray-200"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className={`px-5 py-2.5 text-sm font-medium text-white bg-[#155dfc] rounded-lg transition duration-200 shadow-md flex items-center gap-2 ${
              isLoggingOut
                ? "opacity-70 cursor-not-allowed"
                : "cursor-pointer hover:bg-[#0d44b3]"
            }`}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging out…
              </>
            ) : (
              <>
                Log Out
                <LogOut className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
