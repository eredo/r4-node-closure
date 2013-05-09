
var fs = require('fs'),
    path = require('path');

var packages = {};
var allPackages = {};
var filePackages = {};
var cachedPackages = {};
var cachePath = path.join(__dirname, '..', 'cache.json');

/**
 * Get's the files of a directory and reads them recruisivly.
 * @param {string} dir The directory path.
 */
var getFiles = function(dir) {
  var files = fs.readdirSync(dir);

  for (var i = 0, file; file = files[i]; i++) {
    var filePath = path.join(dir, file);

    var stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFiles(filePath);
    } else {
      if (path.extname(filePath) === '.js') {
        readFile(filePath);
      }
    }
  }

};

/**
 * Read's the file and gets the requirements and providing objects.
 * @param {string} file Path to the file.
 */
var readFile = function(file) {
  var data = fs.readFileSync(file);

  var reg = /goog\.require\(['|"]([^'|"]+)['|"]\);/g;
  var provReg = /goog\.provide\(['|"]([^'|"]+)['|"]\);/g;

  var requirements = [];
  var packs = [];

  var reqMatch = null;
  while ((reqMatch = reg.exec(data.toString())) !== null) {
    requirements.push(reqMatch[1]);
  }

  var provMatch = null;
  while ((provMatch = provReg.exec(data.toString())) !== null) {
    packs.push(provMatch[1]);
  }

  for (var i = 0, pack; pack = packs[i]; i++) {
    packages[pack] = [file, requirements];
  }
};

/**
 * Merges the packages found while running through the files into
 * the packages which where already cached.
 */
var mergePackages = function() {
  for (var pack in packages) {
    allPackages[pack] = packages[pack];
  }
};

/**
 * Stores the the packages which are cacheable in the cache file.
 */
var storePackagesCache = function() {
  fs.writeFileSync(cachePath, JSON.stringify(cachedPackages));
};

/**
 * Runs the calculation of the dependencies and returns the packages that
 * are found.
 * @param {Array.<string>} paths
 * @param {Object.<string>} cachedPaths
 * @returns {Object.<string,Array>}
 */
module.exports = function(paths, cachedPaths) {
  // load caches
  var cacheExists = fs.existsSync(cachePath);
  // check if there's a cache
  if (cacheExists) {
    cachedPackages = require(cachePath);
  }

  for (var i = 0, pt; pt = paths[i]; i++) {
    packages = {};

    // check if it's in the cache
    if (cachedPackages[pt]) {
      packages = cachedPackages[pt];
    } else {
      getFiles(pt);

      if (cachedPaths.indexOf(pt) !== -1) {
        cachedPackages[pt] = packages;
      }
    }

    mergePackages();
  }

  storePackagesCache();
  return allPackages;
};
