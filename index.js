const express = require('express')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.APP_PORT || 3000
const { client } = require('./elastic_client')
var { con, runQuery } = require('./mysql_client')

const INDEX_NAME = 'sidebar_inbox_receiver'

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/inboxes/:id/:page_count/:after_id', async (req, res) => {
  const to_user_id = req.params.id
  const page_count = req.params.page_count || 20
  const after_id = req.params.after_id || 0

  const payload = {
    index: INDEX_NAME,
    body: {
      query: { bool: {
          filter: { exists: { field: "from_user_id" } },
          must: [ // query AND paling luar
            // -- dari InboxFilterTrait->nondispositionQuery() 
            { bool: { should: [
                  { bool: { must: [
                        { terms: { receiver_as: [  
                          'to',
                          'koreksi',
                          'to_edaran',
                          'to_forward',
                          'to_keluar',
                          'to_notadinas',
                          'to_pengumuman',
                          'to_rekomendasi',
                          'to_sket',
                          'to_sprint',
                          'to_super_tugas_keluar',
                          'to_surat_izin_keluar'
                        ] }},
                        { bool: { should: [
                              { bool: { must_not: { term: { from_group_id: "6" }  } } }, // != uk
                              { bool: { must_not: { term: { receiver_as: 'to_forward' }  } } },
                        ]}}
                  ] } },
                  { terms: { receiver_as: ['cc1', 'nondisposition'] }}
            ] } },
            // -- dari InboxFilterTrait->queryInternalScopeProv()
            { bool: { should: [
                  { terms: { receiver_as: [
                    'cc1', 'to_archive', 'to_distributed', 'to_forward', 
                    'to_notadinas', 'to_pengumuman', 'to_rekomendasi', 
                    'to_sket', 'to_sprint', 'to_super_tugas_keluar', 
                    'to_surat_izin_keluar'
                  ] }},
                  { bool: { must: [
                        { term: { receiver_as: 'to' }},
                        { bool: { must_not: { term: { asal_naskah: 'eksternal' }  } } },
                      ]
                    }
                  }
                ]
              }
            },
            // -- filter owner kotak masuk
            { term: { to_user_id }}
          ]
        }
      },
      //query: { term: { to_user_id }},
      sort: [
        { receive_date: { order: 'desc' }}
      ],
      from: after_id,
      size: page_count,
    }
  }

  try {
    const result = await client.search(payload);

    //let data = result.body.hits.hits.map(item => item._source)
    let data = {}
    result.body.hits.hits.map(item => {
      data[item._source.nid] = item._source
    })
    let nids = Object.keys(data)
    console.log('NIds: ' + nids)
    
    const mysqlRes = await runQuery('SELECT * from inbox WHERE NId in (?)', nids)
    console.log(mysqlRes)
    console.log(mysqlRes.sql)

    mysqlRes.flatMap(item => {
      if (data[item.NId])
        data[item.NId].naskah = item
    })
    //const body = rows.flatMap(doc => [{ index: { _index: INDEX_NAME } }, doc])

    res.json({
      count: result.body.hits.total.value,
      data,
    })
  } catch (e) {
    res.send('error: ' + e.message)
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
