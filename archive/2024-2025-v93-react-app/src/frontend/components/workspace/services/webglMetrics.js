/**
 * WebGL Metrics Service
 * Provides WebGL performance monitoring and metrics collection
 */

class WebGLMetrics {
  constructor() {
    this.gl = null;
    this.initialized = false;
    this.metrics = {
      drawCalls: 0,
      triangles: 0,
      points: 0,
      lines: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
      shaders: 0,
      buffers: 0,
      framebuffers: 0,
      renderbuffers: 0,
      vertexArrays: 0,
      extensions: [],
    };
    this.capabilities = {};
    this.limits = {};
    this.extensions = [];
    this.lastFrameTime = 0;
    this.frameCount = 0;
  }

  /**
   * Initialize WebGL metrics with a WebGL context
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
   */
  initialize(gl) {
    if (!gl || this.initialized) return;

    this.gl = gl;
    this.initialized = true;

    // Gather WebGL capabilities
    this.gatherCapabilities();

    // Gather WebGL limits
    this.gatherLimits();

    // Gather available extensions
    this.gatherExtensions();

    console.log("🔧 WebGL Metrics initialized", {
      version: this.capabilities.version,
      vendor: this.capabilities.vendor,
      renderer: this.capabilities.renderer,
      extensions: this.extensions.length,
    });
  }

  /**
   * Gather WebGL capabilities
   */
  gatherCapabilities() {
    if (!this.gl) return;

    const gl = this.gl;

    this.capabilities = {
      version: gl.getParameter(gl.VERSION),
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      webglVersion: gl instanceof WebGL2RenderingContext ? 2 : 1,
      antialias: gl.getContextAttributes()?.antialias || false,
      alpha: gl.getContextAttributes()?.alpha || false,
      depth: gl.getContextAttributes()?.depth || false,
      stencil: gl.getContextAttributes()?.stencil || false,
      premultipliedAlpha:
        gl.getContextAttributes()?.premultipliedAlpha || false,
      preserveDrawingBuffer:
        gl.getContextAttributes()?.preserveDrawingBuffer || false,
      powerPreference: gl.getContextAttributes()?.powerPreference || "default",
    };
  }

