# walkitout

[![build status](https://api.travis-ci.org/ecman/walkitout.png)](https://travis-ci.org/ecman/walkitout) [![codecov](https://codecov.io/gh/ecman/walkitout/branch/master/graph/badge.svg)](https://codecov.io/gh/ecman/walkitout) [![Code Climate](https://codeclimate.com/github/ecman/walkitout/badges/gpa.svg)](https://codeclimate.com/github/ecman/walkitout)

Run a callback, asynchronously, on all filepaths in a directory tree

#  Usage

```js
var walkitout = require('walkitout');

console.log("START WALK");

/**
 * @param path      {string} path to walk
 * @param callback  {function} callback handler 
 * @param finish    {function} optional finish handler
 * @param scope     {object} optional handler scope
 * @param control   {function} optional descend controller
 */
walkitout('.', processLog, processComplete, null, controlDescend)

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

function processComplete() {
  console.log('COMPLETE: wrap up processing ');
}

function controlDescend(dirname, dirPath, descend, skip) {
  // skip directories named test
  (dirname === 'test') ? skip() : descend();
}
```
Output:

```text
START WALK
WALK STARTED
FILE: package.json
FILE: index.js
FILE: README.md
COMPLETE: wrap up processing 
```
