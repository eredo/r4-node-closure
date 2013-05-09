/**
 * @fileOverview Builds up the runtime for closure within the nodejs runtime.
 */

var path = require('path');
var fs = require('fs');
var calcdeps = require('./calcdeps.js');
var vm = require('vm');

(function() {
  'use strict';

  var goog = this.goog = this.goog || {};

  /**
   * Contains the dependencies which are already loaded.
   * @type {Object.<string,boolean>}
   */
  var deps = {};

  // fetch the package.json of the running project
  var scriptPath = process.argv[1];
  var findPackage = function(dir, cb) {
    var pf = path.join(dir, 'package.json');
    var exists = fs.existsSync(pf);

    if (exists) {
      return pf;
    } else {
      return findPackage(path.join(dir, '..'), cb);
    }
  };

  var pack = findPackage(path.dirname(scriptPath));
  var conf = require(pack);
  var paths = [path.dirname(pack)];
  var cachable = conf.pathCachable || [];

  if (conf.paths) {
    paths = conf.paths;
  }

  if (conf.closureEnvironment) {
    paths.push(process.env[conf.closureEnvironment]);
    cachable.push(process.env[conf.closureEnvironment]);

    // load the base.js into the current scope
    var baseCode = fs.readFileSync(path.join(process.env[conf.closureEnvironment],
        'closure', 'goog', 'base.js')).toString();
    vm.runInThisContext(baseCode);
  }

  // calculate the dependencies of the project
  deps = calcdeps(paths, cachable);

  this.goog.global = global;

  /**
   * Requires a package.
   * @param {string} pack
   */
  this.goog.require = function(pack) {
    if (deps[pack]) {
      for (var i = 0, dep, pd = deps[pack][1]; dep = pd[i]; i++) {
        goog.require(dep);
      }

      require(deps[pack][0]);
    } else {
      throw new Error('Unable to find package: ' + pack);
    }
  };

  /**
   * Overrides the regular provide function.
   * @param {string} pack The package that is provided.
   */
  this.goog.provide = function(pack) {
    var ns = pack.split('.');
    var scope = global;

    for (var i = 0, n; n = ns[i]; i++) {
      scope[n] = scope[n] || {};
      scope = scope[n];
    }
  };

  if (!this.goog.inherits) {
    // provide the inherits function if the google base file is not loaded
    this.goog.inherits = function(childCtor, parentCtor) {
      /** @constructor */
      function tempCtor() {};
      tempCtor.prototype = parentCtor.prototype;
      childCtor.superClass_ = parentCtor.prototype;
      childCtor.prototype = new tempCtor();
      /** @override */
      childCtor.prototype.constructor = childCtor;
    };
  }
}).call(global, []);
