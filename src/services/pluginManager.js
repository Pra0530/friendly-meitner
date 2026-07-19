// pluginManager.js - Client side extension orchestra
class PluginManager {
  constructor() {
    this.plugins = [];
    this.worker = null;
    this.listeners = new Set();
  }

  initialize() {
    if (this.worker) return;

    try {
      this.worker = new Worker("/extensionWorker.js");
      this.worker.onmessage = (e) => {
        const { action, pluginId, level, message, data } = e.data;

        if (action === "log") {
          console.log(`[Plugin: ${pluginId}] [${level.toUpperCase()}]`, message);
          this.notifyListeners("log", { pluginId, level, message });
        }

        if (action === "pluginMessage") {
          this.notifyListeners("message", { pluginId, data });
        }

        if (action === "loaded") {
          console.log(`Plugin loaded and sandboxed successfully: ${pluginId}`);
          this.notifyListeners("status", { pluginId, status: "active" });
        }

        if (action === "error") {
          console.error(`Plugin sandbox crash: ${pluginId}`, message);
          this.notifyListeners("status", { pluginId, status: "crashed", error: message });
        }
      };
    } catch (err) {
      console.error("Failed to spawn Plugin Sandbox Worker:", err);
    }
  }

  registerPlugin(id, code) {
    this.initialize();
    
    const existing = this.plugins.find(p => p.id === id);
    if (existing) return;

    this.plugins.push({ id, code, status: "loading" });
    
    if (this.worker) {
      this.worker.postMessage({
        action: "load",
        pluginId: id,
        code: code
      });
    }
  }

  triggerEvent(eventName, eventData) {
    if (!this.worker) return;

    this.plugins.forEach(plugin => {
      this.worker.postMessage({
        action: "triggerEvent",
        pluginId: plugin.id,
        eventName,
        eventData
      });
    });
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(type, event) {
    this.listeners.forEach(cb => cb(type, event));
  }
}

export const pluginManager = new PluginManager();
