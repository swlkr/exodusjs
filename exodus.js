#!/usr/bin/env node

var program  = require("commander"),
    co       = require("co"),
    commands = require("./commands"),
    package  = require("./package.json");

program
.version(package.version)

program
.command("create [name]")
.description("Create a new migration file")
.action(commands.create)

program
.command("migrate")
.description("Apply all migrations that haven't already been applied")
.action(function() {
  co(function *() {
    yield commands.migrate();
  });
});

program
.command("rollback")
.description("Rollback the last migration")
.action(function() {
  co(function *() {
    yield commands.rollback();
  });
})

program.parse(process.argv);

if(!program.args.length) {
  program.help();
}
