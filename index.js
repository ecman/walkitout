require('function-prep');
var fs = require('fs');
var path = require('path');

module.exports = walkitout;

function walkitout(filePath, callback, completer, scope, controller, processor)
{
  var directories = [];
  var files = [];
  var fileCount = 0;
  var statErrors = 0;
  controller = controller || controlDescent;

  function dirDone() 
  {
    if (processor)
    {
      processor();
    }
    else if (completer)
    {
      completer.call(scope);
    }

  } // dirDone

  function handleReaddir(err, filenames)
  {
    var filename = '';
    var index = 0;

    if (err) 
    {
      fileCount = 0;
      processDirectories();
      return;
    }

    fileCount = filenames.length;

    if (fileCount === 0) 
    {
        processDirectories();
        return;
    }

    while (index < filenames.length)
    {
      filename = filenames[index];

      stat(filename);

      index += 1;
    } 

  } // handleReaddir

  function stat(filename) {

      fs.stat(path.join(filePath, filename), handleStat);

      function handleStat(err, stat) 
      {
        if (err)
        {
          statErrors += 1;
          callback.call(scope, err, filename, noopFunction);
        }
        else
        {
          if (stat.isDirectory())
          {
            directories.push(filename);
          }
          else if (stat.isFile())
          {
            files.push(filename);
          }
        }

        if ((directories.length + 
              files.length) === (fileCount - statErrors))
        {
          processDirectories();
        }

      } // handleStat

  } // stat

  function processFiles()
  {
    var filename = files.pop();

    if (!filename) 
    {
      dirDone();
      return;
    }

    setImmediate(
      callback.prep(null, path.join(filePath, filename), processFiles).bind(scope)
    );

  } // processFiles

  function processDirectories()
  {
    var dirname = directories.pop();

    if (!dirname) 
    {
      processFiles();
      return;
    }

    setImmediate(
      controller.prep(dirname, filePath,
        walkitout.prep(path.join(filePath, dirname),
          callback, completer, scope, controller, processDirectories),
        processDirectories).bind(scope)
    );

  } // processDirectories

  fs.readdir(filePath, handleReaddir);

} // walkitout

function controlDescent(dirname, dirPath, descend, skip) {
  descend();
}

function noopFunction() {
}
