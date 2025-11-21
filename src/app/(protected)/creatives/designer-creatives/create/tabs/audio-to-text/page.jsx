"use client";

import React, { useState, useRef } from 'react';
import { FileUp } from 'lucide-react';
import { FloatingAnimation, FloatingElements } from '@/app/(protected)/FloatingAnimation';

const AudioToTextTab = ({ selectedMedia, handleSelectMedia }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [inputPrompt, setInputPrompt] = useState('');
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState({ generate: false });
  const fileInputRef = useRef(null);

  const audioPrompts = [
    'A podcast discussing technology trends',
    'A speech about environmental conservation',
    'A motivational talk for students',
    'A storytelling session for children',
    'A business presentation pitch',
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validExtensions = /\.(mp3|wav|ogg)$/i;
    if (!validExtensions.test(file.name)) {
      alert('Please upload a valid audio file (e.g., .mp3, .wav, .ogg)');
      return;
    }
    setAudioFile(file);
    const fileUrl = URL.createObjectURL(file);
    setOutputs([]);
    handleSelectMedia({ id: `uploaded-audio-${Date.now()}`, src: fileUrl, alt: file.name, type: 'audio' });
    console.log('Audio file uploaded:', file.name);
  };

  const handleInspireMe = () => {
    const randomPrompt = audioPrompts[Math.floor(Math.random() * audioPrompts.length)];
    setInputPrompt(randomPrompt);
    console.log('Inspire Me prompt:', randomPrompt);
  };

  const handleGenerateTranscription = () => {
    if (!audioFile && !selectedMedia.some((item) => item.type === 'audio')) {
      alert('Please upload an audio file.');
      return;
    }
    setLoading({ ...loading, generate: true });
    setOutputs([]);
    setTimeout(() => {
      setOutputs([
        { id: 0, type: 'text', content: 'This is a sample transcription of the audio.', alt: 'Transcription 1' },
      ]);
      setLoading({ ...loading, generate: false });
      console.log('Transcription generated');
    }, 3000);
  };

  return (
    <div className="h-[100%] border border-gray-200 overflow-y-auto rounded-lg">
      {outputs.length === 0 ? (
        <div className="flex flex-col gap-8 p-3">
          <div>
            <div className="flex flex-col pb-5 justify-center">
              <h1 className="font-medium text-lg text-blue-700">Upload Audio</h1>
              <p className="text-gray-600 text-xs">Upload an audio file to transcribe into text.</p>
            </div>
            <div className="space-y-8">
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="w-full p-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-700 text-gray-700 text-sm"
                  aria-label="Upload Audio"
                />
                <button
                  onClick={handleInspireMe}
                  className="absolute bottom-3 left-3 bg-gray-200 text-gray-700 border border-gray-400 px-2 py-0.5 rounded hover:bg-white cursor-pointer transition duration-300 text-sm"
                  aria-label="Inspire Me"
                >
                  Inspire Me
                </button>
              </div>
              <button
                onClick={handleGenerateTranscription}
                className="flex justify-center rounded cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading.generate || (!audioFile && !selectedMedia.some((item) => item.type === 'audio'))}
                aria-label="Generate Transcription"
              >
                {loading.generate ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Generate Transcription'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <h2 className="font-medium text-lg text-blue-700 mb-4">Transcription</h2>
          <div className="grid grid-cols-1 gap-4">
            {outputs.map((output) => (
              <div
                key={output.id}
                className={`relative bg-white border rounded-lg p-4 ${
                  selectedMedia.some((item) => item.id === output.id) ? 'border-blue-700' : 'border-gray-200'
                }`}
                onClick={() => handleSelectMedia({ ...output, id: `transcription-${output.id}` })}
                aria-label={`Select ${output.alt}`}
              >
                <p className="text-gray-700 text-sm">{output.content}</p>
                <p className="text-xs text-gray-500 mt-2">Transcription</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex">
            <button
              onClick={() => setOutputs([])}
              className="border cursor-pointer border-gray-200 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 text-sm font-medium"
              aria-label="Back to Input"
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
              <FloatingElements.FileUp />
            </FloatingAnimation>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioToTextTab;