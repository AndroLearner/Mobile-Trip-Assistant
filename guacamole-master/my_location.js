export default {
  isReady: false,
  isHighAccuracy: false,
  availablePromise: null,
  
  getInitialLocation(options = {}) {
    if (!this.availablePromise) {
      this.availablePromise = new Promise((resolve) => {
        this._resolveAvailablePromise = resolve;
      });
    }
    return this.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 10000,
      ...options,
    }).then(this.updateLocation.bind(this));
  },
  watchLocation() {
    if (this._watchId) return;
    this._watchId = navigator.geolocation.watchPosition((position) => {
      this.updateLocation(position);
    });
  },
  getHighAccuracyLocation(options = {}) {
    return this.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000,
      ...options,
    }).then((position) => {
      this.updateLocation({
        ...position,
        isHighAccuracy: true,
      });
      return position;
    });
  },
  getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  },
  updateLocation(position) {
    this.position = position;
    if (position.isHighAccuracy) {
      this.isHighAccuracy = true;
    }
    this.isReady = true;
    if (this._resolveAvailablePromise) {
      this._resolveAvailablePromise(this.position);
    } else {
      this.availablePromise = Promise.resolve(this);
    }
  },
};
