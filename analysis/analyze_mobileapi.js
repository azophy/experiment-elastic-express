var fs = require('fs');

const filename = './result_mobile_api.json'
let content = ''
fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      console.log('Some error occured - file either not saved or corrupted file saved.');
    }

    content = JSON.parse(data)

    //console.log(content);

    let res = content.data.inboxes.edges.map(item => [
      item.node.date,
      item.node.id,
      item.node.inboxId,
      item.node.sender.name,
      item.node.receiver.name,
    ])

    console.log(res)

    let csv = res.map(row => row.join(';')).join("\n")
    console.log(csv)

    fs.writeFile('result_mobile_api.csv', csv, 'utf8', console.log)
});


