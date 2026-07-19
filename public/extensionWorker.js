// extensionWorker.js - Isolates and sandboxes third-party IDE plugins/extensions
const activePlugins = new Map();

self.onmessage = function (e) {
  const { action, pluginId, code, eventName, eventData } = e.data;

  if (action === "load") {
    try {
      // Create a sandboxed evaluation context for the plugin
      const pluginFunc = new Function("sandbox", `
        with(sandbox) {
          ${code}
        }
      `);

      const sandboxEvents = {};
      const sandbox = {
        console: {
          log: (...args) => sendLog(pluginId, "info", args),
          error: (...args) => sendLog(pluginId, "error", args),
          warn: (...args) => sendLog(pluginId, "warning", args),
        },
        registerListener: (name, cb) => {
          sandboxEvents[name] = cb;
        },
        postMessage: (data) => {
          self.postMessage({ action: "pluginMessage", pluginId, data });
        }
      };

      // Execute plugin load phase
      pluginFunc(sandbox);
      activePlugins.set(pluginId, sandboxEvents);

      self.postMessage({ action: "loaded", pluginId });
    } catch (err) {
      self.postMessage({ action: "error", pluginId, message: err.message });
    }
  }

  if (action === "triggerEvent") {
    const events = activePlugins.get(pluginId);
    if (events && typeof events[eventName] === "function") {
      try {
        events[eventName](eventData);
      } catch (err) {
        sendLog(pluginId, "error", [`Error in event ${eventName}: ${err.message}`]);
      }
    }
  }
};

function sendLog(pluginId, level, args) {
  self.postMessage({
    action: "log",
    pluginId,
    level,
    message: args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ")
  });
}
