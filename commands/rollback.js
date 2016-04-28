var fs                = require("fs"),
    path              = require("path"),
    env               = require("../env"),
    database          = require("../database"),
    utils             = require("../utils")
    log               = utils.log,
    diff              = utils.diff,
    dirExists         = utils.dirExists,
    pluralize         = utils.pluralize,
    requireFromString = utils.requireFromString;

var MIGRATIONS = "migrations";
var EXODUS_MIGRATIONS = "exodus_migrations";
var migrationsFolder = path.join(process.cwd(), MIGRATIONS);

function databaseUrlExists(env) {
  if(!env.databaseUrl) {
    log("No DATABASE_URL found in your environment!");
    log("export DATABASE_URL=your database url");
    log("Then try again");

    return false;
  }

  return true;
}

var rollback = function *(filename) {
  // Get the filename without extension
  var parts = path.parse(filename);

  log(`Running migration ${parts.name}`);

  // Get the file contents
  var filePath = path.join(migrationsFolder, filename);
  var contents = fs.readFileSync(filePath, "utf8");
  var migration = requireFromString(contents);
  var sql = migration.up;

  // run the migration
  try {
    yield database.raw(env.databaseUrl, sql);
  } catch(error) {
    log(error);
  }

  // insert a new migration row into the db
  try {
    yield database.insertMigration(env.databaseUrl, [filename]);
  } catch(error) {
    log(error);
  }
};

module.exports = function *() {
  // Make sure there is a env.databaseUrl present
  if(!databaseUrlExists(env)) { process.exit(0); }

  // Check for migrations folder
  if(!dirExists(migrationsFolder)) {
    log("There is no migrations folder");
    log("Create a migration first");

    process.exit(0);
  }

  // Check for the migrations table
  var tables = yield database.getTablesByName(env.databaseUrl, [EXODUS_MIGRATIONS]);

  if(tables.length === 0) {
    log("Nothing to rollback");
    log("Done");
    process.exit(0);
  }

  // Get migrations from the table
  var rows = yield database.getMigrations(env.databaseUrl);

  // Return if there aren"t any
  if(rows.length === 0) {
    log("Nothing to rollback")
    log("Done")
    process.exit(0);
  }

  var row = rows[0];
  var id = row.id;
  var name = row.name;

  var filePath = path.join(migrationsFolder, name);
  var file = fs.readFileSync(filePath, "utf8")
  var migration = requireFromString(file);

  log("Rolling back 1 migration");
  log(`Rolling back migration ${name.split(".")[0]}`);

  // Rollback migration
  yield database.raw(env.databaseUrl, migration.down);

  // Delete migration row
  yield database.deleteMigration(env.databaseUrl, [id]);

  log("Done");

  process.exit(0);
}
