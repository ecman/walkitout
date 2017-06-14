var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var mocks = require('./lib/mocks');

main('index.js');

function testErrors(code, codeFile, tree)
{
  var walkitout = vm.runInThisContext(code, codeFile);
  var actualPaths = [];
  var expectedPaths = mocks.getExpectedPaths(tree);
  var finishHandled = false;
  var startPath = '.';

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

    checkDepth();
  
  }, pathCheckWait * 1000);

  walkitout(startPath,
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

  function checkDepth() {
    walkitout(startPath,
      function callbackHandler(err, filename, done) {
        done();
      },
      function finishHandler() {
      },
      null,
      function (dirname, dirpath, descend, skip, depth) {
        var normalizedDepth = dirpath.split(path.sep).length;
        if (dirpath.indexOf(startPath) !== 0) {
          normalizedDepth += 1;
        }
        assert.strictEqual(depth, normalizedDepth,
          "dirpath '" + dirpath + path.sep + "' depth should be " +
          normalizedDepth + " not " + depth);
        console.log("dirpath '" + dirpath + path.sep + "' depth " + depth + " OK");
        descend();
      }
    );
  }
}

function main(codeFile)
{
  fs.readFile(
    codeFile, { encoding: 'utf8' },
    function (err, code) {
      var tree = mocks.enable();
      testErrors(code, codeFile, tree);
    }
  );
}

