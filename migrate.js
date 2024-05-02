var mysql = require('mysql');

var con = mysql.createConnection({
  host: "host.docker.internal",
  //host: "172.17.0.1",
  port: "3307",
  user: "sikdweb",
  password: "sikdweb",
  database: "baru",
});

var { client as elasticClient } = require('elastic_client')

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 

// adapted from https://darifnemma.medium.com/how-to-interact-with-mysql-database-using-async-await-promises-in-node-js-9e6c81b683da
function runQuery(query) {
  return new Promise((resolve, reject)=>{
      con.query(query,  (error, results)=>{
          if(error){
              return reject(error);
          }
          return resolve(results);
      });
  });
}

con.connect(async (err) => {
  if (err) throw err;
  console.log("Connected!");

  await runMigration(null, 10)

  con.end((err) => {
    // The connection is terminated gracefully
    // Ensures all remaining queries are executed
    // Then sends a quit packet to the MySQL server.
  });

});

async function runMigration(startFrom = null, chunkSize = 100) {
  let loop = 1
  while (true) {
    console.log(`loop #${loop}`)
    console.log('startFrom: ' + startFrom)
    const whereQuery = startFrom ? `WHERE id > ${startFrom} ` : ''
    const query = `
      SELECT * 
      FROM inbox_receiver 
      ${whereQuery} 
      ORDER BY id asc 
      LIMIT ${chunkSize}`

    const rows = await runQuery(query)
    startFrom = rows[rows.length-1].id
    //console.log('Data received from Db:');
    //console.log(rows);

    await sleep(1000)

    // we reach end of data
    if (rows.length <= 0)  break;
  }
}

function insertToElastic(rows) {
  try {
    await client.indices.create({
      index: 'tweets',
      body: {
        mappings: {
          properties: {
            // more info see: https://wiki.digitalservice.id/doc/experiment-inbox_receiver-dengan-elasticsearch-VA2bPlga3e#h-data
            id: { type: 'integer' },
            orig_id: { type: 'integer' },
            nkey: { type: 'text' },
            nid: { type: 'text' },
            girid: { type: 'text' },
            from_user_id: { type: 'integer' },
            from_user_name: { type: 'text' },
            from_role_id: { type: 'text' },
            from_role_name: { type: 'text' },
            from_group_id (beberapa query butuh ini)
            to_user_id: { type: 'integer' },
            to_user_name: { type: 'text' },
            to_role_id: { type: 'text' },
            to_role_name: { type: 'text' },
            receiver_as: { type: 'text' },
            msg: { type: 'text' },
            status_receive: { type: 'integer' },
            receive_date: { type: 'date' },
            status: { type: 'integer' },
            tindak_lanjut: { type: 'text' },
            action_label: { type: 'text' },
            asal_naskah: { type: 'text' },
          }
        }
      }
    }, { ignore: [400] })
  } catch (e) {
  }
}
