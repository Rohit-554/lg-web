class e {
  constructor(a, b, c, d, f) {
    this._legacyCanvasSize = e.DEFAULT_CANVAS_SIZE;
    this._preferredCamera = "environment";
    this._maxScansPerSecond = 25;
    this._lastScanTimestamp = -1;
    this._destroyed = this._flashOn = this._paused = this._active = !1;
    this.$video = a;
    this.$canvas = document.createElement("canvas");
    c && "object" === typeof c
      ? (this._onDecode = b)
      : (c || d || f
          ? console.warn(
              "You're using a deprecated version of the QrScanner constructor which will be removed in the future"
            )
          : console.warn(
              "Note that the type of the scan result passed to onDecode will change in the future. To already switch to the new api today, you can pass returnDetailedScanResult: true."
            ),
        (this._legacyOnDecode = b));
    b = "object" === typeof c ? c : {};
    this._onDecodeError =
      b.onDecodeError || ("function" === typeof c ? c : this._onDecodeError);
    this._calculateScanRegion =
      b.calculateScanRegion ||
      ("function" === typeof d ? d : this._calculateScanRegion);
    this._preferredCamera = b.preferredCamera || f || this._preferredCamera;
    this._legacyCanvasSize =
      "number" === typeof c
        ? c
        : "number" === typeof d
        ? d
        : this._legacyCanvasSize;
    this._maxScansPerSecond = b.maxScansPerSecond || this._maxScansPerSecond;
    this._onPlay = this._onPlay.bind(this);
    this._onLoadedMetaData = this._onLoadedMetaData.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._updateOverlay = this._updateOverlay.bind(this);
    a.disablePictureInPicture = !0;
    a.playsInline = !0;
    a.muted = !0;
    let h = !1;
    a.hidden && ((a.hidden = !1), (h = !0));
    document.querySelector("lg-settings").shadowRoot.contains(a) ||
      (document.querySelector("lg-settings").shadowRoot.appendChild(a),
      (h = !0));
    c = a.parentElement;
    if (b.highlightScanRegion || b.highlightCodeOutline) {
      d = !!b.overlay;
      this.$overlay = b.overlay || document.createElement("div");
      f = this.$overlay.style;
      f.position = "absolute";
      f.display = "none";
      f.pointerEvents = "none";
      this.$overlay.classList.add("scan-region-highlight");
      if (!d && b.highlightScanRegion) {
        this.$overlay.innerHTML =
          '<svg class="scan-region-highlight-svg" viewBox="0 0 238 238" preserveAspectRatio="none" style="position:absolute;width:100%;height:100%;left:0;top:0;fill:none;stroke:#e9b213;stroke-width:4;stroke-linecap:round;stroke-linejoin:round"><path d="M31 2H10a8 8 0 0 0-8 8v21M207 2h21a8 8 0 0 1 8 8v21m0 176v21a8 8 0 0 1-8 8h-21m-176 0H10a8 8 0 0 1-8-8v-21"/></svg>';
        try {
          this.$overlay.firstElementChild.animate(
            { transform: ["scale(.98)", "scale(1.01)"] },
            {
              duration: 400,
              iterations: Infinity,
              direction: "alternate",
              easing: "ease-in-out",
            }
          );
        } catch (m) {}
        c.insertBefore(this.$overlay, this.$video.nextSibling);
      }
      b.highlightCodeOutline &&
        (this.$overlay.insertAdjacentHTML(
          "beforeend",
          '<svg class="code-outline-highlight" preserveAspectRatio="none" style="display:none;width:100%;height:100%;fill:none;stroke:#e9b213;stroke-width:5;stroke-dasharray:25;stroke-linecap:round;stroke-linejoin:round"><polygon/></svg>'
        ),
        (this.$codeOutlineHighlight = this.$overlay.lastElementChild));
    }
    this._scanRegion = this._calculateScanRegion(a);
    requestAnimationFrame(() => {
      let m = window.getComputedStyle(a);
      "none" === m.display &&
        (a.style.setProperty("display", "block", "important"), (h = !0));
      "visible" !== m.visibility &&
        (a.style.setProperty("visibility", "visible", "important"), (h = !0));
      h &&
        (console.warn(
          "QrScanner has overwritten the video hiding style to avoid Safari stopping the playback."
        ),
        (a.style.opacity = "0"),
        (a.style.width = "0"),
        (a.style.height = "0"),
        this.$overlay &&
          this.$overlay.parentElement &&
          this.$overlay.parentElement.removeChild(this.$overlay),
        delete this.$overlay,
        delete this.$codeOutlineHighlight);
      this.$overlay && this._updateOverlay();
    });
    a.addEventListener("play", this._onPlay);
    a.addEventListener("loadedmetadata", this._onLoadedMetaData);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
    window.addEventListener("resize", this._updateOverlay);
    this._qrEnginePromise = e.createQrEngine();
  }
  static set WORKER_PATH(a) {
    console.warn(
      "Setting QrScanner.WORKER_PATH is not required and not supported anymore. Have a look at the README for new setup instructions."
    );
  }
  static async hasCamera() {
    try {
      return !!(await e.listCameras(!1)).length;
    } catch (a) {
      return !1;
    }
  }
  static async listCameras(a = !1) {
    if (!navigator.mediaDevices) return [];
    let b = async () =>
        (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => "videoinput" === d.kind
        ),
      c;
    try {
      a &&
        (await b()).every((d) => !d.label) &&
        (c = await navigator.mediaDevices.getUserMedia({
          audio: !1,
          video: !0,
        }));
    } catch (d) {}
    try {
      return (await b()).map((d, f) => ({
        id: d.deviceId,
        label: d.label || (0 === f ? "Default Camera" : `Camera ${f + 1}`),
      }));
    } finally {
      c &&
        (console.warn(
          "Call listCameras after successfully starting a QR scanner to avoid creating a temporary video stream"
        ),
        e._stopVideoStream(c));
    }
  }
  async hasFlash() {
    let a;
    try {
      if (this.$video.srcObject) {
        if (!(this.$video.srcObject instanceof MediaStream)) return !1;
        a = this.$video.srcObject;
      } else a = (await this._getCameraStream()).stream;
      return "torch" in a.getVideoTracks()[0].getSettings();
    } catch (b) {
      return !1;
    } finally {
      a &&
        a !== this.$video.srcObject &&
        (console.warn(
          "Call hasFlash after successfully starting the scanner to avoid creating a temporary video stream"
        ),
        e._stopVideoStream(a));
    }
  }
  isFlashOn() {
    return this._flashOn;
  }
  async toggleFlash() {
    this._flashOn ? await this.turnFlashOff() : await this.turnFlashOn();
  }
  async turnFlashOn() {
    if (
      !this._flashOn &&
      !this._destroyed &&
      ((this._flashOn = !0), this._active && !this._paused)
    )
      try {
        if (!(await this.hasFlash())) throw "No flash available";
        await this.$video.srcObject
          .getVideoTracks()[0]
          .applyConstraints({ advanced: [{ torch: !0 }] });
      } catch (a) {
        throw ((this._flashOn = !1), a);
      }
  }
  async turnFlashOff() {
    this._flashOn && ((this._flashOn = !1), await this._restartVideoStream());
  }
  destroy() {
    this.$video.removeEventListener("loadedmetadata", this._onLoadedMetaData);
    this.$video.removeEventListener("play", this._onPlay);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    window.removeEventListener("resize", this._updateOverlay);
    this._destroyed = !0;
    this._flashOn = !1;
    this.stop();
    e._postWorkerMessage(this._qrEnginePromise, "close");
  }
  async start() {
    if (this._destroyed)
      throw Error(
        "The QR scanner can not be started as it had been destroyed."
      );
    if (!this._active || this._paused)
      if (
        ("https:" !== window.location.protocol &&
          console.warn(
            "The camera stream is only accessible if the page is transferred via https."
          ),
        (this._active = !0),
        !document.hidden)
      )
        if (((this._paused = !1), this.$video.srcObject))
          await this.$video.play();
        else
          try {
            let { stream: a, facingMode: b } = await this._getCameraStream();
            !this._active || this._paused
              ? e._stopVideoStream(a)
              : (this._setVideoMirror(b),
                (this.$video.srcObject = a),
                await this.$video.play(),
                this._flashOn &&
                  ((this._flashOn = !1), this.turnFlashOn().catch(() => {})));
          } catch (a) {
            if (!this._paused) throw ((this._active = !1), a);
          }
  }
  stop() {
    this.pause();
    this._active = !1;
  }
  async pause(a = !1) {
    this._paused = !0;
    if (!this._active) return !0;
    this.$video.pause();
    this.$overlay && (this.$overlay.style.display = "none");
    let b = () => {
      this.$video.srcObject instanceof MediaStream &&
        (e._stopVideoStream(this.$video.srcObject),
        (this.$video.srcObject = null));
    };
    if (a) return b(), !0;
    await new Promise((c) => setTimeout(c, 300));
    if (!this._paused) return !1;
    b();
    return !0;
  }
  async setCamera(a) {
    a !== this._preferredCamera &&
      ((this._preferredCamera = a), await this._restartVideoStream());
  }
  static async scanImage(a, b, c, d, f = !1, h = !1) {
    let m,
      n = !1;
    b &&
    ("scanRegion" in b ||
      "qrEngine" in b ||
      "canvas" in b ||
      "disallowCanvasResizing" in b ||
      "alsoTryWithoutScanRegion" in b ||
      "returnDetailedScanResult" in b)
      ? ((m = b.scanRegion),
        (c = b.qrEngine),
        (d = b.canvas),
        (f = b.disallowCanvasResizing || !1),
        (h = b.alsoTryWithoutScanRegion || !1),
        (n = !0))
      : b || c || d || f || h
      ? console.warn(
          "You're using a deprecated api for scanImage which will be removed in the future."
        )
      : console.warn(
          "Note that the return type of scanImage will change in the future. To already switch to the new api today, you can pass returnDetailedScanResult: true."
        );
    b = !!c;
    try {
      let p, k;
      [c, p] = await Promise.all([c || e.createQrEngine(), e._loadImage(a)]);
      [d, k] = e._drawToCanvas(p, m, d, f);
      let q;
      if (c instanceof Worker) {
        let g = c;
        b || e._postWorkerMessageSync(g, "inversionMode", "both");
        q = await new Promise((l, v) => {
          let w,
            u,
            r,
            y = -1;
          u = (t) => {
            t.data.id === y &&
              (g.removeEventListener("message", u),
              g.removeEventListener("error", r),
              clearTimeout(w),
              null !== t.data.data
                ? l({
                    data: t.data.data,
                    cornerPoints: e._convertPoints(t.data.cornerPoints, m),
                  })
                : v(e.NO_QR_CODE_FOUND));
          };
          r = (t) => {
            g.removeEventListener("message", u);
            g.removeEventListener("error", r);
            clearTimeout(w);
            v("Scanner error: " + (t ? t.message || t : "Unknown Error"));
          };
          g.addEventListener("message", u);
          g.addEventListener("error", r);
          w = setTimeout(() => r("timeout"), 1e4);
          let x = k.getImageData(0, 0, d.width, d.height);
          y = e._postWorkerMessageSync(g, "decode", x, [x.data.buffer]);
        });
      } else
        q = await Promise.race([
          new Promise((g, l) =>
            window.setTimeout(() => l("Scanner error: timeout"), 1e4)
          ),
          (async () => {
            try {
              var [g] = await c.detect(d);
              if (!g) throw e.NO_QR_CODE_FOUND;
              return {
                data: g.rawValue,
                cornerPoints: e._convertPoints(g.cornerPoints, m),
              };
            } catch (l) {
              g = l.message || l;
              if (/not implemented|service unavailable/.test(g))
                return (
                  (e._disableBarcodeDetector = !0),
                  e.scanImage(a, {
                    scanRegion: m,
                    canvas: d,
                    disallowCanvasResizing: f,
                    alsoTryWithoutScanRegion: h,
                  })
                );
              throw `Scanner error: ${g}`;
            }
          })(),
        ]);
      return n ? q : q.data;
    } catch (p) {
      if (!m || !h) throw p;
      let k = await e.scanImage(a, {
        qrEngine: c,
        canvas: d,
        disallowCanvasResizing: f,
      });
      return n ? k : k.data;
    } finally {
      b || e._postWorkerMessage(c, "close");
    }
  }
  setGrayscaleWeights(a, b, c, d = !0) {
    e._postWorkerMessage(this._qrEnginePromise, "grayscaleWeights", {
      red: a,
      green: b,
      blue: c,
      useIntegerApproximation: d,
    });
  }
  setInversionMode(a) {
    e._postWorkerMessage(this._qrEnginePromise, "inversionMode", a);
  }
  static async createQrEngine(a) {
    a &&
      console.warn(
        "Specifying a worker path is not required and not supported anymore."
      );
    a = () =>
      import("./qr-scanner-worker.min.js").then((c) => c.createWorker());
    if (
      !(
        !e._disableBarcodeDetector &&
        "BarcodeDetector" in window &&
        BarcodeDetector.getSupportedFormats &&
        (await BarcodeDetector.getSupportedFormats()).includes("qr_code")
      )
    )
      return a();
    let b = navigator.userAgentData;
    return b &&
      b.brands.some(({ brand: c }) => /Chromium/i.test(c)) &&
      /mac ?OS/i.test(b.platform) &&
      (await b
        .getHighEntropyValues(["architecture", "platformVersion"])
        .then(
          ({ architecture: c, platformVersion: d }) =>
            /arm/i.test(c || "arm") && 13 <= parseInt(d || "13")
        )
        .catch(() => !0))
      ? a()
      : new BarcodeDetector({ formats: ["qr_code"] });
  }
  _onPlay() {
    this._scanRegion = this._calculateScanRegion(this.$video);
    this._updateOverlay();
    this.$overlay && (this.$overlay.style.display = "");
    this._scanFrame();
  }
  _onLoadedMetaData() {
    this._scanRegion = this._calculateScanRegion(this.$video);
    this._updateOverlay();
  }
  _onVisibilityChange() {
    document.hidden ? this.pause() : this._active && this.start();
  }
  _calculateScanRegion(a) {
    let b = Math.round((2 / 3) * Math.min(a.videoWidth, a.videoHeight));
    return {
      x: Math.round((a.videoWidth - b) / 2),
      y: Math.round((a.videoHeight - b) / 2),
      width: b,
      height: b,
      downScaledWidth: this._legacyCanvasSize,
      downScaledHeight: this._legacyCanvasSize,
    };
  }
  _updateOverlay() {
    requestAnimationFrame(() => {
      if (this.$overlay) {
        var a = this.$video,
          b = a.videoWidth,
          c = a.videoHeight,
          d = a.offsetWidth,
          f = a.offsetHeight,
          h = a.offsetLeft,
          m = a.offsetTop,
          n = window.getComputedStyle(a),
          p = n.objectFit,
          k = b / c,
          q = d / f;
        switch (p) {
          case "none":
            var g = b;
            var l = c;
            break;
          case "fill":
            g = d;
            l = f;
            break;
          default:
            ("cover" === p ? k > q : k < q)
              ? ((l = f), (g = l * k))
              : ((g = d), (l = g / k)),
              "scale-down" === p &&
                ((g = Math.min(g, b)), (l = Math.min(l, c)));
        }
        var [v, w] = n.objectPosition.split(" ").map((r, y) => {
          const x = parseFloat(r);
          return r.endsWith("%") ? ((y ? f - l : d - g) * x) / 100 : x;
        });
        n = this._scanRegion.width || b;
        q = this._scanRegion.height || c;
        p = this._scanRegion.x || 0;
        var u = this._scanRegion.y || 0;
        k = this.$overlay.style;
        k.width = `${(n / b) * g}px`;
        k.height = `${(q / c) * l}px`;
        k.top = `${m + w + (u / c) * l}px`;
        c = /scaleX\(-1\)/.test(a.style.transform);
        k.left = `${h + (c ? d - v - g : v) + ((c ? b - p - n : p) / b) * g}px`;
        k.transform = a.style.transform;
      }
    });
  }
  static _convertPoints(a, b) {
    if (!b) return a;
    let c = b.x || 0,
      d = b.y || 0,
      f = b.width && b.downScaledWidth ? b.width / b.downScaledWidth : 1;
    b = b.height && b.downScaledHeight ? b.height / b.downScaledHeight : 1;
    for (let h of a) (h.x = h.x * f + c), (h.y = h.y * b + d);
    return a;
  }
  _scanFrame() {
    !this._active ||
      this.$video.paused ||
      this.$video.ended ||
      ("requestVideoFrameCallback" in this.$video
        ? this.$video.requestVideoFrameCallback.bind(this.$video)
        : requestAnimationFrame)(async () => {
        if (!(1 >= this.$video.readyState)) {
          var a = Date.now() - this._lastScanTimestamp,
            b = 1e3 / this._maxScansPerSecond;
          a < b && (await new Promise((d) => setTimeout(d, b - a)));
          this._lastScanTimestamp = Date.now();
          try {
            var c = await e.scanImage(this.$video, {
              scanRegion: this._scanRegion,
              qrEngine: this._qrEnginePromise,
              canvas: this.$canvas,
            });
          } catch (d) {
            if (!this._active) return;
            this._onDecodeError(d);
          }
          !e._disableBarcodeDetector ||
            (await this._qrEnginePromise) instanceof Worker ||
            (this._qrEnginePromise = e.createQrEngine());
          c
            ? (this._onDecode
                ? this._onDecode(c)
                : this._legacyOnDecode && this._legacyOnDecode(c.data),
              this.$codeOutlineHighlight &&
                (clearTimeout(this._codeOutlineHighlightRemovalTimeout),
                (this._codeOutlineHighlightRemovalTimeout = void 0),
                this.$codeOutlineHighlight.setAttribute(
                  "viewBox",
                  `${this._scanRegion.x || 0} ` +
                    `${this._scanRegion.y || 0} ` +
                    `${this._scanRegion.width || this.$video.videoWidth} ` +
                    `${this._scanRegion.height || this.$video.videoHeight}`
                ),
                this.$codeOutlineHighlight.firstElementChild.setAttribute(
                  "points",
                  c.cornerPoints.map(({ x: d, y: f }) => `${d},${f}`).join(" ")
                ),
                (this.$codeOutlineHighlight.style.display = "")))
            : this.$codeOutlineHighlight &&
              !this._codeOutlineHighlightRemovalTimeout &&
              (this._codeOutlineHighlightRemovalTimeout = setTimeout(
                () => (this.$codeOutlineHighlight.style.display = "none"),
                100
              ));
        }
        this._scanFrame();
      });
  }
  _onDecodeError(a) {
    a !== e.NO_QR_CODE_FOUND && console.log(a);
  }
  async _getCameraStream() {
    if (!navigator.mediaDevices) throw "Camera not found.";
    let a = /^(environment|user)$/.test(this._preferredCamera)
        ? "facingMode"
        : "deviceId",
      b = [{ width: { min: 1024 } }, { width: { min: 768 } }, {}],
      c = b.map((d) =>
        Object.assign({}, d, { [a]: { exact: this._preferredCamera } })
      );
    for (let d of [...c, ...b])
      try {
        let f = await navigator.mediaDevices.getUserMedia({
            video: d,
            audio: !1,
          }),
          h =
            this._getFacingMode(f) ||
            (d.facingMode
              ? this._preferredCamera
              : "environment" === this._preferredCamera
              ? "user"
              : "environment");
        return { stream: f, facingMode: h };
      } catch (f) {}
    throw "Camera not found.";
  }
  async _restartVideoStream() {
    let a = this._paused;
    (await this.pause(!0)) && !a && this._active && (await this.start());
  }
  static _stopVideoStream(a) {
    for (let b of a.getTracks()) b.stop(), a.removeTrack(b);
  }
  _setVideoMirror(a) {
    this.$video.style.transform = "scaleX(" + ("user" === a ? -1 : 1) + ")";
  }
  _getFacingMode(a) {
    return (a = a.getVideoTracks()[0])
      ? /rear|back|environment/i.test(a.label)
        ? "environment"
        : /front|user|face/i.test(a.label)
        ? "user"
        : null
      : null;
  }
  static _drawToCanvas(a, b, c, d = !1) {
    c = c || document.createElement("canvas");
    let f = b && b.x ? b.x : 0,
      h = b && b.y ? b.y : 0,
      m = b && b.width ? b.width : a.videoWidth || a.width,
      n = b && b.height ? b.height : a.videoHeight || a.height;
    d ||
      ((d = b && b.downScaledWidth ? b.downScaledWidth : m),
      (b = b && b.downScaledHeight ? b.downScaledHeight : n),
      c.width !== d && (c.width = d),
      c.height !== b && (c.height = b));
    b = c.getContext("2d", { alpha: !1 });
    b.imageSmoothingEnabled = !1;
    b.drawImage(a, f, h, m, n, 0, 0, c.width, c.height);
    return [c, b];
  }
  static async _loadImage(a) {
    if (a instanceof Image) return await e._awaitImageLoad(a), a;
    if (
      a instanceof HTMLVideoElement ||
      a instanceof HTMLCanvasElement ||
      a instanceof SVGImageElement ||
      ("OffscreenCanvas" in window && a instanceof OffscreenCanvas) ||
      ("ImageBitmap" in window && a instanceof ImageBitmap)
    )
      return a;
    if (
      a instanceof File ||
      a instanceof Blob ||
      a instanceof URL ||
      "string" === typeof a
    ) {
      let b = new Image();
      b.src =
        a instanceof File || a instanceof Blob
          ? URL.createObjectURL(a)
          : a.toString();
      try {
        return await e._awaitImageLoad(b), b;
      } finally {
        (a instanceof File || a instanceof Blob) && URL.revokeObjectURL(b.src);
      }
    } else throw "Unsupported image type.";
  }
  static async _awaitImageLoad(a) {
    (a.complete && 0 !== a.naturalWidth) ||
      (await new Promise((b, c) => {
        let d = (f) => {
          a.removeEventListener("load", d);
          a.removeEventListener("error", d);
          f instanceof ErrorEvent ? c("Image load error") : b();
        };
        a.addEventListener("load", d);
        a.addEventListener("error", d);
      }));
  }
  static async _postWorkerMessage(a, b, c, d) {
    return e._postWorkerMessageSync(await a, b, c, d);
  }
  static _postWorkerMessageSync(a, b, c, d) {
    if (!(a instanceof Worker)) return -1;
    let f = e._workerMessageId++;
    a.postMessage({ id: f, type: b, data: c }, d);
    return f;
  }
}
e.DEFAULT_CANVAS_SIZE = 400;
e.NO_QR_CODE_FOUND = "No QR code found";
e._disableBarcodeDetector = !1;
e._workerMessageId = 0;
export default e;
//# sourceMappingURL=qr-scanner.min.js.map
