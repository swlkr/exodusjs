var fs        = require("fs"),
    path      = require("path"),
    utils     = require("../utils"),
    mkdirSync = utils.mkdirSync,
    log       = utils.log;

function prependTimestamp(name) {
  // Create new migration yyyymmddhhmmss-migration-name
  var date = new Date();

  var hour = date.getHours();
  hour = (hour < 10 ? '0' : '') + hour;

  var min  = date.getMinutes();
  min = (min < 10 ? '0' : '') + min;

  var sec  = date.getSeconds();
  sec = (sec < 10 ? '0' : '') + sec;

  var year = date.getFullYear();

  var month = date.getMonth() + 1;
  month = (month < 10 ? '0' : '') + month;

  var day  = date.getDate();
  day = (day < 10 ? '0' : '') + day;

  return `${year}${month}${day}${hour}${min}${sec}-${name}.js`;
}

// exodus create <migration name>
module.exports = function create(migrationName) {
  // exodus create migration-name
  // Handle no name
  if(!migrationName) {
    log("Your migration needs a name!")
    log("exodus create the-name-of-your-migration");

    process.exit(0);
  }
  // Create migrations folder in current directory
  // if it doesn't already exist
  try {
    mkdirSync("migrations");
  } catch(error) {
    log(error);
    process.exit(0);
  }

  // Build the name of the file
  var name = prependTimestamp(migrationName);
  var contents = `module.exports = {
  up: \`
    your sql goes here
  \`,
  down: \`
    your sql goes here
  \`
};`;

  var filePath = path.join(process.cwd(), "migrations", name);

  try {
    fs.writeFileSync(filePath, contents);
  } catch(e) {
    log(e);
    process.exit(0);
  }

  log(`Created migration ${name}`);
}
