/* exported app, utils */
let app = {
  data() {
    return {
      debug: true,
      debugData:
        "48.85832397934772\n2.2940806701383734\n<i>You found me !</i>\nsample point",
      locationAvailable: false,
      latitude: 0,
      longitude: 0,
      points: [],
      minimum: 0,
    };
  },
  computed: {
    debugUrl() {
      return window.location.pathname + "?z=" + this.encodeData(this.debugData);
    },
    latitudeText() {
      return `${this.dmsText(this.latitude)}${this.latitude > 0 ? "N" : "S"}`;
    },
    longitudeText() {
      return `${this.dmsText(this.longitude)}${this.longitude > 0 ? "E" : "W"}`;
    },
    closestPoint() {
      let minDistance = Number.MAX_VALUE;
      let minPoint = this.points[0];
      for (let index = 0; index < this.points.length; index++) {
        const point = this.points[index];
        const distance = this.distanceToPoint(point);
        if (distance < minDistance) {
          minDistance = distance;
          minPoint = point;
        }
      }
      return minPoint;
    },
  },
  watch: {
    debugData(value) {
      this.readZData(value);
    },
  },
  methods: {
    dmsText(value) {
      const deg = Math.abs(value);
      const min = (deg - Math.floor(deg)) * 60;
      const sec = (min - Math.floor(min)) * 60;
      return `${Math.floor(deg).toFixed(0)}°${Math.floor(min)
        .toFixed(0)
        .padStart(2, "0")}'${sec.toFixed(2).padStart(5, "0")}"`;
    },
    distanceText(value) {
      if (!this.locationAvailable) {
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
    distance(lat1, lon1, lat2, lon2) {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    distanceToPoint(point) {
      if (!this.locationAvailable) {
        return Number.MAX_VALUE;
      }
      return this.distance(
        this.latitude,
        this.longitude,
        point.latitude,
        point.longitude
      );
    },
    style(point) {
      if (!this.locationAvailable) {
        return "";
      }
      const d = this.distanceToPoint(point);
      const percent = ((100 * d) / 5) * this.minimum;
      const mix = `color-mix(in srgb, #212121 ${percent}%, #B71C1C)`;
      return `font-weight: ${
        point.id === this.closestPoint.id ? "bold" : "normal"
      }; color: ${d > 1000 ? "inherit" : mix}`;
    },
    showApp() {
      document.getElementById("app").setAttribute("style", "");
    },
    updatePosition(position) {
      this.locationAvailable = true;
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;
    },
    accessGeolocation() {
      if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(this.updatePosition, () => {}, {
          maximumAge: 250,
          enableHighAccuracy: true,
        });
      }
    },
    base64URLTobase64(str) {
      const base64Encoded = str.replace(/-/g, "+").replace(/_/g, "/");
      const padding =
        str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
      return base64Encoded + padding;
    },
    base64tobase64URL(str) {
      return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    },
    decodeData(str) {
      return LZString.decompressFromBase64(
        this.base64URLTobase64(str.split("").reverse().join(""))
      );
    },
    encodeData(str) {
      return this.base64tobase64URL(LZString.compressToBase64(str))
        .split("")
        .reverse()
        .join("");
    },
    readZData(str) {
      this.debugData = str;
      const parts = str.trim().split("\n");
      if (parts.length < 3) {
        return true;
      }
      this.points = [];
      while (parts.length >= 3) {
        this.points.push({
          id: this.points.length + 1,
          latitude: parseFloat(parts.shift()),
          longitude: parseFloat(parts.shift()),
          treasure: parts.shift(),
          name: parts.length > 0 ? parts.shift() : null,
        });
      }
      if (parts.length > 0 && /^\d+$/.test(parts.slice(-1)[0])) {
        this.minimum = parseInt(parts.slice(-1)[0]);
      } else {
        this.minimum = 10;
      }
      return false;
    },
    initApp() {
      const url = new URL(window.location);
      if (url.searchParams.get("z") !== null) {
        this.debug = this.readZData(this.decodeData(url.searchParams.get("z")));
      }
      if (this.debug) {
        this.readZData(this.debugData);
      }
    },
  },
  beforeMount: function () {
    this.accessGeolocation();
    this.initApp();
  },
  mounted: function () {
    console.log("app mounted");
    setTimeout(this.showApp);
  },
};

window.onload = () => {
  app = Vue.createApp(app);
  app.mount("#app");
};
