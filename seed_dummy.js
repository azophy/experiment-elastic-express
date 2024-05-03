var { con, runQuery } = require('./mysql_client')
var { client: elasticClient } = require('./elastic_client')

const AVAILABLE_ACTION_LABELS = ['REVIEW', 'REVIEWED', 'DISPOSED', 'FINISHED']
const AVAILABLE_RECEIVE_STATUS = ['read', 'unread']
const AVAILABLE_RECEIVER_AS = [
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
    'to_surat_izin_keluar',
    'cc1', 'to_archive', 'to_distributed', 'to_forward', 
    'to_notadinas', 'to_pengumuman', 'to_rekomendasi', 
    'to_sket', 'to_sprint', 'to_super_tugas_keluar', 
    'to_surat_izin_keluar'
]

const INDEX_NAME = 'test_sidebar_elastic_bigdata'
const DATE_START = '2023-01-01'
const NUM_DAYS = 100
const NUM_DAILY_GENERATED_DOCS = 5000
//const NUM_DAYS = 3
//const NUM_DAILY_GENERATED_DOCS = 5

function sleep(time) {
  console.log(`sleeping for ${time} seconds`)
  return new Promise(resolve => setTimeout(resolve, time));
} 

const randomNumber = (len) => Math.floor(Math.random() * len)
const randomElement = (list) => list[randomNumber(list.length)]

con.connect(async (err) => {
  if (err) throw err;
  console.log("Mysql connected!");

  const strukturalUsers = await selectStrukturalUsers()

  await prepareIndex()

  let date = new Date(DATE_START)
  for (let day=0;day<NUM_DAYS;day++) {
    console.log('>>> processing for date ' + date)
    // generate dummy data
    let rows = (new Array(NUM_DAILY_GENERATED_DOCS))
        .fill(0)
        .map(() => generateDummyInboxReceiver(strukturalUsers, date))
    //console.log(rows)
    //sleep(10000)

    await insertToElastic(rows)

    date.setDate(date.getDate() + 1)
  }

  con.end((err) => {
    // The connection is terminated gracefully
    // Ensures all remaining queries are executed
    // Then sends a quit packet to the MySQL server.
  });

});

async function selectStrukturalUsers() {
    const query = `
      SELECT 
        people.PeopleId as user_id,
        people.PeopleName as user_name,
        people.GroupId as group_id,
        role.RoleId as role_id,
        role.RoleName as role_name
      FROM people 
      LEFT JOIN role on role.RoleId = people.PrimaryRoleId
      WHERE PeopleIsActive = 1
        AND Eselon in ('II.a', 'II.b', 'III.a')
    `

    const rows = await runQuery(query)
    console.log('got ' + rows.length + ' items')
    return rows
}

function generateDummyInboxReceiver(users, date) {
  var from = randomElement(users)
  var to = randomElement(users)
  var action_label = randomElement(AVAILABLE_ACTION_LABELS)
  var new_id = randomNumber(10000000000000)

  return {
      receive_date: date,
      orig_id: new_id,
      nkey: '-',
      nid: new_id,
      gir_id: new_id,
      from_user_id: from.user_id,
      from_user_name: from.user_name,
      from_role_id:  from.role_id,
      from_role_name: from.role_name,
      from_group_id:  from.group_id,
      to_user_id: to.user_id,
      to_user_name: to.user_name,
      to_role_id:  to.role_id,
      to_role_name: to.role_name,
      receiver_as: randomElement(AVAILABLE_RECEIVER_AS),
      msg: '',
      action_label,
      tindak_lanjut: action_label == 'FINISHED' ? 1 : 0,
      status_receive: action_label == 'REVIEW' ? randomElement(AVAILABLE_RECEIVE_STATUS) : 'read',
      status: action_label == 'REVIEW' ? 0 : 1,
      asal_naskah: 'internal',
  }
}

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
            orig_id: { type: 'text' },
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
