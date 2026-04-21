import { Film, Sparkles } from 'lucide-react';

const tabs = [
    'Text to Image', 'Text to Audio', 'Text to Video',
    'Image to Variations', 'Script to Voiceover to Video',
    'Audio to Text', 'Persona-based Generator'
];

export default function MagicMediaModal({
    isOpen,
    onClose,
    activeTab,
    onTabChange,
    selectedMedia,
    onSelectMedia,
    onApply,
    onCancel,
    children, // Tab content
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[80%] h-[95%] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center py-5 px-14">
                    <h2 className="text-xl font-semibold">Magic Media</h2>
                    <button
                         onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 cursor-pointer"
                        aria-label="Close Magic Media Modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-8 overflow-x-auto border-b border-gray-200 ">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`px-6 py-4 cursor-pointer text-sm font-medium whitespace-nowrap transition ${activeTab === tab
                                    ? 'text-blue-600 border-b-3 border-blue-600 bg-white'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {children}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onApply}
                        disabled={selectedMedia.length === 0}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded-lg disabled:bg-gray-400 cursor-pointer"
                    >
                        Apply ({selectedMedia.length})
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}