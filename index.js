'use strict';

var extend = require('extend-shallow');

module.exports = function(config) {
  config = config || {};

  return function plugin(app) {
    if (!isValidInstance(app)) return;

    this.define('chooseFiles', function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      var opts = extend({}, config, this.options, options);
      var name = opts.collection || 'templates';
      var dest = opts.dest || this.cwd || process.cwd();
      var ext = opts.engine || '*';
      var self = this;

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
        return self.toStream(name, keys)
          .pipe(self.renderFile(ext, opts))
          .pipe(self.renameFile(opts.renameFile))
          .pipe(self.conflicts(dest))
          .pipe(self.dest(dest))
          .on('end', cb);
      }

      // setup a `choices` questions
      this.choices('files', keys);

      // ask the question
      this.ask('files', function(err, answers) {
        if (err) return cb(err);

        if (answers.files && answers.files.length) {
          self.toStream(name, filter(opts, answers.files))
            .pipe(self.renderFile(ext, opts))
            .pipe(self.renameFile(opts.renameFile))
            .pipe(self.conflicts(dest))
            .pipe(self.dest(dest))
            .on('end', cb);

        } else {
          console.log('no files chosen');
          cb();
        }
      });
    });

    return plugin;
  };
};

function rename(opts, dest) {
  if (typeof opts.rename === 'function') {
    return opts.rename(dest);
  }
  return dest;
}

function filter(opts, arr) {
  if (typeof opts.filter === 'function') {
    return opts.filter(arr);
  }
  return arr;
}

function verifyPlugins(app) {
  if (typeof app.ask !== 'function') {
    return new Error('expected the base-questions plugin to be registered');
  }
  if (typeof app.src !== 'function') {
    return new Error('expected the base-fs plugin to be registered');
  }
  if (typeof app.conflicts !== 'function') {
    return new Error('expected the base-fs-conflicts plugin to be registered');
  }
  if (typeof app.renameFile !== 'function') {
    return new Error('expected the base-fs-rename plugin to be registered');
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
