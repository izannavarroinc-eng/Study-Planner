import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/shared";

declare global {
  interface Window {
    google?: any;
  }
}

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export default function GoogleCalendarConnect() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const tokenClientRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState("Not connected");

  useEffect(() => {
    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);
        setReady(true);
      }
      if (tries >= 50) {
        clearInterval(interval);
        setStatus("Google script not loaded");
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const initClient = () => {
    if (!clientId) {
      setStatus("Missing VITE_GOOGLE_CLIENT_ID in Secrets");
      return false;
    }

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error) {
          setStatus("Auth error: " + resp.error);
          return;
        }
        setAccessToken(resp.access_token);
        setStatus("Connected ✅");
      },
    });

    return true;
  };

  const connect = () => {
    if (!tokenClientRef.current && !initClient()) return;
    tokenClientRef.current.requestAccessToken({ prompt: "consent" });
  };

  const createTestEvent = async () => {
    if (!accessToken) return;

    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const event = {
      summary: "Study Planner Test Event",
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
      setStatus("Error creating event");
      return;
    }

    setStatus("Event created ✅ Check Google Calendar");
  };

  return (
    <div className="space-y-2">
      <div className="text-sm">{status}</div>
      <Button onClick={connect} disabled={!ready}>
        Connect Google Calendar
      </Button>
      <Button onClick={createTestEvent} disabled={!accessToken}>
        Create test event
      </Button>
    </div>
  );
}
