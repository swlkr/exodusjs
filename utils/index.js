var fs = require("fs");

function log(message) {
  console.log("[EXODUS]", message);
}

function mkdirSync(dir) {
  try {
    fs.mkdirSync(dir);
  } catch(error) {
    // Ignore the EEXIST error
    if(error && error.code !== "EEXIST") {
      throw(error);
    }
  }
}

function dirExists(dir) {
  try {
    return fs.lstatSync(dir);
  } catch(error) {
    return false;
  }
}

function requireFromString(src) {
  var m = new module.constructor();
  m._compile(src, "");
  return m.exports;
}

function pluralize(string, count) {
  return count === 1 ? string : `${string}s`;
}

function diff(a1, a2) {
  return a1.concat(a2).filter(function(val, index, arr){
    return arr.indexOf(val) === arr.lastIndexOf(val);
  });
}

module.exports = {
  log: log,
  mkdirSync: mkdirSync,
  dirExists: dirExists,
  requireFromString: requireFromString,
  pluralize: pluralize,
  diff: diff
}
