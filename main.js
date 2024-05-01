/* exported app, utils */
let app = {
  data() {
    return {
      locationAvailable: false,
      latitude: 0,
      longitude: 0,
      points: [],
    };
  },
  computed: {
    currentYear() {
      return new Date().getFullYear();
    },
    latitudeText() {
      return `${this.dmsText(this.latitude)}${this.latitude > 0 ? 'N' : 'S'}`;
    },
    longitudeText() {
      return `${this.dmsText(this.longitude)}${this.longitude > 0 ? 'E' : 'W'}`;
    },
  },
  methods: {
    dmsText(value) {
      const deg = Math.abs(value);
      const min = (deg - Math.floor(deg)) * 60;
      const sec = (min - Math.floor(min)) * 60;
      return `${Math.floor(deg).toFixed(0)}°${Math.floor(min).toFixed(0).padStart(2, '0')}'${sec.toFixed(2).padStart(5, '0')}"`;
    },
    distanceText(value) {
      if (value > 100_000) {
        return `${(value / 1_000).toFixed(0)}km`
      }
      if (value > 10_000) {
        return `${(value / 1_000).toFixed(1)}km`
      }
      if (value > 1_000) {
        return `${(value / 1_000).toFixed(2)}km`
      }
      return `${value.toFixed(0)}m`
    },
    distance(lat1, lon1, lat2, lon2) {
      const R = 6371e3;
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    distanceToPoint(point) {
      return this.distance(this.latitude, this.longitude, point.latitude, point.longitude);
    },
    showApp() {
      document.getElementById('app').setAttribute('style', '');
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
    base64URLdecode(str) {
      const base64Encoded = str.replace(/-/g, '+').replace(/_/g, '/');
      const padding = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
      const base64WithPadding = base64Encoded + padding;
      return atob(base64WithPadding);
    },
    decodeData(str) {
      return this.base64URLdecode(str.split("").reverse().join(""));
    },
    fetchData() {
      const url = new URL(window.location);
      if (url.searchParams.get("data") !== null) {
        fetch(this.decodeData(url.searchParams.get("data")), {
          headers: {
            Origin: window.location.host,
          },
          cache: 'no-store',
        })
          .then((response) => {
            response
              .json()
              .then((content) => {
                this.points = content;
              });
          })
      }
    }
  },
  beforeMount: function () {
    this.accessGeolocation();
    this.fetchData();
  },
  mounted: function () {
    console.log('app mounted');
    setTimeout(this.showApp);
  },
};

window.onload = () => {
  app = Vue.createApp(app);
  app.mount('#app');
};
