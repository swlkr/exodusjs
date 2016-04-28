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

var migrate = function *(filename) {
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
    // Create the migrations table
    yield database.createMigrationsTable(env.databaseUrl)
  }

  // Get migrations from the table
  var migrationRows = yield database.getMigrations(env.databaseUrl);
  var migrationsFromDatabase = migrationRows.map(r => r.name);

  // Get migrations from the folder
  var migrationsFromFolder = fs.readdirSync(migrationsFolder);

  // Filter migrations that have already run
  var migrations = diff(migrationsFromFolder, migrationsFromDatabase);

  // Return if there aren't any
  if(migrations.length === 0) {
    log("No migrations to run")
    log("Done")
    process.exit(0);
  }

  log(`Running ${migrations.length} ${pluralize("migration", migrations.length)}`)

  for(var migration of migrations) {
    yield migrate(migration);
  }

  log("Done");

  process.exit(0);
}
