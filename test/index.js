var path = require('path');
var assert = require('assert');
var walkitout = require('../');

var expectedFilenames = [
  'package.json',
  'README.md',
  'index.js',
  'test/index.js'
];

var actualFilenames = [];

walkitout('.', onFile, onFinish);

UM = "UM";

function onFile(err, filename, done) {
  if (err) done();
  actualFilenames.push(filename);
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
  };

  this.toString = function () {
    return '[ScopedHandler]';
  };
}

