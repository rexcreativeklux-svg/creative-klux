"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Upload, Loader2, Plus, CheckCircle, AlertCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // ← adjust path if needed
import { RadialBarChart, RadialBar } from "recharts";

const scoreColor = (score) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#2563eb";
  if (score >= 40) return "#f97316";
  return "#ef4444";
};

const ScoreGauge = ({ label, value }) => (
  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
    <div className="relative">
      <RadialBarChart
        width={100} height={100} cx={50} cy={50}
        innerRadius={32} outerRadius={45}
        data={[{ value, fill: scoreColor(value) }]}
        startAngle={90} endAngle={-270}
      >
        <RadialBar
          dataKey="value"
          cornerRadius={4}
          background={{ fill: "#e5e7eb" }}
        />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold" style={{ color: scoreColor(value) }}>
          {value}%
        </span>
      </div>
    </div>
    <p className="text-xs text-gray-500 mt-2 text-center">{label}</p>
  </div>
);

export default function CreativeScoring() {
  const { creativeScoring } = useAuth();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const acceptFile = (f) => {
    if (!f) return;
    setFile(f);
    setData(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setData(null);
    setError("");
  };

  const handleScore = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setData(null);

    const response = await creativeScoring({ image: file });

    if (!response.ok) {
      setError(response.message || "Scoring failed. Please try again.");
    } else {
      setData(response.data);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Page header ── */}
      <div className="mb-6">
      
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
          >
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Creative Scoring AI</h1>
            <p className="text-sm text-gray-400">Score your creatives for performance, brand awareness, or engagement to optimize results.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: Upload ── */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <p className="font-semibold text-sm text-gray-800 mb-4">Upload Creative</p>

            {!preview ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 cursor-pointer hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700">Click to upload image</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP supported</p>
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={preview}
                  alt="Creative"
                  className="w-full object-contain max-h-72 bg-gray-100"
                />
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            )}

            {file && (
              <button
                onClick={handleScore}
                disabled={loading}
                className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Scoring…</span>
                  : "✦ Score This Creative"
                }
              </button>
            )}
          </div>

          {/* Detected elements */}
          <AnimatePresence>
            {data?.elements?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white border border-gray-200 rounded-2xl p-5"
              >
                <p className="font-semibold text-sm text-gray-800 mb-3">Detected Elements</p>
                <div className="space-y-2">
                  {data.elements.map((el, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {el.detected
                        ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        : <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
                      }
                      <span className="text-sm font-medium text-gray-700">{el.name}</span>
                      {el.note && (
                        <span className="text-xs text-gray-400 ml-auto">{el.note}</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Scores + Recommendations ── */}
        <div className="space-y-4">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24 bg-white border border-gray-200 rounded-2xl">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">AI is scoring your creative…</p>
              </div>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {data && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Score gauges */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <p className="font-semibold text-sm text-gray-800 mb-4">Scores</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Conversion",      value: data.conversionScore  },
                      { label: "Brand Awareness", value: data.brandScore       },
                      { label: "Engagement",      value: data.engagementScore  },
                      { label: "Overall",         value: data.overallScore     },
                    ].map((s) => (
                      <ScoreGauge key={s.label} label={s.label} value={s.value} />
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {data.recommendations?.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <p className="font-semibold text-sm text-gray-800 mb-4">AI Recommendations</p>
                    <div className="space-y-3">
                      {data.recommendations.map((r, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="p-4 rounded-xl border border-gray-100 bg-gray-50"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-800">{r.title}</p>
                            <span className="text-xs font-bold text-green-600 shrink-0">{r.scoreImpact}</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{r.detail}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!data && !loading && !file && (
            <div className="flex items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl">
              <div className="text-center">
                <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Upload a creative to get your AI score</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}