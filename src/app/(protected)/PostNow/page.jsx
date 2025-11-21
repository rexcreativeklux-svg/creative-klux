"use client";

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ImagePlus,
  Video,
  Calendar,
  Clock,
  Hash,
  Smile,
  MapPin,
  Gift,
  Phone,
  MessageCircle,
  Heart,
  Share,
  ArrowLeft,
  Upload,
  X
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const PostNowPage = ({ prefilledData = null }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form states
  const [selectedPages, setSelectedPages] = useState(['user and user_']);
  const [postText, setPostText] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [mediaType, setMediaType] = useState('photo'); // 'photo' or 'video'
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [customizeForPlatforms, setCustomizeForPlatforms] = useState(true);
  const [boost, setBoost] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [shareStory, setShareStory] = useState(false);
  const [privacySetting, setPrivacySetting] = useState('Public');
  const [shareOption, setShareOption] = useState('shareOnce');
  const [selectedAssets, setSelectedAssets] = useState([]); // Assets from localStorage
  const [activeAssetId, setActiveAssetId] = useState(null); // Track the currently selected asset
  const [assetFormStates, setAssetFormStates] = useState({}); // Store form state per asset
  const [selectedPlatform, setSelectedPlatform] = useState('facebook');

  // Preview state
  const [previewData, setPreviewData] = useState({
    author: 'User',
    timestamp: 'Just now',
    text: '',
    media: [],
    platform: 'facebook'
  });

  useEffect(() => {
    // Load action type from localStorage
    const actionType = localStorage.getItem('actionType');

    // Load selected platform from localStorage
    const storedPlatform = localStorage.getItem('selectedPlatform');
    if (storedPlatform) {
      const parsed = JSON.parse(storedPlatform);
      const platform = Array.isArray(parsed) ? parsed[0] : parsed;
      setSelectedPlatform(platform);
    } else {
      setSelectedPlatform(searchParams.get('platform') || 'facebook');
    }

    // Load assets from localStorage for sidebar
    const storedAssets = localStorage.getItem('selectedAssetsForPost');
    if (storedAssets) {
      try {
        const parsedAssets = JSON.parse(storedAssets);
        if (Array.isArray(parsedAssets) && parsedAssets.length > 0) {
          setSelectedAssets(parsedAssets);
          // Set the first valid asset as the default media
          const firstAsset = parsedAssets.find(asset => asset.src && typeof asset.src === 'string');
          if (firstAsset) {
            const isVideo = firstAsset.fileFormat === 'mp4' || firstAsset.fileFormat === 'mov';
            const newMedia = [{
              id: firstAsset.id || `asset-${Date.now()}`,
              type: isVideo ? 'video' : 'photo',
              url: firstAsset.src,
              file: null
            }];
            setUploadedMedia(newMedia);
            setMediaType(isVideo ? 'video' : 'photo');
            setActiveAssetId(firstAsset.id);
            setPreviewData({
              author: 'User',
              timestamp: actionType === 'schedule' ? 'Scheduled' : 'Just now',
              text: postText,
              media: newMedia,
              platform: selectedPlatform
            });
          }
        }
      } catch (err) {
        console.error('Error parsing assets from localStorage:', err);
      }
    }

    // Handle prefilledData or URL parameters
    if (prefilledData) {
      if (prefilledData.text) setPostText(prefilledData.text);
      if (prefilledData.media && prefilledData.media.length > 0) {
        setUploadedMedia(prefilledData.media);
        setMediaType(prefilledData.media[0]?.type || 'photo');
        setActiveAssetId(prefilledData.media[0]?.id || null);
      }
      if (prefilledData.pages) setSelectedPages(prefilledData.pages);
      if (actionType === 'schedule') {
        setIsScheduling(true);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setScheduleDate(tomorrow.toISOString().split('T')[0]);
        setScheduleTime('11:25');
      }
      localStorage.removeItem('actionType');
      return;
    }

    // Check URL parameters
    const initData = {
      text: searchParams.get('text') || '',
      media: searchParams.get('media') ? JSON.parse(searchParams.get('media')) : [],
      platform: searchParams.get('platform') || 'facebook',
      pages: searchParams.get('pages') ? JSON.parse(searchParams.get('pages')) : ['user and user_']
    };

    if (initData.text) setPostText(initData.text);
    if (initData.media && Array.isArray(initData.media) && initData.media.length > 0) {
      setUploadedMedia(initData.media);
      setMediaType(initData.media[0]?.type || 'photo');
      setActiveAssetId(initData.media[0]?.id || null);
    }
    if (initData.pages) setSelectedPages(initData.pages);

    if (actionType === 'schedule') {
      setIsScheduling(true);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduleDate(tomorrow.toISOString().split('T')[0]);
      setScheduleTime('11:25');
    }

    localStorage.removeItem('actionType');
  }, [prefilledData, searchParams]);

  // Update preview whenever form data changes
  useEffect(() => {
    setPreviewData(prev => ({
      ...prev,
      text: postText,
      media: uploadedMedia,
      platform: selectedPlatform,
      timestamp: isScheduling && scheduleDate && scheduleTime
        ? `Scheduled for ${scheduleDate} at ${scheduleTime}`
        : 'Just now'
    }));
  }, [postText, uploadedMedia, isScheduling, scheduleDate, scheduleTime, selectedPlatform]);

  // Update assetFormStates when form fields change
  useEffect(() => {
    if (activeAssetId) {
      setAssetFormStates((prev) => ({
        ...prev,
        [activeAssetId]: {
          selectedPages,
          postText,
          mediaType,
          isScheduling,
          scheduleDate,
          scheduleTime,
          customizeForPlatforms,
          boost,
          collaborators,
          shareStory,
          privacySetting,
          shareOption
        }
      }));
    }
  }, [
    selectedPages,
    postText,
    mediaType,
    isScheduling,
    scheduleDate,
    scheduleTime,
    customizeForPlatforms,
    boost,
    collaborators,
    shareStory,
    privacySetting,
    shareOption,
    activeAssetId
  ]);

  const handleMediaUpload = (event, type) => {
    const files = Array.from(event.target.files);
    const newMedia = files.map(file => ({
      id: `upload-${Date.now()}-${Math.random()}`,
      type: type,
      url: URL.createObjectURL(file),
      file: file
    }));

    setUploadedMedia([...uploadedMedia, ...newMedia]);
    setMediaType(type);
    setActiveAssetId(null); // Clear active asset when new media is uploaded
  };

  const removeMedia = (mediaId) => {
    setUploadedMedia(uploadedMedia.filter(media => media.id !== mediaId));
    if (uploadedMedia.length === 1) {
      setActiveAssetId(null); // Clear active asset if no media remains
    }
  };

  const handleAssetClick = (asset) => {
    // Save current form state for the active asset before switching
    if (activeAssetId) {
      setAssetFormStates((prev) => ({
        ...prev,
        [activeAssetId]: {
          selectedPages,
          postText,
          mediaType,
          isScheduling,
          scheduleDate,
          scheduleTime,
          customizeForPlatforms,
          boost,
          collaborators,
          shareStory,
          privacySetting,
          shareOption
        }
      }));
    }

    // Set new media for the clicked asset
    const isVideo = asset.fileFormat === 'mp4' || asset.fileFormat === 'mov';
    const newMedia = [{
      id: asset.id || `asset-${Date.now()}`,
      type: isVideo ? 'video' : 'photo',
      url: asset.src,
      file: null
    }];
    setUploadedMedia(newMedia);
    setMediaType(isVideo ? 'video' : 'photo');
    setActiveAssetId(asset.id);

    // Restore saved form state for the clicked asset, if it exists
    const savedState = assetFormStates[asset.id];
    if (savedState) {
      setSelectedPages(savedState.selectedPages);
      setPostText(savedState.postText);
      setMediaType(savedState.mediaType);
      setIsScheduling(savedState.isScheduling);
      setScheduleDate(savedState.scheduleDate);
      setScheduleTime(savedState.scheduleTime);
      setCustomizeForPlatforms(savedState.customizeForPlatforms);
      setBoost(savedState.boost);
      setCollaborators(savedState.collaborators);
      setShareStory(savedState.shareStory);
      setPrivacySetting(savedState.privacySetting);
      setShareOption(savedState.shareOption);
    } else {
      // Reset to default form state if no saved state exists
      setSelectedPages(['user and user_']);
      setPostText('');
      setIsScheduling(false);
      setScheduleDate('');
      setScheduleTime('');
      setCustomizeForPlatforms(true);
      setBoost(false);
      setCollaborators([]);
      setShareStory(false);
      setPrivacySetting('Public');
      setShareOption('shareOnce');
    }
  };

  const handleScheduleToggle = () => {
    setIsScheduling(!isScheduling);
    if (!isScheduling) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduleDate(tomorrow.toISOString().split('T')[0]);
      setScheduleTime('11:25');
    }
  };

  const handlePublish = () => {
    const postData = {
      pages: selectedPages,
      text: postText,
      media: uploadedMedia,
      mediaType: mediaType,
      isScheduled: isScheduling,
      scheduleDate,
      scheduleTime,
      boost,
      platform: [selectedPlatform],
      collaborators,
      shareStory,
      privacySetting
    };

    console.log('Publishing post:', postData);

    // Update assetFormStates for the current asset
    if (activeAssetId) {
      setAssetFormStates((prev) => ({
        ...prev,
        [activeAssetId]: postData
      }));
    }

    // Clear localStorage after publishing or scheduling
    localStorage.removeItem('selectedAssetsForPost');
    localStorage.removeItem('actionType');
    localStorage.removeItem('selectedPlatform');

    alert(isScheduling ? 'Post scheduled successfully!' : 'Post published successfully!');
    router.back();
  };

  const handlePostAll = () => {
    const posts = selectedAssets.map((asset) => {
      const savedState = assetFormStates[asset.id] || {
        selectedPages: ['user and user_'],
        postText: '',
        mediaType: asset.fileFormat === 'mp4' || asset.fileFormat === 'mov' ? 'video' : 'photo',
        isScheduling: false,
        scheduleDate: '',
        scheduleTime: '',
        customizeForPlatforms: true,
        boost: false,
        collaborators: [],
        shareStory: false,
        privacySetting: 'Public',
        shareOption: 'shareOnce'
      };

      return {
        pages: savedState.selectedPages,
        text: savedState.postText,
        media: [{
          id: asset.id || `asset-${Date.now()}`,
          type: savedState.mediaType,
          url: asset.src,
          file: null
        }],
        mediaType: savedState.mediaType,
        isScheduled: savedState.isScheduling,
        scheduleDate: savedState.scheduleDate,
        scheduleTime: savedState.scheduleTime,
        boost: savedState.boost,
        platform: [selectedPlatform],
        collaborators: savedState.collaborators,
        shareStory: savedState.shareStory,
        privacySetting: savedState.privacySetting
      };
    });

    console.log('Publishing/scheduling all posts:', posts);

    // Clear localStorage and assetFormStates after publishing or scheduling
    localStorage.removeItem('selectedAssetsForPost');
    localStorage.removeItem('actionType');
    localStorage.removeItem('selectedPlatform');
    setAssetFormStates({});

    alert(isScheduling ? 'All posts scheduled successfully!' : 'All posts published successfully!');
    router.back();
  };

  const PreviewPost = () => (
    <div className="bg-white w-[450px] rounded-lg border border-gray-200">
      <div className="py-4">
        <div className="flex px-3 items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">S</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{previewData.author}</h3>
            <p className="text-xs text-gray-500">{previewData.timestamp}</p>
          </div>
        </div>

        {previewData.text ? (
          <p className="text-gray-900 mb-3 px-3 text-sm">{previewData.text}</p>
        ) : (
          <div className="rounded-lg px-3 pb-2 overflow-hidden">
            <img
              src="/textplaceholder.png"
              alt="No Text Placeholder"
              className="w-full object-cover"
            />
          </div>
        )}

        <div className="">
          {previewData.media.length === 0 ? (
            <div className="overflow-hidden">
              <img
                src="/placeholderimg.png"
                alt="Placeholder"
                className="w-full h-[400px] object-cover"
              />
            </div>
          ) : previewData.media.length === 1 ? (
            <div className="rounded-lg overflow-hidden">
              {previewData.media[0].type === 'photo' ? (
                <img
                  src={previewData.media[0].url}
                  alt="Post media"
                  className="w-full h-[400px] object-cover"
                />
              ) : (
                <video
                  src={previewData.media[0].url}
                  className="w-full h-[400px] object-cover"
                  controls
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
              {previewData.media.slice(0, 4).map((media, index) => (
                <div key={media.id} className="relative">
                  {media.type === 'photo' ? (
                    <img
                      src={media.url}
                      alt={`Post media ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <video
                      src={media.url}
                      className="w-full h-24 object-cover"
                      controls
                    />
                  )}
                  {index === 3 && previewData.media.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        +{previewData.media.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 px-10">
          <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg">
            <Heart className="w-4 h-4" />
            <span className="text-sm">Like</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Comment</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg">
            <Share className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-14">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex flex-row justify-between items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Create post</h1>
          <div>
            <button
              onClick={handlePostAll}
              disabled={selectedAssets.length === 0}
              className={`mt-4 w-full px-5 py-2 text-white rounded-md transition duration-300 ease-in-out ${selectedAssets.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {isScheduling ? 'Schedule All' : 'Post All'}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 px-2">
        <div className="flex relative flex-col lg:flex-row gap-7">
          {/* Sidebar - Selected Assets */}
          <div className="lg:sticky lg:top-6 rounded-md max-h-[calc(100vh-200px)] w-[15%] overflow-y-auto">
            <div className="bg-white p-3">
              <h2 className="font-medium text-gray-900 mb-3">Selected Assets</h2>
              {selectedAssets.length === 0 ? (
                <p className="text-sm text-gray-500">No assets selected.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedAssets.map((asset, index) => (
                    <div
                      key={asset.id}
                      onClick={() => handleAssetClick(asset)}
                      className={`flex items-center cursor-pointer rounded-lg border transition duration-300 p-2 ${activeAssetId === asset.id ? 'border-blue-700 bg-blue-50' : 'border-gray-200 hover:border-blue-500'
                        }`}
                    >
                      {asset.fileFormat === 'mp4' || asset.fileFormat === 'mov' ? (
                        <video
                          src={asset.src}
                          className="w-10 h-10 bg-gray-500 object-cover rounded-md"
                          muted
                        />
                      ) : (
                        <img
                          src={asset.src}
                          alt={asset.alt || `Asset ${index + 1}`}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                      )}
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        Asset {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Form */}
          <div className="relative w-[45%]">
            <div className="h-[calc(100vh-200px)] scroll overflow-y-auto space-y-6 bg-gray-50 border rounded-md border-gray-200 px-5 pt-5">
              {/* Post to */}
              <div className="p-3 border bg-white border-gray-200 rounded-md">
                <label className="block font-medium mb-3">
                  Post to
                </label>
                <div className="relative">
                  <div
                    className="w-full p-2 pr-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="border bg-white border-gray-200 p-3 rounded-md">
                <label className="block font-medium text-gray-900 mb-1">
                  Media
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Share photos or a video, {selectedPlatform} posts can't exceed 10 photos.
                </p>

                <div className="flex space-x-3">
                  <label className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border transition duration-300 ease-in-out border-gray-300 rounded-lg hover:bg-white hover:border-blue-700 cursor-pointer">
                    <ImagePlus className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Add Photo</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleMediaUpload(e, 'photo')}
                    />
                  </label>

                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 transition duration-300 ease-in-out rounded-lg hover:bg-white hover:border-blue-700 cursor-pointer">
                    <Video className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Add Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleMediaUpload(e, 'video')}
                    />
                  </label>
                </div>

                {/* Uploaded Media Preview */}
                {uploadedMedia.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {uploadedMedia.map((media) => (
                      <div key={media.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                          {media.type === 'photo' ? (
                            <img
                              src={media.url}
                              alt="Uploaded media"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={media.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          )}
                        </div>
                        <button
                          onClick={() => removeMedia(media.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="border bg-white border-gray-200 p-3 rounded-md">
                <label className="block font-medium mb-3">
                  Text
                </label>
                <div className="relative">
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={6}
                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute bottom-3 right-3 flex space-x-2">
                    <Hash className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                    <Smile className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                  </div>
                </div>

                {/* Post options */}
                <div className="flex space-x-6 mt-3 text-blue-600">
                  <button className="flex cursor-pointer items-center space-x-1 text-sm hover:underline">
                    <Smile className="w-4 h-4" />
                  </button>
                  <button className="flex cursor-pointer items-center space-x-1 text-sm hover:underline">
                    <MapPin className="w-4 h-4" />
                  </button>
                  <button className="flex cursor-pointer items-center space-x-1 text-sm hover:underline">
                    <Gift className="w-4 h-4" />
                  </button>
                  <button className="flex cursor-pointer items-center space-x-1 text-sm hover:underline">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="flex cursor-pointer items-center space-x-1 text-sm hover:underline">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scheduling Options */}
              <div className="border bg-white rounded-md border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Scheduling Options</span>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isScheduling}
                      onChange={handleScheduleToggle}
                      className="sr-only"
                    />
                    <span className="mr-2 text-sm text-gray-500">Set date and time</span>
                    <div className={`relative inline-flex h-6 cursor-pointer w-11 items-center border border-gray-200 rounded-full transition-colors ${isScheduling ? 'bg-blue-700' : 'bg-white'}`}>
                      <div className={`inline-block h-4 w-4 transform rounded-full bg-gray-200 transition-transform ${isScheduling ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </label>
                </div>

                {isScheduling && (
                  <div>
                    <p className="text-xs text-gray-500 py-4">
                      Schedule your post for the times when your audience is most active, or manually select a
                      date and time in the future to publish your post.
                    </p>

                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{selectedPlatform[0]}</span>
                      </div>
                      <span className="font-medium text-gray-900">{selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</span>
                    </div>

                    <div className="flex space-x-3">
                      <div className="flex-1 relative">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full pl-2 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full pl-2 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Collaborator */}
              <div className="border bg-white border-gray-200 p-3 rounded-md">
                <label className="block font-medium mb-3">
                  Collaborator
                </label>
                <input
                  type="text"
                  value={collaborators}
                  onChange={(e) => setCollaborators(e.target.value)}
                  placeholder="Enter collaborator name"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Share Your Story */}
              <div className="border bg-white border-gray-200 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Share to Your Story</span>
                    <p className="text-xs text-gray-500 mt-1">Share this post to your story for 24 hours.</p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={shareStory}
                      onChange={(e) => setShareStory(e.target.checked)}
                      className="sr-only"
                    />
                    <span className="mr-2 text-sm text-gray-500">Enable</span>
                    <div className={`relative inline-flex h-6 cursor-pointer w-11 items-center border border-gray-200 rounded-full transition-colors ${shareStory ? 'bg-blue-700' : 'bg-white'}`}>
                      <div className={`inline-block h-4 w-4 transform rounded-full bg-gray-200 transition-transform ${shareStory ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </label>
                </div>
                {shareStory && (
                  <div className="mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="shareAlways"
                        checked={shareOption === 'shareAlways'}
                        onChange={(e) => setShareOption(e.target.value)}
                        className="rounded cursor-pointer border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="mt-4">
                        <span className="font-medium">Share Always</span>
                        <p className="text-xs text-gray-500">Automatically share this and all future posts to your story.</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="shareOnce"
                        checked={shareOption === 'shareOnce'}
                        onChange={(e) => setShareOption(e.target.value)}
                        className="rounded cursor-pointer border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="mt-4">
                        <span className="font-medium">Share Once</span>
                        <p className="text-xs text-gray-500">Post will be shared to your story once for 24 hours.</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Privacy Settings */}
              <div className="border bg-white border-gray-200 p-3 rounded-md">
                <label className="block font-medium mb-1">
                  Privacy Settings
                </label>
                <p className="text-xs text-gray-500">Adjust your privacy settings to control who can see your post in News Feed, in Watch, in search results and on your profile.</p>
                <div className="">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="public"
                      checked={privacySetting === 'public'}
                      onChange={(e) => setPrivacySetting(e.target.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="mt-4">
                      <span className="font-medium">Public</span>
                      <p className="text-sm text-gray-600">Anyone can see your post.</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="restricted"
                      checked={privacySetting === 'restricted'}
                      onChange={(e) => setPrivacySetting(e.target.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="mt-4">
                      <span className="font-medium">Restricted</span>
                      <p className="text-sm text-gray-600">Only certain people can see your post.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row bg-white sticky bottom-0 border border-gray-200 p-3 rounded-md justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`relative inline-flex h-6 cursor-pointer w-11 items-center border border-gray-200 rounded-full transition-colors ${boost ? 'bg-blue-700' : 'bg-white'}`}>
                    <div className={`inline-block h-4 w-4 transform rounded-full bg-gray-200 transition-transform ${boost ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={boost}
                      onChange={() => setBoost(!boost)}
                      className="sr-only"
                    />
                    <span className="mr-2 text-sm font-medium text-gray-900">Boost</span>
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-white border cursor-pointer border-gray-200 rounded-md hover:border-blue-700 transition duration-300 ease-in-out"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    className="px-5 py-2 bg-blue-600 cursor-pointer text-white rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
                  >
                    {isScheduling ? 'Schedule' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="flex flex-col w-[40%] items-center">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="px-3 py-3 border border-gray-200 rounded-md bg-white text-sm">
                  {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} feed preview
                </div>
              </div>
              <PreviewPost />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostNowPage;