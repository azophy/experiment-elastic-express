const { Client } = require('es7')

const client = new Client({
  node: 'http://172.17.0.1:9200', // Elasticsearch endpoint
  //auth: {
    //username: 'elastic',
    //password: 'changeme'
  //}
})

module.exports = {
  client,
}
