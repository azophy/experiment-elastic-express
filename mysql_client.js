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

module.exports = {
  con,
}
