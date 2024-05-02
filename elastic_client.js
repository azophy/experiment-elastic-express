const { Client } = require('es7')

const host = process.env.APP_HOST || '172.17.0.1'

const client = new Client({
  node: `http://${host}:9200`, // Elasticsearch endpoint
  //auth: {
    //username: 'elastic',
    //password: 'changeme'
  //}
})

module.exports = {
  client,
}
