// pluginManager.js - Client side extension orchestra (lazy-initialised)
class PluginManager {
  constructor() {
    this.plugins = [];
    this.worker = null;
    this.listeners = new Set();
    this._initialized = false;
  }

  initialize() {
    if (this._initialized) return;
    this._initialized = true;

    try {
      // Only spawn Worker in browser context
      if (typeof window === 'undefined' || typeof Worker === 'undefined') return;
      this.worker = new Worker('/extensionWorker.js');
      this.worker.onmessage = (e) => {
        const { action, pluginId, level, message, data } = e.data;

        if (action === 'log') {
          console.log(`[Plugin: ${pluginId}] [${level.toUpperCase()}]`, message);
          this.notifyListeners('log', { pluginId, level, message });
        }
        if (action === 'pluginMessage') {
          this.notifyListeners('message', { pluginId, data });
        }
        if (action === 'loaded') {
          this.notifyListeners('status', { pluginId, status: 'active' });
        }
        if (action === 'error') {
          console.warn(`Plugin sandbox error (${pluginId}):`, message);
          this.notifyListeners('status', { pluginId, status: 'crashed', error: message });
        }
      };
      this.worker.onerror = (err) => {
        // Non-critical — main thread continues unaffected
        console.warn('Extension worker error (non-fatal):', err.message);
      };
    } catch (err) {
      // Worker unsupported or blocked — main thread continues unaffected
      console.warn('Plugin sandbox unavailable (non-fatal):', err.message);
    }
  }

  registerPlugin(id, code) {
    // Defer initialization to ensure we're in a browser context
    this.initialize();

    if (this.plugins.find(p => p.id === id)) return;
    this.plugins.push({ id, code, status: 'loading' });

    if (this.worker) {
      this.worker.postMessage({ action: 'load', pluginId: id, code });
    }
  }

  triggerEvent(eventName, eventData) {
    if (!this.worker) return;
    this.plugins.forEach(plugin => {
      this.worker.postMessage({
        action: 'triggerEvent',
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
    this.listeners.forEach(cb => {
      try { cb(type, event); } catch (e) {}
    });
  }
}

export const pluginManager = new PluginManager();
