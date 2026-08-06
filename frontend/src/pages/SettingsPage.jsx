import Settings from "../components/Settings.jsx";

export default function SettingsPage({ onSaved }) {
  return (
    <>
      <header className="app-header">
        <div>
          <h1 className="app-title">
            Settings<span>.</span>
          </h1>
          <div className="app-subtitle">manage your preferences</div>
        </div>
      </header>

      <Settings onSaved={onSaved} />
    </>
  );
}
