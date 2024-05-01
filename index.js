const express = require('express')
const app = express()
const port = process.env.APP_PORT || 3000

const { Client } = require('es7')
const client = new Client({
  node: 'http://172.17.0.1:9200', // Elasticsearch endpoint
  //auth: {
    //username: 'elastic',
    //password: 'changeme'
  //}
})

const INDEX_NAME = 'my_index'

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/elastic/create_index', async (req, res) => {
  try {
    await client.indices.create({ index: INDEX_NAME })
    res.send('Success!')
  } catch (e) {
    res.send('error: ' + e.message)
  }
})

function randomString(len = 10) {
  const str = Math.floor(Math.random() * Math.pow(32, len)).toString(32);
  return str.padStart(len, '0')
}

function generateId() {
  return Math.floor(Date.now() / 1000).toString(32) + randomString(8)
}

app.get('/elastic/insert_people/:name/:position', async (req, res) => {
  //const id = generateId()
  const payload = {
      index: INDEX_NAME,
      //id,
      body: req.params,
  }
  console.log(payload)

  try {
    const result = await client.index(payload)
    res.send(result)
  } catch (e) {
    res.send('error: ' + e.message)
  }
})

app.get('/elastic/insert_dummies/:count', async (req, res) => {
  const count = req.params.count
  const availablePositions = [
    'admin',
    'writer',
    'clerk',
    'HR',
    'IT'
  ]

  let succeed = 0
  for (let i=0;i<count;i++) {
    try {
      const payload = {
          index: INDEX_NAME,
          body: {
            name: randomString(5),
            position: availablePositions[
              Math.floor(Math.random() * availablePositions.length)
            ],
          },
      }
      console.log(payload)
      const result = await client.index(payload)
      succeed++
    } catch (e) {
      console.log('error: ' + e.message)
    }
  }
  res.send('succeed: ' + succeed)
})

app.get('/elastic/refresh_index', async (req, res) => {
  await client.indices.refresh({ index: INDEX_NAME })
  res.send('done')
})

app.get('/elastic/list_by_position/:position', async (req, res) => {
  const position = req.params.position

  try {
    const { body } = await client.search({
      index: INDEX_NAME,
      // type: '_doc', // uncomment this line if you are using {es} ≤ 6
      body: {
        query: {
          match: { position }
        }
      }
    })
    res.send({
      count: body.hits.total.value,
      results: body.hits.hits.map(item => item._source),
    })
  } catch (e) {
    res.send('error: ' + e.message)
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
