import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/shared";
import { Calendar, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse & { error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export default function GoogleCalendarConnect() {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "creating" | "created" | "error"
  >("idle");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [eventLink, setEventLink] = useState<string>("");

  // --- DEBUG: log diagnostics on mount ---
  useEffect(() => {
    const origin = window.location.origin;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

    console.log("[GoogleCalendarConnect] window.location.origin:", origin);
    console.log(
      "[GoogleCalendarConnect] VITE_GOOGLE_CLIENT_ID loaded:",
      clientId ? `${clientId.slice(0, 12)}…` : "EMPTY — secret not exposed to client"
    );
    console.log(
      "[GoogleCalendarConnect] window.google available:",
      Boolean(window.google?.accounts?.oauth2)
    );

    if (!clientId) {
      console.warn(
        "[GoogleCalendarConnect] VITE_GOOGLE_CLIENT_ID is empty. " +
        "Make sure the secret is named exactly VITE_GOOGLE_CLIENT_ID (prefix required for Vite)."
      );
    }

    if (!window.google?.accounts?.oauth2) {
      console.warn(
        "[GoogleCalendarConnect] window.google.accounts.oauth2 is not available yet. " +
        "The GSI script may still be loading (it has async defer)."
      );
    }

    console.log(
      "[GoogleCalendarConnect] Add BOTH of these as Authorized JavaScript Origins " +
      "in Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client ID:\n" +
      "  https://study-wise-central--izannavarroinc.replit.app\n" +
      "  https://2b93295f-8efc-44a1-924a-ef90a3c4939e-00-2y7znyrhk2yn.kirk.replit.dev\n" +
      "  (and your current origin: " + origin + ")"
    );
  }, []);

  const handleConnect = useCallback(() => {
    const origin = window.location.origin;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

    // --- DEBUG: pre-flight checks ---
    console.log("[GoogleCalendarConnect] handleConnect called");
    console.log("[GoogleCalendarConnect] origin at click time:", origin);
    console.log(
      "[GoogleCalendarConnect] client ID at click time:",
      clientId ? `${clientId.slice(0, 12)}…` : "EMPTY"
    );
    console.log(
      "[GoogleCalendarConnect] window.google.accounts.oauth2:",
      Boolean(window.google?.accounts?.oauth2)
    );

    if (!window.google?.accounts?.oauth2) {
      const msg =
        "Google Identity Services script not loaded. " +
        "Check that <script src=\"https://accounts.google.com/gsi/client\" async defer></script> " +
        "is in index.html and the page has fully loaded.";
      console.error("[GoogleCalendarConnect]", msg);
      setErrorMsg(msg);
      setStatus("error");
      return;
    }

    if (!clientId) {
      const msg =
        "VITE_GOOGLE_CLIENT_ID is empty. " +
        "Add it to Replit Secrets with the exact name VITE_GOOGLE_CLIENT_ID (the VITE_ prefix is required).";
      console.error("[GoogleCalendarConnect]", msg);
      setErrorMsg(msg);
      setStatus("error");
      return;
    }

    setStatus("connecting");
    setErrorMsg("");

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            console.error("[GoogleCalendarConnect] Token request failed:", response.error);
            console.error(
              "[GoogleCalendarConnect] If the error is 'redirect_uri_mismatch' or 'origin mismatch', " +
              "you must add the following to Authorized JavaScript Origins in Google Cloud Console:\n" +
              "  " + window.location.origin
            );
            setErrorMsg(
              `OAuth error: ${response.error}. ` +
              `If you see "redirect_uri_mismatch", add "${window.location.origin}" ` +
              `to Authorized JavaScript Origins in Google Cloud Console.`
            );
            setStatus("error");
            return;
          }
          console.log("[GoogleCalendarConnect] Access token received successfully.");
          setAccessToken(response.access_token);
          setStatus("connected");
        },
      });

      console.log("[GoogleCalendarConnect] Calling requestAccessToken()…");
      tokenClient.requestAccessToken();
    } catch (e: any) {
      console.error("[GoogleCalendarConnect] initTokenClient threw:", e);
      setErrorMsg(e?.message ?? "Unexpected error initialising OAuth client.");
      setStatus("error");
    }
  }, []);

  const handleCreateTestEvent = useCallback(async () => {
    if (!accessToken) return;

    setStatus("creating");
    setErrorMsg("");

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const event = {
      summary: "Study Planner – Test Event",
      description: "Created from the Study Planner app.",
      start: { dateTime: now.toISOString(), timeZone: "UTC" },
      end: { dateTime: oneHourLater.toISOString(), timeZone: "UTC" },
    };

    try {
      console.log("[GoogleCalendarConnect] Creating calendar event…");
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
        console.error("[GoogleCalendarConnect] Calendar API error:", err);
        throw new Error(err?.error?.message ?? "Failed to create event.");
      }

      const created = await res.json();
      console.log("[GoogleCalendarConnect] Event created:", created.htmlLink);
      setEventLink(created.htmlLink ?? "");
      setStatus("created");
    } catch (e: any) {
      console.error("[GoogleCalendarConnect] handleCreateTestEvent error:", e);
      setErrorMsg(e.message ?? "Unknown error");
      setStatus("error");
    }
  }, [accessToken]);

  return (
    <div className="space-y-4">
      {status === "idle" && (
        <Button
          onClick={handleConnect}
          variant="outline"
          className="gap-2"
          data-testid="button-google-calendar-connect"
        >
          <Calendar className="w-4 h-4" />
          Connect Google Calendar
        </Button>
      )}

      {status === "connecting" && (
        <Button disabled variant="outline" className="gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting…
        </Button>
      )}

      {status === "connected" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            Google Calendar connected
          </div>
          <Button
            onClick={handleCreateTestEvent}
            className="gap-2"
            data-testid="button-create-test-event"
          >
            <Calendar className="w-4 h-4" />
            Create test event
          </Button>
        </div>
      )}

      {status === "creating" && (
        <Button disabled className="gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Creating event…
        </Button>
      )}

      {status === "created" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            Event created successfully!
          </div>
          {eventLink && (
            <a
              href={eventLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              data-testid="link-google-calendar-event"
            >
              <ExternalLink className="w-4 h-4" /> View in Google Calendar
            </a>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setStatus("connected");
              setEventLink("");
            }}
            className="gap-2"
          >
            <Calendar className="w-4 h-4" />
            Create another event
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setStatus("idle");
              setErrorMsg("");
            }}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
