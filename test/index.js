const assert = require('assert');

const { Features, middleware } = require('../index.js');

describe('calling features', () => {
  it('should be able to load features', (done) => {
    const a = new Features();
    a.load({
      a: "true",
      b: "false",
      c: "1",
      d: "0",
      g: "null",
      i: "undefined",
      j: "null",
      k: "4242",
      l: "youpi",
      m: "off",
      n: "on"
    })
    assert(a.isEnabled('a') === true);
    assert(a.isEnabled('b') === false);
    assert(a.isEnabled('c') === true);
    assert(a.isEnabled('d') === false);
    assert(a.isEnabled('g') === true);
    assert(a.isEnabled('i') === true);
    assert(a.isEnabled('j') === true);
    assert(a.isEnabled('k') === true);
    assert(a.isEnabled('l') === true);
    assert(a.isEnabled('m') === false);
    assert(a.isEnabled('n') === true);
    assert(a.isEnabled('unknown') === false);
    done();
  });

  it('should be able to get variant', (done) => {
    const a = new Features();
    a.load({
      a: "true",
      b: "false",
      c: "1",
      d: "0",
      g: "null",
      i: "undefined",
      j: "null",
      k: "4242",
      l: "youpi"
    });
    assert(a.getVariant('a') === "true");
    assert(a.getVariant('b') === "false");
    assert(a.getVariant('unknown') === null);
    done();
  });

  it('should generate a middleware able to get features in query', (done) => {
    const defaultFeatures = {features:{'bar':'on'}};
    const mockReq = {query: {foo:'on'}};
    const mockRes = {};
    middleware(defaultFeatures)(mockReq, mockRes, function () {
      assert(mockReq.features.isEnabled('bar'));
      assert(mockReq.features.isEnabled('foo'));
      assert(mockReq.features.getVariant('bar') === 'on');
      assert(mockReq.features.getVariant('foo') === 'on');
      assert(mockReq.features.isEnabled('yop') === false);
      assert(mockReq.features.getVariant('yop') === null);
      done();
    });
  });

  it('should generate a middleware able to get features in headers', (done) => {
    const defaultFeatures = {features:{'bar':'on'}};
    const mockReq = {headers: { get: function (o) {
      assert(o === 'features');
      return JSON.stringify({'foo':'on'});
    }}};
    const mockRes = {};
    middleware(defaultFeatures)(mockReq, mockRes, function () {
      assert(mockReq.features.isEnabled('bar'));
      assert(mockReq.features.isEnabled('foo'));
      assert(mockReq.features.getVariant('bar') === 'on');
      assert(mockReq.features.getVariant('foo') === 'on');
      assert(mockReq.features.isEnabled('yop') === false);
      assert(mockReq.features.getVariant('yop') === null);
      done();
    });
  });

  it('should generate a middleware able to use rampedUp', (done) => {
    const defaultFeatures = {features:{
      'foo':{ variant:'on', rampedUp: 0.05},
      'bar':{ variant:'on', rampedUp: 1},
      'woo':{ variant:'on', rampedUp: 0}
    }};
    const mockReq = {headers: {}, query: {}};
    const mockRes = {};
    middleware(defaultFeatures)(mockReq, mockRes, function () {
      let countEnabled = 0;
      for (let i = 0; i < 50; ++i) {
        if (mockReq.features.isEnabled('bar')) {
          countEnabled++;
        }
      }
      assert(countEnabled === 50);
      countEnabled = 0;
      for (let i = 0; i < 50; ++i) {
        if (mockReq.features.isEnabled('woo')) {
          countEnabled++;
        }
      }
      assert(countEnabled === 0);
      countEnabled = 0;
      for (let i = 0; i < 10000; ++i) {
        if (mockReq.features.isEnabled('foo')) {
          countEnabled++;
        }
      }
      console.log('rampedUp 0.05 => count is '+countEnabled/10000);
      assert(countEnabled > 0 && countEnabled < 1000);
      done();
    });
  });

  it('should generate a middleware able to use rampedUp', (done) => {
    const defaultFeatures = {features:{
      'foo':{ variant:'on', ipList: ['192.168.0.1', '192.168.0.20', '192.168.0.5']},
      'bar':{ variant:'on', ipList: ['192.168.0.1', '192.168.0.25', '192.168.0.5']},
      'woo':{ variant:'on', ipList: [/192\.168\.0\.\d+/]}
    }};
    const mockReq = {headers: {}, query: {}, userIp: '192.168.0.20'};
    const mockRes = {};
    middleware(defaultFeatures)(mockReq, mockRes, function () {
      assert(mockReq.features.isEnabled('foo'));
      assert(mockReq.features.isEnabled('bar') === false);
      assert(mockReq.features.isEnabled('woo') === true);
      done();
    });
  });
});
