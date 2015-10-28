require('dotenv').load();

var config = {};

config.version = '0.0.4';

config.database = {};
config.database.url = process.env.DATABASE_URL;

module.exports = config;
