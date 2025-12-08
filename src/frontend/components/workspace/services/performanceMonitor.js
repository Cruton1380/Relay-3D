/**
 * Performance Monitor Service
 * Provides performance monitoring and metrics collection for the application
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      frameRate: 0,
      renderTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
      points: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
    };

    this.isRunning = false;
    this.startTime = 0;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.performanceEntries = [];
    this.observers = [];
    this.updateInterval = null;

    // Initialize performance observer if available
    this.initializeObserver();
  }

  /**
   * Initialize performance observer for monitoring
   */
  initializeObserver() {
    if (typeof PerformanceObserver !== "undefined") {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.performanceEntries.push(...entries);
          this.processPerformanceEntries(entries);
        });

        observer.observe({ entryTypes: ["measure", "navigation", "paint"] });
        this.observers.push(observer);
      } catch (error) {
        console.warn("Performance Observer not available:", error);
      }
    }
  }

  /**
   * Process performance entries
   * @param {PerformanceEntry[]} entries
   */
  processPerformanceEntries(entries) {
    entries.forEach((entry) => {
      if (entry.entryType === "measure") {
        this.metrics.renderTime = entry.duration;
      } else if (entry.entryType === "paint") {
        // Handle paint timing
        if (entry.name === "first-contentful-paint") {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      }
    });
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = performance.now();
    this.frameCount = 0;
    this.lastFrameTime = this.startTime;

    // Start regular metrics update
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000); // Update every second

    // Mark start in performance timeline
    if (performance.mark) {
      performance.mark("performance-monitor-start");
    }

    console.log("🚀 Performance Monitor started");
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Mark end in performance timeline
    if (performance.mark && performance.measure) {
      performance.mark("performance-monitor-end");
      performance.measure(
        "performance-monitor-duration",
        "performance-monitor-start",
        "performance-monitor-end",
      );
    }

    console.log("⏹️ Performance Monitor stopped");
  }

  /**
   * Update performance metrics
   */
  updateMetrics() {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    // Update frame rate
    this.frameCount++;
    const elapsed = now - this.startTime;
    this.metrics.frameRate = this.frameCount / (elapsed / 1000);

    // Update memory usage if available
    if (performance.memory) {
      this.metrics.memoryUsage = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
      };
    }

    // Update render time
    this.metrics.renderTime = deltaTime;
    this.lastFrameTime = now;

    // Notify observers
    this.notifyObservers();
  }

  /**
   * Update WebGL metrics
   * @param {WebGLRenderingContext} gl
   * @param {THREE.WebGLRenderer} renderer
   */
  updateWebGLMetrics(gl, renderer) {
    if (!this.isRunning || !renderer) return;

    const info = renderer.info;

    this.metrics.drawCalls = info.render.calls;
    this.metrics.triangles = info.render.triangles;
    this.metrics.points = info.render.points;
    this.metrics.geometries = info.memory.geometries;
    this.metrics.textures = info.memory.textures;
    this.metrics.programs = info.programs?.length || 0;
  }

  /**
   * Record a custom performance mark
   * @param {string} name
   */
  mark(name) {
    if (performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Record a custom performance measure
   * @param {string} name
   * @param {string} startMark
   * @param {string} endMark
   */
  measure(name, startMark, endMark) {
    if (performance.measure) {
      performance.measure(name, startMark, endMark);
    }
  }

  /**
   * Get current metrics
   * @returns {Object} Current performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get performance report
   * @returns {Object} Detailed performance report
   */
  getReport() {
    return {
      metrics: this.getMetrics(),
      isRunning: this.isRunning,
      uptime: this.isRunning ? (performance.now() - this.startTime) / 1000 : 0,
      frameCount: this.frameCount,
      averageFrameTime:
        this.frameCount > 0
          ? (performance.now() - this.startTime) / this.frameCount
          : 0,
      performanceEntries: this.performanceEntries.slice(-10), // Last 10 entries
    };
  }

  /**
   * Add performance observer
   * @param {Function} callback
   */
  addObserver(callback) {
    this.observers.push(callback);
  }

  /**
   * Remove performance observer
   * @param {Function} callback
   */
  removeObserver(callback) {
    const index = this.observers.indexOf(callback);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notify all observers
   */
  notifyObservers() {
    const metrics = this.getMetrics();
    this.observers.forEach((callback) => {
      if (typeof callback === "function") {
        try {
          callback(metrics);
        } catch (error) {
          console.error("Error in performance observer:", error);
        }
      }
    });
  }

  /**
   * Log performance summary
   */
  logSummary() {
    const report = this.getReport();
    console.group("📊 Performance Summary");
    console.log("Frame Rate:", report.metrics.frameRate.toFixed(2), "FPS");
    console.log("Render Time:", report.metrics.renderTime.toFixed(2), "ms");
    console.log("Draw Calls:", report.metrics.drawCalls);
    console.log("Triangles:", report.metrics.triangles);
    console.log("Geometries:", report.metrics.geometries);
    console.log("Textures:", report.metrics.textures);
    console.log("Uptime:", report.uptime.toFixed(2), "seconds");

    if (report.metrics.memoryUsage) {
      console.log("Memory Usage:", {
        used:
          (report.metrics.memoryUsage.used / 1024 / 1024).toFixed(2) + " MB",
        total:
          (report.metrics.memoryUsage.total / 1024 / 1024).toFixed(2) + " MB",
      });
    }

    console.groupEnd();
  }

  /**
   * Clear all performance data
   */
  clear() {
    this.performanceEntries = [];
    this.frameCount = 0;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;

    // Clear browser performance entries
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
    if (performance.clearMarks) {
      performance.clearMarks();
    }
  }

  /**
   * Check if performance monitoring is supported
   * @returns {boolean} Whether performance monitoring is supported
   */
  isSupported() {
    return (
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
    );
  }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
