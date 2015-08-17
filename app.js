#!/usr/bin/env node

var config   = require('./config.js'),
    app      = require('commander'),
    commands = require('./commands.js');

var command, name;

app
.version(config.version)
.usage('[up|down|create] migration-name')
.arguments('<cmd> [arg]')
.action(function(cmd, arg) {
  command = cmd;
  name = arg;
})
.parse(process.argv);

if(!command) {
  app.outputHelp();
  return;
}

var clog = function(message) {
  console.log('[EXODUS]', message);
};

// exodus create migration-name
// Handle no name
if(command === 'create' && !name) {
  clog('Your migration needs a name!\n[EXODUS] exodus create the-name-of-your-migration');
  return;
}

switch(command) {
  case 'create':
    commands.create(name);
    break;
  case 'up':
    commands.up();
    break;
  case 'down':
    commands.down();
    break;
}
