import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/shared";

declare global {
  interface Window {
    google?: any;
  }
}

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export default function GoogleCalendarConnect() {
  const tokenClientRef = useRef<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState("Not connected");

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    if (!clientId) {
      setStatus("Missing VITE_GOOGLE_CLIENT_ID (check Replit Secrets)");
      return;
    }

    const init = () => {
      if (!window.google?.accounts?.oauth2) return;

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp?.access_token) {
            setAccessToken(resp.access_token);
            setStatus("Connected ✅");
          } else {
            setStatus("Failed to get token");
          }
        },
      });

      setStatus("Ready to connect");
    };

    const t = setInterval(() => {
      init();
      if (tokenClientRef.current) clearInterval(t);
    }, 200);

    return () => clearInterval(t);
  }, []);

  const connect = () => {
    setStatus("Requesting permission...");
    tokenClientRef.current?.requestAccessToken({ prompt: "consent" });
  };

  const createTestEvent = async () => {
    if (!accessToken) return;

    setStatus("Creating event...");

    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const event = {
      summary: "StudyPlan - Test Event",
      description: "Created from the app",
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    };

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
      setStatus("Error: " + (await res.text()));
      return;
    }

    setStatus("Event created ✅ (check Google Calendar)");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={connect}>Connect Google Calendar</Button>
      <Button variant="outline" onClick={createTestEvent} disabled={!accessToken}>
        Create test event
      </Button>
      <span className="text-sm text-muted-foreground">{status}</span>
    </div>
  );
}
