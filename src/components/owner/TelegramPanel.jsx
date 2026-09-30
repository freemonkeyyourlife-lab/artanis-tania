import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, RefreshCw, Check, AlertTriangle, UserCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Automatisches Senden über Telegram. Der einzige der drei Kanäle, der von
// außen wirklich Nachrichten schicken darf — über deinen eigenen Bot.
export default function TelegramPanel({ setup, onSave, saving }) {
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(true);
  const [chats, setChats] = useState(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const call = async (payload) => {
    const res = await base44.functions.invoke("telegramBot", payload);
    return res.data || {};
  };

  useEffect(() => {
    (async () => {
      try {
        setStatus(await call({ action: "status" }));
      } catch (e) {
        setStatus({ ok: false, error: "Der Dienst antwortet gerade nicht." });
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const findChats = async () => {
    setBusy("chats");
    setNotice("");
    try {
      const data = await call({ action: "discover" });
      if (!data.ok) {
        setNotice(data.error || "Der Bot antwortet nicht.");
        setChats([]);
      } else {
        setChats(data.chats || []);
        if (!data.chats?.length) {
          setNotice("Noch niemand hat deinem Bot geschrieben. Schreib ihm selbst kurz „Hallo“.");
        }
      }
    } catch (e) {
      setNotice("Abfragen hat nicht geklappt.");
    } finally {
      setBusy("");
    }
  };

  const pick = async (chat) => {
    const done = await onSave({ telegramChatId: chat.chatId });
    if (done) setNotice(`„${chat.name}“ ist jetzt als dein Empfänger gespeichert.`);
  };

  const sendTest = async () => {
    setBusy("test");
    setNotice("");
    try {
      const data = await call({
        action: "send",
        chatId: setup.telegramChatId,
        text: "Test aus ARTANIS × TRIANIA — die Verbindung steht. 🖤",
      });
      setNotice(data.ok ? "Testnachricht ist raus — schau in Telegram." : (data.error || "Senden hat nicht geklappt."));
    } catch (e) {
      setNotice("Senden hat nicht geklappt.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">Automatisch senden — Telegram</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4">
        WhatsApp und Instagram lassen von außen keine Nachrichten in normale Privatchats zu. Telegram
        schon — über einen eigenen Bot. Damit kann die App dir schreiben, wenn etwas passiert, und
        jedem antworten, der deinem Bot schreibt.
      </p>

      {notice && (
        <p className="glass rounded-xl border border-border px-4 py-3 text-[14px] font-bold text-primary mb-4">
          {notice}
        </p>
      )}

      {checking && (
        <p className="text-[15px] font-semibold text-muted-foreground">Verbindung wird geprüft …</p>
      )}

      {!checking && status?.missingKey && (
        <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4">
          <p className="flex items-center gap-2 font-display text-lg text-amber-300 mb-2">
            <AlertTriangle className="w-5 h-5" /> Ein Schritt fehlt noch
          </p>
          <ol className="text-[15px] font-semibold text-foreground space-y-1.5 list-decimal list-inside">
            <li>In Telegram <span className="text-primary">@BotFather</span> anschreiben und <span className="text-primary">/newbot</span> senden.</li>
            <li>Einen Namen vergeben — BotFather antwortet mit einem langen Code.</li>
            <li>Diesen Code unter <span className="text-primary">Einstellungen → Secrets</span> als <span className="text-primary">TELEGRAM_BOT_TOKEN</span> eintragen.</li>
            <li>Dann hier neu laden — der Rest geht von allein.</li>
          </ol>
        </div>
      )}

      {!checking && status?.ok && (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-[15px] font-bold text-emerald-400">
            <Check className="w-4 h-4" /> Verbunden mit @{status.bot?.username || "dein Bot"}
          </p>

          <div>
            <label className="text-[15px] font-bold text-foreground">Name deines Bots</label>
            <Input
              value={setup.telegramBotUsername || ""}
              onChange={(event) => onSave({ telegramBotUsername: event.target.value })}
              placeholder="@dein_bot"
              className="mt-1.5 h-11 max-w-sm text-[15px] font-semibold"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={findChats}
              disabled={busy === "chats"}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground disabled:opacity-50"
            >
              {busy === "chats" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Wer hat dem Bot geschrieben?
            </button>
            {setup.telegramChatId && (
              <button
                onClick={sendTest}
                disabled={busy === "test"}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
              >
                {busy === "test" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Testnachricht an mich
              </button>
            )}
          </div>

          {setup.telegramChatId && (
            <p className="text-[14px] font-semibold text-muted-foreground">
              Dein Empfänger ist gespeichert.
            </p>
          )}

          {chats && chats.length > 0 && (
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.chatId}
                  className="glass rounded-xl border border-border p-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <span className="text-[15px] font-bold text-foreground">
                    {chat.name} {chat.username && <span className="text-muted-foreground">@{chat.username}</span>}
                  </span>
                  <button
                    onClick={() => pick(chat)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[14px] font-bold text-foreground disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" /> Das bin ich
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!checking && status && !status.ok && !status.missingKey && (
        <p className="flex items-center gap-2 text-[15px] font-bold text-destructive">
          <AlertTriangle className="w-4 h-4" /> {status.error || "Der Bot antwortet nicht."}
        </p>
      )}
    </div>
  );
}