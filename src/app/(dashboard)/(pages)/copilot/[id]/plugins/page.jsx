"use client";

/**
 * /copilot/[id]/plugins — the apps and skills a copilot can work with.
 *
 * Header + Add Connector, a Connectors / Skills tab pair, the promo banner, a
 * "Most popular" grid with Browse all, and "Apps connected" beneath it.
 *
 * ⚠️ THIS IS THE SAME SET OF INTEGRATIONS AS /integrations, not a second one.
 * Connect Instagram here or connect it there — one row, one table, both screens
 * show it, and disconnecting on either takes it away from both. Anything else
 * would ask the user to authorise the same account twice and then wonder why
 * their copilot cannot post to a page they already connected.
 *
 * See ../../_components/useBrandIntegrations: it drives the publishing page's
 * own connect engine rather than repeating it.
 *
 * Still UI only: MCP servers, connector requests and skill upload.
 *
 * The connector list is the app's own integrations registry, so a card can only
 * name a platform Creative Klux genuinely has a brand mark for.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Plus, MessageSquarePlus, LayoutGrid, Upload } from "lucide-react";

import {
  useCopilots,
  notifyPending,
  newConversationId,
} from "../../_data/copilots";
import PlatformPageModal from "@/app/(components)/integrations/PlatformPageModal";
import { useBrandIntegrations } from "../../_components/useBrandIntegrations";
import { CREATE_SKILL_PROMPT } from "../../_data/skills";
import { CONNECTORS } from "../../_data/connectors";
import ConnectorCard from "../_components/ConnectorCard";
import ConnectorsModal from "../_components/ConnectorsModal";
import RequestConnectorModal from "../_components/RequestConnectorModal";
import SkillsTab from "../_components/SkillsTab";
import SkillsModal from "../_components/SkillsModal";
import UploadSkillModal from "../_components/UploadSkillModal";
import DropdownMenu from "../../_components/DropdownMenu";

/** Cards under "Most popular", with the rest behind "Browse all". */
const POPULAR = 8;

const TABS = ["Connectors", "Skills"];

export default function CopilotPlugins() {
  const { id } = useParams();
  const router = useRouter();
  const copilot = useCopilots().find((c) => c.id === id);
  const [tab, setTab] = useState("Connectors");
  // ⚠️ ONE value, not a flag per dialog: the connector browser and the request
  // form must never both be open, and the request form REPLACES the browser it
  // was opened from (see RequestConnectorModal). "Add Connector" and "Browse
  // all" both open the browser — one is "I know I want to add something", the
  // other "show me the rest", and they land on the same catalog.
  const [dialog, setDialog] = useState(null); // "connectors" | "request" | "skills" | "upload" | null

  // ⚠️ ONE SET OF INTEGRATIONS, shared with the publishing page — see the hook.
  // Called before the early return below, because hooks cannot be conditional.
  const {
    connectedBy,
    loading: integrationsLoading,
    connectPlatform: connect,
    connectingId,
    disconnect,
    disconnectingId,
    pageModal,
  } = useBrandIntegrations();

  if (!copilot) return null; // the layout owns the "not found" state

  // Every skill action lands in the SAME place: a new conversation with the
  // prompt drafted in the composer. Activating a skill, creating one and "ask
  // the chat" differ only in what they draft, so they differ only in the
  // argument they pass here.
  const openInChat = (prompt) => {
    setDialog(null);
    router.push(
      `/copilot/${copilot.id}?c=${newConversationId()}&task=${encodeURIComponent(prompt)}`,
    );
  };

  const connectPlatform = (platform) => {
    setDialog(null);
    connect(platform.id);
  };

  const popular = CONNECTORS.slice(0, POPULAR);

  /** The catalog rows that are actually connected, for "Apps connected". */
  const connectedApps = CONNECTORS.filter((c) => connectedBy.has(c.id));

  return (
    // Full width, gutters only — no centred column. The connector grid is the
    // point of this screen and the reference runs it edge to edge; capping it
    // at a reading width left two columns of cards stranded in the middle of a
    // wide window. The conversation and Workflows screens keep their max-w for
    // the opposite reason: prose and a single stack of cards.
    <div className="h-full overflow-y-auto px-4 md:px-10 py-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Plugins
          </h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Enhance your Copilot experience by integrating with your favorite
            apps and custom connectors.
          </p>
        </div>
        {/* The header action belongs to the TAB, not the page: on Connectors it
            opens the catalog, on Skills it adds a skill. One button that changed
            only its label would still open the wrong dialog. */}
        {tab === "Connectors" ? (
          <button
            onClick={() => setDialog("connectors")}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-surface hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Connector
          </button>
        ) : (
          <DropdownMenu
            trigger={
              <>
                <Plus className="h-4 w-4" />
                Add Skill
              </>
            }
            triggerClassName="flex shrink-0 items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-surface hover:bg-gray-800 transition-colors cursor-pointer"
            items={[
              {
                label: "Create skill in chat",
                icon: MessageSquarePlus,
                onClick: () => openInChat(CREATE_SKILL_PROMPT),
              },
              {
                label: "Browse skills",
                icon: LayoutGrid,
                onClick: () => setDialog("skills"),
              },
              {
                label: "Upload skill file",
                icon: Upload,
                onClick: () => setDialog("upload"),
              },
            ]}
          />
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      {/* Underline rather than the segmented pill the workflows modal uses:
          two tabs switching the whole page's content are a level of
          navigation, and a pill reads as a filter over one list. */}
      <div className="mt-6 flex items-center gap-6 border-b border-gray-200">
        {TABS.map((name) => {
          const active = tab === name;
          return (
            <button
              key={name}
              onClick={() => setTab(name)}
              aria-pressed={active}
              className={`-mb-px border-b-2 pb-2.5 text-sm transition-colors cursor-pointer ${
                active
                  ? "border-blue-600 text-gray-900 font-semibold"
                  : "border-transparent text-gray-500 font-medium hover:text-gray-900"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {tab === "Connectors" ? (
        <>
          {/* ── Banner ──────────────────────────────────────── */}
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-blue-600 px-6 py-16 text-center">
            <p className="rounded-full bg-blue-500/60 px-5 py-2.5 text-[15px] text-white">
              Connect your copilot to{" "}
              <strong className="font-semibold">social, ads, and more</strong>
            </p>
            <p className="mt-3 text-sm text-blue-100">
              Publishes your designs and reports back on how they did
            </p>
          </div>

          {/* ── Most popular ────────────────────────────────── */}
          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Most popular</h2>
            <button
              onClick={() => setDialog("connectors")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Browse all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {popular.map((platform) => (
              <ConnectorCard
                key={platform.id}
                platform={platform}
                onConnect={() => connectPlatform(platform)}
                connected={connectedBy.get(platform.id)}
                onDisconnect={() =>
                  disconnect(connectedBy.get(platform.id)?.id)
                }
                busy={
                  connectingId === platform.id ||
                  disconnectingId === connectedBy.get(platform.id)?.id
                }
              />
            ))}
          </div>

          {/* ── Apps connected ────────────────────────────────
              The brand's real integrations, the same ones the Integrations page
              lists. Said out loud in the subtitle, because a list of apps on a
              copilot's own screen reads as belonging to that copilot. */}
          <h2 className="mt-10 text-lg font-bold text-gray-900">
            Apps connected
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Connected for your whole brand — every copilot can use these, and
            they are the same apps your Integrations page lists.
          </p>

          {integrationsLoading ? (
            <p className="mt-3 text-sm text-gray-400">Loading…</p>
          ) : connectedApps.length ? (
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {connectedApps.map((platform) => (
                <ConnectorCard
                  key={platform.id}
                  platform={platform}
                  connected={connectedBy.get(platform.id)}
                  onDisconnect={() =>
                    disconnect(connectedBy.get(platform.id)?.id)
                  }
                  busy={disconnectingId === connectedBy.get(platform.id)?.id}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No apps connected yet.</p>
          )}
        </>
      ) : (
        <SkillsTab
          copilot={copilot}
          onOpenInChat={openInChat}
          onBrowseAll={() => setDialog("skills")}
        />
      )}

      <ConnectorsModal
        isOpen={dialog === "connectors"}
        onClose={() => setDialog(null)}
        onRequest={() => setDialog("request")}
        onConnectPlatform={connectPlatform}
        connectedBy={connectedBy}
        onDisconnect={disconnect}
        connectingId={connectingId}
        disconnectingId={disconnectingId}
      />
      <RequestConnectorModal
        isOpen={dialog === "request"}
        onClose={() => setDialog(null)}
      />
      <SkillsModal isOpen={dialog === "skills"} onClose={() => setDialog(null)} />
      <UploadSkillModal
        isOpen={dialog === "upload"}
        onClose={() => setDialog(null)}
        onAskChat={() => openInChat(CREATE_SKILL_PROMPT)}
      />

      {/* Which Facebook Page / ad account to connect. Some platforms resolve to
          several targets, and the engine cannot pick for the user — the same
          modal the Integrations page shows, for the same step. */}
      {pageModal.open && (
        <PlatformPageModal
          pages={pageModal.pages}
          onSelect={pageModal.onSelect}
          onClose={pageModal.onClose}
          loading={pageModal.loadingPageId}
          selectedPageId={null}
        />
      )}
    </div>
  );
}
