var fs = require('fs');

const filename = './hening-100-elastic-b.json'
let content = ''

fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      console.log('Some error occured - file either not saved or corrupted file saved.');
    }

    content = JSON.parse(data).data

    //console.log(content);

    let res = Object.keys(content).map(key => {
      let item = content[key]
      return [
        item.receive_date,
        item.orig_id,
        item.nid,
        item.from_user_name,
        item.to_user_name,
      ]
    })

    console.log(res)

    let csv = res.map(row => row.join(';')).join("\n")
    console.log(csv)

    fs.writeFile(filename + '.csv', csv, 'utf8', console.log)
});


