import { create } from "zustand";

export type GCalStatus = "idle" | "connecting" | "connected" | "error";

interface GoogleCalendarState {
  status: GCalStatus;
  accessToken: string | null;
  errorMsg: string;
  connect: () => void;
  disconnect: () => void;
  createCalendarEvent: (params: {
    title: string;
    description?: string;
    start: Date;
    end: Date;
  }) => Promise<{ htmlLink: string } | null>;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
            }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export const useGoogleCalendarStore = create<GoogleCalendarState>((set, get) => ({
  status: "idle",
  accessToken: null,
  errorMsg: "",

  connect: () => {
    const origin = window.location.origin;

    console.log("[GCalStore] connect() called, origin:", origin);
    console.log("[GCalStore] client ID present:", Boolean(GOOGLE_CLIENT_ID));
    console.log("[GCalStore] window.google available:", Boolean(window.google?.accounts?.oauth2));

    if (!window.google?.accounts?.oauth2) {
      const msg =
        "Google Identity Services not loaded. Make sure the GSI script is in index.html and the page has fully loaded.";
      console.error("[GCalStore]", msg);
      set({ status: "error", errorMsg: msg });
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      const msg =
        "VITE_GOOGLE_CLIENT_ID is empty. Add it to Replit Secrets with the exact name VITE_GOOGLE_CLIENT_ID.";
      console.error("[GCalStore]", msg);
      set({ status: "error", errorMsg: msg });
      return;
    }

    set({ status: "connecting", errorMsg: "" });

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error || !response.access_token) {
            const msg =
              `OAuth error: ${response.error ?? "no token returned"}. ` +
              `If you see "redirect_uri_mismatch", add "${origin}" to ` +
              `Authorized JavaScript Origins in Google Cloud Console.`;
            console.error("[GCalStore] Token request failed:", msg);
            set({ status: "error", errorMsg: msg });
            return;
          }
          console.log("[GCalStore] Access token received — connected.");
          set({ status: "connected", accessToken: response.access_token, errorMsg: "" });
        },
      });

      tokenClient.requestAccessToken();
    } catch (e: any) {
      console.error("[GCalStore] initTokenClient threw:", e);
      set({ status: "error", errorMsg: e?.message ?? "Unexpected OAuth error." });
    }
  },

  disconnect: () => {
    console.log("[GCalStore] disconnect() called");
    set({ status: "idle", accessToken: null, errorMsg: "" });
  },

  createCalendarEvent: async ({ title, description, start, end }) => {
    const { accessToken } = get();
    if (!accessToken) {
      console.error("[GCalStore] createCalendarEvent called but not connected.");
      return null;
    }

    const event = {
      summary: title,
      description: description ?? "",
      start: { dateTime: start.toISOString(), timeZone: "UTC" },
      end: { dateTime: end.toISOString(), timeZone: "UTC" },
    };

    try {
      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        const msg = err?.error?.message ?? "Failed to create event.";
        console.error("[GCalStore] Calendar API error:", msg);
        set({ status: "error", errorMsg: msg });
        return null;
      }

      const created = await res.json();
      console.log("[GCalStore] Event created:", created.htmlLink);
      return { htmlLink: created.htmlLink ?? "" };
    } catch (e: any) {
      console.error("[GCalStore] createCalendarEvent error:", e);
      set({ status: "error", errorMsg: e?.message ?? "Unknown error creating event." });
      return null;
    }
  },
}));
