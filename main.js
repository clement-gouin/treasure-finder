/* exported app, utils */
let app = {
  data() {
    return {
      locationAvailable: false,
      latitude: 0,
      longitude: 0,
      points: [],
      MINIMUM: 20,
    };
  },
  computed: {
    currentYear() {
      return new Date().getFullYear();
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
  methods: {
    isValidUrl(value) {
      try {
        return Boolean(new URL(value));
      } catch (e) {
        return false;
      }
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
      const percent = (100 * d) / 1000;
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
        navigator.geolocation.watchPosition(this.updatePosition);
      }
    },
    base64URLTobase64(str) {
      const base64Encoded = str.replace(/-/g, "+").replace(/_/g, "/");
      const padding =
        str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
      return base64Encoded + padding;
    },
    decodeData(str) {
      return this.base64URLTobase64(str.split("").reverse().join(""));
    },
    fetchData() {
      const url = new URL(window.location);
      if (url.searchParams.get("data") !== null) {
        fetch(atob(this.decodeData(url.searchParams.get("data"))), {
          headers: {
            Origin: window.location.host,
          },
          cache: "no-store",
        }).then((response) => {
          response.json().then((content) => {
            this.points = content.map((point, i) => {
              point.id = i;
              return point;
            });
          });
        });
      }
      if (url.searchParams.get("z") !== null) {
        this.points = JSON.parse(
          LZString.decompressFromBase64(
            this.decodeData(url.searchParams.get("z"))
          )
        ).map((point, i) => {
          point.id = i;
          return point;
        });
      }
    },
  },
  beforeMount: function () {
    this.accessGeolocation();
    this.fetchData();
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
