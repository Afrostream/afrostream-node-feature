const assert = require('better-assert');

class Features {
  constructor(options = {}) {
    this.features = {};
    this.context = {
      req: options.req
    };
    this.logger = options.logger || console;
    // prefixing logger if possible
    if (this.logger.prefix) {
      this.logger = this.logger.prefix('FEATURE');
    }
  }

  _processVariant(variant) {
    assert(typeof variant === "string" ||
      typeof variant === "object" && variant && typeof variant.variant === "string");

    if (typeof variant === "string") {
      return {
        variant: variant
      };
    }
    return variant;
  }

  load(inputFeatures) {
    assert(typeof inputFeatures === 'object');

    const features = {};
    this.logger.info('loading ' + JSON.stringify(inputFeatures));
    Object.keys(inputFeatures)
      .forEach((f) => {
        features[f] = this._processVariant(inputFeatures[f]);
      });
    Object.assign(this.features, features);
    this.logger.info('features = ' + JSON.stringify(this.features));
  }

  isEnabled(key) {
    assert(typeof key === 'string');

    this.logger.info('isEnabled(' + key + ') ?');
    if (typeof this.features[key] === "undefined") {
      this.logger.warn('[WARNING]: unknown feature ' + key);
      return false;
    }
    const variant = this.features[key].variant;
    let enabled = !(
      variant === "0" ||
      variant === "false" ||
      variant === "off"
    );
    this.logger.info('isEnabled(' + key + ') ='+enabled);
    if (enabled && this.features[key].rampedUp) {
      assert(this.features[key].rampedUp === 'number');
      enabled = (Math.random() < this.features[key].rampedUp);
      this.logger.info('isEnabled(' + key + ') rampedUp ='+enabled);
    }
    if (enabled && Array.isArray(this.features[key].ipList) && this.context.req) {
      const userIp = (this.context.req.userIp || this.context.req.ip);
      enabled = this.features[key].ipList.some(ip => userIp.match(ip));
      this.logger.info('isEnabled(' + key + ') rampedUp ='+enabled);
    }
    this.logger.info('isEnabled(' + key + ') ='+enabled);
    return enabled;
  }

  isDisabled(key) {
    assert(typeof key === 'string');

    return !this.isEnabled(key);
  }

  getVariant(key) {
    assert(typeof key === 'string');

    if (typeof this.features[key] === "undefined") {
      console.warn('[WARNING]: unknown feature ' + key);
      return null;
    }
    return this.features[key].variant;
  }
}

const middleware = function(options) {
  options = options || {};
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
      const reqFeatures = Object.assign({},
        harvestFeaturesInQuery(req),
        harvestFeaturesInHeaders(req)
      );

      req.features = new Features({
        req: req,
        logger: req.logger
      });
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
