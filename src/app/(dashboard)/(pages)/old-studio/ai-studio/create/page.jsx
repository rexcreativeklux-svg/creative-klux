"use client";

import { CheckCircle2, Image, Video, FileText, Mic, Users, Download, Layout, Palette } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { motion } from "framer-motion";

const AIStudio = () => {
  const [step, setStep] = useState(1);
  const [pipeline, setPipeline] = useState(null);
  const [inputData, setInputData] = useState({ text: "", file: null });
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState({ 1: false, 2: false, 3: false });
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleSelectPipeline = (pipelineType) => {
    setPipeline(pipelineType);
    setInputData({ text: "", file: null });
    setOutput(null);
  };

  const handleInputChange = (e) => {
    setInputData((prev) => ({ ...prev, text: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validExtensions = pipeline === "image_variations" ? /\.(jpg|jpeg|png|gif|webp)$/i : /\.(mp3|wav)$/i;
    if (!validExtensions.test(file.name)) {
      alert(`Please upload a valid ${pipeline === "image_variations" ? "image" : "audio"} file`);
      return;
    }
    setLoading({ ...loading, 2: true });
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      setInputData((prev) => ({ ...prev, file: { src: url, type: pipeline === "image_variations" ? "image" : "audio" } }));
      setLoading({ ...loading, 2: false });
    }, 1000);
  };

  const handleGenerateOutput = () => {
    setLoading({ ...loading, 2: true });
    setTimeout(() => {
      let mockOutput;
      switch (pipeline) {
        case "text_image":
          mockOutput = { type: "image", src: "https://via.placeholder.com/512?text=Generated+Image", alt: "Generated Image" };
          break;
        case "text_video":
          mockOutput = { type: "video", src: "https://via.placeholder.com/1280x720.mp4?text=Generated+Video", alt: "Generated Video" };
          break;
        case "image_variations":
          mockOutput = [
            { id: 1, type: "image", src: "https://via.placeholder.com/512?text=Variant+1", alt: "Variant 1" },
            { id: 2, type: "image", src: "https://via.placeholder.com/512?text=Variant+2", alt: "Variant 2" },
          ];
          break;
        case "script_video":
          mockOutput = { type: "video", src: "https://via.placeholder.com/1280x720.mp4?text=Voiceover+Video", alt: "Voiceover Video" };
          break;
        case "audio_text":
          mockOutput = { type: "text", content: "This is a sample transcription of the audio input." };
          break;
        case "persona_generator":
          mockOutput = { type: "image", src: "https://via.placeholder.com/512?text=Persona+Image", alt: "Persona Image" };
          break;
        default:
          mockOutput = null;
      }
      setOutput(mockOutput);
      setLoading({ ...loading, 2: false });
    }, 1000);
  };

  const handleSendOutput = (destination) => {
    setLoading({ ...loading, 3: true });
    setTimeout(() => {
      setResult({ type: destination, status: `Sent to ${destination}` });
      setLoading({ ...loading, 3: false });
    }, 1000);
  };

  const handleDownload = () => {
    setLoading({ ...loading, 3: true });
    setTimeout(() => {
      setResult({ type: "download", url: output?.src || "https://via.placeholder.com/512" });
      setLoading({ ...loading, 3: false });
    }, 1000);
  };

  const handleContinue = () => {
    if (step < steps.length) {
      setLoading({ ...loading, [step]: true });
      setTimeout(() => {
        setStep(step + 1);
        setLoading({ ...loading, [step]: false });
      }, 1000);
    }
  };

  const steps = [
    { id: 1, title: "Choose Pipeline", icon: <Layout className="h-5 w-5" /> },
    { id: 2, title: "Generate Output", icon: <Palette className="h-5 w-5" /> },
    { id: 3, title: "Send Output", icon: <Download className="h-5 w-5" /> },
  ];

  const pipelineOptions = [
    { type: "text_image", name: "Text → Image", desc: "Generate images from text prompts", size: "512x512", icon: <Image /> },
    { type: "text_video", name: "Text → Video", desc: "Create videos from text prompts", size: "1280x720", icon: <Video /> },
    { type: "image_variations", name: "Image → Variations", desc: "Generate image variations", size: "512x512", icon: <Image /> },
    { type: "script_video", name: "Script → Voiceover → Video", desc: "Script to narrated video", size: "1280x720", icon: <Video /> },
    { type: "audio_text", name: "Audio → Text", desc: "Transcribe audio to text", size: "Text", icon: <Mic /> },
    { type: "persona_generator", name: "Persona-based Generator", desc: "Generate for specific personas", size: "512x512", icon: <Users /> },
  ];

  return (
    <div>


      <div className="flex flex-row gap-10 w-full">
        <div className="hidden lg:flex overflow-hidden sticky top-20 flex-col mt-15 w-[30%] h-[500px]">
          <div className="absolute top-0 left-4.5 w-1 h-full bg-gray-300 rounded-full" />
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute top-0 left-4.5 w-1 bg-[#155dfc] rounded-full"
          />
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex items-center h-full last:mb-0 mb-10">
              <div className="relative z-20">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 bg-white
                    ${step === s.id ? "border-[#155dfc] bg-blue-100 text-[#155dfc]" : step > s.id ? "bg-[#155dfc] border-[#155dfc] text-white" : "border-gray-300 text-gray-300"}`}
                >
                  {loading[s.id] ? (
                    <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                  ) : step > s.id ? (
                    <CheckCircle2 size={20} className="text-blue-700" />
                  ) : (
                    s.icon
                  )}
                </div>
              </div>
              <span className={`ml-3 text-sm font-medium ${step === s.id ? "text-[#155dfc]" : "text-black"}`}>
                <div className="text-gray-500 text-xs">Step {s.id}</div>
                <div className="font-medium">{s.title}</div>
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col overflow-hidden w-full mt-5 justify-between gap-10 bg-white rounded-2xl p-4">
          <div className="overflow-auto">
            {step === 1 && (
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="text-sm flex border-b border-b-gray-200 pb-5 flex-row gap-2 mb-10">
                  <div className="flex justify-center bg-gray-50 border border-gray-100 rounded-full px-2 items-center">
                    <Layout className="text-blue-700 w-7 h-7" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Which pipeline do you want to run?</h1>
                    <p className="text-gray-600 text-xs">Select an AI pipeline to generate your creative.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {pipelineOptions.map((opt) => (
                    <div
                      key={opt.type}
                      onClick={() => handleSelectPipeline(opt.type)}
                      className={`border p-4 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${pipeline === opt.type ? "bg-blue-100 border-blue-500" : "bg-white hover:bg-gray-100 hover:border hover:border-gray-200 border-gray-200"}`}
                    >
                      <div className="text-center">
                        <div className="mx-auto mb-2">{opt.icon}</div>
                        <span className="text-sm font-medium">{opt.name}</span>
                        <div className="text-xs text-gray-500">{opt.desc}</div>
                        <div className="text-xs font-medium">({opt.size})</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="text-sm flex justify-between border-b p-2 border-b-gray-200 flex-row mb-6">
                  <div className="flex justify-center gap-2">
                    <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                      <Palette className="text-blue-700 w-6 h-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h1 className="font-medium text-lg text-blue-700">Generate Output</h1>
                      <p className="text-gray-600 text-xs">Provide input to generate your creative.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateOutput}
                    className="flex self-start rounded-lg cursor-pointer hover:bg-blue-800 justify-center bg-blue-700 text-white p-2 items-center"
                    disabled={loading[2]}
                  >
                    {loading[2] ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Generate Output"
                    )}
                  </button>
                </div>
                <div className="space-y-6">
                  {(pipeline === "text_image" || pipeline === "text_video" || pipeline === "script_video" || pipeline === "persona_generator") && (
                    <div className="flex relative items-center gap-2">
                      <textarea
                        placeholder={pipeline === "script_video" ? "Enter your script..." : "Enter your text prompt..."}
                        value={inputData.text}
                        onChange={handleInputChange}
                        className="w-full p-3 border bg-gray-50 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155dfc] h-32"
                      />
                    </div>
                  )}
                  {(pipeline === "image_variations" || pipeline === "audio_text") && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="flex rounded-lg cursor-pointer hover:bg-blue-800 justify-center bg-blue-700 text-white p-2 items-center"
                        disabled={loading[2]}
                      >
                        {loading[2] ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          `Upload ${pipeline === "image_variations" ? "Image" : "Audio"}`
                        )}
                      </button>
                      <input
                        type="file"
                        accept={pipeline === "image_variations" ? "image/*" : "audio/*"}
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                  {output && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Generated Output</h3>
                      {output.type === "image" && (
                        <img src={output.src} alt={output.alt} className="w-full max-w-md h-auto rounded-lg border border-gray-200" />
                      )}
                      {output.type === "video" && (
                        <video src={output.src} controls className="w-full max-w-md h-auto rounded-lg border border-gray-200" />
                      )}
                      {output.type === "text" && (
                        <p className="p-3 border bg-gray-50 border-gray-200 rounded-md">{output.content}</p>
                      )}
                      {Array.isArray(output) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {output.map((variant) => (
                            <img key={variant.id} src={variant.src} alt={variant.alt} className="w-full h-40 object-cover rounded-lg" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="border border-gray-200 p-3 rounded-lg">
                <div className="text-sm flex border-b border-b-gray-200 pb-2 flex-row gap-2 mb-7 py-2">
                  <div className="flex bg-gray-100 px-3 rounded-full justify-center items-center">
                    <Download className="text-blue-700 w-6 h-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="font-medium text-lg text-blue-700">Send Output</h1>
                    <p className="text-gray-600 text-xs">Download or send to creatives for further editing.</p>
                  </div>
                </div>
                {result && (
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-green-600">
                      {result.type === "download" ? "Output Downloaded!" : result.status}
                    </h3>
                    {result.type === "download" && (
                      <a href={result.url} download className="mt-4 text-blue-600 underline">
                        Download Output
                      </a>
                    )}
                  </div>
                )}
                {!result && (
                  <div className="flex gap-4 justify-center flex-wrap">
                    <button
                      onClick={handleDownload}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center"
                      disabled={loading[3]}
                    >
                      {loading[3] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Download"
                      )}
                    </button>
                    <button
                      onClick={() => handleSendOutput("Ad Creatives")}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center"
                      disabled={loading[3]}
                    >
                      {loading[3] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Send to Ad Creatives"
                      )}
                    </button>
                    <button
                      onClick={() => handleSendOutput("Social Creatives")}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center"
                      disabled={loading[3]}
                    >
                      {loading[3] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Send to Social Creatives"
                      )}
                    </button>
                    <button
                      onClick={() => handleSendOutput("Designer Creatives")}
                      className="flex rounded-lg cursor-pointer hover:bg-blue-800 bg-blue-700 text-white p-2 items-center"
                      disabled={loading[3]}
                    >
                      {loading[3] ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Send to Designer Creatives"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="border cursor-pointer border-gray-300 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition duration-300"
                disabled={loading[step]}
              >
                Back
              </button>
            )}
            {step < steps.length && (
              <button
                onClick={handleContinue}
                className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                disabled={loading[step]}
              >
                {loading[step] ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Continue"
                )}
              </button>
            )}
            {step === steps.length && (
              <button
                onClick={handleDownload}
                className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                disabled={loading[3] || result}
              >
                {loading[3] ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Finish"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudio;