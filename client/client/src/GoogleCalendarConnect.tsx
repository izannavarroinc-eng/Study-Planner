import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/shared";

declare global {
  interface Window {
    google?: any;
  }
}

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

const SCOPES = "https://www.googleapis.com/auth/calendar.events";

export default function GoogleCalendarConnect() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const tokenClientRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Not connected");

  // Espera a que cargue el script de Google (gsi/client) que está en index.html
  useEffect(() => {
    let tries = 0;
    const maxTries = 50; // ~5s si interval = 100ms

    const interval = setInterval(() => {
      tries++;

      const ok = !!window.google?.accounts?.oauth2;
      if (ok) {
        clearInterval(interval);
        setReady(true);
      }

      if (tries >= maxTries) {
        clearInterval(interval);
        setReady(false);
        setStatus("Google script not loaded. Check index.html script tag.");
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const initClient = () => {
    if (!clientId) {
      setStatus("Missing VITE_GOOGLE_CLIENT_ID (Replit Secrets)");
      return false;
    }
    if (!window.google?.accounts?.oauth2) {
      setStatus("Google OAuth library not ready yet.");
      return false;
    }

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp: TokenResponse) => {
        if (resp.error) {
          setStatus(
            `Auth error: ${resp.error} ${resp.error_description ?? ""}`.trim()
          );
          return;
        }
        if (!resp.access_token) {
          setStatus("No access_token returned by Google.");
          return;
        }
        setAccessToken(resp.access_token);
        setStatus(`Connected ✅ (expires in ~${resp.expires_in ?? "?"}s)`);
      },
    });

    return true;
  };

  const connect = () => {
    if (!tokenClientRef.current) {
      const ok = initClient();
      if (!ok) return;
    }
    setStatus("Opening Google consent...");
    tokenClientRef.current.requestAccessToken({ prompt: "consent" });
  };

  const createTestEvent = async () => {
    if (!accessToken) {
      setStatus("Connect first (no token).");
      return;
    }

    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60 * 1000); // +5 min
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 min

    const body = {
      summary: "Study Planner test event",
      description: "Created from Study Planner",
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    };

    try {
      setStatus("Creating test event...");

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus(`Event failed: ${res.status} ${JSON.stringify(data)}`);
        return;
      }

      setStatus(`Event created ✅ id=${data.id}`);
    } catch (err: any) {
      setStatus(`Network error: ${err?.message ?? String(err)}`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">{status}</div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={connect} disabled={!ready}>
          Connect Google Calendar
        </Button>

        <Button
          variant="outline"
          onClick={createTestEvent}
          disabled={!accessToken}
        >
          Create test event
        </Button>
      </div>

      {!clientId && (
        <div className="text-xs text-destructive">
          Missing <code>VITE_GOOGLE_CLIENT_ID</code> in Replit Secrets.
        </div>
      )}
    </div>
  );
}
