const NOOP = () => {};
const windowOrRoot = typeof window === 'object' ? window : root;
const cancelAnimationFrame = windowOrRoot.cancelAnimationFrame || clearTimeout;

class RenderingLoop {
  constructor(params) {
    params = params || {};

    this.begin = params.begin || NOOP;
    this.update = params.update || NOOP;
    this.render = params.render || NOOP;
    this.end = params.end || NOOP;

    this.fps = params.fps || 60;
    this.simulationTimestep = 1000 / this.fps;
    this.frameDelta = 0;
    this.lastFrameTimeMs = 0;
    this.fpsAlpha = 0.9;
    this.fpsUpdateInterval = 1000;
    this.lastFpsUpdate = 0;
    this.framesSinceLastFpsUpdate = 0;
    this.numUpdateSteps = 0;
    this.minFrameDelay = 0;
    this.running = false;
    this.started = false;
    this.panic = false;
    this.rafHandle = null;

    this.requestAnimationFrame = windowOrRoot.requestAnimationFrame || (() => {
      const lastTimestamp = Date.now();
      let now;
      let timeout;

      return (callback) => {
        now = Date.now();

        timeout = Math.max(0, this.simulationTimestep - (now - lastTimestamp));
        lastTimestamp = now + timeout;

        return setTimeout(() => {
          callback(now + timeout);
        }, timeout);
      };
    })();

    this.animate = this.animate.bind(this);
  }

  get maxAllowedFps() {
    return 1000 / this.minFrameDelay;
  }

  set maxAllowedFps(fps) {
    if (typeof fps === 'undefined') {
      fps = Infinity;
    }

    if (fps === 0) {
      this.stop();
    } else {
      this.minFrameDelay = 1000 / fps;
    }
  }

  resetFrameDelta() {
    const oldFrameDelta = this.frameDelta;
    this.frameDelta = 0;
    return oldFrameDelta;
  }

  start() {
    if (!started) {
      this.started = true;

      this.rafHandle = this.requestAnimationFrame((timestamp) => {
        this.draw(1);

        this.running = true;
        this.lastFrameTimeMs = timestamp;
        this.lastFpsUpdate = timestamp;
        this.framesSinceLastFpsUpdate = 0;
        this.rafHandle = this.requestAnimationFrame(this.animate);
      });
    }

    return this;
  }

  stop() {
    this.running = false;
    this.started = false;
    cancelAnimationFrame(this.rafHandle);

    return this;
  }

  animate(timestamp) {
    this.rafHandle = this.requestAnimationFrame(this.animate);

    if (timestamp < this.lastFrameTimeMs + this.minFrameDelay) {
      return;
    }

    this.frameDelta += timestamp - this.lastFrameTimeMs;
    this.lastFrameTimeMs = timestamp;

    this.begin(timestamp, this.frameDelta);

    if (timestamp > this.lastFpsUpdate + this.fpsUpdateInterval) {
      this.fps = this.fpsAlpha * this.framesSinceLastFpsUpdate * 1000 / (timestamp - this.lastFpsUpdate) +
                 (1 - this.fpsAlpha) * this.fps;

      this.lastFpsUpdate = timestamp;
      this.framesSinceLastFpsUpdate = 0;
    }

    this.framesSinceLastFpsUpdate++;

    this.numUpdateSteps = 0;

    while (this.frameDelta >= this.simulationTimestep) {
      this.update(this.simulationTimestep);
      this.frameDelta -= this.simulationTimestep;

      if (++this.numUpdateSteps >= 240) {
        this.panic = true;
        break;
      }
    }

    this.render(this.frameDelta / this.simulationTimestep);

    this.end(this.fps, this.panic);

    this.panic = false;
  }
}

module.exports = RenderingLoop;
