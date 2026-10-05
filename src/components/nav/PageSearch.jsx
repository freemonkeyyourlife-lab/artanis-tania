import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { MODULE_TYPES } from "@/lib/modules";
import { isRestricted } from "@/lib/accessTiers";

// Die Seitensuche: Namen eintippen, Enter, da. Strg+K öffnet sie von überall.
// Admin-Seiten (z. B. Logbuch) sieht nur der Besitzer.
export default function PageSearch({ isOwner }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pages = MODULE_TYPES.filter((m) => isOwner || !isRestricted(m.path));
  const go = (path) => { setOpen(false); navigate(path); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Seite suchen (Strg+K)"
        className="w-9 h-9 rounded-full glass-btn flex items-center justify-center hover:text-primary transition-colors"
      >
        <Search className="w-4 h-4" />
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Seite suchen … z. B. Logbuch" />
        <CommandList>
          <CommandEmpty>Keine Seite gefunden.</CommandEmpty>
          <CommandGroup heading="Seiten">
            {pages.map((m) => (
              <CommandItem key={m.path} value={`${m.label} ${m.description} ${m.path}`} onSelect={() => go(m.path)}>
                <div className="flex flex-col">
                  <span className="font-bold">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.description}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}