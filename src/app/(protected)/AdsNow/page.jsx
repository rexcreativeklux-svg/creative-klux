"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronDown,
    Calendar,
    Info,
    Plus,
    ChevronRight,
    Share,
    MessageCircle,
    Heart,
    Eye,
    Upload,
    X,
    Check,
    CircleCheck,
    ChevronUp
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';

const ModernAdsPostPage = () => {
    const [url, setUrl] = useState('');
    const [projectName, setProjectName] = useState('');
    const [selectedGoal, setSelectedGoal] = useState('');
    const [conversionButton, setConversionButton] = useState('Button');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('United States');
    const [dailyBudget, setDailyBudget] = useState(100);
    const [selectedAdSet, setSelectedAdSet] = useState('');
    const [uploadedMedia, setUploadedMedia] = useState([]);
    const [selectedAudiences, setSelectedAudiences] = useState([]);
    const [isAdContentOpen, setIsAdContentOpen] = useState(false);
    const leftColumnRef = useRef(null);
    const [leftColumnHeight, setLeftColumnHeight] = useState(0);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (leftColumnRef.current) {
            setLeftColumnHeight(leftColumnRef.current.offsetHeight);
        }
    }, []);

    useEffect(() => {
        const storedAssets = localStorage.getItem('selectedAssetsForPost');
        if (storedAssets) {
            try {
                const parsedAssets = JSON.parse(storedAssets);
                if (Array.isArray(parsedAssets) && parsedAssets.length > 0) {
                    const newMedia = parsedAssets.map(asset => ({
                        id: Date.now() + Math.random(),
                        url: asset.src,
                        type: (asset.fileFormat === 'mp4' || asset.fileFormat === 'mov') ? 'video' : 'image',
                        file: null
                    }));
                    setUploadedMedia(newMedia);
                }
            } catch (err) {
                console.error('Error parsing assets from localStorage:', err);
            }
            localStorage.removeItem('selectedAssetsForPost');
        }

        const paramUrl = searchParams.get('url');
        if (paramUrl) setUrl(paramUrl);

        const paramProjectName = searchParams.get('projectName');
        if (paramProjectName) setProjectName(paramProjectName);

        if (!startDate) {
            const current = new Date();
            const start = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;
            setStartDate(start);
        }
        if (!endDate) {
            const current = new Date();
            current.setDate(current.getDate() + 2);
            const end = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')} ${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;
            setEndDate(end);
        }
    }, [searchParams, startDate, endDate]);

    const campaignGoalOptions = [
        { value: 'Brand Awareness', label: 'Brand Awareness', subtitle: 'AI Smart Optimization', description: 'Increase visibility and recognition of your brand.' },
        { value: 'Engagement', label: 'Engagement', subtitle: 'AI Smart Optimization', description: 'Encourage likes, comments, and shares on your content.' },
        { value: 'Sales', label: 'Sales', subtitle: 'AI Smart Optimization', description: 'Drive purchases of your products or services.' },
        { value: 'Lead Generation', label: 'Lead Generation', subtitle: 'AI Smart Optimization', description: 'Collect contact information from potential customers.' },
        { value: 'Website Traffic', label: 'Website Traffic', subtitle: 'AI Smart Optimization', description: 'Get more people to visit your website.' },
    ];

    const audienceOptions = [
        { value: 'B2B', label: 'B2B (Professional)', description: 'Business owners, startups, agencies' },
        { value: 'B2C', label: 'B2C (Customer-Friendly)', description: 'End consumers, everyday users' },
        { value: 'Casual', label: 'Casual / Social-first', description: 'Broad social media audience' },
        { value: 'Inspirational', label: 'Inspirational / Motivational', description: 'Entrepreneurs, creators, startups' },
        { value: 'Sales', label: 'Direct / Sales-oriented', description: 'Hot leads, ad audiences' },
    ];

    const conversionButtons = [
        'Use App', 'Learn More', 'Shop Now', 'Sign Up', 'Contact Us', 'Get Quote', 'Download'
    ];

    const countries = [
        'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan'
    ];

    const handleMediaUpload = (event) => {
        const files = Array.from(event.target.files);
        const newMedia = files.map(file => ({
            id: Date.now() + Math.random(),
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video/') ? 'video' : 'image',
            file
        }));
        setUploadedMedia(prev => [...prev, ...newMedia]);
    };

    const removeMedia = (id) => {
        setUploadedMedia(prev => prev.filter(media => media.id !== id));
    };

    const handleAudienceToggle = (value) => {
        setSelectedAudiences(prev =>
            prev.includes(value)
                ? prev.filter(item => item !== value)
                : [...prev, value]
        );
    };

    const handlePublish = () => {
        const adData = {
            url,
            projectName,
            selectedGoal,
            conversionButton,
            startDate,
            endDate,
            selectedCountry,
            dailyBudget,
            selectedAdSet,
            uploadedMedia: uploadedMedia.map(media => ({
                type: media.type,
                url: media.url
            })),
            selectedAudiences
        };
        console.log('Compiled Ad Data:', adData);
    };

    const AdPreview = () => (
        <div className="bg-white rounded-2xl border border-gray-200">
            <div className="pt-3">
                <div className="flex space-x-2 px-2">
                    <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">YN</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col space-x-1">
                            <h3 className="font-semibold text-gray-900 text-[12px]">Your Name</h3>
                            <span className="text-gray-500 text-[10px]">Sponsored</span>
                        </div>
                    </div>
                </div>

                <div className='py-2 px-2'>
                    <p className="text-[10px]">Step into the future with Weviy! ✨ From sleek gadgets to lifestyle-enhancing digital solutions...</p>
                </div>

                {uploadedMedia.length > 0 ? (
                    <div className="mb-2 overflow-hidden">
                        {uploadedMedia[0].type === 'video' ? (
                            <video
                                src={uploadedMedia[0].url}
                                className="w-full h-48 object-cover"
                                controls
                            />
                        ) : (
                            <img
                                src={uploadedMedia[0].url}
                                alt="Ad media"
                                className="w-full h-48 object-cover"
                            />
                        )}
                    </div>
                ) : (
                    <div className="mb-2 bg-gray-100 h-48 flex items-center justify-center">
                        <div className="text-center px-10">
                            <div className="text-gray-500 mb-1 text-sm">Click to upload images and Videos and see the preview here!</div>
                        </div>
                    </div>
                )}

                <div className="py-1 pb-3 border-b border-b-gray-200 px-2">
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-">{url || 'url.com'}</p>
                            <h4 className="text-xs font-medium text-gray-900">Discover Cutting-Edge...</h4>
                        </div>
                        <button className="hover:bg-gray-50 hover:border hover:border-blue-700 cursor-pointer text-black border border-gray-200 px-3 py-1.5 rounded-lg text-xs transition-colors">
                            {conversionButton}
                        </button>
                    </div>
                </div>

                <div className="flex items-center py-2 justify-between text-gray-600">
                    <button className="flex items-center space-x-1 hover:bg-gray-50 px-2 py-1 rounded">
                        <Heart className="w-3 h-3" />
                        <span className="text-xs">Like</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:bg-gray-50 px-2 py-1 rounded">
                        <MessageCircle className="w-3 h-3" />
                        <span className="text-xs">Comment</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:bg-gray-50 px-2 py-1 rounded">
                        <Share className="w-3 h-3" />
                        <span className="text-xs">Share</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen px-16 pt-5">
            <div className="">
                <h1 className="text-2xl font-medium text-gray-900 mb-8">Set Up Your Ad Campaign in a Snap</h1>

                <div className="flex flex-row gap-8 py-3 ">
                    {/* Left Column - Campaign Setup */}
                    <div ref={leftColumnRef} className="w-[50%] space-y-10 pl-1 pr-5 overflow-y-auto max-h-[80vh]">
                        {/* URL Section */}
                        <>
                            <svg className="absolute -top-[999px] -left-[999px] w-0 h-0">
                                <defs>
                                    <clipPath id="custom-clip-shape-url" clipPathUnits="objectBoundingBox">
                                        <path
                                            d="M0.000000 0.041760 C0.000000 0.018697 0.025072 0.000000 0.056000 0.000000 L0.136587 0.000527 C0.231390 0.072507 0.094452 0.241046 0.363062 0.237535 L0.672051 0.239291 C0.738764 0.235779 0.763343 0.241046 0.805478 0.239291 L0.940660 0.239291 C1.017907 0.253336 0.998596 0.553546 1.005618 0.600948 L1.000000 0.958240 C1.000000 0.981303 0.974928 1.000000 0.944000 1.000000 L0.056000 1.000000 C0.025072 1.000000 0.000000 0.981303 0.000000 0.958240 L0.000000 0.041760 Z"
                                            fill="black"
                                        />
                                    </clipPath>
                                </defs>
                            </svg>

                            <div
                                style={{ clipPath: 'url(#custom-clip-shape-url)' }}
                                className={clsx(
                                    'w-full bg-gray-100 rounded-4xl p-6',
                                    'relative overflow-hidden'
                                )}
                            >
                                <label className="block text-sm font-medium text-gray-800 mb-2">URL</label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://yourdomain.com"
                                />
                            </div>
                        </>

                        {/* Project Name */}
                        <div className="bg-white rounded-lg ">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                                <label className="text-sm font-medium text-gray-700">Project name</label>
                            </div>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Project Name"
                            />
                        </div>

                        {/* Ad Goal */}
                        <div className="bg-white rounded-lg ">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                                <label className="text-sm font-medium text-gray-700">Ad Goal</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {campaignGoalOptions.map((goal) => (
                                    <div
                                        key={goal.value}
                                        onClick={() => setSelectedGoal(goal.value)}
                                        className={`px-3 py-3 relative rounded-lg cursor-pointer transition-colors ${selectedGoal === goal.value
                                            ? 'border border-blue-700 '
                                            : 'border border-gray-200 hover:border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-medium text-gray-900">{goal.label}</h3>
                                            {selectedGoal === goal.value && (
                                                <div className='absolute top-2 right-2'>
                                                    <CircleCheck strokeWidth={2} className="w-5 h-5 text-blue-700" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">{goal.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ad Conversion Button */}
                        <div className="bg-white rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                                <label className="text-sm font-medium text-gray-700">Ad Conversion Button</label>
                                <Info className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="relative">
                                <select
                                    value={conversionButton}
                                    onChange={(e) => setConversionButton(e.target.value)}
                                    className="w-full cursor-pointer px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                >
                                    {conversionButtons.map(button => (
                                        <option key={button} value={button}>{button}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="bg-white rounded-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className='flex flex-col pt-1'>
                                    <div className="flex items-center mb-4 space-x-2">
                                        <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                                        <label className="text-sm font-medium text-gray-700">Start date</label>
                                        <Info className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            value={startDate.replace(' ', 'T')}
                                            onChange={(e) => setStartDate(e.target.value.replace('T', ' '))}
                                            className="w-full cursor-pointer px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className='flex flex-row justify-between mb-3'>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                                            <label className="text-sm font-medium text-gray-700">End date</label>
                                            <Info className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">3D</button>
                                            <button className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">14D</button>
                                            <button className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">30D</button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            value={endDate.replace(' ', 'T')}
                                            onChange={(e) => setEndDate(e.target.value.replace('T', ' '))}
                                            className="w-full cursor-pointer px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-center text-gray-500 mt-3">
                                Meta ads typically need 2-3 days to calibrate and scale. Run for at least 3 days for optimal results.
                            </p>
                        </div>

                        {/* Cities and Countries */}
                        <div className="bg-white">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                                <label className="text-sm font-medium text-gray-700">Cities and Countries to Advertise</label>
                                <Info className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="relative">
                                <select
                                    value={selectedCountry}
                                    onChange={(e) => setSelectedCountry(e.target.value)}
                                    className="w-full cursor-pointer px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                >
                                    {countries.map(country => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                            <div className="mt-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                                    {selectedCountry}
                                    <X className="w-4 h-4 ml-2 cursor-pointer hover:text-blue-600" />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Budget, Ad Sets, Preview */}
                    <div className="w-[50%] flex rounded-xl border border-gray-200 flex-col space-y-6 overflow-y-auto max-h-[80vh]">
                        {/* Daily Budget */}
                        <div className="bg-white py-6 px-5">
                            <div className="flex items-center space-x-2 mb-">
                                <Calendar className="w-5 h-5 text-blue-700" />
                                <label className="text-sm font-medium text-gray-700">Daily Budget</label>
                                <Info className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center justify-end mb-2">
                                <div className="flex items-center border border-gray-200 rounded-lg px-2 py-1">
                                    <span className="text-lg font-medium text-gray-600">$</span>
                                    <input
                                        type="number"
                                        value={dailyBudget}
                                        onChange={(e) => setDailyBudget(Number(e.target.value))}
                                        className="bg-transparent border-none outline-none font-medium text-gray-600 w-12"
                                        min="1"
                                        max="1000"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type="range"
                                        min="1"
                                        max="1000"
                                        value={dailyBudget}
                                        onChange={(e) => setDailyBudget(Number(e.target.value))}
                                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #1d4ed8 0%, #1d4ed8 ${(dailyBudget / 1000) * 100}%, #e5e7eb ${(dailyBudget / 1000) * 100}%, #e5e7eb 100%)`
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 py-3">
                                    <span>Limited</span>
                                    <span>Basic Reach</span>
                                    <span>2x + Results</span>
                                </div>
                            </div>
                            <div className="flex justify-center space-x-3 bg-gray-100 p-2 rounded-lg">
                                <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">!</span>
                                </div>
                                <p className="text-sm text-gray-700">
                                    Please increase your budget to achieve better results
                                </p>
                            </div>
                        </div>

                        {/* Ad Sets */}
                        <div className="bg-white p-3 flex-1">
                            <div className="flex items-center justify-end mb-5">
                                <div className="flex items-center border border-blue-700 p-2 hover:bg-gray-100 rounded-xl space-x-1 text-blue-700 hover:text-blue-800 cursor-pointer">
                                    <Upload className="w-4 h-4" />
                                    <span className="text-sm px-1">Add Media</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        className="hidden"
                                        onChange={handleMediaUpload}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-row pb-3 gap-4">
                                <div className="w-[50%] space-y-4">
                                    {/* Ad Content Dropdown */}
                                    <div className="">
                                        <div 
                                            className="flex items-center cursor-pointer border-b border-b-gray-200 py-3 justify-between"
                                            onClick={() => setIsAdContentOpen(!isAdContentOpen)}
                                        >
                                            <span className="font-medium text-gray-700">Ad Content</span>
                                            {isAdContentOpen ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        {isAdContentOpen && (
                                            <div className="mt-2 py-4 border-b border-b-gray-200">
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Audience Description</label>
                                                    <p className="text-xs text-gray-500">
                                                        {selectedAudiences.length > 0 
                                                            ? selectedAudiences.map(aud => 
                                                                audienceOptions.find(opt => opt.value === aud)?.description || ''
                                                              ).join(', ')
                                                            : 'Select an audience to see description'}
                                                    </p>
                                                </div>
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                                                    <p className="text-xs text-gray-500">Discover Cutting-Edge...</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                    <p className="text-xs text-gray-500">
                                                        Step into the future with Weviy! ✨ From sleek gadgets to lifestyle-enhancing digital solutions...
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="">
                                        <span className="font-medium text-gray-700 pb-4 block">Audience Targeting</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            {audienceOptions.map((audience, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleAudienceToggle(audience.value)}
                                                    className={`flex items-center px-2 py-1 rounded-lg text-xs cursor-pointer transition-colors ${selectedAudiences.includes(audience.value)
                                                        ? 'border border-blue-700 bg-gray-50'
                                                        : 'border border-gray-200 hover:bg-gray-50 hover:border-blue-700'
                                                    }`}
                                                >
                                                    {audience.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="w-[50%]">
                                    <AdPreview />
                                </div>
                            </div>

                            <button onClick={handlePublish} className="w-full cursor-pointer bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-medium transition-colors">
                                Publish Ads
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        );
    };

export default ModernAdsPostPage;