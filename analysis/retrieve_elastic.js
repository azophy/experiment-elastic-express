var fs = require('fs');

const APP_HOST = process.env.APP_HOST
const USER_ID = 2811 // a.n. DIKKY AHMAD
const PAGE_SIZE = 300

const randomNumber = (len) => Math.floor(Math.random() * len)

const timestamp = Date.now()

const RESULT_FILENAME = `retrieve_elastic_${USER_ID}_${timestamp}.csv`

function sleep(time) {
  console.log(`sleeping for ${time} seconds`)
  return new Promise(resolve => setTimeout(resolve, time));
} 

async function run() {
  let from = 0

  while (true) {
    console.log('retrieving from cursor: ' + from)

    let res = await fetch(`http://${APP_HOST}:3000/inboxes/${USER_ID}/${PAGE_SIZE}/${from}`)
    let content = await res.json()
    let data = Object.keys(content.data).map(k => content.data[k])
    console.log(data)
    let countThisPage = data.length

    console.log('countThisPage: ' + countThisPage)

    if (countThisPage <= 0) break;

    from += PAGE_SIZE 

    // collect results
    const rows = data.map(row => [
      row.receive_date,
      row.orig_id,
      row.nid,
    ])
    console.log(rows)
    const csv = rows.map(r => r.join(';')).join("\n")

    fs.appendFile(RESULT_FILENAME, csv + "\n", console.log)

    //await sleep(10000)
  }
}

run()
