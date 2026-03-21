import { useEffect } from "react";
import { useGoogleCalendarStore } from "@/lib/googleCalendarStore";
import { Button } from "@/components/ui/shared";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
} from "lucide-react";

export default function GoogleCalendarConnect() {
  const { status, errorMsg, connect, disconnect } = useGoogleCalendarStore();

  // --- TEMPORARY DEBUG LOGS (safe to remove once verified) ---
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
    const origin = window.location.origin;
    const gsiReady = Boolean(window.google?.accounts?.oauth2);

    console.group("%c[Google Calendar Debug]", "color: #4285F4; font-weight: bold;");
    console.log("Client ID (exact):", clientId || "⚠️ EMPTY — secret not exposed to client");
    console.log("window.location.origin:", origin);
    console.log("Running on Replit deployed domain?", origin === "https://study-wise-central--izannavarroinc.replit.app");
    console.log("GSI window.google.accounts.oauth2 ready:", gsiReady);
    console.log("---");
    console.log("✅ Add BOTH of these as Authorized JavaScript Origins in Google Cloud Console:");
    console.log("   https://study-wise-central--izannavarroinc.replit.app");
    console.log("   " + origin);
    console.groupEnd();
  }, []);

  return (
    <div className="space-y-4">
      {status === "idle" && (
        <Button
          onClick={connect}
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
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            Google Calendar connected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            className="gap-2 text-muted-foreground"
            data-testid="button-google-calendar-disconnect"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
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
            onClick={() => useGoogleCalendarStore.setState({ status: "idle", errorMsg: "" })}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
