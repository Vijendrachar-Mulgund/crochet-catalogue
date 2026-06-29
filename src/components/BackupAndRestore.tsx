import { useRef } from "react";
import { useToast } from "./Toast";
import { BackupData } from "../types";

export function BackupAndRestore({ onRestored }: { onRestored: () => void }) {
  const toast = useToast();

  const importRef = useRef<HTMLInputElement>(null);

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

  return (
    <>
      <div className="view-head">
        <div>
          <h1>Backup &amp; restore</h1>
          <p className="sub">
            Your catalogue is saved on this computer in this browser. Export a backup file regularly and keep it safe —
            you can restore it here or move it to another computer.
          </p>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={exportBackup}>
          ⬇ Export backup
        </button>
        <button className="btn btn-secondary" onClick={() => importRef.current?.click()}>
          ⬆ Restore from backup
        </button>
      </div>
      <input type="file" accept="application/json" hidden ref={importRef} onChange={handleImport} />
    </>
  );
}
