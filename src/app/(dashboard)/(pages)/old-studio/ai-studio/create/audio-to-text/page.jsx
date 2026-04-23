"use client";

import React, { useState, useRef } from 'react';
import { Upload, Mic, ArrowLeft } from 'lucide-react';
import { FloatingAnimation, FloatingElements } from '@/app/(components)/FloatingAnimation';

const AudioToTextTab = ({ selectedMedia, handleSelectMedia }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid audio file (.mp3, .wav, .ogg, .m4a, .webm)');
      return;
    }

    setAudioFile(file);
    setTranscription('');
    const previewUrl = URL.createObjectURL(file);

    handleSelectMedia({
      id: `audio-${Date.now()}`,
      type: 'audio',
      src: previewUrl,
      name: file.name,
      file,
    });
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;

    setLoading(true);
    setTranscription('');

    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Transcription failed');

      setTranscription(data.text || 'No transcription returned.');
    } catch (err) {
      console.error('Transcription error:', err);
      setTranscription('Error: Could not transcribe audio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setAudioFile(null);
    setTranscription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-[100%] border border-gray-200 overflow-y-auto rounded-lg">
      {/* Upload View */}
      {(!audioFile || transcription === '') ? (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full">
                <Mic className="w-10 h-10 text-blue-700" />
              </div>
            </div>

            <h1 className="text-xl font-medium text-blue-700 mb-2">Audio to Text</h1>
            <p className="text-gray-600 text-sm mb-10">
              Upload an audio file and get an accurate transcription instantly.
            </p>

            <div className="space-y-6 w-full">
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer text-center"
              >
                <Upload className="w-14 h-14 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium text-lg">Click to upload audio</p>
                <p className="text-sm text-gray-500 mt-2">MP3, WAV, OGG, M4A, WEBM supported</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Show uploaded file */}
              {audioFile && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FileUp className="w-6 h-6 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 truncate">{audioFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleTranscribe}
                disabled={!audioFile || loading}
                className="w-full cursor-pointer bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium text-lg transition flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  'Transcribe Audio'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Result View with Sticky Top Back Button */
        <div className="relative h-full flex flex-col">
          {/* Sticky Header with Back Button */}
          <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
            <h2 className="text-xl font-medium text-blue-700">Transcription Result</h2>
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6 text-blue-700" />
            </button>
          </div>

          {/* Scrollable Transcription */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 min-h-full">
              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                {transcription || 'No text generated.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Loading */}
      {loading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative w-80 h-60 bg-gray-50 rounded-xl overflow-hidden flex flex-col items-center justify-center">
            <FloatingAnimation animationDuration="3.5s" showProgressBar={true}>
              <FloatingElements.FileUp />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioToTextTab;