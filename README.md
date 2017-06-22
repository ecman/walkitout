# walkitout

[![build status](https://api.travis-ci.org/ecman/walkitout.png)](https://travis-ci.org/ecman/walkitout) [![codecov](https://codecov.io/gh/ecman/walkitout/branch/master/graph/badge.svg)](https://codecov.io/gh/ecman/walkitout) [![Code Climate](https://codeclimate.com/github/ecman/walkitout/badges/gpa.svg)](https://codeclimate.com/github/ecman/walkitout) [![Build status](https://ci.appveyor.com/api/projects/status/kkrhnekh80tjxqxk/branch/master?svg=true)](https://ci.appveyor.com/project/ecman/walkitout/branch/master)

Run a callback, asynchronously, on all filepaths in a directory tree

#  Usage

```js
var walkitout = require('walkitout');

console.log("START WALK");

/**
 * @param {string}    path      path to walk
 * @param {function}  callback  callback handler
 * @param {function}  finish    optional finish handler
 * @param (object}    scope     optional handler scope
 * @param {function}  control   optional descent controller
 *
 * @returns {function}  ends walk and invokes finish
 */
var cancelWalk = walkitout('.',
  processLog, processComplete, null, controlDescent)

console.log("WALK STARTED");

function processLog(err, filename, done) {
  if (err) throw err;

  // skip: dotfiles, coverage, node_modules
  if (!/^(\.|coverage|node_modules)/
    .test(filename)) {
    console.log('FILE:', filename);
  }

  done();
}

function processComplete(cancelled) {
  // "cancelled" is true if cancelWalk() was invoked
  var info = '(' + (cancelled ? '' : 'not ') + 'cancelled)';
  console.log('COMPLETE: wrap up processing ' + info);
}

function controlDescent(dirname, dirPath, descend, skip, depth) {
  // skip directories named test,
  // only walk a max-depth of 2 levels
  (dirname === 'test' || depth === 2) ?
    skip() : descend();
}
```

Output:

```text
START WALK
WALK STARTED
FILE: package.json
FILE: index.js
FILE: README.md
COMPLETE: wrap up processing (not cancelled)
```
