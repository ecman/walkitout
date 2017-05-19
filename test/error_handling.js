var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

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
var mockTree = {
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
var fsMock =  {
  '_tree': mockTree,
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

// For use in vm context.
// Require proxy to give fs mock
// to vm script
var requireMock = function (name) {
  if (name === 'fs') return fsMock;
  return require(name);
};

// A filename for vm traces
var filename = 'index.js';

main();

function testErrors(code) 
{
  var walkitout = vm.runInThisContext(code, 'index.js');
  var actualPaths = [];
  var expectedPaths = Object
    .keys(mockTree)
    .filter(filterForExpectedPaths);
  var finishHandled = false;

  var pathCheckWait = 1;
  // Wait n seconds and then check
  // actualPaths against expectedPaths
  var pathCheckTimer = setTimeout(function () 
  {
    var i = 0;
    var containsPath;

    assert.strictEqual(actualPaths.length, expectedPaths.length,
      'Actual paths should have a count of ' + expectedPaths.length
      + ' not ' + actualPaths.length);
    console.log('Actual paths count is OK');

    while (i < expectedPaths.length)
    {
      containsPath = actualPaths.indexOf(expectedPaths[i]) >= 0 ? true : false;
      assert.equal(containsPath, true, 
        'Actual paths should contain "' + expectedPaths[i] + '"' 
        + ' but it does not.');
      console.log(expectedPaths[i], 'is OK');

      i += 1;
    }

    assert.equal(finishHandled, true, 
      'walkitout should call the finish handler');
    console.log('finish handler called OK');
    
  }, pathCheckWait * 1000);

  walkitout('.', 
    function callbackHandler(err, filename, done) {
      // skip on error. 
      // see filterForExpectedPaths() 
      if (err) return done();
      actualPaths.push(filename);
      done();
    },
    function finishHandler() {
      // This will be checked
      finishHandled = true;
    }
  );
}

// Filters for expected paths, that should
// match the results of what the walkitout
// callback will put into actualResults
// (e.g. the callback skips errors)
function filterForExpectedPaths(filename) 
{
  var data = mockTree[filename];
  var isFile = !Array.isArray(data);
  var fileOk;
  var pathCheck;
  var pathData;
  var pathOk;

  if (isFile) fileOk = (data === null);
  else fileOk = data[0][0] === null &&
                data[0][1] === null;

  if (!fileOk) return false;

  pathCheck = filename;

  do 
  {
    pathCheck = pathCheck.replace(/\/[^\/]+$/, '');
    pathData = mockTree[pathCheck];
    pathOk = (!Array.isArray(pathData) ? 
      pathData : (pathData[0][0]) === null &&
                  pathData[0][1]) === null;
  }
  while (pathOk && pathCheck.indexOf('/') !== -1)

  return pathOk && isFile;
}

function main() 
{
  fs.readFile(
    filename, { encoding: 'utf8' }, 
    function (err, code) {
      global.require = requireMock;
      global.module = {};
      global.fs = fsMock;

      testErrors(code);
    }
  );
}

