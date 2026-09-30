import React, { useState } from "react";
import { FileSpreadsheet, Contact, Copy, Check } from "lucide-react";
import { buildCsv, buildVcard, buildTextList, downloadText } from "@/lib/channels";

// Die Kundenliste raus in deine Apps: als Tabelle, als Handy-Kontakte oder
// als Text zum Einfügen.
export default function ChannelExport({ contacts }) {
  const [copied, setCopied] = useState(false);
  const empty = contacts.length === 0;

  const copyList = async () => {
    await navigator.clipboard.writeText(buildTextList(contacts));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buttons = [
    {
      key: "csv",
      label: "Als Tabelle",
      icon: FileSpreadsheet,
      hint: "Für Excel, Numbers und Google Tabellen",
      run: () => downloadText("kunden.csv", "text/csv;charset=utf-8", buildCsv(contacts)),
    },
    {
      key: "vcard",
      label: "Als Handy-Kontakte",
      icon: Contact,
      hint: "Diese Datei übernimmt dein Handy direkt in die Kontakte",
      run: () => downloadText("kunden.vcf", "text/vcard;charset=utf-8", buildVcard(contacts)),
    },
  ];

  return (
    <div className="glass rounded-2xl border-2 border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">Raus exportieren</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4">
        Alle {contacts.length} Kontakte auf einmal — zum Mitnehmen in WhatsApp, Telegram oder dein
        Telefonbuch.
      </p>

      <div className="flex flex-wrap gap-3">
        {buttons.map((button) => {
          const Icon = button.icon;
          return (
            <button
              key={button.key}
              onClick={button.run}
              disabled={empty}
              title={button.hint}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground disabled:opacity-40"
            >
              <Icon className="w-4 h-4" /> {button.label}
            </button>
          );
        })}
        <button
          onClick={copyList}
          disabled={empty}
          title="Als Text in die Zwischenablage"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground disabled:opacity-40"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Kopiert" : "Als Text kopieren"}
        </button>
      </div>
    </div>
  );
}