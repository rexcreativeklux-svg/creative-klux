"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  ChevronDown,
  Link as LinkIcon,
  Download,
  Copy,
  Folder,
  QrCode,
  Code,
  ChevronLeft,
  Search,
  MoreHorizontal,
  Crown,
  Loader2,
  Check,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import DownloadModal from "./DownloadModal";
import { getPopoverPosition, InstagramIcon } from "./shareOptions";

/**
 * ShareModal — cloned from the Design-Editor reference and wired to
 * creative-klux. This panel replaces the old top-bar Save button, so it owns
 * the real Save action (onSave/saving/dirty), plus a working Copy link and a
 * full Download modal. Cosmetic options mirror the reference.
 */
/**
 * The QR and Embed sub-views share this frame: a positioned card with a back
 * arrow and a title.
 *
 * Declared at module scope, NOT inside ShareModal. A component defined during
 * render is a brand-new type on every render, so React unmounts and remounts the
 * whole subtree each time — which here meant the embed <textarea> lost focus and
 * cursor position, and the card lost its scroll offset, on every keystroke or
 * state change in the modal.
 */
function SubViewShell({ title, position, onBack, children }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[400px] max-h-[85vh] overflow-y-auto z-[100]"
      style={position}
    >
      <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

export default function ShareModal({
  isOpen,
  onClose,
  buttonRef,
  shareUrl,
  canvas,
  elements,
  name,
  onSave,
  saving,
  dirty,
  onPresent,
}) {
  const [showMorePublish, setShowMorePublish] = useState(false);
  const [shareExpanded, setShareExpanded] = useState(true);
  const [saveExpanded, setSaveExpanded] = useState(true);
  const [accessLevel, setAccessLevel] = useState("private");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subView, setSubView] = useState(null); // 'qr' | 'embed' | null
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [embedCopied, setEmbedCopied] = useState(false);

  const link = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
  const embedCode = `<iframe src="${link}" width="800" height="600" frameborder="0" allowfullscreen></iframe>`;

  // Generate the QR code lazily whenever the QR sub-view opens.
  useEffect(() => {
    if (subView !== "qr" || !link) return;
    let alive = true;
    import("qrcode")
      .then((QR) => QR.toDataURL(link, { width: 240, margin: 2 }))
      .then((url) => alive && setQrDataUrl(url))
      .catch(() => alive && toast.error("Could not generate QR code"));
    return () => {
      alive = false;
    };
  }, [subView, link]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleDownloadClick = () => setShowDownloadModal(true);

  const handlePublicViewLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Public view link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handlePresent = () => {
    onPresent?.();
    onClose();
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      toast.success("Embed code copied");
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      toast.error("Could not copy embed code");
    }
  };

  // ── Save action (moved in from the old top-bar button) ──────────────
  const saveContent = saving ? (
    <>
      <Loader2 className="w-5 h-5 animate-spin" /> Saving…
    </>
  ) : dirty ? (
    <>
      <Save className="w-5 h-5" /> Save design
    </>
  ) : (
    <>
      <Check className="w-5 h-5" /> Saved
    </>
  );

  // Main sharing options
  const mainShareOptions = [
    { icon: Download, label: "Download", onClick: handleDownloadClick },
    { icon: QrCode, label: "QR Code", onClick: () => setSubView("qr") },
    { icon: LinkIcon, label: "Public view link", onClick: handlePublicViewLink },
    { icon: Code, label: "Embed", onClick: () => setSubView("embed") },
  ];

  const moreMainOptions = [
    { customIcon: <InstagramIcon className="w-6 h-6 text-white" />, label: "Instagram", onClick: () => console.log("Instagram"), color: "from-purple-500 via-pink-500 to-orange-400" },
    { icon: Crown, label: "Present", onClick: handlePresent, color: "from-orange-500 to-orange-600" },
    { icon: Folder, label: "Move", onClick: () => console.log("Move") },
    { icon: MoreHorizontal, label: "See all", onClick: () => setShowMorePublish(true) },
  ];

  const extendedShareOptions = [
    { icon: Download, label: "Download", onClick: handleDownloadClick },
    { icon: LinkIcon, label: "Public view link", onClick: handlePublicViewLink },
    { icon: Crown, label: "Present", onClick: handlePresent, color: "from-orange-500 to-orange-600" },
    { icon: QrCode, label: "QR Code", onClick: () => setSubView("qr") },
    { icon: Copy, label: "Copy to clipboard", onClick: handleCopyLink },
    { icon: Code, label: "Embed", onClick: () => setSubView("embed") },
    { icon: Copy, label: "Brand Template", onClick: () => console.log("Brand Template"), premium: true },
    { icon: LinkIcon, label: "Template link", onClick: () => console.log("Template link"), premium: true },
    { icon: Folder, label: "Move", onClick: () => console.log("Move") },
  ];

  const saveOptions = [
    { icon: Download, label: "Download", onClick: handleDownloadClick },
    { icon: Save, label: "Save design", onClick: onSave },
  ];

  const filteredShareOptions = extendedShareOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredSaveOptions = saveOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const OptionTile = ({ option, small }) => (
    <button
      onClick={option.onClick}
      className={`flex flex-col items-center gap-2 ${small ? "p-3" : "p-4"} hover:bg-gray-50 rounded-xl transition-colors group relative`}
    >
      {option.customIcon ? (
        <div className={`w-12 h-12 rounded-full ${option.color ? `bg-gradient-to-br ${option.color}` : "bg-gray-100"} flex items-center justify-center group-hover:scale-105 transition-transform`}>
          {option.customIcon}
        </div>
      ) : (
        <div className={`w-12 h-12 rounded-full ${option.color ? `bg-gradient-to-br ${option.color}` : "bg-gray-100"} flex items-center justify-center group-hover:scale-105 transition-transform`}>
          <option.icon className={`w-6 h-6 ${option.color ? "text-white" : "text-gray-700"}`} />
        </div>
      )}
      <span className="text-xs font-medium text-center">{option.label}</span>
      {option.premium && <Crown className="w-3 h-3 text-yellow-500 absolute top-2 right-2" />}
    </button>
  );


  // ── QR Code view ────────────────────────────────────────────────────
  if (subView === "qr") {
    return (
      <SubViewShell
        title="QR Code"
        position={getPopoverPosition(buttonRef)}
        onBack={() => setSubView(null)}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-[240px] h-[240px] flex items-center justify-center border border-gray-200 rounded-xl bg-white">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Design QR code" className="w-[220px] h-[220px]" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            )}
          </div>
          <p className="text-sm text-gray-500 text-center break-all">{link}</p>
          <a
            href={qrDataUrl || undefined}
            download={`${(name || "design").replace(/\s+/g, "-")}-qr.png`}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              qrDataUrl
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-200 text-gray-400 pointer-events-none"
            }`}
          >
            <Download className="w-5 h-5" /> Download QR
          </a>
        </div>
      </SubViewShell>
    );
  }

  // ── Embed view ──────────────────────────────────────────────────────
  if (subView === "embed") {
    return (
      <SubViewShell
        title="Embed"
        position={getPopoverPosition(buttonRef)}
        onBack={() => setSubView(null)}
      >
        <p className="text-sm text-gray-500 mb-3">Paste this code into your website to embed the design.</p>
        <textarea
          readOnly
          value={embedCode}
          onFocus={(e) => e.target.select()}
          className="w-full h-28 p-3 text-sm font-mono border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-gray-300 resize-none"
        />
        <button
          onClick={handleCopyEmbed}
          className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {embedCopied ? <Check className="w-5 h-5" /> : <Code className="w-5 h-5" />}
          {embedCopied ? "Copied!" : "Copy embed code"}
        </button>
      </SubViewShell>
    );
  }

  // ── "More ways to publish" view ─────────────────────────────────────
  if (showMorePublish) {
    return (
      <>
        <div
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[400px] max-h-[85vh] overflow-y-auto z-[100]"
          style={getPopoverPosition(buttonRef)}
        >
          <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMorePublish(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-semibold">More ways to publish</h2>
            </div>
            <button onClick={onClose} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">?</span>
              Need help?
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="How would you like to publish?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share</h3>
              <button onClick={() => setShareExpanded(!shareExpanded)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                {shareExpanded ? "See less" : "See more"}
              </button>
            </div>
            {shareExpanded && (
              <div className="grid grid-cols-4 gap-4">
                {filteredShareOptions.map((option, idx) => (
                  <OptionTile key={idx} option={option} />
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Save</h3>
              <button onClick={() => setSaveExpanded(!saveExpanded)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                {saveExpanded ? "See less" : "See more"}
              </button>
            </div>
            {saveExpanded && (
              <div className="grid grid-cols-4 gap-4">
                {filteredSaveOptions.map((option, idx) => (
                  <OptionTile key={idx} option={option} />
                ))}
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>

        <DownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          buttonRef={buttonRef}
          canvas={canvas}
          elements={elements}
          name={name}
        />
      </>
    );
  }

  // ── Main share view ─────────────────────────────────────────────────
  return (
    <>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[400px] max-h-[85vh] overflow-y-auto z-[100]"
        style={getPopoverPosition(buttonRef)}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Share design</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>0 visitors</span>
            </div>
            {/* Settings gear — hidden until a share-settings screen exists.
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button> */}
          </div>
        </div>

        {/* Save design (replaces old top-bar Save button) */}
        <div className="px-6 pt-4">
          <button
            onClick={onSave}
            disabled={saving || !dirty}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveContent}
          </button>
        </div>

        {/* People with access */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold mb-3">People with access</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Add people"
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500" />
            <button className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors">
              <span className="text-gray-400 text-xl">+</span>
            </button>
          </div>
        </div>

        {/* Access level */}
        <div className="px-6 py-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold mb-3">Access level</h3>
          <button
            onClick={() => setAccessLevel(accessLevel === "private" ? "public" : "private")}
            className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-sm font-medium">
                {accessLevel === "private" ? "Only you can access" : "Anyone with the link"}
              </span>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Copy link */}
        <div className="px-6 py-4">
          <button
            onClick={handleCopyLink}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>

        {/* Create custom link */}
        <div className="px-6 py-3">
          <button className="w-full text-center py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2">
            Create custom link
            <Crown className="w-4 h-4 text-yellow-500" />
          </button>
        </div>

        <div className="border-t border-gray-100" />

        {/* Main share options grid */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-4 gap-3">
            {mainShareOptions.map((option, idx) => (
              <OptionTile key={idx} option={option} small />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3 mt-3">
            {moreMainOptions.map((option, idx) => (
              <OptionTile key={idx} option={option} small />
            ))}
          </div>
        </div>

        <div className="h-4" />
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        buttonRef={buttonRef}
        canvas={canvas}
        elements={elements}
        name={name}
      />
    </>
  );
}
