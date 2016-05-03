'use strict';

require('mocha');
var assert = require('assert');
var choose = require('./');

describe('assemble-choose-files', function() {
  it('should export a function', function() {
    assert.equal(typeof choose, 'function');
  });
});
