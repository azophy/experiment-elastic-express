var { con } = require('./mysql_client')
var { client: elasticClient } = require('./elastic_client')

function sleep(time) {
  console.log(`sleeping for ${time} seconds`)
  return new Promise(resolve => setTimeout(resolve, time));
} 

// adapted from https://darifnemma.medium.com/how-to-interact-with-mysql-database-using-async-await-promises-in-node-js-9e6c81b683da
function runQuery(query) {
  return new Promise((resolve, reject)=>{
      const startTime = Date.now()
      con.query(query,  (error, results)=>{
          const timeDelta = Date.now() - startTime
          console.log('query executed in ' + (timeDelta/1000) + ' seconds')
          if(error){
              return reject(error);
          }
          return resolve(results);
      });
  });
}

con.connect(async (err) => {
  if (err) throw err;
  console.log("Mysql connected!");

  await runMigration('5323', 500)
  //await runMigration(null, 500)

  con.end((err) => {
    // The connection is terminated gracefully
    // Ensures all remaining queries are executed
    // Then sends a quit packet to the MySQL server.
  });

});

async function runMigration(startFrom = null, chunkSize = 100) {
  await prepareIndex()

  let loop = 1
  while (true) {
    console.log(`loop #${loop}`)
    console.log('startFrom: ' + startFrom)
    const whereQuery = startFrom ? `WHERE id > ${startFrom} ` : ''
    const query = `
      SELECT 
        inbox_receiver.id as orig_id ,
        inbox_receiver.NId as nid ,
        inbox_receiver.GIR_Id as gir_id ,
        inbox_receiver.ReceiverAs as receiver_as ,
        inbox_receiver.Msg as msg ,
        inbox_receiver.StatusReceive as status_receive ,
        inbox_receiver.ReceiveDate as receive_date ,
        inbox_receiver.Status as status ,
        inbox_receiver.TindakLanjut as tindak_lanjut ,
        inbox_receiver.action_label ,
        inbox_receiver.TindakLanjut as tindak_lanjut ,
        sender.PeopleId as from_user_id,
        sender.PeopleName as from_user_name,
        sender.GroupId as from_group_id,
        sender_role.RoleId as from_role_id,
        sender_role.RoleName as from_role_name,
        receiver.PeopleId as to_user_id,
        receiver.PeopleName as to_user_name,
        receiver_role.RoleId as to_role_id,
        receiver_role.RoleName as to_role_name,
        inbox.AsalNaskah as asal_naskah
      FROM inbox_receiver 
      JOIN people as sender on sender.PeopleId = inbox_receiver.From_Id
      JOIN role as sender_role on sender_role.RoleId = inbox_receiver.RoleId_From
      JOIN people as receiver on receiver.PeopleId = inbox_receiver.To_Id
      JOIN role as receiver_role on receiver_role.RoleId = inbox_receiver.RoleId_To
      JOIN inbox on inbox.NId = inbox_receiver.NId
      ${whereQuery} 
      -- ORDER BY id asc 
      LIMIT ${chunkSize}`

    const rows = await runQuery(query)
    console.log('got ' + rows.length + ' items')
    startFrom = rows[rows.length-1].orig_id
    //console.log('Data received from Db:');
    //console.log(rows);
    console.log('next startFrom ' + startFrom)

    await insertToElastic(rows)

    //await sleep(10000)

    // we reach end of data
    if (rows.length <= 0)  break;
    loop++
  }
}

const INDEX_NAME = 'sidebar_inbox_receiver'

async function prepareIndex() {
  try {
    console.log('creating index...')
    await elasticClient.indices.create({
      index: INDEX_NAME,
      body: {
        mappings: {
          properties: {
            // more info see: https://wiki.digitalservice.id/doc/experiment-inbox_receiver-dengan-elasticsearch-VA2bPlga3e#h-data
            //id: { type: 'integer' },
            orig_id: { type: 'integer' },
            nkey: { type: 'text' },
            nid: { type: 'text' },
            gir_id: { type: 'text' },
            from_user_id: { type: 'integer' },
            from_user_name: { type: 'text' },
            from_role_id: { type: 'text' },
            from_role_name: { type: 'text' },
            from_group_id: { type: 'integer' },
            to_user_id: { type: 'integer' },
            to_user_name: { type: 'text' },
            to_role_id: { type: 'text' },
            to_role_name: { type: 'text' },
            receiver_as: { type: 'text' },
            msg: { type: 'text' },
            status_receive: { type: 'text' },
            receive_date: { type: 'date' },
            status: { type: 'integer' },
            tindak_lanjut: { type: 'integer' },
            action_label: { type: 'text' },
            asal_naskah: { type: 'text' },
          }
        }
      }
    }, { ignore: [400] })
    console.log('index created')
  } catch (e) {
    console.log('error: ' + e.message)
  }
}

async function insertToElastic(rows) {
  try {
    const body = rows.flatMap(doc => [{ index: { _index: INDEX_NAME } }, doc])

    console.log('inserting to elastic...')
    const { body: bulkResponse } = await elasticClient.bulk({ refresh: true, body })

    if (bulkResponse.errors) {
      const erroredDocuments = []
      // The items array has the same order of the dataset we just indexed.
      // The presence of the `error` key indicates that the operation
      // that we did for the document has failed.
      bulkResponse.items.forEach((action, i) => {
        const operation = Object.keys(action)[0]
        if (action[operation].error) {
          erroredDocuments.push({
            // If the status is 429 it means that you can retry the document,
            // otherwise it's very likely a mapping error, and you should
            // fix the document before to try it again.
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1]
          })
        }
      })
      console.log(erroredDocuments)
    } else {
      console.log('no error encountered')
    }
  } catch (e) {
    console.log('error: ' + e.message)
  }
}
