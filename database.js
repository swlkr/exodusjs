var pg    = require("pg"),
    yepql = require("yepql")(pg),
    path  = require("path");


function raw(connectionString, query, params) {
  return new Promise(function(resolve, reject) {
    pg.connect(connectionString, function(error, client, done) {
      if(error) {
        reject(error);
        return;
      }

      client.query(query, params, function(queryError, result) {
        done();

        if(queryError) {
          reject(queryError);
          return;
        }

        resolve(result.rows || []);
      })
    })
  })
}

module.exports = Object.assign(yepql.makeQueries(path.join(__dirname, "sql")), {raw: raw})
