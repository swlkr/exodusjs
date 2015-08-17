var config = require('./config'),
    fs     = require('fs'),
    acid   = require('acidjs')(config.database.url);

var clog = function(message) {
  console.log('[EXODUS]', message);
};

var commands = {};

var contents = `var migration = {
  up: \`
    your sql goes here
  \`,
  down: \`
    your sql goes here
  \`
};

module.exports = migration;`;

function sanityCheck() {
  // Check for a database url
  if(!config.database.url) {
    clog('No DATABASE_URL found in your environment!');
    clog('export DATABASE_URL=your database url');
    clog('Then try again');

    process.exit(0);
  }

  // Check for migrations folder
  try {
    if (!fs.lstatSync('./migrations').isDirectory()) {
      clog('No migrations folder');
      clog('Create a migration first');

      process.exit();
    }
  }
  catch (e) {
    clog('No migrations folder');
    clog('Create a migration first');

    process.exit();
  }
}

function requireFromString(src, filename) {
  var Module = module.constructor;
  var m = new Module();
  m._compile(src, filename);
  return m.exports;
}

// exodus create <migration name>
commands.create = function(name) {
  // Create migrations folder in current directory
  fs.mkdir('migrations', function(err) {
    if(err && err.code !== 'EEXIST') {
      clog(err);
    }

    // Create migration file in migrations/
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

    // Create new migration yyyymmddhhmmss-migration-name
    var migration = {
      name: `${year}${month}${day}${hour}${min}${sec}-${name}.js`,
      contents: contents
    };

    fs.writeFile(`migrations/${migration.name}`, migration.contents, function(writeFileError) {
      if(writeFileError) {
        clog(writeFileError);
        return;
      }

      clog(`Created migration ${migration.name}`);
    });
  });
};

// exodus up
commands.up = function() {
  sanityCheck();

  // Check for table existence
  acid
  .sql('select * from information_schema.tables where table_name = $1', ['migrations'])
  .then(function(rows) {
    // table doesn't exist, create it!
    if(rows.length === 0) {
      return acid.sql('create table migrations (id serial primary key, name text, ran_at timestamp without time zone default now());');
    } else {
      return new Promise(function(resolve) {
        resolve([]);
      });
    }
  })
  .then(function() { return acid.sql('select * from migrations order by ran_at desc'); })
  .then(function(rows) {
    // Get the migrations in the migrations folder
    var files = fs.readdirSync('migrations');

    // Get the migrations that have already run
    var ranMigrations = rows.map(function(f) { return `${f.name}`; });

    // Exclude migrations that have already run
    var names = files.filter(function(f) { return ranMigrations.indexOf(f) === -1; });

    // Bail if there aren't any
    if(names.length === 0) {
      clog('No migrations to run');
      clog('Done');
      process.exit(0);
    }

    clog(`Running ${names.length} migrations`);

    // require() any migrations that are left
    // get the sql
    // transform into promises that will run the sql
    var migrations = names
                     .map(function(n) {
                       clog(`Running migration ${n.split('.')[0]}`);
                       return requireFromString(fs.readFileSync(`migrations/${n}`, 'utf8'));
                     })
                     .map(function(m) { return m.up; })
                     .map(function(sql) { return acid.sql(sql); });

    Promise
    .all(migrations)
    .then(function() {
      // Insert all migration filenames into the migrations table
      return Promise.all(names.map(function(n) { return acid.insert('migrations', { name: n }); }));
    })
    .then(function() {
      clog('Done');

      process.exit(0);
    })
    .catch(function(error) {
      clog(error);

      process.exit(0);
    });
  })
  .catch(function(error) {
    clog(error);

    process.exit(0);
  });
};

commands.down = function() {
  sanityCheck();

  acid
  .sql('select * from information_schema.tables where table_name = $1', ['migrations'])
  .then(function(rows) {
    // table doesn't exist, bail
    if(rows.length === 0) {
      clog('No migrations to rollback');
      clog('Done');

      process.exit(0);
    } else {
      return acid.sql('select * from migrations order by ran_at desc');
    }
  })
  .then(function(rows) {
    if(rows.length === 0) {
      clog('No migrations to rollback');
      clog('Done');

      process.exit(0);
    }

    var id = rows[0].id;
    var name = rows[0].name;
    var migration = requireFromString(fs.readFileSync(`migrations/${name}`, 'utf8'));

    clog('Rolling back 1 migration');
    clog(`Rolling back migration ${name.split('.')[0]}`);

    return Promise.all([id, acid.sql(migration.down)]);
  })
  .then(function(values) {
    var id = values[0];

    return acid.delete('migrations', 'id = $1', id);
  })
  .then(function() {
    clog('Done');

    process.exit(0);
  })
  .catch(function(error) {
    clog(error);

    process.exit(0);
  });
};

module.exports = commands;
