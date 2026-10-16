"use client";

import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import { api } from "./api";

// In production nginx carries /api/ws to the backend on the page's own
// origin. `next dev` can't proxy a WebSocket through its rewrite, so local
// dev points NEXT_PUBLIC_WS_URL straight at the backend instead
// (ws://localhost:8080/api/ws).
function socketUrl() {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${window.location.host}/api/ws`;
}

// Calls onMessage with each push to `topic`, and onConnect every time the
// socket (re)connects, so callers can refetch anything sent while it was
// down. Returns whether the socket is currently up.
export function useLiveTopic(topic, { onMessage, onConnect }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!topic) return undefined;
    const client = new Client({
      brokerURL: socketUrl(),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(topic, (frame) => onMessage?.(JSON.parse(frame.body)));
        onConnect?.();
      },
      onWebSocketClose: () => setConnected(false),
    });
    client.activate();
    return () => {
      client.deactivate();
    };
    // Callers pass fresh closures each render; only a new topic should
    // tear the socket down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  return connected;
}

// One stall's live queue (QueueSnapshot on the backend): slot fill levels
// plus each unfinished order's place in line. Starts from `initial` when the
// server already rendered it, loads it over HTTP otherwise.
export function useStallQueue(stallId, initial = null) {
  const [snapshot, setSnapshot] = useState(initial);

  const refetch = () => {
    api(`/api/stalls/${stallId}/queue`).then(setSnapshot, () => {});
  };

  const connected = useLiveTopic(stallId ? `/topic/stalls/${stallId}/queue` : null, {
    onMessage: setSnapshot,
    onConnect: refetch,
  });

  return { snapshot, connected };
}

export function LiveIndicator({ connected }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${connected ? "text-[#3f6b3a]" : "text-gray-400"}`}>
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-[#3f6b3a]" : "bg-gray-300"}`} />
      {connected ? "Live" : "Reconnecting…"}
    </span>
  );
}
