import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Notification Modal Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls visibility
 * @param {function} props.onClose - Callback when modal closes
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message
 * @param {string} props.type - 'error' | 'success' | 'warning' | 'info'
 * @param {number} props.duration - Auto-close duration in ms (0 = no auto-close)
 */
const NotificationModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'error',
  duration = 3000 
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const typeConfig = {
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      bgGradient: 'from-red-500 to-red-600',
      dotColor: 'bg-red-600'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgGradient: 'from-green-500 to-green-600',
      dotColor: 'bg-green-600'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      bgGradient: 'from-yellow-500 to-yellow-600',
      dotColor: 'bg-yellow-600'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      bgGradient: 'from-blue-500 to-blue-600',
      dotColor: 'bg-blue-600'
    },
    
  };

  const config = typeConfig[type] || typeConfig.error;
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-surface rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Icon with border */}
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className={`w-24 h-24 rounded-full border-4 border-gray-200`}
                style={{
                  borderTopColor: config.iconColor.includes('red') ? '#dc2626' :
                                  config.iconColor.includes('green') ? '#16a34a' :
                                  config.iconColor.includes('yellow') ? '#ca8a04' :
                                  '#2563eb'
                }}
              />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: type === 'error' ? [0, -10, 10, -10, 0] : 0
                  }}
                  transition={{ 
                    duration: type === 'error' ? 0.5 : 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    repeatDelay: type === 'error' ? 0.5 : 0
                  }}
                >
                  <IconComponent className={`w-10 h-10 ${config.iconColor}`} />
                </motion.div>
              </div>
            </div>

            {/* Text */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              {message && (
                <motion.p
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-sm text-gray-600"
                >
                  {message}
                </motion.p>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className={`w-2 h-2 ${config.dotColor} rounded-full`}
                />
              ))}
            </div>

            {/* Optional close button */}
            {duration === 0 && (
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
              >
                Close
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Demo component showing usage
// const NotificationModalDemo = () => {
//   const [modal, setModal] = React.useState({
//     error: false,
//     success: false,
//     warning: false,
//     info: false
//   });

//   const showModal = (type) => {
//     setModal(prev => ({ ...prev, [type]: true }));
//   };

//   const closeModal = (type) => {
//     setModal(prev => ({ ...prev, [type]: false }));
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
//       <div className="bg-surface rounded-xl shadow-lg p-8 max-w-md w-full">
//         <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Modals</h2>
        
//         <div className="space-y-3">
//           <button
//             onClick={() => showModal('error')}
//             className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
//           >
//             Show Error Modal
//           </button>
          
//           <button
//             onClick={() => showModal('success')}
//             className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
//           >
//             Show Success Modal
//           </button>
          
//           <button
//             onClick={() => showModal('warning')}
//             className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
//           >
//             Show Warning Modal
//           </button>
          
//           <button
//             onClick={() => showModal('info')}
//             className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//           >
//             Show Info Modal
//           </button>
//         </div>
//       </div>

//       {/* Notification Modals */}
//       <NotificationModal
//         isOpen={modal.error}
//         onClose={() => closeModal('error')}
//         title="Brand name is required"
//         message="Please enter a brand name to continue."
//         type="error"
//         duration={3000}
//       />

//       <NotificationModal
//         isOpen={modal.success}
//         onClose={() => closeModal('success')}
//         title="Brand created successfully!"
//         message="Your brand has been created and is ready to use."
//         type="success"
//         duration={3000}
//       />

//       <NotificationModal
//         isOpen={modal.warning}
//         onClose={() => closeModal('warning')}
//         title="Missing optional fields"
//         message="Some optional fields were not filled. You can add them later."
//         type="warning"
//         duration={3000}
//       />

//       <NotificationModal
//         isOpen={modal.info}
//         onClose={() => closeModal('info')}
//         title="Processing your request"
//         message="Please wait while we create your brand."
//         type="info"
//         duration={3000}
//       />
//     </div>
//   );
// };

export default NotificationModal;