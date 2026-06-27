// SettingsView — business details (used on PDF covers) and backup/restore.
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import type { BackupData, Settings } from "../types";
import { resizeImage } from "../lib/image";
import { useToast } from "./Toast";
import { Categories } from "./Categories";

export function SettingsView({ onRestored }: { onRestored: () => void }) {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // TODO: load settings from a data source.
    const s: Settings = { businessName: "", tagline: "", logoDataUrl: null };
    setSettings(s);
    setLogoDataUrl(s.logoDataUrl);
  }, []);

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImage(file, 512, 0.9).then(setLogoDataUrl);
  }

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: persist settings to a data source.
    toast("Settings saved", "ok");
  }

  function exportBackup() {
    // TODO: export data from a data source.
    toast("Backup downloaded", "ok");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Restoring will replace everything currently in the catalogue. Continue?")) {
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      let payload: BackupData;
      try {
        payload = JSON.parse(reader.result as string);
      } catch {
        toast("That file could not be read.", "err");
        return;
      }
      // TODO: restore `payload` into a data source.
      void payload;
      toast("Catalogue restored", "ok");
      onRestored();
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  if (!settings) return null;

  return (
    <>
      <div className="view-head">
        <div>
          <h1>Settings</h1>
          <p className="sub">Your business details appear on the cover of every PDF you share.</p>
        </div>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="field">
          <label>Business name</label>
          <input
            type="text"
            name="businessName"
            placeholder="e.g. Charming Yarns"
            defaultValue={settings.businessName}
          />
        </div>
        <div className="field">
          <label>
            Tagline <span className="hint">optional</span>
          </label>
          <input type="text" name="tagline" placeholder="e.g. Handmade with love" defaultValue={settings.tagline} />
        </div>
        <div className="field">
          <label>Logo</label>
          <div className="photo-pick">
            <div className="logo-preview">{logoDataUrl ? <img src={logoDataUrl} alt="" /> : "🧶"}</div>
            <div>
              <div className="field" style={{ marginBottom: 8 }}>
                <input type="file" accept="image/*" onChange={handleLogo} />
              </div>
              {logoDataUrl && (
                <button type="button" className="btn btn-sm btn-danger" onClick={() => setLogoDataUrl(null)}>
                  Remove logo
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="btn-row">
          <button type="submit" className="btn btn-primary">
            Save settings
          </button>
        </div>
      </form>

      <div className="panel" style={{ marginTop: 22 }}>
        <Categories />
      </div>

      <div className="panel" style={{ marginTop: 22 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Backup &amp; restore</h2>
        <p className="hint" style={{ color: "var(--muted)", margin: "0 0 16px" }}>
          Your catalogue is saved on this computer in this browser. Export a backup file regularly and keep it safe —
          you can restore it here or move it to another computer.
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={exportBackup}>
            ⬇ Export backup
          </button>
          <button className="btn btn-secondary" onClick={() => importRef.current?.click()}>
            ⬆ Restore from backup
          </button>
        </div>
        <input type="file" accept="application/json" hidden ref={importRef} onChange={handleImport} />
      </div>
    </>
  );
}
