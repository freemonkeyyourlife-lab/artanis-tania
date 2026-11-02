import React, { useState } from "react";
import { Globe, ExternalLink, CheckCircle2, Server } from "lucide-react";

// Pro Veröffentlichungsziel die konkreten Schritte, um die eigene Domain
// dorthin zu schalten — damit nach dem Verknüpfen des GitHub-Projekts klar
// ist, wie die Wunsch-Domain live geht.
const DOMAIN_GUIDE = {
  GITHUB_PAGES: {
    title: "GitHub Pages",
    steps: [
      `Im Repo: Settings → Pages → „Custom domain" deine Domain eintragen, Save.`,
      `Im Repo eine Datei namens CNAME (ohne Endung) anlegen, Inhalt = deine Domain.`,
      `Bei deinem Domain-Anbieter einen CNAME-Record auf DEIN-USER.github.io. setzen.`,
      `DNS braucht bis zu 24 h. Danach in Pages-Settings „Enforce HTTPS" aktivieren.`,
    ],
    link: "https://docs.github.com/de/pages/configuring-a-custom-domain-for-your-github-pages-site",
    linkLabel: "GitHub: Custom Domain einrichten",
  },
  NETLIFY: {
    title: "Netlify",
    steps: [
      `Im Dashboard: Add new site → Deploy manually, ZIP hochladen (oder per Drag-and-Drop).`,
      `Site settings → Domain management → Add a custom domain → deine Domain eintragen.`,
      `Bei deinem Domain-Anbieter die Nameserver auf Netlify stellen (oder CNAME auf die Netlify-Subdomain).`,
      `HTTPS wird automatisch ausgestellt, sobald das DNS greift.`,
    ],
    link: "https://docs.netlify.com/domains-https/custom-domains/",
    linkLabel: "Netlify: Custom Domain hinzufügen",
  },
  VERCEL: {
    title: "Vercel",
    steps: [
      `Vercel „New Project" → Repository importieren (oder ZIP via CLI drag-and-drop).`,
      `Settings → Domains → deine Domain eintragen.`,
      `Bei deinem Domain-Anbieter A-Record auf 76.76.21.21 (apex) bzw. CNAME auf cname.vercel-dns.com (Subdomain).`,
      `Vercel stellt HTTPS automatisch aus, sobald das DNS greift.`,
    ],
    link: "https://vercel.com/docs/domains/add-manage-domains",
    linkLabel: "Vercel: Domains verwalten",
  },
  EIGENER: {
    title: "Eigener Webspace",
    steps: [
      `ZIP auf deinen Webspace entpacken (z. B. per FTP/SSH ins Document Root).`,
      `Bei deinem Domain-Anbieter A-Record auf die IP deines Webservers setzen.`,
      `Falls nötig im Webserver einen vhost / Servernamen für die Domain anlegen.`,
      `TLS-Zertifikat ausstellen (z. B. Let's Encrypt), dann ist die Seite unter https:// live.`,
    ],
    link: "",
    linkLabel: "",
  },
};

const TARGETS = ["GITHUB_PAGES", "NETLIFY", "VERCEL", "EIGENER"];

// Zeigt die passenden Domain-Schritte für ein Veröffentlichungsziel. Ohne
// festes `target` kann der Nutzer oben selbst wählen — so funktioniert es
// auch als eigenständige Anleitung in der Hilfe.
export default function GodDomainConnect({ target, domain }) {
  const [sel, setSel] = useState(target || "GITHUB_PAGES");
  const g = DOMAIN_GUIDE[sel] || DOMAIN_GUIDE.GITHUB_PAGES;
  const shown = domain || "deine-domain.de";

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-background p-3 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-primary">
        <Globe className="w-3.5 h-3.5" />
        <p className="text-[12px] font-bold uppercase tracking-wider">Domain verbinden</p>
      </div>

      {!target && (
        <select
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          className="bg-elevated border border-border rounded-full px-2 py-1 text-[11px] font-bold text-foreground focus:outline-none w-fit"
        >
          {TARGETS.map((t) => (
            <option key={t} value={t}>{DOMAIN_GUIDE[t].title}</option>
          ))}
        </select>
      )}

      <p className="text-[11px] font-bold text-foreground">
        Für <span className="text-primary">{shown}</span> bei {g.title}:
      </p>

      <ol className="space-y-1.5">
        {g.steps.map((s, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground leading-snug">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
            <span>{s}</span>
          </li>
        ))}
      </ol>

      {g.link && (
        <a
          href={g.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline w-fit"
        >
          <ExternalLink className="w-3 h-3" /> {g.linkLabel}
        </a>
      )}

      <p className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-snug">
        <Server className="w-3 h-3 shrink-0 mt-0.5" />
        Base44 hostet nur diese App selbst — die Domain schaltest du bei deinem Hoster live.
      </p>
    </div>
  );
}