"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlignHorizontalJustifyCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronRight,
  ClipboardIcon,
  CopyIcon,
  CopyPlus,
  Ellipsis,
  FlipHorizontal2,
  FlipVertical2,
  Group,
  Image as ImageIcon,
  Layers,
  LayoutList,
  LockIcon,
  MoveDown,
  MoveUp,
  Trash2,
  UnlockIcon,
  Ungroup,
} from "lucide-react";
import { PAGE_ALIGNMENTS } from "@/(lib)/design/alignToPage";
import { selectionLayerAbility } from "@/(lib)/design/stacking";

/**
 * EditorElementMenu — the floating action pill for the current selection, and
 * the "…" menu behind it.
 *
 * ── One component for one element and for many ────────────────────────────
 *
 * A single element and a multi-selection get the same pill, because they want
 * the same things done to them: the only differences are which buttons make
 * sense (flip is per-image; group needs several; ungroup needs a group) and
 * those are decided from the selection itself, not by having two components
 * drift apart. SelectionChrome positions it under one element, SelectionOverlay
 * under the union box — placement is the caller's job, contents are this one's.
 *
 * ── The shortcuts printed in the menu are real ────────────────────────────
 *
 * Every combination shown next to a row is bound in DesignEditor's keydown
 * handler, so the menu doubles as the place you learn them and then stop
 * needing it. A printed shortcut that does nothing is worse than no shortcut
 * at all — if you remove a binding there, remove its label here.
 *
 * Anything that can't be done to this selection (paste with nothing copied,
 * delete on a locked element) is DISABLED rather than hidden, so the menu
 * doesn't reshuffle under the pointer between two visits.
 */

// Read once at module scope: this only renders on the client, so there's no
// server pass to desync from.
const IS_MAC =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
const MOD = IS_MAC ? "⌘" : "Ctrl";
const ALT = IS_MAC ? "⌥" : "Alt";

/**
 * Everything the menu needs to know about a selection, in one place.
 *
 * Shared by the pill and by the right-click menu so the two can't drift into
 * disagreeing about what is possible — a menu that offers Group where the pill
 * greys it out is worse than either behaviour on its own.
 */
export function selectionMenuModel(elements, stack = []) {
  const element = elements[0];
  const many = elements.length > 1;
  const isImage = !many && element?.type === "image";
  return {
    element,
    many,
    isGroup: element?.type === "group",
    isImage,
    anyLocked: elements.some((el) => el.locked),
    allLocked: elements.every((el) => el.locked),
    // Only a single image can become the page background — "set these four as
    // the background" has no meaning, and neither does it for text or a shape.
    canSetBackground: isImage && Boolean(element.src),
    // What a layer move would actually achieve here. Shared with the Position
    // panel's Arrange buttons (see stacking.js) so the same element never reads
    // as movable in one place and stuck in the other. A group MEMBER is not in
    // the stack at all, so this comes back all-false and the whole submenu greys
    // out — which is right: a child stacks among its siblings, not the page.
    layer: selectionLayerAbility(stack, elements),
  };
}

