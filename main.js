import { createApp } from "vue";

const HELP_HEADER = [
  "Minimum distance to show secret (int, optional, default is 20 meters)",
];
const HELP_PART = [
  "Latitude (float)",
  "Longitude (float)",
  "Secret (html)",
  "Point name (html, can be empty)",
];
const DEFAULT_VALUES = {
  hasMinimum: true,
  minimum: 20,
  points: [],
};

const utils = {
  base64URLTobase64(str) {
    const base64Encoded = str.replace(/-/gu, "+").replace(/_/gu, "/");
    const padding =
      str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
    return base64Encoded + padding;
  },
  base64tobase64URL(str) {
    return str.replace(/\+/gu, "-").replace(/\//gu, "_").replace(/[=]+$/u, "");
  },
  decodeData(str) {
    return LZString.decompressFromBase64(
      utils.base64URLTobase64(str.split("").reverse().join(""))
    );
  },
  encodeData(str) {
    return utils
      .base64tobase64URL(LZString.compressToBase64(str))
      .split("")
      .reverse()
      .join("");
  },
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  distance(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const dist2 =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const angle = 2 * Math.atan2(Math.sqrt(dist2), Math.sqrt(1 - dist2));
    return earthRadius * angle;
  },
};

const app = createApp({
  data() {
    return {
      debug: true,
      debugData:
        "48.85832397934772\n2.2940806701383734\n<i>You found me !</i>\nsample point",
      debugUrl: "",
      editor: {
        numbersCols: 0,
        numbersText: "",
        overlayText: "",
      },
      parsed: DEFAULT_VALUES,
      location: {
        available: false,
        latitude: 0,
        longitude: 0,
        precision: 0,
      },
      closestPointId: null,
    };
  },
  computed: {
    latitudeText() {
      return this.location.available
        ? `${this.dmsText(this.location.latitude)}${
            this.location.latitude > 0 ? "N" : "S"
          }`
        : "???";
    },
    longitudeText() {
      return this.location.available
        ? `${this.dmsText(this.location.longitude)}${
            this.location.longitude > 0 ? "E" : "W"
          }`
        : "???";
    },
    precisionText() {
      return this.location.available
        ? `${this.location.precision.toFixed(0)}m`
        : "???";
    },
  },
  watch: {
    debugData(value) {
      this.readZData(value);
      this.updateDebugUrl(value);
      this.updateEditor(value);
      this.closestPointId = this.closestPoint().id;
    },
  },
  beforeMount() {
    this.accessGeolocation();
    this.initApp();
  },
  mounted() {
    setTimeout(this.showApp);
    this.updateIcons();
  },
  updated() {
    this.updateIcons();
  },
  methods: {
    showApp() {
      document.getElementById("app").setAttribute("style", "");
    },
    initApp() {
      const url = new URL(window.location);
      if (url.searchParams.get("z") !== null) {
        this.debug = this.readZData(
          utils.decodeData(url.searchParams.get("z"))
        );
      }
      if (this.debug) {
        this.readZData(this.debugData);
        this.updateEditor(this.debugData);
        this.updateDebugUrl(this.debugData);
      }
    },
    updateIcons() {
      lucide.createIcons({
        nameAttr: "icon",
        attrs: {
          width: "1.1em",
          height: "1.1em",
        },
      });
    },
    updateDebugUrl(value) {
      this.debugUrl = value.trim().length
        ? `${window.location.pathname}?z=${utils.encodeData(value.trim())}`
        : "";
    },
    updateEditor(value) {
      const debugDataSplit = value.split("\n");
      let size = (this.parsed.hasMinimum ? 1 : 0) + HELP_PART.length;
      while (debugDataSplit.length > size) {
        size += HELP_PART.length;
      }
      const lines = Array(size).fill(0);
      this.editor.numbersText = debugDataSplit
        .map((_value, index) => `${index + 1}.`)
        .join("\n");
      this.editor.overlayText = lines
        .map((_value, index) => {
          if (
            debugDataSplit.length > index &&
            debugDataSplit[index].trim().length
          ) {
            return " ".repeat(debugDataSplit[index].length);
          }
          if (this.parsed.hasMinimum && index === 0) {
            return HELP_HEADER[0];
          }
          return HELP_PART[
            (index - (this.parsed.hasMinimum ? 1 : 0)) % HELP_PART.length
          ];
        })
        .join("\n");
      this.editor.numbersCols = lines.length.toString().length + 1;
    },
    scrollEditor() {
      this.$refs.numbers.scrollTop = this.$refs.code.scrollTop;
      this.$refs.overlay.scrollTop = this.$refs.code.scrollTop;
      this.$refs.overlay.scrollLeft = this.$refs.code.scrollLeft;
    },
    readZData(str) {
      this.debugData = str;
      this.parsed = utils.clone(DEFAULT_VALUES);
      const parts = str.split("\n");
      if (parts.length < 3) {
        return true;
      }
      if (/^\d+$/u.test(parts[0])) {
        this.parsed.minimum = parseInt(parts.shift(), 10);
      } else {
        this.parsed.hasMinimum = parts[0].trim().length === 0;
      }
      while (parts.length >= 3) {
        this.parsed.points.push({
          id: this.parsed.points.length + 1,
          latitude: parseFloat(parts.shift()),
          longitude: parseFloat(parts.shift()),
          treasure: parts.shift(),
          name: parts.length > 0 ? parts.shift() : null,
        });
      }
      return false;
    },
    closestPoint() {
      let minDistance = Number.MAX_VALUE;
      let [minPoint] = this.parsed.points;
      for (let index = 0; index < this.parsed.points.length; index += 1) {
        const point = this.parsed.points[index];
        const distance = this.distanceToPoint(point);
        if (distance < minDistance) {
          minDistance = distance;
          minPoint = point;
        }
      }
      return minPoint;
    },
    dmsText(value) {
      const deg = Math.abs(value);
      const min = (deg - Math.floor(deg)) * 60;
      const sec = (min - Math.floor(min)) * 60;
      return `${Math.floor(deg).toFixed(0)}°${Math.floor(min)
        .toFixed(0)
        .padStart(2, "0")}'${sec.toFixed(2).padStart(5, "0")}"`;
    },
    distanceText(value) {
      if (!this.location.available) {
        return "???";
      }
      if (value > 100_000) {
        return `${(value / 1_000).toFixed(0)}km`;
      }
      if (value > 10_000) {
        return `${(value / 1_000).toFixed(1)}km`;
      }
      if (value > 1_000) {
        return `${(value / 1_000).toFixed(2)}km`;
      }
      return `${value.toFixed(0)}m`;
    },
    distanceToPoint(point) {
      if (!this.location.available) {
        return Number.MAX_VALUE;
      }
      return Math.max(
        this.location.precision,
        utils.distance(
          this.location.latitude,
          this.location.longitude,
          point.latitude,
          point.longitude
        )
      );
    },
    pointStyle(point) {
      if (!this.location.available) {
        return "";
      }
      const limit = Math.max(this.parsed.minimum, this.location.precision);
      const dist = this.distanceToPoint(point) - limit;
      const ratio = Math.max(1, dist / (4 * limit));
      return `color: color-mix(in srgb, var(--text-primary) ${
        100 * ratio
      }%, #B71C1C)`;
    },
    closest(point) {
      if (!this.location.available) {
        return false;
      }
      return point.id === this.closestPointId;
    },
    precisionStyle() {
      if (!this.location.available) {
        return "";
      }
      const ratio = Math.min(
        1,
        Math.max(0, this.location.precision - this.parsed.minimum) /
          (4 * this.parsed.minimum)
      );
      return `color: color-mix(in srgb, #B71C1C ${
        100 * ratio
      }%, var(--text-primary))`;
    },
    updatePosition(position) {
      this.location = {
        available: true,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        precision: position.coords.accuracy,
      };
      this.closestPointId = this.closestPoint().id;
    },
    accessGeolocation() {
      if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
          this.updatePosition,
          () => {
            this.position.available = false;
          },
          {
            maximumAge: 250,
            enableHighAccuracy: true,
          }
        );
      }
    },
  },
});

window.onload = () => {
  app.mount("#app");
};