  /**
   * Gather WebGL limits
   */
  gatherLimits() {
    if (!this.gl) return;

    const gl = this.gl;

    this.limits = {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxVertexTextureImageUnits: gl.getParameter(
        gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
      ),
      maxCombinedTextureImageUnits: gl.getParameter(
        gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
      ),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      maxFragmentUniformVectors: gl.getParameter(
        gl.MAX_FRAGMENT_UNIFORM_VECTORS,
      ),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
      aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
    };

    // WebGL 2 specific limits
    if (gl instanceof WebGL2RenderingContext) {
      this.limits.maxDrawBuffers = gl.getParameter(gl.MAX_DRAW_BUFFERS);
      this.limits.maxColorAttachments = gl.getParameter(
        gl.MAX_COLOR_ATTACHMENTS,
      );
      this.limits.maxSamples = gl.getParameter(gl.MAX_SAMPLES);
      this.limits.max3DTextureSize = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE);
      this.limits.maxArrayTextureLayers = gl.getParameter(
        gl.MAX_ARRAY_TEXTURE_LAYERS,
      );
      this.limits.maxTransformFeedbackInterleavedComponents = gl.getParameter(
        gl.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS,
      );
      this.limits.maxTransformFeedbackSeparateAttribs = gl.getParameter(
        gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS,
      );
      this.limits.maxTransformFeedbackSeparateComponents = gl.getParameter(
        gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS,
      );
      this.limits.maxUniformBufferBindings = gl.getParameter(
        gl.MAX_UNIFORM_BUFFER_BINDINGS,
      );
      this.limits.maxUniformBlockSize = gl.getParameter(
        gl.MAX_UNIFORM_BLOCK_SIZE,
      );
      this.limits.maxVertexOutputComponents = gl.getParameter(
        gl.MAX_VERTEX_OUTPUT_COMPONENTS,
      );
      this.limits.maxFragmentInputComponents = gl.getParameter(
        gl.MAX_FRAGMENT_INPUT_COMPONENTS,
      );
    }
  }

  /**
   * Gather available WebGL extensions
   */
  gatherExtensions() {
    if (!this.gl) return;

    const gl = this.gl;
    this.extensions = gl.getSupportedExtensions() || [];

    // Store extension objects for commonly used extensions
    this.extensionObjects = {
      ANGLE_instanced_arrays: gl.getExtension("ANGLE_instanced_arrays"),
      OES_vertex_array_object: gl.getExtension("OES_vertex_array_object"),
      OES_texture_float: gl.getExtension("OES_texture_float"),
      OES_texture_half_float: gl.getExtension("OES_texture_half_float"),
      OES_element_index_uint: gl.getExtension("OES_element_index_uint"),
      WEBGL_depth_texture: gl.getExtension("WEBGL_depth_texture"),
      WEBGL_debug_renderer_info: gl.getExtension("WEBGL_debug_renderer_info"),
      WEBGL_lose_context: gl.getExtension("WEBGL_lose_context"),
      EXT_texture_filter_anisotropic: gl.getExtension(
        "EXT_texture_filter_anisotropic",
      ),
      EXT_color_buffer_half_float: gl.getExtension(
        "EXT_color_buffer_half_float",
      ),
      EXT_color_buffer_float: gl.getExtension("EXT_color_buffer_float"),
      EXT_disjoint_timer_query: gl.getExtension("EXT_disjoint_timer_query"),
    };
  }

  /**
   * Update metrics from Three.js renderer
   * @param {THREE.WebGLRenderer} renderer
   */
  updateFromRenderer(renderer) {
    if (!renderer || !this.initialized) return;

    const info = renderer.info;

    this.metrics.drawCalls = info.render.calls;
    this.metrics.triangles = info.render.triangles;
    this.metrics.points = info.render.points;
    this.metrics.lines = info.render.lines;
    this.metrics.geometries = info.memory.geometries;
    this.metrics.textures = info.memory.textures;
    this.metrics.programs = info.programs ? info.programs.length : 0;

    // Update frame count
    this.frameCount++;
  }

  /**
   * Get current metrics
   * @returns {Object} Current WebGL metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      frameCount: this.frameCount,
      capabilities: this.capabilities,
      limits: this.limits,
      extensions: this.extensions.length,
      extensionList: this.extensions,
    };
  }

  /**
   * Get memory usage information
   * @returns {Object} Memory usage metrics
   */
  getMemoryUsage() {
    if (!this.gl) return null;

    const gl = this.gl;
    const webglMemoryExt = this.extensionObjects.WEBGL_debug_renderer_info;

    const memoryInfo = {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      currentProgram: gl.getParameter(gl.CURRENT_PROGRAM),
      textureBinding2D: gl.getParameter(gl.TEXTURE_BINDING_2D),
      textureBindingCubeMap: gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP),
    };

    if (webglMemoryExt) {
      memoryInfo.unmaskedVendor = gl.getParameter(
        webglMemoryExt.UNMASKED_VENDOR_WEBGL,
      );
      memoryInfo.unmaskedRenderer = gl.getParameter(
        webglMemoryExt.UNMASKED_RENDERER_WEBGL,
      );
    }

    return memoryInfo;
  }

  /**
   * Check if an extension is supported
   * @param {string} extensionName
   * @returns {boolean} Whether the extension is supported
   */
  isExtensionSupported(extensionName) {
    return this.extensions.includes(extensionName);
  }

  /**
   * Get extension object
   * @param {string} extensionName
   * @returns {Object|null} Extension object or null if not supported
   */
  getExtension(extensionName) {
    return this.extensionObjects[extensionName] || null;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      drawCalls: 0,
      triangles: 0,
      points: 0,
      lines: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
      shaders: 0,
      buffers: 0,
      framebuffers: 0,
      renderbuffers: 0,
      vertexArrays: 0,
      extensions: [],
    };
    this.frameCount = 0;
  }

  /**
   * Log WebGL information
   */
  logInfo() {
    if (!this.initialized) {
      console.warn("WebGL Metrics not initialized");
      return;
    }

    console.group("🔧 WebGL Information");
    console.log("Version:", this.capabilities.version);
    console.log("Vendor:", this.capabilities.vendor);
    console.log("Renderer:", this.capabilities.renderer);
    console.log(
      "Shading Language Version:",
      this.capabilities.shadingLanguageVersion,
    );
    console.log("WebGL Version:", this.capabilities.webglVersion);
    console.log("Extensions:", this.extensions.length);

    console.group("Limits");
    Object.entries(this.limits).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();

    console.group("Current Metrics");
    Object.entries(this.metrics).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * Get performance report
   * @returns {Object} Performance report
   */
  getPerformanceReport() {
    return {
      metrics: this.getMetrics(),
      memoryUsage: this.getMemoryUsage(),
      initialized: this.initialized,
      frameCount: this.frameCount,
      capabilities: this.capabilities,
      limits: this.limits,
      extensions: this.extensions,
    };
  }
}

// Export singleton instance
export const webglMetrics = new WebGLMetrics();
export default webglMetrics;
