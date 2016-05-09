'use strict';

var path = require('path');
var extend = require('extend-shallow');
var cwd = require('base-cwd');

module.exports = function(config) {
  config = config || {};

  return function plugin(app) {
    if (!isValidInstance(app)) {
      return;
    }

    app.use(cwd());

    this.define('selectViews', function(name, options, cb) {
      if (typeof name === 'function') {
        cb = name;
        name = null;
        options = {};
      }

      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      if (typeof options === 'string') {
        var dest = options;
        options = {};
        options.dest = dest;
      }

      // lazily ensure the correct plugins are loaded
      var err = verifyPlugins(this);
      if (err instanceof Error) {
        cb(err);
        return;
      }

      // merge options
      var opts = extend({}, config, this.options, options);
      if (typeof name === 'undefined' || name == null) {
        name = getCollectionName(app, opts);
        if (name instanceof Error) {
          cb(name);
          return;
        }
      }

      var renderFn = renderChoices(app, name);

      // get the specified view collection
      var views = this.getViews(name);
      if (typeof views === 'undefined') {
        cb(new Error('cannot find collection ' + name));
        return;
      }

      var keys = Object.keys(views);
      if (!keys.length) {
        cb(new Error('no views found in collection: ' + name));
        return;
      }

      if (keys.length === 1) {
        renderFn(keys, opts, cb);
        return;
      }

      if (opts.selectViews) {
        renderFn(opts.selectViews, opts, cb);
        return;
      }

      // setup a `choices` questions
      this.choices('files', keys);
      this.question('dest', 'Destination directory?');

      // prompt the user
      this.ask('files', function(err, answers) {
        if (err) {
          cb(err);
          return;
        }

        if (answers.files && answers.files.length) {
          if (!opts.dest) {
            app.ask('dest', {save: false}, function(err, answers) {
              if (err) {
                cb(err);
                return;
              }
              opts.dest = path.resolve(app.cwd, answers.dest);
              renderFn(answers.files, opts, cb);
            });
            return;
          }

          renderFn(answers.files, opts, cb);
        } else {
          console.log('no files chosen');
          cb();
        }
      });
    });

    return plugin;
  };
};

function renderChoices(app, name) {
  var rendered = [];
  return function(files, options, cb) {
    app.data({options: options});

    app.toStream(name, filter(options, files)).on('error', cb)
      .pipe(app.renderFile(options)).on('error', cb)
      .pipe(app.conflicts(options.dest)).on('error', cb)
      .pipe(app.dest(function(file) {
        if (options.flatten) {
          file.base = path.dirname(file.path);
        }
        rendered.push(file);
        return options.dest;
      }))
      .on('error', cb)
      .on('end', function() {
        cb(null, rendered);
      });
  };
}

function getCollectionName(app, options) {
  var name = options.collection;
  if (typeof name === 'undefined') {
    var names = Object.keys(app.views);
    if (names.length > 1) {
      return new Error('expected options.collection to be a string');
    }
    name = names[0];
  }
  return name;
}

function filter(options, arr) {
  if (typeof options.filter === 'function') {
    return options.filter(arr);
  }
  return arr;
}

function verifyPlugins(app) {
  // these plugins are not included in assemble by default
  if (typeof app.ask !== 'function') {
    return new Error('expected the base-questions plugin to be registered');
  }
  if (typeof app.conflicts !== 'function') {
    return new Error('expected the base-fs-conflicts plugin to be registered');
  }
  if (typeof app.rename !== 'function') {
    return new Error('expected the base-fs-rename plugin to be registered');
  }

  // these plugins are included in assemble, but will need to
  // be registered if using `base` directly
  if (typeof app.src !== 'function') {
    return new Error('expected the base-fs plugin to be registered');
  }
  if (typeof app.renderFile !== 'function') {
    return new Error('expected the assemble-render-file plugin to be registered');
  }
}

function isValidInstance(app) {
  if (!app.isApp && !app.isGenerator && !app.isViews) {
    return false;
  }
  if (app.isRegistered('choose-files')) {
    return false;
  }
  return true;
}
