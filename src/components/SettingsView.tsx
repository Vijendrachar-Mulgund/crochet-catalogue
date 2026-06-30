import { useEffect, useState, type SyntheticEvent } from "react";
import type { Settings } from "../types";
import { resizeImage } from "../lib/image";
import { useToast } from "./Toast";

export function SettingsView() {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

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

  if (!settings) return null;

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="view-head">
          <div>
            <h1>Settings</h1>
            <p className="sub">Your business details appear on the cover of every PDF you share.</p>
          </div>
        </div>

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
    </>
  );
}
