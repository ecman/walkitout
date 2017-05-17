# walkitout

Walk a directory tree recursively with callback and finish handler, asynchronously

#  Usage

```js
var walkitout = require('walkitout');

console.log("START WALK");
walkitout('.', processLog, processComplete)
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
```
Output:

```text
START WALK
WALK STARTED
FILE: test/index.js
FILE: package.json
FILE: out.txt
FILE: index.js
FILE: check.js
FILE: README.md
COMPLETE: wrap up processing 
```
