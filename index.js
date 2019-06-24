"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var RenderingLoop =
/*#__PURE__*/
function () {
  function RenderingLoop(params) {
    _classCallCheck(this, RenderingLoop);

    this.fps = params.fps;
    this.simulationStep = 1000 / this.fps;
    this.frameDelta = 0;
    this.lastFrameTimeMs = 0;
    this.lastFpsUpdate = 0;
    this.framesThisSecond = 0;
    this.numUpdateSteps = 0;
    this.minFrameDelay = 0;
    this.running = false;
    this.started = false;
    this.panic = false;
    this.rafHandle = null;
    this.animate = this.animate.bind(this);
  }

  _createClass(RenderingLoop, [{
    key: "begin",
    value: function begin(time, delta) {}
  }, {
    key: "end",
    value: function end(fps, panic) {}
  }, {
    key: "update",
    value: function update(delta) {}
  }, {
    key: "render",
    value: function render(interpolation) {}
  }, {
    key: "resetFrameDelta",
    value: function resetFrameDelta() {
      var frameDelta = this.frameDelta;
      this.frameDelta = 0;
      return frameDelta;
    }
  }, {
    key: "start",
    value: function start() {
      var _this = this;

      if (this.started) {
        return;
      }

      this.started = true;
      this.rafHandle = requestAnimationFrame(function (timestamp) {
        _this.render(1);

        _this.running = true;
        _this.lastFrameTimeMs = timestamp;
        _this.lastFpsUpdate = timestamp;
        _this.framesThisSecond = 0;
        _this.rafHandle = requestAnimationFrame(_this.animate);
      });
    }
  }, {
    key: "stop",
    value: function stop() {
      this.running = false;
      this.started = false;
      cancelAnimationFrame(this.rafHandle);
    }
  }, {
    key: "animate",
    value: function animate(time) {
      this.rafHandle = requestAnimationFrame(this.animate);

      if (time < this.lastFrameTimeMs + this.minFrameDelay) {
        return;
      }

      this.frameDelta += time - this.lastFrameTimeMs;
      this.lastFrameTimeMs = time;
      this.begin(time, this.frameDelta);

      if (time > this.lastFpsUpdate + 1000) {
        this.fps = 0.25 * this.framesThisSecond + 0.75 * this.fps;
        this.lastFpsUpdate = time;
        this.framesThisSecond = 0;
      }

      ++this.framesThisSecond;
      this.numUpdateSteps = 0;

      while (this.frameDelta >= this.simulationStep) {
        this.update(this.simulationStep);
        this.frameDelta -= this.simulationStep;

        if (++this.numUpdateSteps >= 240) {
          this.panic = true;
          break;
        }
      }

      this.render(this.frameDelta / this.simulationStep);
      this.end(this.fps, this.panic);
      this.panic = false;
    }
  }, {
    key: "maxAllowedFps",
    get: function get() {
      return 1000 / this.minFrameDelay;
    },
    set: function set(fps) {
      if (fps == null) {
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