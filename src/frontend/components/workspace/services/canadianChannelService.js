/**
 * Canadian Channel Data Service
 * Temporarily replaces regular channel data with focused Canadian provincial data
 */

class CanadianChannelService {
  constructor() {
    this.originalFetchChannels = null;
    this.isCanadianMode = false;
  }

  // Enable Canadian mode by monkey-patching fetch
  enableCanadianMode() {
    if (this.isCanadianMode) return;

    console.log("🇨🇦 Enabling Canadian provincial data mode");

    // Store original fetch
    this.originalFetch = window.fetch;

    // Override fetch to intercept channel requests
    window.fetch = async (url, options) => {
      if (url.includes("/api/channels") && !url.includes("/canada")) {
        console.log("🇨🇦 Redirecting channel request to Canadian data");
        const newUrl = url.replace("/api/channels", "/api/channels/canada");
        return this.originalFetch(newUrl, options);
      }

      return this.originalFetch(url, options);
    };

    this.isCanadianMode = true;
  }

  // Disable Canadian mode
  disableCanadianMode() {
    if (!this.isCanadianMode) return;

    console.log("🌍 Disabling Canadian mode, restoring regular data");

    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    this.isCanadianMode = false;
  }

  // Get status
  getStatus() {
    return {
      mode: this.isCanadianMode ? "Canadian Provincial" : "Global",
      isCanadianMode: this.isCanadianMode,
    };
  }
}

// Create singleton instance
const canadianChannelService = new CanadianChannelService();

export default canadianChannelService;