export default function EditorElementMenu({
  zoom = 1,
  elements = [],
  stack = [],
  canPaste = false,
  onCopy,
  onPaste,
  onDuplicate,
  onRemove,
  onMoveLayer,
  onToggleLock,
  onGroup,
  onUngroup,
  onAlign,
  onSetAsBackground,
  onShowLayers,
  onFlip,
}) {
  const [menu, setMenu] = useState(false);
  const rootRef = useRef(null);

  // Click-away and Escape both close it. The listener is on the whole document
  // because the pill lives in a pointer-inert overlay layer — there is no
  // backdrop element to hang it off.
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setMenu(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  if (!elements.length) return null;

  const { element, many, isGroup, isImage, anyLocked, allLocked, canSetBackground, layer } =
    selectionMenuModel(elements, stack);

  // Buttons must not start a drag on whatever sits under the pill, nor bubble a
  // fresh selection that would replace the one they act on.
  const stop = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const act = (fn) => (e) => {
    stop(e);
    fn?.();
  };
  // Menu rows close the menu on the way out; the pill's own buttons don't.
  const run = (fn) => (e) => {
    stop(e);
    fn?.();
    setMenu(false);
  };

  return (
    <div
      ref={rootRef}
      onMouseDown={stop}
      className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-surface px-1 py-1 shadow-lg"
    >
      {many && (
        <>
          <span className="ml-1 mr-0.5 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600 whitespace-nowrap">
            {elements.length} selected
          </span>
          <Divider />
        </>
      )}

      {/* Group / Ungroup, spelled out rather than left as an icon among icons.
          It is the reason most multi-selections are made, and the one action
          here with no obvious picture — an icon for it is a guess every time.
          Buried in the "…" menu it was effectively missing. */}
      {many && !isGroup && (
        <>
          <TextBtn
            title={anyLocked ? "Locked elements can't be grouped" : `Group (${MOD}+G)`}
            onClick={act(onGroup)}
            disabled={anyLocked}
          >
            Group
          </TextBtn>
          <Divider />
        </>
      )}
      {isGroup && !many && (
        <>
          <TextBtn
            title={`Ungroup (${MOD}+Shift+G)`}
            onClick={act(onUngroup)}
            disabled={element.locked}
          >
            Ungroup
          </TextBtn>
          <Divider />
        </>
      )}

      {/* Flip — the one pair that is about the picture rather than the box, so
          it only appears for a single image. */}
      {isImage && !anyLocked && (
        <>
          <Btn
            title="Flip horizontal"
            active={Boolean(element.flipH)}
            onClick={act(() => onFlip?.("flipH"))}
          >
            <FlipHorizontal2 className="h-4 w-4" />
          </Btn>
          <Btn
            title="Flip vertical"
            active={Boolean(element.flipV)}
            onClick={act(() => onFlip?.("flipV"))}
          >
            <FlipVertical2 className="h-4 w-4" />
          </Btn>
          <Divider />
        </>
      )}

      <Btn
        title={anyLocked ? `Unlock (${ALT}+Shift+L)` : `Lock (${ALT}+Shift+L)`}
        onClick={act(onToggleLock)}
      >
        {anyLocked ? <LockIcon className="h-4 w-4" /> : <UnlockIcon className="h-4 w-4" />}
      </Btn>

      <Btn
        title={`Duplicate (${MOD}+D)`}
        onClick={act(onDuplicate)}
        disabled={allLocked}
      >
        <CopyPlus className="h-4 w-4" />
      </Btn>

      <Divider />

      <Btn title={`Copy (${MOD}+C)`} onClick={act(onCopy)}>
        <CopyIcon className="h-4 w-4" />
      </Btn>
      <Btn title={`Paste (${MOD}+V)`} onClick={act(onPaste)} disabled={!canPaste}>
        <ClipboardIcon className="h-4 w-4" />
      </Btn>

      <Btn
        title={allLocked ? "Can't delete a locked element" : "Delete"}
        danger
        onClick={act(onRemove)}
        disabled={allLocked}
      >
        <Trash2 className="h-4 w-4" />
      </Btn>

      {/* Everything else. Shown for locked and multi-selections too: those
          still need Copy, Unlock and Align. */}
      <div className="relative">
        <Btn title="More" active={menu} onClick={act(() => setMenu((m) => !m))}>
          <Ellipsis className="h-4 w-4" />
        </Btn>

        {menu && (
          <Dropdown
            zoom={zoom}
            elements={elements}
            many={many}
            isGroup={isGroup}
            anyLocked={anyLocked}
            allLocked={allLocked}
            layer={layer}
            canPaste={canPaste}
            canSetBackground={canSetBackground}
            run={run}
            onCopy={onCopy}
            onPaste={onPaste}
            onDuplicate={onDuplicate}
            onRemove={onRemove}
            onMoveLayer={onMoveLayer}
            onToggleLock={onToggleLock}
            onGroup={onGroup}
            onUngroup={onUngroup}
            onAlign={onAlign}
            onSetAsBackground={onSetAsBackground}
            onShowLayers={onShowLayers}
          />
        )}
      </div>
    </div>
  );
}

function Dropdown({
  placement = "absolute right-0 top-full z-50 mt-1",
  style,
  elements,
  many,
  isGroup,
  anyLocked,
  allLocked,
  layer,
  canPaste,
  canSetBackground,
  run,
  onCopy,
  onPaste,
  onDuplicate,
  onRemove,
  onMoveLayer,
  onToggleLock,
  onGroup,
  onUngroup,
  onAlign,
  onSetAsBackground,
  onShowLayers,
}) {
  const [submenu, setSubmenu] = useState(null); // 'layer' | 'align' | null

  return (
    <div
      // Placement is the caller's: right-aligned under the "…" button for the
      // pill, pinned to the pointer for the right-click menu. The pill is
      // already counter-scaled by its container, so this needs none of its own.
      className={`${placement} w-60 rounded-xl border border-gray-100 bg-surface p-1.5 shadow-2xl`}
      style={style}
    >
      <Item icon={CopyIcon} label="Copy" shortcut={`${MOD}+C`} onClick={run(onCopy)} />
      <Item
        icon={ClipboardIcon}
        label="Paste"
        shortcut={`${MOD}+V`}
        disabled={!canPaste}
        onClick={run(onPaste)}
      />
      <Item
        icon={CopyPlus}
        label="Duplicate"
        shortcut={`${MOD}+D`}
        disabled={allLocked}
        onClick={run(onDuplicate)}
      />
      <Item
        icon={Trash2}
        label="Delete"
        shortcut="Delete"
        disabled={allLocked}
        onClick={run(onRemove)}
      />

      {canSetBackground && (
        <>
          <Separator />
          <Item
            icon={ImageIcon}
            label="Set as background"
            onClick={run(onSetAsBackground)}
          />
        </>
      )}

      <Separator />

      <SubmenuItem
        icon={Layers}
        label="Layer"
        open={submenu === "layer"}
        onOpen={() => setSubmenu("layer")}
        onCloseSub={() => setSubmenu(null)}
      >
        <Item
          icon={ArrowUpToLine}
          label="Bring to front"
          shortcut={`${MOD}+Shift+]`}
          disabled={allLocked || !layer.canMoveUp}
          onClick={run(() => onMoveLayer?.("front"))}
        />
        <Item
          icon={MoveUp}
          label="Bring forward"
          shortcut={`${MOD}+]`}
          disabled={allLocked || !layer.canMoveUp}
          onClick={run(() => onMoveLayer?.("forward"))}
        />
        <Item
          icon={MoveDown}
          label="Send backward"
          shortcut={`${MOD}+[`}
          disabled={allLocked || !layer.canMoveDown}
          onClick={run(() => onMoveLayer?.("backward"))}
        />
        <Item
          icon={ArrowDownToLine}
          label="Send to back"
          shortcut={`${MOD}+Shift+[`}
          disabled={allLocked || !layer.canMoveDown}
          onClick={run(() => onMoveLayer?.("back"))}
        />
        {/* Said out loud rather than left for the user to discover by pressing
            all four: an element that touches nothing looks identical at every
            position in the stack, so the moves are real but invisible. */}
        {!layer.hasOverlap && (layer.canMoveUp || layer.canMoveDown) && (
          <p className="px-2 py-1 text-[10px] leading-relaxed text-gray-400">
            Nothing overlaps this — moving it won&apos;t change the page.
          </p>
        )}
        <Separator />
        {/* The way out when four buttons aren't enough — the whole stack, in
            order. Same panel the rail's Layers tab opens. */}
        <Item icon={LayoutList} label="Show layers" onClick={run(onShowLayers)} />
      </SubmenuItem>

      <SubmenuItem
        icon={AlignHorizontalJustifyCenter}
        label="Align to page"
        open={submenu === "align"}
        onOpen={() => setSubmenu("align")}
        onCloseSub={() => setSubmenu(null)}
      >
        {PAGE_ALIGNMENTS.map((a) => (
          <Item
            key={a.key}
            label={a.label}
            disabled={allLocked}
            onClick={run(() => onAlign?.(a.key))}
          />
        ))}
      </SubmenuItem>

      <Separator />

      {many && !isGroup && (
        <Item
          icon={Group}
          label="Group"
          shortcut={`${MOD}+G`}
          disabled={anyLocked}
          onClick={run(onGroup)}
        />
      )}
      {isGroup && (
        <Item
          icon={Ungroup}
          label="Ungroup"
          shortcut={`${MOD}+Shift+G`}
          disabled={elements[0]?.locked}
          onClick={run(onUngroup)}
        />
      )}
      <Item
        icon={anyLocked ? UnlockIcon : LockIcon}
        label={anyLocked ? "Unlock" : "Lock"}
        shortcut={`${ALT}+Shift+L`}
        onClick={run(onToggleLock)}
      />
    </div>
  );
}

function Btn({ children, onClick, title, active, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-blue-50 text-blue-600"
          : danger
            ? "text-gray-500 hover:bg-red-50 hover:text-red-600"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

/** A pill button that is a word rather than a picture. */
function TextBtn({ children, onClick, title, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex h-8 items-center rounded-lg px-2.5 text-[13px] font-medium text-gray-700 transition
                 cursor-pointer hover:bg-gray-100 hover:text-gray-900
                 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function Item({ icon: Icon, label, shortcut, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-gray-700 transition-colors hover:bg-gray-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      {/* The blank keeps labels in one column whether or not a row has an icon
          — the alignment submenu's rows don't. */}
      {Icon ? (
        <Icon className="h-[15px] w-[15px] shrink-0 text-gray-400" />
      ) : (
        <span className="w-[15px]" />
      )}
      <span className="flex-1 truncate">{label}</span>
      {shortcut && <span className="text-[11px] text-gray-400">{shortcut}</span>}
    </button>
  );
}

/** A row that reveals a nested panel to its right while hovered. */
function SubmenuItem({ icon: Icon, label, open, onOpen, onCloseSub, children }) {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onCloseSub}>
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-gray-700 transition-colors hover:bg-gray-100 cursor-pointer"
      >
        <Icon className="h-[15px] w-[15px] shrink-0 text-gray-400" />
        <span className="flex-1 truncate">{label}</span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open && (
        // Opens leftward: the pill is centred on the selection and this menu is
        // already at its right edge, so a submenu to the right would run off
        // the stage on anything past the middle of the artboard. -mr-1 overlaps
        // the parent by a pixel so the pointer never crosses a gap on its way
        // in, which would close the submenu it is travelling to.
        <div className="absolute right-full top-0 -mr-1 z-50 w-52 rounded-xl border border-gray-100 bg-surface p-1.5 shadow-2xl">
          {children}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-gray-200" />;
}

function Separator() {
  return <div className="my-1 border-t border-gray-100" />;
}

/** Roughly the dropdown's size, for keeping it on screen. w-60 plus padding. */
const MENU_W = 240;
const MENU_H = 380;

/**
 * EditorContextMenu — the pill's "…" menu, opened by right-clicking a selection.
 *
 * The same Dropdown, the same model, the same handlers: right-click is a second
 * doorway to the actions, not a second set of them. Anything added to the menu
 * shows up in both places without being wired twice.
 *
 * Positioned `fixed` in viewport coordinates because a contextmenu event gives
 * client coordinates and nothing else — it does not need to know where the
 * stage is or how far it is zoomed, which is what makes it usable from anywhere.
 *
 * Props: { x, y, elements, stack, onClose, ...the same actions as the pill }
 */
export function EditorContextMenu({ x, y, elements = [], stack = [], onClose, ...actions }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) onClose?.();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    // Capture, so a click that opens something else still closes this first.
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey);
    // Scrolling or zooming the stage would leave the menu pointing at nothing.
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  if (!elements.length) return null;

  const model = selectionMenuModel(elements, stack);

  // Flipped back on screen rather than clamped: a menu shoved left to fit would
  // sit over the thing that was right-clicked.
  const left =
    typeof window !== "undefined" && x + MENU_W > window.innerWidth
      ? Math.max(8, x - MENU_W)
      : x;
  const top =
    typeof window !== "undefined" && y + MENU_H > window.innerHeight
      ? Math.max(8, window.innerHeight - MENU_H - 8)
      : y;

  const run = (fn) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    fn?.();
    onClose?.();
  };

  return (
    <div ref={rootRef} onContextMenu={(e) => e.preventDefault()}>
      <Dropdown
        placement="fixed z-[9999]"
        style={{ left, top }}
        elements={elements}
        {...model}
        run={run}
        {...actions}
      />
    </div>
  );
}
