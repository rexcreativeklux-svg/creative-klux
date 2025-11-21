"use client";

import React, { useState, useRef, useEffect } from 'react';
import { User, Download, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/app/(protected)/Breadcrumbs';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const PersonaBasedGeneratorPage = () => {
    const router = useRouter();
    const [inputData, setInputData] = useState({
        name: '',
        age: '',
        occupation: '',
        tone: '',
        contentType: 'text',
        exportFormat: 'TXT',
        layout: 'Square',
    });
    const [outputs, setOutputs] = useState([]);
    const [loading, setLoading] = useState({ generate: false, export: {} });
    const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState({});
    const layoutDropdownRef = useRef(null);
    const menuRefs = useRef({});

    const exportFormatOptions = [
        { value: 'TXT', label: 'TXT', contentTypes: ['text'] },
        { value: 'PDF', label: 'PDF', contentTypes: ['text', 'image'] },
        { value: 'PNG', label: 'PNG', contentTypes: ['image'] },
        { value: 'JPEG', label: 'JPEG', contentTypes: ['image'] },
        { value: 'MP4', label: 'MP4', contentTypes: ['video'] },
        { value: 'AVI', label: 'AVI', contentTypes: ['video'] },
    ];

    const layoutOptions = [
        {
            value: 'Square',
            svg: (
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="10" width="60" height="60" stroke="#4B5563" strokeWidth="1" />
                </svg>
            ),
            label: 'Square',
        },
        {
            value: 'Landscape',
            svg: (
                <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="5" width="80" height="40" stroke="#4B5563" strokeWidth="1" />
                </svg>
            ),
            label: 'Landscape',
        },
        {
            value: 'Portrait',
            svg: (
                <svg width="50" height="100" viewBox="0 0 50 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="10" width="40" height="80" stroke="#4B5563" strokeWidth="1" />
                </svg>
            ),
            label: 'Portrait',
        },
    ];

    const staticThumbnails = [
        'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
        'https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=200',
        'https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?auto=compress&cs=tinysrgb&w=200',
        'https://images.pexels.com/photos/3184423/pexels-photo-3184423.jpeg?auto=compress&cs=tinysrgb&w=200',
        'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=200',
    ];

    const getDefaultExportFormat = (contentType) => {
        if (contentType === 'text') return 'TXT';
        if (contentType === 'image') return 'PNG';
        if (contentType === 'video') return 'MP4';
        return 'TXT';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputData((prev) => {
            const newData = { ...prev, [name]: value };
            if (name === 'contentType') {
                newData.exportFormat = getDefaultExportFormat(value);
            }
            console.log('Input changed:', { name, value, newData });
            return newData;
        });
    };

    const handleLayoutChange = (layout) => {
        setInputData((prev) => ({ ...prev, layout }));
        setLayoutDropdownOpen(false);
        console.log('Layout changed:', layout);
    };

    const toggleLayoutDropdown = () => {
        setLayoutDropdownOpen((prev) => !prev);
        setMenuOpen({});
    };

    const toggleMenu = (resultId) => {
        setMenuOpen((prev) => ({
            ...prev,
            [resultId]: !prev[resultId],
        }));
        setLayoutDropdownOpen(false);
    };

    useEffect(() => {
        const validFormats = exportFormatOptions
            .filter((option) => option.contentTypes.includes(inputData.contentType))
            .map((option) => option.value);
        if (!validFormats.includes(inputData.exportFormat)) {
            const defaultFormat = getDefaultExportFormat(inputData.contentType);
            setInputData((prev) => ({
                ...prev,
                exportFormat: defaultFormat,
            }));
            console.log('Reset exportFormat to:', defaultFormat);
        }
    }, [inputData.contentType]);

    const handleGenerateContent = () => {
        if (!inputData.name || !inputData.age || !inputData.occupation || !inputData.tone) {
            alert('Please fill in all persona fields.');
            return;
        }
        setLoading({ ...loading, generate: true });
        setOutputs([]);
        setTimeout(() => {
            const newOutputs = Array(4).fill().map((_, index) => {
                if (inputData.contentType === 'text') {
                    return {
                        id: index,
                        type: 'text',
                        content: `Sample content ${index + 1} generated for ${inputData.name}, a ${inputData.age}-year-old ${inputData.occupation} with a ${inputData.tone} tone.`,
                    };
                } else if (inputData.contentType === 'image') {
                    return {
                        id: index,
                        type: 'image',
                        src: `https://via.placeholder.com/512?text=Persona+Image+${index + 1}`,
                        alt: `Persona-Based Image ${index + 1}`,
                    };
                } else if (inputData.contentType === 'video') {
                    return {
                        id: index,
                        type: 'video',
                        src: `https://via.placeholder.com/1280x720.mp4?text=Persona+Video+${index + 1}`,
                        alt: `Persona-Based Video ${index + 1}`,
                        thumbnail: `https://via.placeholder.com/1280x720?text=Video+Thumbnail+${index + 1}`,
                    };
                }
                return null;
            }).filter(Boolean);
            setOutputs(newOutputs);
            setLoading({ ...loading, generate: false });
            console.log('Content generated for persona:', inputData, newOutputs);
        }, 1000);
    };

    const handleDownload = (resultId) => {
        if (!outputs[resultId]) {
            alert('No content available to download.');
            return;
        }
        setLoading((prev) => ({ ...prev, export: { ...prev.export, [resultId]: true } }));
        setMenuOpen((prev) => ({ ...prev, [resultId]: false }));
        setTimeout(() => {
            const format = inputData.exportFormat || getDefaultExportFormat(inputData.contentType);
            let url;
            if (inputData.contentType === 'text') {
                if (format === 'TXT') {
                    const blob = new Blob([outputs[resultId].content], { type: 'text/plain' });
                    url = URL.createObjectURL(blob);
                } else if (format === 'PDF') {
                    url = `https://via.placeholder.com/pdf?text=Persona+Content+${resultId + 1}`;
                }
            } else if (inputData.contentType === 'image') {
                if (format === 'PNG' || format === 'JPEG') {
                    const canvas = document.createElement('canvas');
                    canvas.width = 512;
                    canvas.height = 512;
                    const ctx = canvas.getContext('2d');
                    const img = new window.Image();
                    img.crossOrigin = 'anonymous';
                    img.src = outputs[resultId].src;
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, 512, 512);
                        url = canvas.toDataURL(`image/${format.toLowerCase()}`);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `persona-content-${resultId + 1}.${format.toLowerCase()}`;
                        link.click();
                        setLoading((prev) => ({ ...prev, export: { ...prev.export, [resultId]: false } }));
                        console.log('Download triggered for result:', resultId, url);
                    };
                    img.onerror = () => {
                        console.error(`Failed to load image for download: ${outputs[resultId].src}`);
                        setLoading((prev) => ({ ...prev, export: { ...prev.export, [resultId]: false } }));
                    };
                    return;
                } else if (format === 'PDF') {
                    url = `https://via.placeholder.com/pdf?text=Persona+Image+${resultId + 1}`;
                }
            } else if (inputData.contentType === 'video') {
                url = outputs[resultId].src;
            }
            const link = document.createElement('a');
            link.href = url;
            link.download = `persona-content-${resultId + 1}.${format.toLowerCase()}`;
            link.click();
            setLoading((prev) => ({ ...prev, export: { ...prev.export, [resultId]: false } }));
            console.log('Download triggered for result:', resultId, url);
        }, 1000);
    };

    const handleBack = () => {
        setOutputs([]);
        setInputData((prev) => ({
            ...prev,
            name: '',
            age: '',
            occupation: '',
            tone: '',
            contentType: 'text',
            exportFormat: 'TXT',
        }));
        setLayoutDropdownOpen(false);
        setMenuOpen({});
        console.log('Back to input');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(event.target)) {
                setLayoutDropdownOpen(false);
            }
            Object.keys(menuRefs.current).forEach((resultId) => {
                if (menuRefs.current[resultId] && !menuRefs.current[resultId].contains(event.target)) {
                    setMenuOpen((prev) => ({ ...prev, [resultId]: false }));
                }
            });
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredExportFormatOptions = exportFormatOptions.filter((option) =>
        option.contentTypes.includes(inputData.contentType)
    );

    return (
        <div className="px-14">
            <div className="font-medium text-xl mb-6">Persona-Based Generator Pipeline</div>

            <Breadcrumbs
                items={[
                    { name: 'Creatives', href: '/creatives' },
                    { name: 'AI Studio', href: null },
                    { name: 'Persona-Based Generator', href: '/creatives/ai-studio/persona-based-generator' },
                ]}
            />

            <div className="flex flex-col overflow-hidden w-full mt-5 gap-6 bg-white rounded-2xl py-4" >
                <div className="overflow-auto space-y-6">
                    {!outputs.length ? (
                        <div className="border border-gray-200 flex flex-col justify-between gap-10 p-3 rounded-lg">
                            <div>
                                <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                                    <div className="flex justify-center gap-2">
                                        <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                                            <User className="text-blue-700 w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h1 className="font-medium text-lg text-blue-700">Define Persona</h1>
                                            <p className="text-gray-600 text-xs">Define the persona and content type for generation.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-7">
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Persona Name (e.g., Jane Doe)"
                                            value={inputData.name}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                                        />
                                        <input
                                            type="text"
                                            name="age"
                                            placeholder="Age (e.g., 30)"
                                            value={inputData.age}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                                        />
                                        <input
                                            type="text"
                                            name="occupation"
                                            placeholder="Occupation (e.g., Marketing Manager)"
                                            value={inputData.occupation}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                                        />
                                        <input
                                            type="text"
                                            name="tone"
                                            placeholder="Tone (e.g., Friendly, Professional)"
                                            value={inputData.tone}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                                        />
                                        <select
                                            name="contentType"
                                            value={inputData.contentType}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                                        >
                                            <option value="text">Text</option>
                                            <option value="image">Image</option>
                                            <option value="video">Video</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">Export Format</label>
                                            <select
                                                name="exportFormat"
                                                value={inputData.exportFormat}
                                                onChange={handleInputChange}
                                                className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-sm"
                                            >
                                                <option value="" disabled>Select an export format</option>
                                                {filteredExportFormatOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">Layout</label>
                                            <div className="relative" ref={layoutDropdownRef}>
                                                <button
                                                    onClick={toggleLayoutDropdown}
                                                    className="w-full p-3 border bg-white border-gray-200 rounded-md text-left text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition duration-200"
                                                >
                                                    {inputData.layout || 'Select a layout'}
                                                </button>
                                                {layoutDropdownOpen && (
                                                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg grid grid-cols-3 gap-2 p-2">
                                                        {layoutOptions.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => handleLayoutChange(option.value)}
                                                                className={`flex flex-col justify-center items-center p-2 border rounded-md transition duration-200 ${inputData.layout === option.value ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-700'
                                                                    }`}
                                                            >
                                                                <div className="mb-2">{option.svg}</div>
                                                                <span className="text-sm text-gray-700">{option.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <select
                                                    value={inputData.layout}
                                                    onChange={(e) => handleLayoutChange(e.target.value)}
                                                    className="hidden"
                                                >
                                                    <option value="" disabled>Select a layout</option>
                                                    {layoutOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGenerateContent}
                                        className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        disabled={loading.generate || !inputData.name || !inputData.age || !inputData.occupation || !inputData.tone}
                                    >
                                        {loading.generate ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            'Generate Content'
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h2 className="font-medium text-lg text-blue-700 mb-4">Sample Thumbnails</h2>
                                <div className="grid grid-cols-5 gap-4">
                                    {staticThumbnails.map((thumbnail, index) => (
                                        <div key={index} className="relative h-34 bg-white border border-gray-200 rounded-lg overflow-hidden">
                                            <img
                                                src={thumbnail}
                                                alt={`Sample Thumbnail ${index + 1}`}
                                                className="w-full cursor-pointer object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                                <div className="flex justify-center gap-2">
                                    <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                                        <User className="text-blue-700 w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h1 className="font-medium text-lg text-blue-700">Generated Content</h1>
                                        <p className="text-gray-600 text-xs">Review and export your persona-based content.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {outputs.map((output) => (
                                    <div key={output.id} className="border border-gray-200 rounded-lg p-4 relative">
                                        <div className="absolute top-5 right-4" ref={(el) => (menuRefs.current[output.id] = el)}>
                                            <button
                                                onClick={() => toggleMenu(output.id)}
                                                className="p-1 hover:bg-gray-100 rounded-full "
                                            >
                                                <MoreVertical className="w-5 h-5 text-gray-600" />
                                            </button>
                                            {menuOpen[output.id] && (
                                                <div className="absolute z-10 right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg flex flex-col gap-2 p-2">
                                                    <button
                                                        onClick={() => handleDownload(output.id)}
                                                        className="flex w-full text-left rounded cursor-pointer hover:bg-gray-100 p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                        disabled={loading.export[output.id]}
                                                    >
                                                        {loading.export[output.id] ? (
                                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                        ) : (
                                                            'Download'
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center">
                                            {output.type === 'text' && (
                                                <div className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md">
                                                    <p className="text-sm">{output.content}</p>
                                                </div>
                                            )}
                                            {output.type === 'image' && (
                                                <img
                                                    src={output.src}
                                                    alt={output.alt}
                                                    className="w-full h-auto rounded-lg border border-gray-200"
                                                />
                                            )}
                                            {output.type === 'video' && (
                                                <video
                                                    src={output.src}
                                                    controls
                                                    className="w-full max-w-xs h-auto rounded-lg border border-gray-200"
                                                    style={{ aspectRatio: '1280/720' }}
                                                />
                                            )}
                                            {/* <p className="text-xs text-gray-500 mt-2">Content Type: {inputData.contentType}</p> */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-10 flex">
                                <button
                                    onClick={handleBack}
                                    className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    disabled={Object.values(loading.export).some((v) => v)}
                                >
                                    Back
                                </button>
                            </div>
                        </>
                    )}
                    {loading.generate && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                            <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
                                <FloatingAnimation animationDuration="3s" showProgressBar={true}>
                                    <FloatingElements.Kite />
                                </FloatingAnimation>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonaBasedGeneratorPage;

// End of file