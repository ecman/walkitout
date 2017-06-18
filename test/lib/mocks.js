var path = require('path');

/*
 A tree data structure for use with the fs mock.
 Used so fs mock can send errors to walkitout
 on specified paths.

 Sets up the following structure:

  [-] .
  [-] dir1/
  [-] dir1/dirA/
  [-] dir1/dirA/dirAA/
  [x] dir1/dirA/dirAA/fileAA.txt
  [x] dir1/dirA/dirAA/fileAB.txt
  [x] dir1/fileA.txt
  [-] dir2/dirB/
  [x] dir2/fileZ.txt
  [-] otherdir1 (should be readdir error)
  [-] otherdir1/otherfile2.txt (should be unreachable)
  [x] file1.txt
  [-] otherfile1.txt (should be stat error)

  'x' indicates a filepath that should be
  sent to the callback handler and without error

  Format:

  {
    dirname: [[stat Error | null,
              readdir Error | null], ...filenames],
    filename: stat Error | null,
    ...
  }
*/
var defaultTree = {
  '.': [[null, null], 'dir1', 'dir2', 'otherdir1', 'file1.txt', 'otherfile1.txt'],
  'dir1': [[null, null], 'fileA.txt', 'dirA'],
  'dir1/dirA': [[null, null], 'dirAA'],
  'dir1/dirA/dirAA': [[null, null], 'fileAA.txt', 'fileAB.txt'],
  'dir1/dirA/dirAA/fileAA.txt': null,
  'dir1/dirA/dirAA/fileAB.txt': null,
  'dir1/fileA.txt': null,
  'dir2': [[null, null], 'fileZ.txt', 'dirB'],
  'dir2/dirB': [[null, null]],
  'dir2/fileZ.txt': null,
  'otherdir1': [[null, new Error('Error with otherdir1')]],
  'otherdir1/otherfile2.txt': null,
  'file1.txt': null,
  'otherfile1.txt': new Error('Error with otherfile')
};

// For use in vm context.
// Mock the bare minimum of the fs readir() and stat()
// methods used by walkitout to use the mockTree data
// structure.
function fsMock(tree) {
  return  {
    '_tree': tree,
    'readdir': function (path, callback) {
      var data = this._tree[path];
      callback(data[0][1], data.slice(1));
    },
    'stat': function (path, callback) {
      var data = this._tree[path];
      if (Array.isArray(data)) callback(data[0][0], this._stat(path, true));
      else callback(data, this._stat(path, false));
    },
    '_stat': function (path, directory) {
      return {
        isDirectory: function () { return directory; },
        isFile: function () { return !directory; }
      };
    }
  };
}

// For use in vm context.
// Require proxy to give fs mock
// to vm script
var requireMock = function (name) {
  if (name === 'fs') return global.fs;
  return require(name);
};

// A filename for vm traces
var filename = 'index.js';

exports.getExpectedPaths = getExpectedPaths;

exports.enable = function (tree) {
  tree = normalizeTree(tree || defaultTree);
  global.fs = fsMock(tree);
  global.__realRequire = global.require;
  global.__realModule = global.module;
  global.__realFs = global.fs;
  global.require = requireMock;
  global.module = {};
  return tree;
};

exports.disable = function () {
  global.require = global.__realRequire;
  global.module = global.__realModule;
  global.fs = global.__realFs;
};

function getError(cfg) {
  var e = new Error(cfg.message);
  Object.keys(cfg).forEach(function (key) {
    e[key] = e[key] || cfg[key];
  });
  return e;
}

function getExpectedPaths(tree) {
  return Object.keys(tree)
    .filter(filterForExpectedPaths.bind(null, tree));
}

function getNoEntityError(filename) {
  return getError({
    message: "ENOENT, stat '" + filename + "'",
    errno: 34,
    code: 'ENOENT',
    path: filename
  });
}

// Filters for expected paths, that should
// match the results of what the walkitout
// callback will put into actualResults
// (e.g. the callback skips errors)
function filterForExpectedPaths(tree, filename)
{
  var data = tree[filename] !== undefined ?
    tree[filename] : getNoEntityError(filename);
  var isFile = !Array.isArray(data);
  var fileOk;
  var pathCheck;
  var pathData;
  var pathOk;
  var pathRegex = new RegExp('\\' + path.sep
      + '[^\\' + path.sep + ']+$');

  if (isFile) fileOk = (data === null);
  else fileOk = data[0][0] === null &&
                data[0][1] === null;

  if (!fileOk) return false;

  pathCheck = filename;

  do
  {
    pathCheck = pathCheck.replace(pathRegex, '');
    pathData = tree[pathCheck];
    pathOk = (!Array.isArray(pathData) ?
      pathData : (pathData[0][0]) === null &&
                  pathData[0][1]) === null;
  }
  while (pathOk && pathCheck.indexOf('/') !== -1)

  return pathOk && isFile;
}

function normalizeTree(tree) {
  var normalTree = {};
  var normalKey;
  Object.keys(tree).forEach(function (key) {
    normalKey = key;
    if (path.sep === '/' && key.indexOf('\\') !== -1) {
      normalKey = normalKey.split('\\').join('/');
    }
    else if (path.sep === '\\' && key.indexOf('/') !== -1) {
      normalKey = normalKey.split('/').join('\\');
    }
    normalTree[normalKey] = tree[key];
  });
  return normalTree;
}
