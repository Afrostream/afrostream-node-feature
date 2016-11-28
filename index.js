const assert = require('better-assert');

class Features {
  constructor(features) {
    this.features = {};
    this.load(features || {});
  }

  _processVariant(variant) {
    assert(typeof variant === "string" ||
           typeof variant === "object" && variant && typeof variant.variant === "string");
    if (typeof variant === "string") {
      return { variant: variant };
    }
    return variant;
  }

  load(inputFeatures) {
    const features = {};
    Object.keys(inputFeatures)
      .forEach((f) => { features[f] = this._processVariant(inputFeatures[f]); });
    Object.assign(this.features, features);
  }

  isEnabled(key) {
    if (typeof this.features[key] === "undefined") {
      console.warn('[WARNING]: unknown feature '+key);
      return false;
    }
    const variant = this.features[key].variant;

    return !(
              variant === "0" ||
              variant === "false"
            );
  }

  isDisabled(key) {
    return !this.isEnabled(key);
  }

  getVariant(key) {
    if (typeof this.features[key] === "undefined") {
      console.warn('[WARNING]: unknown feature '+key);
      return null;
    }
    return this.features[key].variant;
  }
}

const middleware = function (options) {
  options = options || { };
  options.features = options.features || {};

  //
  const harvestFeaturesInQuery = (req) => {
    return req.query || {};
  };
  const harvestFeaturesInHeaders = (req) => {
    try {
      return JSON.parse(req.headers.get('features'));
    } catch (e) {
      return {};
    }
  };

  return (req, res, next) => {
    try {
      const reqFeatures = Object.assign(
        {},
        harvestFeaturesInQuery(req),
        harvestFeaturesInHeaders(req)
      );

      req.features = new Features();
      if (options.features instanceof Features) {
        req.features.load(options.features.features);
      }
      req.features.load(reqFeatures);
    } catch (e) {
      // should never reach this !
      console.error('[ERROR]: loading features ' + e.message);
    }
    next();
  };
};

module.exports = {
  Features: Features,
  middleware: middleware
};
