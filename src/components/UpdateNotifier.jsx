import React, { useState, useEffect } from "react";
import "./UpdateNotifier.css";
import BrandMark from "./BrandMark";

const UpdateNotifier = ({ theme }) => {
  const [updateVersion, setUpdateVersion] = useState(null);

  useEffect(() => {
    const checkUpdate = () => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.runtime) {
        chrome.storage.local.get(["latestVersionCache"], (result) => {
           if (result.latestVersionCache) {
             const currentVersion = chrome.runtime.getManifest().version;
             if (isNewerVersion(currentVersion, result.latestVersionCache)) {
                setUpdateVersion(result.latestVersionCache);
             }
           }
        });
      }
    };
    
    checkUpdate();

    const listener = (message) => {
      if (message.action === "update_available" && message.version) {
        setUpdateVersion(message.version);
      }
    };
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(listener);
    }
    return () => {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(listener);
      }
    };
  }, []);

  function isNewerVersion(current, latest) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const curr = currentParts[i] || 0;
      const lat = latestParts[i] || 0;
      if (lat > curr) return true;
      if (lat < curr) return false;
    }
    return false;
  }

  if (!updateVersion) return null;

  return (
    <div className="update-notifier" role="status">
      <BrandMark className="update-notifier-icon" />
      <div className="update-notifier-content">
        <h3>Mise à jour disponible</h3>
        <p>Better Zeus {updateVersion} est disponible.</p>
      </div>
      <div className="update-notifier-actions">
        <button
          type="button"
          className="bz-button bz-button-secondary"
          onClick={() => setUpdateVersion(null)}
        >
          Plus tard
        </button>
        <button
          type="button"
          className="bz-button bz-button-primary"
          onClick={() => {
            window.open(
              "https://github.com/Axthauvin/better-zeus/releases/latest",
              "_blank",
            );
            setUpdateVersion(null);
          }}
        >
          Voir
        </button>
      </div>
    </div>
  );
};

export default UpdateNotifier;
