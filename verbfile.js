'use strict';

var path = require('path');
var cwd = path.join.bind(path, __dirname, 'test/fixtures');
var select = require('./');

/**
 * Example usage with verb
 *
 * ```sh
 * $ verb hbs
 * # or
 * $ verb txt
 * ```
 */

module.exports = function(verb) {
  verb.use(require('verb-readme-generator'));
  verb.use(select());

  verb.docs.option('renameKey', function(key) {
    return path.basename(key);
  });

  verb.task('txt', function(cb) {
    verb.docs('fixtures/*.txt');
    verb.selectViews('docs', cb);
  });

  verb.task('hbs', function(cb) {
    verb.engine('hbs', require('engine-handlebars'));
    verb.option('engine', 'hbs');
    verb.docs('fixtures/*.hbs');
    verb.selectViews('docs', cb);
  });

  verb.task('default', ['readme']);
};
