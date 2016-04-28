# exodus.js
_Simple postgres database migrations_

## Install

```bash
$ npm i -D exodusjs # short for npm install --save-dev exodusjs
```

## How Do I Use It?

```bash
$ export DATABASE_URL=postgres://postgres:@localhost:5432/database
$ exodus create add-events-table # this creates a migrations/ folder in the current directory along with a new migration file!
$ exodus migrate
$ [EXODUS] Running 1 migration
$ [EXODUS] Ran migration 20150811090001-add-events-table
$ [EXODUS] Finished
$ exodus rollback
$ [EXODUS] Rolling back 1 migration
$ [EXODUS] Rolling back migration 20150811090001-add-events-table
$ [EXODUS] Finished
```

## What Does A Migration Look Like?

```js
// 20150811090001-add-events-table
var migration = {
  up: `
    your sql goes here
  `,
  down: `
    your sql goes here
  `
};

module.exports = migration;
```

## A Real Migration

```js
var migration = {
  up: `
    create table events (
      id bigserial primary key,
      data json,
      created_at timestamp without time zone default now()
    );
  `,
  down: `
    drop table events;
  `
};

module.exports = migration;
```

## How Does It Work?

When you run exodus migrate for the first time, a migrations table is created in your database and it tracks which migrations have been run.

## What's With The Name?

Migrations... exodus... they're synonyms. You get it.
