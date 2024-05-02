var mysql = require('mysql');

const host = process.env.APP_HOST || '172.17.0.1'

var con = mysql.createConnection({
  host,
  //host: "172.17.0.1",
  port: "3307",
  user: "sikdweb",
  password: "sikdweb",
  database: "baru",
});

// adapted from https://darifnemma.medium.com/how-to-interact-with-mysql-database-using-async-await-promises-in-node-js-9e6c81b683da
function runQuery(query, bindings=null) {
  return new Promise((resolve, reject)=>{
      const callback = (error, results) => {
          const timeDelta = Date.now() - startTime
          console.log('query executed in ' + (timeDelta/1000) + ' seconds')
          if(error){
              return reject(error);
          }
          return resolve(results);
      }

      const startTime = Date.now()
      if (bindings == null)
        con.query(query, callback);
      else
        con.query(query, bindings, callback);
  });
}

module.exports = {
  con,
  runQuery,
}
