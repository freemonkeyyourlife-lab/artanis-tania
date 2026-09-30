import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus } from "lucide-react";
import GuideBox from "@/components/owner/GuideBox";
import ChannelSetupPanel from "@/components/owner/ChannelSetupPanel";
import ChannelContactForm from "@/components/owner/ChannelContactForm";
import ChannelContactList from "@/components/owner/ChannelContactList";
import ChannelExport from "@/components/owner/ChannelExport";

// Der Kanal-Bereich: deine Kunden mit ihren WhatsApp-, Telegram- und
// Instagram-Namen — und ein Tipp, der dich direkt in den echten Chat bringt.
export default function ChannelHub() {
  const [contacts, setContacts] = useState([]);
  const [setup, setSetup] = useState({});
  const [setupRecord, setSetupRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSetup, setSavingSetup] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [list, setups] = await Promise.all([
          base44.entities.ChannelContact.list("-created_date", 500),
          base44.entities.ChannelSetup.list(),
        ]);
        setContacts(list);
        const row = setups[0] || null;
        setSetupRecord(row);
        setSetup(row || {});
      } catch (e) {
        setNotice("Die Kanäle konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveSetup = async () => {
    setSavingSetup(true);
    setNotice("");
    try {
      const saved = setupRecord
        ? await base44.entities.ChannelSetup.update(setupRecord.id, setup)
        : await base44.entities.ChannelSetup.create(setup);
      setSetupRecord(saved);
      setSetup(saved);
      setNotice("Deine Kanäle sind gespeichert.");
    } catch (e) {
      setNotice("Speichern hat nicht geklappt. Versuch es nochmal.");
    } finally {
      setSavingSetup(false);
    }
  };

  const saveContact = async (data) => {
    setSavingContact(true);
    setNotice("");
    try {
      if (editing?.id) {
        const saved = await base44.entities.ChannelContact.update(editing.id, data);
        setContacts((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
      } else {
        const saved = await base44.entities.ChannelContact.create(data);
        setContacts((prev) => [saved, ...prev]);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (e) {
      setNotice("Der Kontakt konnte nicht gespeichert werden.");
    } finally {
      setSavingContact(false);
    }
  };

  const removeContact = async (contact) => {
    setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    try {
      await base44.entities.ChannelContact.delete(contact.id);
    } catch (e) {
      setContacts((prev) => [contact, ...prev]);
      setNotice("Löschen hat nicht geklappt.");
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (contact) => {
    setEditing(contact);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GuideBox
        title="So funktioniert es"
        steps={[
          "Trag oben einmal deine eigenen Kanal-Namen ein — WhatsApp-Nummer, Telegram-Name, Instagram-Name.",
          "Leg darunter deine Kunden an. Pro Kunde die Namen, unter denen du ihn auf den Kanälen findest.",
          "Jeder Kunde bekommt dann einen Knopf pro Kanal. Ein Tipp — und WhatsApp, Telegram oder Instagram öffnet sich direkt mit genau dieser Person.",
          "Ganz unten nimmst du die ganze Liste mit: als Tabelle, als Handy-Kontakte oder als Text.",
        ]}
      >
        Hier laufen deine Kanäle zusammen. Du musst nichts einrichten — die Sprung-Knöpfe funktionieren
        sofort, sobald ein Name hinterlegt ist.
      </GuideBox>

      {notice && (
        <p className="glass rounded-xl border border-border px-4 py-3 text-[15px] font-bold text-primary">
          {notice}
        </p>
      )}

      <ChannelSetupPanel
        value={setup}
        onChange={setSetup}
        onSave={saveSetup}
        saving={savingSetup}
      />

      {formOpen && (
        <ChannelContactForm
          contact={editing}
          onSubmit={saveContact}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          saving={savingContact}
        />
      )}

      <div className="glass rounded-2xl border-2 border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="font-display text-xl text-foreground">Deine Kunden</p>
            <p className="text-[15px] font-semibold text-muted-foreground">
              {contacts.length} {contacts.length === 1 ? "Kontakt" : "Kontakte"} hinterlegt
            </p>
          </div>
          {!formOpen && (
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
            >
              <UserPlus className="w-4 h-4" /> Kontakt anlegen
            </button>
          )}
        </div>

        <ChannelContactList
          contacts={contacts}
          onEdit={openEdit}
          onDelete={removeContact}
        />
      </div>

      <ChannelExport contacts={contacts} />
    </div>
  );
}