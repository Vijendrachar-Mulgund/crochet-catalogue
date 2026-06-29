import { useNavigate } from "react-router";
import { BackupAndRestore } from "./BackupAndRestore";
import { Categories } from "./Categories";
import { SettingsView } from "./SettingsView";

export function Profile() {
  const navigate = useNavigate();

  return (
    <>
      <div className="panel">
        <SettingsView />
      </div>

      <div className="panel">
        <Categories />
      </div>

      <div className="panel">
        <BackupAndRestore onRestored={() => navigate("/")} />
      </div>
    </>
  );
}
