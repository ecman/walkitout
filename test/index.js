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
  }i
}
