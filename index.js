var fs = require('fs');
var path = require('path');

module.exports = walkitout;

function walkitout(filePath, callback, completer, processor)
{
  var dirsRemaining = 0;
  var directories = [];
  var files = [];
  var fileCount = 0;

  completer = completer || (function () {});

  function dirDone() 
  {
    dirsRemaining =- 1;

    if (dirsRemaining === -1) 
    {
      if (processor)
      {
        processor();
      }
      else 
      {
        completer();
      }
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
          return;
        }

        if (stat.isDirectory()) 
        {
          directories.push(filename);
        }
        else if (stat.isFile())
        {
          files.push(filename);
        }

        if ((directories.length + 
              files.length) === fileCount) 
        {
          dirsRemaining = directories.length || 1;
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

    callback(null, path.join(filePath, filename), function () {
      processFiles();
    });

  } // processFiles

  function processDirectories()
  {
    var dirname = directories.pop();

    if (!dirname) 
    {
      processFiles();
      return;
    }

    /*
    while (dirname && dirname[0] === '.') 
    {
      dirname = directories.pop();
    }

    if (!dirname)
    {
      processFiles();
      return;
    }
    */

    walkitout(path.join(filePath, dirname), callback, processDirectories);

  } // processDirectories

  fs.readdir(filePath, handleReaddir);

} // walkitout

