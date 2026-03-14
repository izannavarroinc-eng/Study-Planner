import { useState, useCallback } from "react";
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

  const handleConnect = useCallback(() => {
    if (!window.google?.accounts?.oauth2) {
      setErrorMsg(
        "Google Identity Services not loaded. Make sure the GSI script is in your HTML."
      );
      setStatus("error");
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      setErrorMsg(
        "No VITE_GOOGLE_CLIENT_ID env variable set. Add it to your Replit secrets."
      );
      setStatus("error");
      return;
    }

    setStatus("connecting");
    setErrorMsg("");

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          setErrorMsg(response.error);
          setStatus("error");
          return;
        }
        setAccessToken(response.access_token);
        setStatus("connected");
      },
    });

    tokenClient.requestAccessToken();
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
        throw new Error(err?.error?.message ?? "Failed to create event.");
      }

      const created = await res.json();
      setEventLink(created.htmlLink ?? "");
      setStatus("created");
    } catch (e: any) {
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
