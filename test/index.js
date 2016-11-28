const assert = require('assert');

const { Features, middleware } = require('../index.js');

describe('calling features', () => {
  it('should be able to load features', (done) => {
    const a = new Features({
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
    assert(a.isEnabled('a') === true);
    assert(a.isEnabled('b') === false);
    assert(a.isEnabled('c') === true);
    assert(a.isEnabled('d') === false);
    assert(a.isEnabled('g') === true);
    assert(a.isEnabled('i') === true);
    assert(a.isEnabled('j') === true);
    assert(a.isEnabled('k') === true);
    assert(a.isEnabled('l') === true);
    assert(a.isEnabled('unknown') === false);
    done();
  });

  it('should be able to get variant', (done) => {
    const a = new Features({
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
  })
});
