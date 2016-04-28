var create   = require("./create"),
    migrate  = require("./migrate"),
    rollback = require("./rollback");

module.exports = {
  create: create,
  migrate: migrate,
  rollback: rollback
};
