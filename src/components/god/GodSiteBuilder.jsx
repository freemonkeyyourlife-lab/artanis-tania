import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import JSZip from "jszip";
import { Loader2, Download, Globe, Github, FolderGit2, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// GitHub-Seitenbauer: zieht ein öffentliches GitHub-Projekt, packt alle Dateien
// in ein fertiges ZIP (bereit zum Download bzw. Hochladen bei einem Hoster) und
// legt zur angegebenen Domain einen Eintrag ab. Die Base44-Plattform hostet nur
// diese App selbst — das fertige ZIP lädst du bei deinem Hoster unter der
// Domain hoch, dann steht die Seite.

const CAP = 400; // Schutz vor dem GitHub-Ratenlimit (60 Abrufe/Stunde anonym).
const SKIP = ["node_modules/", ".git/", ".next/", ".cache/", "dist/.vite/"];

function parseRepo(raw) {
  const m = String(raw || "").trim().match(/github\.com[/:]([^/]+)\/([^/.?#]+)/) || String(raw || "").trim().match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

const rawUrl = (owner, repo, branch, path) =>
  `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

export default function GodSiteBuilder() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [subpath, setSubpath] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [domain, setDomain] = useState("");
  const [saved, setSaved] = useState([]);
  const [log, setLog] = useState([]);
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState("");

  const note = (m) => setLog((l) => [...l.slice(-10), m]);

  const loadSaved = async () => {
    try {
      const p = await base44.entities.SiteBuild.filter({}, { sort: "-created_date", limit: 50 });
      setSaved(p.items || []);
    } catch {}
  };
  useEffect(() => { loadSaved(); }, []);

  const loadRepo = async () => {
    setErr("");
    const parsed = parseRepo(repoUrl);
    if (!parsed) { setErr("Bitte als github.com/owner/repo oder owner/repo angeben."); return; }
    setLoading(true);
    setFiles([]);
    setLog([]);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch || "main"}?recursive=1`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      const data = await res.json();
      if (!res.ok || data.message) throw new Error(data.message || `HTTP ${res.status}`);
      const base = subpath ? subpath.replace(/^\/+/, "").replace(/\/+$/, "") + "/" : "";
      const list = (data.tree || [])
        .filter((e) => e.type === "blob")
        .map((e) => e.path)
        .filter((p) => (!base || p.startsWith(base)) && !SKIP.some((s) => p.includes(s)))
        .map((p) => ({ path: base ? p.slice(base.length) : p, url: rawUrl(parsed.owner, parsed.repo, branch, p) }))
        .filter((f) => f.path);
      if (list.length > CAP) {
        note(`Hinweis: ${list.length} Dateien — auf die ersten ${CAP} begrenzt (Ratenlimit).`);
      }
      setFiles(list.slice(0, CAP));
      note(`${parsed.owner}/${parsed.repo} @ ${branch}: ${Math.min(list.length, CAP)} Dateien geladen.`);
    } catch (e) {
      setErr("Laden fehlgeschlagen: " + (e?.message || "?"));
    } finally {
      setLoading(false);
    }
  };

  const buildZip = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setLog([]);
    try {
      const zip = new JSZip();
      let n = 0;
      for (const f of files) {
        try {
          const blob = await (await fetch(f.url)).blob();
          zip.file(f.path, blob);
          n += 1;
          if (n % 25 === 0) setProgress(`${n}/${files.length} gepackt …`);
        } catch { /* einzelne Datei überspringen */ }
      }
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      const name = repoUrl.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "site";
      a.download = `${name}-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setProgress("");
      note(`Fertig — ${n} Dateien als ZIP heruntergeladen.`);
    } finally {
      setBusy(false);
    }
  };

  const saveSite = async (status = "FERTIG") => {
    if (!files.length || busy) return;
    setBusy(true);
    try {
      const parsed = parseRepo(repoUrl);
      await base44.entities.SiteBuild.create({
        repoUrl: repoUrl.trim(),
        owner: parsed?.owner || "",
        repo: parsed?.repo || "",
        branch,
        subpath,
        domain: domain.trim(),
        status,
        fileCount: files.length,
        builtAt: new Date().toISOString(),
      });
      setDomain("");
      note(`Seite abgelegt — Domain: ${domain.trim() || "—"}.`);
      await loadSaved();
    } finally {
      setBusy(false);
    }
  };

  const rebuild = async (s) => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(
        `https://api.github.com/repos/${s.owner}/${s.repo}/git/trees/${s.branch || "main"}?recursive=1`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      const data = await res.json();
      if (!res.ok || data.message) throw new Error(data.message || `HTTP ${res.status}`);
      const base = s.subpath ? s.subpath.replace(/^\/+/, "").replace(/\/+$/, "") + "/" : "";
      const list = (data.tree || []).filter((e) => e.type === "blob").map((e) => e.path)
        .filter((p) => (!base || p.startsWith(base)) && !SKIP.some((s2) => p.includes(s2)))
        .map((p) => ({ path: base ? p.slice(base.length) : p, url: rawUrl(s.owner, s.repo, s.branch || "main", p) }))
        .filter((f) => f.path).slice(0, CAP);
      const zip = new JSZip();
      let n = 0;
      for (const f of list) {
        try { zip.file(f.path, await (await fetch(f.url)).blob()); n += 1; } catch {}
      }
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = `${s.repo}-site.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      note(`Neu gebaut: ${s.repo} (${n} Dateien).`);
    } catch (e) {
      setErr("Neu bauen fehlgeschlagen: " + (e?.message || "?"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 px-1">
      <div className="flex items-center gap-2 text-primary">
        <Github className="w-4 h-4" />
        <p className="text-[13px] font-bold uppercase tracking-wider">GitHub-Seitenbauer</p>
      </div>

      <input
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        placeholder="github.com/owner/repo"
        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
      />
      <div className="flex gap-2">
        <input
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="Branch"
          className="w-1/2 px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground focus:outline-none focus:border-primary/50"
        />
        <input
          value={subpath}
          onChange={(e) => setSubpath(e.target.value)}
          placeholder="Ordner (optional)"
          className="w-1/2 px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      <button
        onClick={loadRepo}
        disabled={loading || !repoUrl.trim()}
        className="glass-btn inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderGit2 className="w-4 h-4" />} Projekt laden
      </button>

      {err && <p className="text-[12px] text-destructive font-bold">{err}</p>}

      {files.length > 0 && (
        <>
          <div className="rounded-xl bg-elevated border border-border px-3 py-2">
            <p className="text-[12px] font-bold text-foreground">{files.length} Dateien geladen</p>
            <p className="text-[11px] text-muted-foreground truncate">{files[0]?.path} …</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={buildZip}
              disabled={busy}
              className="glass-btn glass-btn-accent inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold text-gloss disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} ZIP bauen & laden
            </button>
          </div>

          <div className="flex gap-2">
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Ziel-Domain (z. B. meine-seite.de)"
              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={() => saveSite("FERTIG")}
              disabled={busy || !files.length}
              title="Seite zur Domain ablegen"
              className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold disabled:opacity-50"
            >
              <Globe className="w-4 h-4" /> Ablegen
            </button>
          </div>

          <div className="rounded-xl bg-background border border-border px-3 py-2 flex gap-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Das ZIP ist fertig zum Hochladen. Base44 hostet nur diese App — lade das ZIP bei deinem Hoster unter der Domain hoch, dann steht die Seite.
            </p>
          </div>
        </>
      )}

      {progress && <p className="text-[12px] text-primary font-bold">{progress}</p>}

      {saved.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Abgelegte Seiten</p>
          {saved.map((s) => (
            <div key={s.id} className="rounded-xl bg-elevated border border-border p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-bold text-foreground truncate">{s.repo || s.repoUrl}</p>
                {s.status === "FERTIG" ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-primary shrink-0" />}
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" /> {s.domain || "keine Domain"} · {s.fileCount} Dateien
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => rebuild(s)}
                  disabled={busy}
                  className="glass-btn inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" /> Neu bauen
                </button>
                {s.domain && (
                  <a
                    href={s.domain.startsWith("http") ? s.domain : `https://${s.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-btn inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold"
                  >
                    <ExternalLink className="w-3 h-3" /> Öffnen
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {log.length > 0 && (
        <div className="rounded-xl bg-background border border-border p-3 max-h-32 overflow-y-auto">
          {log.map((l, i) => <p key={i} className="text-[11px] text-foreground whitespace-pre-wrap">{l}</p>)}
        </div>
      )}
    </div>
  );
}