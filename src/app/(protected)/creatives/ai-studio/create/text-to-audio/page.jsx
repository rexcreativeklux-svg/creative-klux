"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Download, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/app/(protected)/Breadcrumbs";
import { FloatingAnimation, FloatingElements } from "@/app/(protected)/FloatingAnimation";

export default function TextToAudioPipelinePage() {
    const router = useRouter();
    const [inputData, setInputData] = useState({ text: "", exportFormat: "MP3", voiceType: "Neutral AI" });
    const [output, setOutput] = useState(null);
    const textInputRef = useRef(null);
    const [loading, setLoading] = useState({ generate: false, export: false });
    const [result, setResult] = useState(null);
    const [exportFormatDropdownOpen, setExportFormatDropdownOpen] = useState(false);
    const [voiceTypeDropdownOpen, setVoiceTypeDropdownOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(null);
    const menuRefs = useRef({});
    const exportFormatDropdownRef = useRef(null);
    const voiceTypeDropdownRef = useRef(null);

    const exportFormatOptions = [
        { value: "MP3", label: "MP3" },
        { value: "WAV", label: "WAV" },
    ];

    const voiceTypeOptions = [
        {
            value: "Male",
            image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200",
            label: "Male",
        },
        {
            value: "Female",
            image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200",
            label: "Female",
        },
        {
            value: "Neutral AI",
            image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
            label: "Neutral AI",
        },
        {
            value: "Energetic",
            image: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=200",
            label: "Energetic",
        },
        {
            value: "Calm",
            image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
            label: "Calm",
        },
        {
            value: "Dramatic",
            image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200",
            label: "Dramatic",
        },
        {
            value: "Childlike",
            image: "https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=200",
            label: "Childlike",
        },
        {
            value: "Authoritative",
            image: "https://images.pexels.com/photos/936564/pexels-photo-936564.jpeg?auto=compress&cs=tinysrgb&w=200",
            label: "Authoritative",
        },
    ];

    const staticThumbnails = [
        "https://images.pexels.com/photos/267569/pexels-photo-267569.jpeg?auto=compress&cs=tinysrgb&w=200",
        "https://images.pexels.com/photos/261949/pexels-photo-261949.jpeg?auto=compress&cs=tinysrgb&w=200",
        "https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg?auto=compress&cs=tinysrgb&w=200",
        "https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=200",
        "https://images.pexels.com/photos/1591060/pexels-photo-1591060.jpeg?auto=compress&cs=tinysrgb&w=200",
    ];

    const inspirePrompts = [
        "A futuristic city at sunset",
        "A serene mountain landscape",
        "An abstract colorful pattern",
        "A steampunk airship in the clouds",
        "A cozy cabin in a snowy forest",
    ];

    const handleTextChange = (e) => {
        const text = e.target.value;
        setInputData((prev) => ({ ...prev, text }));
        console.log("Text input updated:", text);
    };

    const handleExportFormatChange = (exportFormat) => {
        setInputData((prev) => ({ ...prev, exportFormat }));
        setExportFormatDropdownOpen(false);
        setMenuOpen(null);
    };

    const handleVoiceTypeChange = (voiceType) => {
        setInputData((prev) => ({ ...prev, voiceType }));
        setVoiceTypeDropdownOpen(false);
        setMenuOpen(null);
    };

    const toggleExportFormatDropdown = () => {
        setExportFormatDropdownOpen((prev) => !prev);
        setVoiceTypeDropdownOpen(false);
        setMenuOpen(null);
    };

    const toggleVoiceTypeDropdown = () => {
        setVoiceTypeDropdownOpen((prev) => !prev);
        setExportFormatDropdownOpen(false);
        setMenuOpen(null);
    };

    const toggleMenu = (cardId) => {
        setMenuOpen((prev) => (prev === cardId ? null : cardId));
        setExportFormatDropdownOpen(false);
        setVoiceTypeDropdownOpen(false);
    };

    const handleInspireMe = () => {
        const randomPrompt = inspirePrompts[Math.floor(Math.random() * inspirePrompts.length)];
        setInputData((prev) => ({ ...prev, text: randomPrompt }));
        console.log("Inspire Me prompt:", randomPrompt);
    };

    const handleGenerateAudio = () => {
        if (!inputData.text.trim()) {
            alert("Please enter text to generate audio.");
            return;
        }
        setLoading({ ...loading, generate: true });
        setOutput(null);
        setResult(null);
        setMenuOpen(null);
        setTimeout(() => {
            // Simulated audio generation: 3 audio outputs
            const sampleAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
            setOutput([
                { id: 1, type: "audio", src: sampleAudioUrl },
                { id: 2, type: "audio", src: sampleAudioUrl },
                { id: 3, type: "audio", src: sampleAudioUrl },
            ]);
            setLoading({ ...loading, generate: false });
            console.log("Audio generated: 3 outputs");
        }, 1000);
    };

    const handleSendOutput = (destination, cardId) => {
        if (!output || !output.find((o) => o.id === cardId)) {
            alert("No audio available to send.");
            return;
        }
        setLoading({ ...loading, export: true });
        setTimeout(() => {
            setResult({ type: destination, status: `Sent to ${destination} (Audio ${cardId})` });
            setLoading({ ...loading, export: false });
            setMenuOpen(null);
            console.log(`Output ${cardId} sent to ${destination}`);
        }, 1000);
    };

    const handleDownload = (cardId) => {
        if (!output || !output.find((o) => o.id === cardId)) {
            alert("No audio available to download.");
            return;
        }
        setLoading({ ...loading, export: true });
        setTimeout(() => {
            const format = inputData.exportFormat || "MP3";
            const audio = output.find((o) => o.id === cardId);
            const url = audio.src;
            const link = document.createElement("a");
            link.href = url;
            link.download = `generated-audio-${cardId}.${format.toLowerCase()}`;
            link.click();
            setResult({ type: "download", url, format, cardId });
            setLoading({ ...loading, export: false });
            setMenuOpen(null);
            console.log(`Download triggered for audio ${cardId}:`, url);
        }, 1000);
    };

    const handleBack = () => {
        setOutput(null);
        setResult(null);
        setInputData((prev) => ({ ...prev, text: "" }));
        setExportFormatDropdownOpen(false);
        setVoiceTypeDropdownOpen(false);
        setMenuOpen(null);
        console.log("Back to input");
    };

    // Close dropdowns and menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                exportFormatDropdownRef.current &&
                !exportFormatDropdownRef.current.contains(event.target) &&
                voiceTypeDropdownRef.current &&
                !voiceTypeDropdownRef.current.contains(event.target) &&
                !Object.values(menuRefs.current).some((ref) => ref && ref.contains(event.target))
            ) {
                setExportFormatDropdownOpen(false);
                setVoiceTypeDropdownOpen(false);
                setMenuOpen(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const selectedVoiceoverStyle = voiceTypeOptions.find((option) => option.value === inputData.voiceType);

    return (
        <div className="px-14">
            <div className="font-medium text-xl mb-6">Text to Audio Pipeline</div>

            <Breadcrumbs
                items={[
                    { name: "Creatives", href: "/creatives" },
                    { name: "AI Studio", href: null },
                    { name: "Text to Audio", href: "/creatives/ai-studio/create/text-to-audio" },
                ]}
            />

            <div className="flex flex-col overflow-hidden w-full mt-5 gap-6 bg-white rounded-2xl py-4">
                <div className="overflow-auto space-y-6">
                    {!output ? (
                        /* Input Section */
                        <div className="border border-gray-200 flex flex-col justify-between gap-30 p-3 rounded-lg">
                            <div className="space-y-7">
                                <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                                    <div className="flex justify-center gap-2">
                                        <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                                            <Mic className="text-blue-700 w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h1 className="font-medium text-lg text-blue-700">Enter Text</h1>
                                            <p className="text-gray-600 text-xs">Enter text to generate audio.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col relative">
                                    <textarea
                                        ref={textInputRef}
                                        value={inputData.text}
                                        onChange={handleTextChange}
                                        placeholder="Type your text here..."
                                        className="w-full p-3 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200"
                                        rows={5}
                                    />
                                    <button
                                        onClick={handleInspireMe}
                                        className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-white cursor-pointer transition duration-300 text-sm"
                                    >
                                        Inspire Me
                                    </button>
                                </div>
                                <div className="space-y-10">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">Export Format</label>
                                            <div className="relative" ref={exportFormatDropdownRef}>
                                                <button
                                                    onClick={toggleExportFormatDropdown}
                                                    className="w-full p-3 border bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200 flex items-center gap-2"
                                                >
                                                    {inputData.exportFormat || "Select an export format"}
                                                </button>
                                                {exportFormatDropdownOpen && (
                                                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-1 gap-2 p-2">
                                                        {exportFormatOptions.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => handleExportFormatChange(option.value)}
                                                                className={`flex items-center p-2 transition duration-200 ${inputData.exportFormat === option.value
                                                                        ? "border-blue-700 bg-blue-50"
                                                                        : "border-gray-200 bg-white hover:border-blue-700"
                                                                    }`}
                                                            >
                                                                <span className="text-sm text-gray-700">{option.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <select
                                                    value={inputData.exportFormat}
                                                    onChange={(e) => handleExportFormatChange(e.target.value)}
                                                    className="hidden"
                                                >
                                                    <option value="" disabled>
                                                        Select an export format
                                                    </option>
                                                    {exportFormatOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">Voice Type</label>
                                            <div className="relative" ref={voiceTypeDropdownRef}>
                                                <button
                                                    onClick={toggleVoiceTypeDropdown}
                                                    className="w-full p-3 border bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200 flex items-center gap-2"
                                                >
                                                    {selectedVoiceoverStyle && (
                                                        <img
                                                            src={selectedVoiceoverStyle.image}
                                                            alt={selectedVoiceoverStyle.label}
                                                            className="w-6 h-6 object-cover rounded"
                                                        />
                                                    )}
                                                    {inputData.voiceType || "Select a voice type"}
                                                </button>
                                                {voiceTypeDropdownOpen && (
                                                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-4 gap-2 p-2">
                                                        {voiceTypeOptions.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => handleVoiceTypeChange(option.value)}
                                                                className={`flex cursor-pointer flex-col items-center p-2 border rounded-md transition duration-200 ${inputData.voiceType === option.value
                                                                        ? "border-blue-700 bg-blue-50"
                                                                        : "border-gray-200 bg-white hover:border-blue-700"
                                                                    }`}
                                                            >
                                                                <img
                                                                    src={option.image}
                                                                    alt={option.label}
                                                                    className="w-full h-20 object-cover rounded-md mb-2"
                                                                />
                                                                <span className="text-sm text-gray-700">{option.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <select
                                                    value={inputData.voiceType}
                                                    onChange={(e) => handleVoiceTypeChange(e.target.value)}
                                                    className="hidden"
                                                >
                                                    <option value="" disabled>
                                                        Select a voice type
                                                    </option>
                                                    {voiceTypeOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGenerateAudio}
                                        className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        disabled={loading.generate || !inputData.text.trim()}
                                    >
                                        {loading.generate ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            "Generate Audio"
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h2 className="font-medium text-lg text-blue-700 mb-4">Sample Thumbnails</h2>
                                <div className="grid grid-cols-5 gap-4">
                                    {staticThumbnails.map((thumbnail, index) => (
                                        <div
                                            key={index}
                                            className="relative bg-white border h-35 border-gray-200 rounded-lg overflow-hidden"
                                        >
                                            <img
                                                src={thumbnail}
                                                alt={`Sample Thumbnail ${index + 1}`}
                                                className="w-full cursor-pointer object-contain"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Results Section */
                        <div className="border border-gray-200 p-3 rounded-lg">
                            <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                                <div className="flex justify-center gap-2">
                                    <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                                        <Mic className="text-blue-700 w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h1 className="font-medium text-lg text-blue-700">Generated Audio</h1>
                                        <p className="text-gray-600 text-xs">Review and export your audio.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {output.map((audio) => (
                                    <div
                                        key={audio.id}
                                        className="relative bg-white border border-gray-200 rounded-md  p-4"
                                    >
                                        <div className="absolute top-2 right-2" ref={(el) => (menuRefs.current[audio.id] = el)}>
                                            <button
                                                onClick={() => toggleMenu(audio.id)}
                                                className="text-gray-600 cursor-pointer hover:text-blue-700 p-1 rounded-full hover:bg-gray-100 transition duration-200"
                                                aria-label={`Menu for audio ${audio.id}`}
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                            {menuOpen === audio.id && (
                                                <div className="absolute z-20 right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg p-2">
                                                    <button
                                                        onClick={() => handleDownload(audio.id)}
                                                        className="w-full text-left p-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md flex items-center gap-2"
                                                        disabled={loading.export}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </button>
                                                    <div className="relative group">
                                                        <button className="w-full text-left p-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md flex items-center gap-2">
                                                            Use
                                                        </button>
                                                        <div className="absolute z-20 right-full top-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg p-2 hidden group-hover:block">
                                                            <button
                                                                onClick={() => handleSendOutput("Ad Creatives", audio.id)}
                                                                className="w-full text-left p-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md"
                                                                disabled={loading.export}
                                                            >
                                                                Send to Ad Creatives
                                                            </button>
                                                            <button
                                                                onClick={() => handleSendOutput("Social Creatives", audio.id)}
                                                                className="w-full text-left p-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md"
                                                                disabled={loading.export}
                                                            >
                                                                Send to Social Creatives
                                                            </button>
                                                            <button
                                                                onClick={() => handleSendOutput("Designer Creatives", audio.id)}
                                                                className="w-full text-left p-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md"
                                                                disabled={loading.export}
                                                            >
                                                                Send to Designer Creatives
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <audio src={audio.src} controls className="w-full pt-5" />
                                    </div>
                                ))}
                            </div>
                            {result && (
                                <div className="flex flex-col items-center mt-4">
                                    <h3 className="text-lg font-semibold text-green-600">
                                        {result.type === "download" ? `Audio ${result.cardId} Downloaded!` : result.status}
                                    </h3>
                                    {result.type === "download" && (
                                        <a href={result.url} download className="mt-4 text-blue-700 underline">
                                            Download Audio {result.cardId} ({result.format})
                                        </a>
                                    )}
                                </div>
                            )}
                            <div className="mt-10 flex">
                                <button
                                    onClick={handleBack}
                                    className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    disabled={loading.export}
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    )}

                    {loading.generate && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                            <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
                                <FloatingAnimation animationDuration="3s" showProgressBar={true}>
                                    <FloatingElements.AudioFile />
                                </FloatingAnimation>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}