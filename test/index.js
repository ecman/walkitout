var path = require('path');
var assert = require('assert');
var walkitout = require('../');

var expectedFilenames = [
  'test/error_handling.js',
  'test/index.js',
  'package.json',
  'index.js',
  'README.md'
];

var actualFilenames = [];

walkitout('.', onFile, onFinish);

function okFilename(filename) {
  return !/^\.|coverage|node_modules/.test(filename);
}

function onFile(err, filename, done) {
  if (err) return done();
  if (okFilename(filename)) {
    actualFilenames.push(filename);
  }
  done();
}

function onFinish() {
  var i = 0;
  var containsFilename;

  while (i < expectedFilenames.length) {
    containsFilename = actualFilenames
      .indexOf(expectedFilenames[i]) >= 0;

    assert.strictEqual(containsFilename, true, 
      'actualFilenames should contain "' + expectedFilenames[i] + '"');

    i++;
  }

  assert.strictEqual(actualFilenames.length, expectedFilenames.length,
    'actualFilenames length does not match expectedFilenames length');

  checkScopes();
}

function checkScopes() {
  var scopedHandler = new ScopedHandler();

  walkitout('.',
    scopedHandler.handleFile, 
    scopedHandler.handleFinish, 
    scopedHandler);
}

function ScopedHandler() 
{
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

    assert.strictEqual(actual, expected,
      'callback handler should retain scope: ' +
      'expected "' + expected + '" not "' + actual + '"');

    checkWalkControl();
  };

  this.toString = function () {
    return '[ScopedHandler]';
  };
}

function checkWalkControl()
{
  expectedFilenames.splice(expectedFilenames.indexOf('test/error_handling.js'), 1);
  expectedFilenames.splice(expectedFilenames.indexOf('test/index.js'), 1);
  actualFilenames = [];

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
      assert.deepStrictEqual(actualFilenames, expectedFilenames,
        'Actual filenames do not match expected filenames');
    },
    // optional scope
    null,
    // optional walk controller
    function (dirname, dirPath, next, skip) {
      dirname === 'test' ? skip() : next();
    });
  }

