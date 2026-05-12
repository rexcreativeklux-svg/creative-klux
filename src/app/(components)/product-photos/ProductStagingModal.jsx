import { useState, useRef } from 'react';
import { generateImage, uploadFile } from '@/(lib)/ai-helpers';
import { X, Upload, Download, Loader2, MoreHorizontal, RefreshCw, Trash2, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

const SIZES = [
  { id: 'original', name: 'Original', w: 1, h: 1, icon: '⊞' },
  { id: '9_16', name: 'Portrait (9:16)', w: 9, h: 16 },
  { id: '3_4', name: 'Portrait (3:4)', w: 3, h: 4 },
  { id: '2_3', name: 'Portrait (2:3)', w: 2, h: 3 },
  { id: '1_1', name: 'Square', w: 1, h: 1 },
  { id: '3_2', name: 'Landscape (3:2)', w: 3, h: 2 },
  { id: '4_3', name: 'Landscape (4:3)', w: 4, h: 3 },
  { id: '16_9', name: 'Landscape (16:9)', w: 16, h: 9 },
];

const SCENES = [
  { id: 'lifestyle', name: 'Lifestyle', desc: 'Person using product in real life', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=70' },
  { id: 'studio', name: 'Studio', desc: 'Clean white/grey studio', img: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=300&q=70' },
  { id: 'outdoor', name: 'Outdoor', desc: 'Natural outdoor setting', img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=70' },
  { id: 'flat_lay', name: 'Flat Lay', desc: 'Top-down table composition', img: 'https://images.unsplash.com/photo-1517231925375-bf2cb42917a5?w=300&q=70' },
  { id: 'editorial', name: 'Editorial', desc: 'Magazine-style fashion shoot', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=70' },
  { id: 'social', name: 'Social Media', desc: 'Eye-catching social media ready', img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300&q=70' },
];

export default function ProductStagingModal({ onClose }) {
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [selectedSize, setSelectedSize] = useState('3_2');
  const [selectedScene, setSelectedScene] = useState('lifestyle');
  const [applyBrandStyle, setApplyBrandStyle] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [imageMenu, setImageMenu] = useState(null);
  const [showSizePicker, setShowSizePicker] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadedImage(URL.createObjectURL(file));
    setUploadedFileUrl(null);
  };

  const handleGenerate = async () => {
    if (!uploadedFile && !uploadedImage) { toast.error('Upload a product image first'); return; }
    setGenerating(true);
    setShowSizePicker(false);
    try {
      let fileUrl = uploadedFileUrl;
      if (!fileUrl && uploadedFile) {
        const { file_url } = await uploadFile({ file: uploadedFile });
        fileUrl = file_url;
        setUploadedFileUrl(fileUrl);
      }
      const sizeObj = SIZES.find(s => s.id === selectedSize);
      const sceneObj = SCENES.find(s => s.id === selectedScene);
      const generationPrompt = `Product staging photo: Place this exact product in a ${sceneObj?.name || 'lifestyle'} setting — ${sceneObj?.desc}. Keep the product design, colors and details identical to the reference. Professional commercial photography. ${sizeObj ? `Aspect ratio ${sizeObj.w}:${sizeObj.h}.` : ''} ${prompt ? prompt + '.' : ''}  High quality, ${selectedScene === 'editorial' ? 'magazine editorial style' : 'clean professional product photography'}.`;
      const result = await generateImage({
        prompt: generationPrompt,
        existing_image_urls: [fileUrl],
      });
      setGeneratedImages(prev => [result.url, ...prev]);
      toast.success('Image generated!');
    } catch {
      // error shown by helper
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (url) => {
    const a = document.createElement('a');
    a.href = url; a.download = 'product-staged.png'; a.target = '_blank'; a.click();
  };

  const sizeObj = SIZES.find(s => s.id === selectedSize);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => { setShowSizePicker(false); setImageMenu(null); }}>
      <div className="bg-white rounded-2xl shadow-2xl flex overflow-hidden" style={{ width: '1000px', height: '600px' }} onClick={e => e.stopPropagation()}>

        {/* Left sidebar */}
        <div className="w-52 border-r border-gray-100 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="flex items-center px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-800">Product Staging</span>
          </div>

          {/* Upload */}
          <div className="px-3 py-3 border-b border-gray-100">
            {uploadedImage ? (
              <div className="relative">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-violet-400 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <img src={uploadedImage} alt="product" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-gray-300 rounded-lg py-4 flex flex-col items-center justify-center gap-1.5 text-xs text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors">
                <Upload className="w-4 h-4" />
                Upload product
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Scene selector */}
          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Scene</p>
            <div className="grid grid-cols-2 gap-1.5">
              {SCENES.map(s => (
                <button key={s.id} onClick={() => setSelectedScene(s.id)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-colors aspect-video ${selectedScene === s.id ? 'border-violet-500' : 'border-gray-200 hover:border-violet-300'}`}>
                  <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-end">
                    <span className="text-white text-[9px] font-semibold px-1.5 pb-1 leading-tight">{s.name}</span>
                  </div>
                  {selectedScene === s.id && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px]">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex-1">
            {/* Size */}
            <button onClick={() => setShowSizePicker(p => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 text-sm transition-colors">
              <span className="text-gray-600">Size</span>
              <span className="text-gray-400 text-xs">{sizeObj?.name}</span>
            </button>

            {/* Brand style */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 text-sm">
              <span className="text-gray-600">Apply brand style</span>
              <button onClick={() => setApplyBrandStyle(p => !p)}
                className={`relative w-9 h-5 rounded-full transition-all ${applyBrandStyle ? 'bg-violet-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${applyBrandStyle ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Prompt */}
            <div className="px-4 py-3">
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="Describe the image you want (optional)"
                className="w-full text-xs text-gray-600 placeholder:text-gray-400 bg-transparent outline-none resize-none leading-relaxed" rows={3} />
              <div className="h-px bg-gray-200 mt-2" />
            </div>
          </div>

          {/* Generate */}
          <div className="px-3 pb-4">
            <button onClick={handleGenerate} disabled={generating}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: generating ? '#9ca3af' : 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : 'Generate 1 image'}
            </button>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col relative bg-[#f8f8f8]">
          <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 shadow-sm">
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {/* Size picker overlay */}
          {showSizePicker && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm" onClick={() => setShowSizePicker(false)}>
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-96" onClick={e => e.stopPropagation()}>
                <h3 className="font-semibold text-gray-800 mb-4">Choose size</h3>
                <div className="grid grid-cols-3 gap-3">
                  {SIZES.map(s => {
                    const maxDim = 52;
                    const bw = s.w >= s.h ? maxDim : Math.round(maxDim * s.w / s.h);
                    const bh = s.h >= s.w ? maxDim : Math.round(maxDim * s.h / s.w);
                    return (
                      <button key={s.id} onClick={() => { setSelectedSize(s.id); setShowSizePicker(false); }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-colors ${selectedSize === s.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'}`}>
                        <div className="flex items-center justify-center h-16">
                          {s.icon ? (
                            <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-lg">{s.icon}</div>
                          ) : (
                            <div className="border-2 border-gray-300 rounded relative" style={{ width: bw, height: bh }}>
                              {selectedSize === s.id && <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-violet-600 rounded-full flex items-center justify-center"><span className="text-white text-[7px]">✓</span></div>}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-600 text-center leading-tight">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {generatedImages.length === 0 && !generating ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-32 h-32 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center shadow">
                  {uploadedImage
                    ? <img src={uploadedImage} alt="product" className="w-full h-full object-cover" />
                    : <span className="text-5xl">📦</span>
                  }
                </div>
                <div className="text-gray-300 text-3xl">→</div>
                <div className="w-32 h-32 bg-white rounded-2xl shadow flex items-center justify-center overflow-hidden border border-gray-100">
                  <img src={SCENES.find(s => s.id === selectedScene)?.img} alt="scene" className="w-full h-full object-cover opacity-80" />
                </div>
              </div>
              <p className="text-gray-500 text-center text-sm leading-relaxed max-w-xs">
                Create stunning lifestyle images that tell a story and show it in action
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-6">
              {generating && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                    <p className="text-gray-500 text-sm">Generating your product staging…</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {generatedImages.map((url, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden group aspect-square bg-gray-100">
                    <img src={url} alt={`result ${idx + 1}`} className="w-full h-full object-cover" />
                    <button onClick={e => { e.stopPropagation(); setImageMenu(p => p?.idx === idx ? null : { idx, x: e.clientX, y: e.clientY }); }}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-gray-600" />
                    </button>
                    <button onClick={() => handleDownload(url)}
                      className="absolute bottom-2 right-2 bg-white/90 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Download className="w-3 h-3" /> Save
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generatedImages.length > 0 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white rounded-full shadow border border-gray-200 px-2 py-1">
              <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500">−</button>
              <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500">+</button>
            </div>
          )}
        </div>
      </div>

      {/* Image context menu */}
      {imageMenu && (
        <div className="fixed z-[200] bg-white rounded-xl shadow-2xl border border-gray-100 w-48 py-1"
          style={{ top: imageMenu.y, left: imageMenu.x }} onClick={e => e.stopPropagation()}>
          {[
            { label: 'Regenerate', icon: RefreshCw, action: () => { handleGenerate(); setImageMenu(null); } },
            { label: 'Download', icon: Download, action: () => { handleDownload(generatedImages[imageMenu.idx]); setImageMenu(null); } },
            { label: 'Copy link', icon: Copy, action: () => { navigator.clipboard.writeText(generatedImages[imageMenu.idx]); toast.success('Copied!'); setImageMenu(null); } },
            { label: 'Delete', icon: Trash2, red: true, action: () => { setGeneratedImages(p => p.filter((_, i) => i !== imageMenu.idx)); setImageMenu(null); } },
            { label: 'Good result', icon: ThumbsUp, action: () => setImageMenu(null) },
            { label: 'Bad result', icon: ThumbsDown, action: () => setImageMenu(null) },
          ].map(item => (
            <button key={item.label} onClick={() => item.action ? item.action() : setImageMenu(null)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 ${item.red ? 'text-red-500' : 'text-gray-700'}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}