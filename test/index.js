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
    scopedHandler.handleFile, scopedHandler.handleFinish);
}

ScopedHandler.prototype.handleFile = ScopedHandler_handleFile;
ScopedHandler.prototype.handleFinish = ScopedHandler_handleFinish;
ScopedHandler.prototype.toString = ScopedHandler_toString;

function ScopedHandler() {}

function ScopedHandler_handleFile(err, fileName, done) {
  assert.strictEqual(this, '[ScopedHandler]',
    'callback handler should retain scope');
  done();
}

function ScopedHandler_handleFinish(err, filename, done) {
  assert.strictEqual(this, '[ScopedHandler]',
    'finish handler should retain scope');
}

function ScopedHandler_toString() {
  return '[ScopedHandler]';
}
