"use client";

/**
 * UploadSkillModal — "Upload skill file" from the Add Skill menu.
 *
 * A drop zone, the file requirements, and a line pointing at how to write one.
 *
 * ⚠️ THE FILE NEVER LEAVES THE BROWSER. There is no endpoint to send it to yet,
 * so the picker and the drag-and-drop are real (they have to be, or the zone is
 * a picture of a control) and the upload itself reports that the backend owes us
 * one. The chosen file's name is echoed back so the user can see the drop landed
 * rather than wondering whether they missed.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} props.onAskChat  "ask the chat" — opens the conversation.
 */

import { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import { notifyPending } from "../../_data/copilots";

/** What the zone accepts, matching the requirements listed beneath it. */
const ACCEPT = ".zip,.skill";

export default function UploadSkillModal({ isOpen, onClose, onAskChat }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const take = (chosen) => {
    if (!chosen) return;
    setFile(chosen);
    notifyPending("Uploading a skill");
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload skill"
      size="xl"
    >
      {/* ⚠️ preventDefault on dragOver as well as drop — without it the browser
          navigates to the dropped file and the page is simply gone. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-blue-600 bg-blue-50"
            : "border-gray-300 bg-gray-100 hover:border-gray-400"
        }`}
      >
        <FileText className="h-6 w-6 text-gray-400" />
        {file ? (
          <span className="flex items-center gap-2 text-sm text-gray-900">
            {file.name}
            <button
              onClick={(e) => {
                e.stopPropagation(); // or the zone reopens the picker behind us
                setFile(null);
              }}
              aria-label="Remove file"
              className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : (
          <span className="text-sm text-gray-500">
            Drag and drop or click to upload
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => take(e.target.files?.[0])}
        />
      </div>

      <p className="mt-6 text-sm font-semibold text-gray-900">
        File requirements
      </p>
      <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-relaxed text-gray-500">
        <li>
          A <code className="font-mono text-gray-900">.zip</code> or{" "}
          <code className="font-mono text-gray-900">.skill</code> file with a{" "}
          <code className="font-mono text-gray-900">SKILL.md</code> at the root
          level
        </li>
        <li>
          <code className="font-mono text-gray-900">SKILL.md</code> starts with
          YAML frontmatter declaring the name and description, followed by the
          skill instructions in markdown
        </li>
      </ul>

      <p className="mt-5 text-[13px] text-gray-500">
        Read more about{" "}
        <button
          onClick={() => notifyPending("The skill-authoring guide")}
          className="font-medium text-gray-900 underline underline-offset-2 hover:text-blue-600 transition-colors cursor-pointer"
        >
          creating skills
        </button>{" "}
        or{" "}
        <button
          onClick={onAskChat}
          className="font-medium text-gray-900 underline underline-offset-2 hover:text-blue-600 transition-colors cursor-pointer"
        >
          ask the chat
        </button>
        .
      </p>
    </ResponsiveModal>
  );
}
