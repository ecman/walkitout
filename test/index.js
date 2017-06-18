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
      + ' not ' + actualPaths.length + "\n\nactual:\n" + actualPaths.join("\n") 
      + "\n\nexpected:\n" + expectedPaths.join("\n"));
    console.log('actual paths count is OK');

    while (i < expectedPaths.length)
    {
      containsPath = actualPaths.indexOf(expectedPaths[i]) >= 0 ? true : false;
      assert.equal(containsPath, true,
        'Actual paths should contain "' + expectedPaths[i] + '"'
        + ' but it does not.');

      i += 1;
    }
    console.log('actual paths match expected OK');

    assert.equal(finishHandled, true,
      'walkitout should call the finish handler');
    console.log('finish handler invoked OK');

    checkDepth(expectedPaths);

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

  function checkDepth(expectedFilenames) {
    walkitout(startPath,
      function callbackHandler(err, filename, done) {
        done();
      },
      function finishHandler() {
        console.log('descent depths OK');
        checkScopes(expectedFilenames);
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

function checkWalkControl(expectedFilenames)
{
  var actualFilenames = [];

  function okFilename(filename) {
    return !/^\.|coverage|node_modules|test/.test(filename);
  }

  walkitout('.',
    // handler
    function (err, filename, done) {
      if (err) return done();
      if (okFilename(filename)) {
        actualFilenames.push(filename);
      }
      done();
    },
    // finish handler
    function () {
      expectedFilenames.forEach(function (filename) {
        assert.strictEqual(actualFilenames.indexOf(filename) !== -1, true,
          'Actual filenames do not match expected filenames');
      });
      assert.strictEqual(actualFilenames.length, expectedFilenames.length,
        'Actual filenames length does not match expected filenames length');
      console.log('descent control OK');
    },
    // optional scope
    null,
    // optional walk controller
    function (dirname, dirPath, next, skip) {
      dirname === 'test' ? skip() : next();
    }
  );
}

function checkScopes(expectedFilenames)
{
  var scopedHandler = new ScopedHandler(expectedFilenames);

  walkitout('.',
    scopedHandler.handleFile, 
    scopedHandler.handleFinish, 
    scopedHandler);
}

function ScopedHandler(expectedFilenames)
{
  this.expectedFilenames = expectedFilenames;
  this.handleFile = function (err, fileName, done) {
    var actual = this.toString();
    var expected = '[ScopedHandler]';

    assert.strictEqual(actual, expected,
      'callback handler should retain scope: ' +
      'expected "' + expected + '" not "' + actual + '"');

    done();
  };

  this.handleFinish = function () {
    var actual = this.toString();
    var expected = '[ScopedHandler]';

    console.log('callback handler scope OK');
    console.log('descent controller scope OK');

    assert.strictEqual(actual, expected,
      'callback handler should retain scope: ' +
      'expected "' + expected + '" not "' + actual + '"');

    console.log('finish handler scope OK');

    checkWalkControl(this.expectedFilenames);
  };

  this.handleDescent = function (dirname, dirpath, descend, skip, depth) {
    var actual = this.toString();
    var expected = '[ScopedHandler]';

    assert.strictEqual(actual, expected,
      'descent controller should retain scope: ' +
      'expected "' + expected + '" not "' + actual + '"');

    descend();
  }

  this.toString = function () {
    return '[ScopedHandler]';
  };
}
