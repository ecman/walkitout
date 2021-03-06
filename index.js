var fs = require('fs');
var path = require('path');

module.exports = walkitout;

function walkitout(filePath, callback, completer, scope, controller, processor, depth, detail)
{
  var directories = [];
  var files = [];
  var fileCount = 0;
  var statErrors = 0;
  controller = controller || controlDescent;
  depth = depth !== undefined ? depth : 1;
  detail = detail || { cancelled: false, completed: false };

  function complete()
  {
    if (detail.completed) return;

    detail.completed = true;

    if (completer) completer.call(scope, detail.cancelled);
  }

  function dirDone()
  {
    if (processor)
    {
      processor();
    }
    else
    {
      complete();
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

    if (!detail.cancelled)
    {
      setImmediate(
        callback.bind(scope, null, path.join(filePath, filename), processFiles)
      );
    }

  } // processFiles

  function processDirectories()
  {
    var dirname = directories.pop();

    if (!dirname)
    {
      processFiles();
      return;
    }

    if (!detail.cancelled)
    {
      setImmediate(
        controller.bind(scope, dirname, filePath,
          walkitout.bind(null, path.join(filePath, dirname),
            callback, completer, scope, controller, processDirectories, depth + 1, detail),
          processDirectories, depth)
      );
    }

  } // processDirectories

  fs.readdir(filePath, handleReaddir);

  return function cancel() {
    detail.cancelled = true;
    setImmediate(complete);
  };

} // walkitout

function controlDescent(dirname, dirPath, descend, skip, depth) {
  descend();
}

function noopFunction() {
}
