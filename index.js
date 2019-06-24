"use strict";

function _readOnlyError(name) { throw new Error("\"" + name + "\" is read-only"); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var NOOP = function NOOP() {};

var windowOrRoot = (typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object' ? window : root;
var cancelAnimationFrame = windowOrRoot.cancelAnimationFrame || clearTimeout;

var RenderingLoop =
/*#__PURE__*/
function () {
  function RenderingLoop(params) {
    var _this = this;

    _classCallCheck(this, RenderingLoop);

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

    this.requestAnimationFrame = windowOrRoot.requestAnimationFrame || function () {
      var lastTimestamp = Date.now();
      var now;
      var timeout;
      return function (callback) {
        now = Date.now();
        timeout = Math.max(0, _this.simulationTimestep - (now - lastTimestamp));
        lastTimestamp = (_readOnlyError("lastTimestamp"), now + timeout);
        return setTimeout(function () {
          callback(now + timeout);
        }, timeout);
      };
    }();

    this.animate = this.animate.bind(this);
  }

  _createClass(RenderingLoop, [{
    key: "resetFrameDelta",
    value: function resetFrameDelta() {
      var oldFrameDelta = this.frameDelta;
      this.frameDelta = 0;
      return oldFrameDelta;
    }
  }, {
    key: "start",
    value: function start() {
      var _this2 = this;

      if (!started) {
        this.started = true;
        this.rafHandle = this.requestAnimationFrame(function (timestamp) {
          _this2.draw(1);

          _this2.running = true;
          _this2.lastFrameTimeMs = timestamp;
          _this2.lastFpsUpdate = timestamp;
          _this2.framesSinceLastFpsUpdate = 0;
          _this2.rafHandle = _this2.requestAnimationFrame(_this2.animate);
        });
      }

      return this;
    }
  }, {
    key: "stop",
    value: function stop() {
      this.running = false;
      this.started = false;
      cancelAnimationFrame(this.rafHandle);
      return this;
    }
  }, {
    key: "animate",
    value: function animate(timestamp) {
      this.rafHandle = this.requestAnimationFrame(this.animate);

      if (timestamp < this.lastFrameTimeMs + this.minFrameDelay) {
        return;
      }

      this.frameDelta += timestamp - this.lastFrameTimeMs;
      this.lastFrameTimeMs = timestamp;
      this.begin(timestamp, this.frameDelta);

      if (timestamp > this.lastFpsUpdate + this.fpsUpdateInterval) {
        this.fps = this.fpsAlpha * this.framesSinceLastFpsUpdate * 1000 / (timestamp - this.lastFpsUpdate) + (1 - this.fpsAlpha) * this.fps;
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
  }, {
    key: "maxAllowedFps",
    get: function get() {
      return 1000 / this.minFrameDelay;
    },
    set: function set(fps) {
      if (typeof fps === 'undefined') {
        fps = Infinity;
      }

      if (fps === 0) {
        this.stop();
      } else {
        this.minFrameDelay = 1000 / fps;
      }
    }
  }]);

  return RenderingLoop;
}();

module.exports = RenderingLoop;