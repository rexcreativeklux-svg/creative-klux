// components/ImageCropperModal.jsx
import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import "react-image-crop/dist/ReactCrop.css";

const ImageCropperModal = forwardRef(({
  isOpen,
  imageSrc,
  currentIndex,
  totalImages,
  crop,
  completedCrop,
  onCropChange,
  onCropComplete,
  onSave,
  onSkip,
  onCancel,
  onPrevious,
  aspectRatio = undefined,
}, ref) => {
  const imgRef = useRef(null);

  useImperativeHandle(ref, () => ({
    cropper: {
      getImage: () => imgRef.current,
    },
    getImageElement: () => imgRef.current,
  }));

  // THIS IS THE FIX: Force trigger onComplete when image loads
  const handleImageLoad = (img) => {
    const initialCrop = {
      unit: '%',
      width: 80,
      x: 10,
      y: 10,
      ...(typeof aspectRatio === 'number' && !isNaN(aspectRatio)
        ? {}
        : { height: 80 }
      ),
    };
    onCropChange(initialCrop);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <h2 className="text-md font-medium text-gray-800">
            Croping Image {currentIndex + 1} of {totalImages}
          </h2>
          <button onClick={onCancel} className="text-3xl cursor-pointer bg-gray-50 py-0 px-2.5 rounded-full text-gray-500 hover:text-gray-800">×</button>
        </div>

        {/* Crop Area */}
        <div className="flex-1 flex items-center overflow-auto  bg-gray-100 p-8">
          <div className="  mx-auto">
            <ReactCrop
              crop={crop}
              onChange={onCropChange}
              onComplete={onCropComplete}
              aspect={typeof aspectRatio === 'number' && !isNaN(aspectRatio) ? aspectRatio : undefined}
              ruleOfThirds
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop me"
                onLoad={(e) => handleImageLoad(e.currentTarget)}
                className="max-w-full max-h-full object-contain block"
                style={{ maxHeight: '65vh' }}
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex justify-center gap-6 flex-wrap">
          {currentIndex > 0 && (
            <button onClick={onPrevious} className="px-4 py-2 cursor-pointer border border-gray-300 rounded-md hover:bg-gray-100 ">
              Previous
            </button>
          )}

          <button onClick={onSkip} className="px-4 py-2 cursor-pointer bg-gray-600 text-white rounded-md hover:bg-gray-700 ">
            Skip
          </button>

          <button onClick={onCancel} className="px-4 py-2 cursor-pointer border border-red-500 text-red-600 rounded-md hover:bg-red-50 ">
            Cancel all
          </button>

          {currentIndex < totalImages - 1 ? (
            <button
              onClick={onSave}
              className="px-5 py-2 bg-blue-600 cursor-pointer text-white rounded-md hover:bg-blue-700 shadow-lg"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onSave}
              //   disabled={!completedCrop?.width || !imgRef.current}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Finish Crop
            </button>
          )}
        </div>
      </div>

      {/* Beautiful, visible resize handles */}
      <style jsx global>{`
        .ReactCrop__drag-handle {
          width: 16px !important;
          height: 16px !important;
          background: white !important;
          border: 3px solid #2563eb !important;
          border-radius: 50% !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .ReactCrop__crop-selection {
          border: 2px solid #3b82f6 !important;
          box-shadow: 0 0 0 9999em rgba(0,0,0,0.5);
        }
          .ord-nw { top: -6px !important; left: -6px !important; }
        .ord-n { top: -6px !important; left: 50% !important; transform: translateX(-50%); }
        .ord-ne { top: -6px !important; right: -6px !important; }
        .ord-e { top: 50% !important; right: -6px !important; transform: translateY(-50%); }
        .ord-se { bottom: -6px !important; right: -6px !important; }
        .ord-s { bottom: -6px !important; left: 50% !important; transform: translateX(-50%); }
        .ord-sw { bottom: -6px !important; left: -6px !important; }
        .ord-w { top: 50% !important; left: -6px !important; transform: translateY(-50%); }
      `}</style>
    </div>
  );
});

ImageCropperModal.displayName = "ImageCropperModal";
export default ImageCropperModal;