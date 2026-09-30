import React from "react";
import { MessageCircle, Send, Camera, Pencil, Trash2 } from "lucide-react";
import { linksForContact } from "@/lib/channels";

const ICONS = {
  whatsapp: MessageCircle,
  telegram: Send,
  instagram: Camera,
};

// Jeder Kontakt mit einem Tipp in den echten Chat — WhatsApp, Telegram oder
// Instagram öffnen sich direkt mit dieser Person.
export default function ChannelContactList({ contacts, onEdit, onDelete }) {
  if (!contacts.length) {
    return (
      <div className="glass rounded-2xl border-2 border-border p-8 text-center">
        <p className="text-[15px] font-semibold text-muted-foreground">
          Noch niemand drin. Leg oben deinen ersten Kontakt an — dann kannst du direkt in den Chat
          springen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => {
        const links = linksForContact(contact, `Hallo ${contact.name}!`);
        return (
          <div
            key={contact.id}
            className="glass rounded-2xl border-2 border-border p-4 flex flex-wrap items-center gap-3"
          >
            <div className="flex-1 min-w-[180px]">
              <p className="font-display text-lg text-foreground">{contact.name}</p>
              {contact.note && (
                <p className="text-[13px] font-semibold text-muted-foreground">{contact.note}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {links.length === 0 && (
                <span className="text-[13px] font-semibold text-muted-foreground">
                  Noch kein Kanal hinterlegt
                </span>
              )}
              {links.map((link) => {
                const Icon = ICONS[link.id];
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    title={`${link.label} öffnen`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[14px] font-bold text-foreground"
                  >
                    <Icon className="w-4 h-4" /> {link.label}
                  </a>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(contact)}
                title="Bearbeiten"
                className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(contact)}
                title="Löschen"
                className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}