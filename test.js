'use strict';

require('mocha');
var assert = require('assert');
var assemble = require('assemble-core');
var questions = require('base-questions');
var conflicts = require('base-fs-conflicts');
var rename = require('base-fs-rename');
var exists = require('fs-exists-sync');
var selectViews = require('./');
var del = require('delete');
var app;

describe('assemble-select-views', function() {
  describe('module', function() {
    it('should export a function', function() {
      assert.equal(typeof selectViews, 'function');
    });
  });

  describe('plugin', function() {
    it('should only register the plugin once', function(cb) {
      var count = 0;
      app = assemble();
      app.on('plugin', function(name) {
        if (name === 'assemble-select-views') {
          count++;
        }
      });
      app.use(selectViews());
      app.use(selectViews());
      app.use(selectViews());
      assert.equal(count, 1);
      cb();
    });
  });

  describe('errors', function() {
    beforeEach(function() {
      app = assemble();
      app.use(selectViews());
      app.create('pages');
    });

    it('should throw an error when base-questions is not registered', function(cb) {
      app.use(conflicts());
      app.use(rename());

      app.selectViews('pages', function(err, views) {
        assert(err);
        assert.equal(err.message, 'expected the base-questions plugin to be registered');
        cb();
      });
    });

    it('should throw an error when base-fs-conflicts is not registered', function(cb) {
      app.use(questions());
      app.use(rename());

      app.selectViews('pages', function(err, views) {
        assert(err);
        assert.equal(err.message, 'expected the base-fs-conflicts plugin to be registered');
        cb();
      });
    });

    it('should throw an error when base-fs-rename is not registered', function(cb) {
      app.use(questions());
      app.use(conflicts());

      app.selectViews('pages', function(err, views) {
        assert(err);
        assert.equal(err.message, 'expected the base-fs-rename plugin to be registered');
        cb();
      });
    });

    it('should throw an error when base-fs-rename is not registered', function(cb) {
      app.use(questions());
      app.use(conflicts());

      app.selectViews('pages', function(err, views) {
        assert(err);
        assert.equal(err.message, 'expected the base-fs-rename plugin to be registered');
        cb();
      });
    });

    it('should throw an error when the options.collection is not defined', function(cb) {
      app.create('posts');
      app.use(questions());
      app.use(conflicts());
      app.use(rename());

      app.selectViews(function(err, views) {
        assert(err);
        assert.equal(err.message, 'expected options.collection to be a string');
        cb();
      });
    });
  });

  describe('plugin', function() {
    this.timeout(10000);

    beforeEach(function() {
      app = assemble();
      app.use(questions());
      app.use(conflicts());
      app.use(rename());
      app.use(selectViews());
      app.create('pages');
    });

    afterEach(function(cb) {
      del('actual', cb);
    });

    it('should render views specified on the `selectViews` option', function(cb) {
      app.page('foo.hbs', {content: 'this is {{name}}', data: {name: 'Foo'}});
      app.page('bar.hbs', {content: 'this is {{name}}'});
      app.page('baz.hbs', {content: 'this is {{name}}'});
      app.data({name: 'blah'});

      app.engine('hbs', require('engine-handlebars'));
      app.option('selectViews', ['baz', 'foo']);
      app.option('dest', 'actual');

      app.selectViews('pages', function(err, views) {
        if (err) return cb(err);
        assert(exists('actual/foo.hbs'));
        assert(exists('actual/baz.hbs'));
        cb();
      });
    });
  });
});
