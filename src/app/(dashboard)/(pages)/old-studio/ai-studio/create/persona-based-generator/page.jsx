"use client";

import React, { useState, useRef, useEffect } from 'react';
import { User, Download, MoreVertical, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/app/(components)/Breadcrumbs';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';

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

    // Generate search queries based on persona attributes
    const generateSearchQueries = (persona) => {
        const queries = [];
        
        // Add occupation-based queries
        if (persona.occupation) {
            queries.push(persona.occupation.toLowerCase());
            queries.push(`${persona.occupation.toLowerCase()} professional`);
        }
        
        // Add tone-based queries
        if (persona.tone) {
            queries.push(`${persona.tone.toLowerCase()} person`);
        }
        
        // Add age-based queries
        const age = parseInt(persona.age);
        if (!isNaN(age)) {
            if (age < 25) queries.push('young professional');
            else if (age < 40) queries.push('professional adult');
            else if (age < 60) queries.push('mature professional');
            else queries.push('senior professional');
        }
        
        // Generic fallback queries
        queries.push('business person', 'professional portrait', 'working professional');
        
        return queries;
    };

    // Fetch images from Pexels
    const fetchPexelsImages = async (query, orientation = null) => {
        try {
            let url = `/api/pexels?query=${encodeURIComponent(query)}&type=photos&per_page=15`;
            if (orientation) {
                url += `&orientation=${orientation}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Pexels API Error:', errorData);
                throw new Error('Failed to fetch images from Pexels');
            }

            const data = await response.json();
            console.log(`Fetched ${data.photos?.length || 0} images for query: ${query}`);
            return data.photos || [];
        } catch (error) {
            console.error('Error fetching Pexels images:', error);
            return [];
        }
    };

    // Fetch videos from Pexels
    const fetchPexelsVideos = async (query, orientation = null) => {
        try {
            let url = `/api/pexels?query=${encodeURIComponent(query)}&type=videos&per_page=15`;
            if (orientation) {
                url += `&orientation=${orientation}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Pexels API Error:', errorData);
                throw new Error('Failed to fetch videos from Pexels');
            }

            const data = await response.json();
            console.log(`Fetched ${data.videos?.length || 0} videos for query: ${query}`);
            return data.videos || [];
        } catch (error) {
            console.error('Error fetching Pexels videos:', error);
            return [];
        }
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

    const handleGenerateContent = async () => {
        if (!inputData.name || !inputData.age || !inputData.occupation || !inputData.tone) {
            alert('Please fill in all persona fields.');
            return;
        }
        
        setLoading({ ...loading, generate: true });
        setOutputs([]);

        try {
            if (inputData.contentType === 'text') {
                // Generate text content
                const newOutputs = Array(4).fill().map((_, index) => ({
                    id: index,
                    type: 'text',
                    content: `Sample content ${index + 1} generated for ${inputData.name}, a ${inputData.age}-year-old ${inputData.occupation} with a ${inputData.tone} tone. This content reflects their professional background and communication style.`,
                }));
                setOutputs(newOutputs);
                setLoading({ ...loading, generate: false });
                return;
            }

            if (inputData.contentType === 'image') {
                // Generate search queries based on persona
                const queries = generateSearchQueries(inputData);
                console.log('Generated search queries:', queries);

                // Determine orientation based on layout
                let orientation = null;
                if (inputData.layout === 'Portrait') orientation = 'portrait';
                else if (inputData.layout === 'Landscape') orientation = 'landscape';
                else if (inputData.layout === 'Square') orientation = 'square';

                // Fetch images from multiple queries
                const allImages = [];
                for (const query of queries) {
                    const images = await fetchPexelsImages(query, orientation);
                    if (images.length > 0) {
                        allImages.push(...images);
                        if (allImages.length >= 20) break; // Stop when we have enough
                    }
                }

                if (allImages.length === 0) {
                    alert('No images found. Please check your Pexels API configuration or try different persona attributes.');
                    setLoading({ ...loading, generate: false });
                    return;
                }

                // Remove duplicates and filter by layout preference
                const uniqueImages = Array.from(new Map(allImages.map(img => [img.id, img])).values());
                
                let filteredImages = uniqueImages;
                if (inputData.layout === 'Portrait') {
                    const portraitImages = uniqueImages.filter(img => img.height > img.width);
                    if (portraitImages.length > 0) filteredImages = portraitImages;
                } else if (inputData.layout === 'Square') {
                    const squareImages = uniqueImages.filter(img => {
                        const ratio = img.width / img.height;
                        return ratio >= 0.9 && ratio <= 1.1;
                    });
                    if (squareImages.length > 0) filteredImages = squareImages;
                } else {
                    const landscapeImages = uniqueImages.filter(img => img.width > img.height);
                    if (landscapeImages.length > 0) filteredImages = landscapeImages;
                }

                // Select 4 random images
                const selectedImages = filteredImages
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 4)
                    .map((image, index) => ({
                        id: index,
                        type: 'image',
                        src: image.src.large2x || image.src.large || image.src.medium,
                        thumbnail: image.src.medium,
                        alt: image.alt || `Persona-Based Image ${index + 1}`,
                        photographer: image.photographer,
                        photographerUrl: image.photographer_url,
                        pexelsUrl: image.url,
                        width: image.width,
                        height: image.height,
                    }));

                setOutputs(selectedImages);
                console.log(`Generated ${selectedImages.length} images from Pexels`);
            }

            if (inputData.contentType === 'video') {
                // Generate search queries based on persona
                const queries = generateSearchQueries(inputData);
                console.log('Generated video search queries:', queries);

                // Determine orientation based on layout
                let orientation = null;
                if (inputData.layout === 'Portrait') orientation = 'portrait';
                else if (inputData.layout === 'Landscape') orientation = 'landscape';

                // Fetch videos from multiple queries
                const allVideos = [];
                for (const query of queries) {
                    const videos = await fetchPexelsVideos(query, orientation);
                    if (videos.length > 0) {
                        allVideos.push(...videos);
                        if (allVideos.length >= 20) break;
                    }
                }

                if (allVideos.length === 0) {
                    alert('No videos found. Please check your Pexels API configuration or try different persona attributes.');
                    setLoading({ ...loading, generate: false });
                    return;
                }

                // Remove duplicates and filter by layout preference
                const uniqueVideos = Array.from(new Map(allVideos.map(v => [v.id, v])).values());
                
                let filteredVideos = uniqueVideos;
                if (inputData.layout === 'Portrait') {
                    const portraitVideos = uniqueVideos.filter(v => v.height > v.width);
                    if (portraitVideos.length > 0) filteredVideos = portraitVideos;
                } else if (inputData.layout === 'Square') {
                    const squareVideos = uniqueVideos.filter(v => {
                        const ratio = v.width / v.height;
                        return ratio >= 0.9 && ratio <= 1.1;
                    });
                    if (squareVideos.length > 0) filteredVideos = squareVideos;
                } else {
                    const landscapeVideos = uniqueVideos.filter(v => v.width > v.height);
                    if (landscapeVideos.length > 0) filteredVideos = landscapeVideos;
                }

                // Select 4 random videos
                const selectedVideos = filteredVideos
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 4)
                    .map((video, index) => {
                        // Get the best quality video file
                        let videoFile = video.video_files.find(file => 
                            file.quality === 'hd' && file.width <= 1920
                        );
                        
                        if (!videoFile) {
                            videoFile = video.video_files.find(file => file.quality === 'sd');
                        }
                        
                        if (!videoFile) {
                            videoFile = video.video_files[0];
                        }

                        return {
                            id: index,
                            type: 'video',
                            src: videoFile.link,
                            thumbnail: video.image,
                            alt: `Persona-Based Video ${index + 1}`,
                            duration: video.duration,
                            width: video.width,
                            height: video.height,
                            user: video.user?.name || 'Pexels',
                            pexelsUrl: video.url,
                        };
                    });

                setOutputs(selectedVideos);
                console.log(`Generated ${selectedVideos.length} videos from Pexels`);
            }
        } catch (error) {
            console.error('Error generating content:', error);
            alert('An error occurred while generating content. Please check the console and try again.');
        } finally {
            setLoading({ ...loading, generate: false });
        }
    };

    const handleDownload = async (resultId) => {
        if (!outputs[resultId]) {
            alert('No content available to download.');
            return;
        }
        
        setLoading((prev) => ({ ...prev, export: { ...prev.export, [resultId]: true } }));
        setMenuOpen((prev) => ({ ...prev, [resultId]: false }));

        try {
            const output = outputs[resultId];
            const format = inputData.exportFormat || getDefaultExportFormat(inputData.contentType);

            if (inputData.contentType === 'text') {
                if (format === 'TXT') {
                    const blob = new Blob([output.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `persona-content-${resultId + 1}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            } else if (inputData.contentType === 'image') {
                // Download image from Pexels
                const response = await fetch(output.src);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `persona-image-${resultId + 1}.${format.toLowerCase()}`;
                link.click();
                URL.revokeObjectURL(url);
            } else if (inputData.contentType === 'video') {
                // Download video from Pexels
                const response = await fetch(output.src);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `persona-video-${resultId + 1}.mp4`;
                link.click();
                URL.revokeObjectURL(url);
            }

            console.log('Download completed for result:', resultId);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download content. You can try viewing it on Pexels instead.');
        } finally {
            setLoading((prev) => ({ ...prev, export: { ...prev.export, [resultId]: false } }));
        }
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

            <div className="flex flex-col overflow-hidden w-full mt-5 gap-6 bg-white rounded-2xl py-4">
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
                        <div className="border border-gray-200 p-3 rounded-lg">
                            <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                                <div className="flex justify-center gap-2">
                                    <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                                        <User className="text-blue-700 w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h1 className="font-medium text-lg text-blue-700">Generated Content ({outputs.length})</h1>
                                        <p className="text-gray-600 text-xs">Review and export your persona-based content from Pexels.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {outputs.map((output) => (
                                    <div key={output.id} className="border border-gray-200 rounded-lg p-4 relative hover:border-blue-700 transition duration-300">
                                        <div className="absolute top-5 right-4 z-10" ref={(el) => (menuRefs.current[output.id] = el)}>
                                            <button
                                                onClick={() => toggleMenu(output.id)}
                                                className="p-1 hover:bg-gray-100 rounded-full bg-white border border-gray-200"
                                            >
                                                <MoreVertical className="w-5 h-5 text-gray-600" />
                                            </button>
                                            {menuOpen[output.id] && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                                                    <button
                                                        onClick={() => handleDownload(output.id)}
                                                        className="flex w-full text-left rounded cursor-pointer hover:bg-gray-100 p-3 items-center gap-2 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                        disabled={loading.export[output.id]}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        {loading.export[output.id] ? 'Downloading...' : 'Download'}
                                                    </button>
                                                    {(output.type === 'image' || output.type === 'video') && output.pexelsUrl && (
                                                        <a
                                                            href={output.pexelsUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex w-full text-left rounded cursor-pointer hover:bg-gray-100 p-3 items-center gap-2 text-sm font-medium"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            View on Pexels
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center">
                                            {output.type === 'text' && (
                                                <div className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md">
                                                    <p className="text-sm text-gray-700">{output.content}</p>
                                                </div>
                                            )}
                                            {output.type === 'image' && (
                                                <div className="w-full">
                                                    <img
                                                        src={output.src}
                                                        alt={output.alt}
                                                        className="w-full h-48 object-cover rounded-lg border border-gray-200 mb-2"
                                                    />
                                                    {output.photographer && (
                                                        <p className="text-xs text-gray-500 text-center">
                                                            Photo by <a href={output.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{output.photographer}</a>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {output.type === 'video' && (
                                                <div className="w-full">
                                                    <video
                                                        src={output.src}
                                                        poster={output.thumbnail}
                                                        controls
                                                        preload="metadata"
                                                        className="w-full h-48 object-cover rounded-lg border border-gray-200 mb-2"
                                                    />
                                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                                        <span>{Math.floor(output.duration)}s</span>
                                                        <span>{output.user}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-10 flex gap-4">
                                <button
                                    onClick={handleBack}
                                    className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    disabled={Object.values(loading.export).some((v) => v)}
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleGenerateContent}
                                    className="border cursor-pointer border-blue-700 bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 transition duration-300 text-sm font-medium"
                                >
                                    Generate More
                                </button>
                            </div>
                        </div>
                    )}
                    {loading.generate && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                            <div className="relative w-[300px] h-[200px] bg-gray-50 rounded-lg overflow-hidden flex flex-col items-center justify-center">
                                <FloatingAnimation animationDuration="3s" showProgressBar={true}>
                                    <FloatingElements.ImageFile />
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