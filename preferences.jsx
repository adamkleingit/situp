import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const { ipcRenderer } = window.require('electron');

function Preferences() {
  const [config, setConfig] = useState({
    width: 480,
    interval: 15,
    runOnStartup: true,
    opacity: 0.8,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    ipcRenderer.on('load-config', (event, cfg) => {
      setConfig(cfg);
      setLoaded(true);
    });
    // Request config if not sent automatically
    ipcRenderer.send('request-config');
    return () => {
      ipcRenderer.removeAllListeners('load-config');
    };
  }, []);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : 
            id === 'opacity' ? parseFloat(value) : 
            Number(value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ipcRenderer.send('save-config', config);
  };

  const handleCancel = () => {
    window.close();
  };

  if (!loaded) return <div>Loading...</div>;

  return (
    <form id="prefsForm" onSubmit={handleSubmit}>
      <div className="row">
        <label>Window width:</label>
        <input
          type="number"
          id="width"
          min="100"
          max="1920"
          required
          value={config.width}
          onChange={handleChange}
        />
        <span className="hint">Height will adjust automatically (16:9)</span>
      </div>
      <div className="row">
        <label htmlFor="interval">Interval (minutes):</label>
        <input
          type="number"
          id="interval"
          min="1"
          max="180"
          required
          value={config.interval}
          onChange={handleChange}
        />
      </div>
      <div className="row">
        <label htmlFor="opacity">Opacity:</label>
        <input
          type="range"
          id="opacity"
          min="0.1"
          max="1"
          step="0.1"
          value={config.opacity}
          onChange={handleChange}
        />
        <span className="hint">{Math.round(config.opacity * 100)}%</span>
      </div>
      <div className="row">
        <label>
          <input
            type="checkbox"
            id="runOnStartup"
            checked={!!config.runOnStartup}
            onChange={handleChange}
          />
          Run on startup
        </label>
      </div>
      <div className="row">
        <span>Before saving, drag the window to the screen you want the video to play on.</span>
        </div>
      <div className="actions">
        <button type="button" onClick={handleCancel} id="cancelBtn">
          Cancel
        </button>
        <button type="submit">Save</button>
      </div>
    </form>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<Preferences />); 