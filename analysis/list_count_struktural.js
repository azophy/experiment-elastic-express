var { con, runQuery } = require('../mysql_client')
var fs = require('fs');

const APP_HOST = process.env.APP_HOST

function sleep(time) {
  console.log(`sleeping for ${time} seconds`)
  return new Promise(resolve => setTimeout(resolve, time));
} 

const randomNumber = (len) => Math.floor(Math.random() * len)

function MobileApiRequest(body, token = null) {
  let headers = {
    'Content-Type': 'application/json',
  }

  if (token != null) headers.Authorization = 'Bearer ' + token

  return fetch(`http://${APP_HOST}:8000/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

con.connect(async (err) => {
  if (err) throw err;
  console.log("Mysql connected!");

  const strukturalUsers = await selectStrukturalUsers()

  // for all struktural users
  for (let i=0;i<strukturalUsers.length;i++) {
    let user = strukturalUsers[i]
    // login mobile api
    let resLogin = await MobileApiRequest({
      'query': '# di bagian query/mutation\nmutation login ($loginInput:LoginInput) {\n  login(input: $loginInput) {\n    message\n    access_token\n    token_type\n    profile {\n      id\n      name\n      email\n    }\n    expires_in\n  }\n}\n\n# di bagian query variables\n',
      'variables': {
        'loginInput': {
          'username': user.nip,
          'password': 'example_password',
          'device': 'test',
          'fcm_token': 'test_local' + randomNumber(10000000),
        }
      }
    })
    let contentLogin = await resLogin.json()
    let token = contentLogin.data.login.access_token

    // query count mobile api
    let resInboxes = await MobileApiRequest({
      'query': ' query {\n    inboxes(\n      filter: { scope: INTERNAL, receiverTypes: "cc1, nondisposition" }\n      first: 1\n    ) {\n      edges {\n        node {\n          date\n          id\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n        total\n        count\n      }\n    }\n  }'
    }, token)
    let contentInboxes = await resInboxes.json()
    console.log(contentInboxes)

    // query count for elasticsearch
    let res = await fetch(`http://${APP_HOST}:3000/inboxes/${user.user_id}/1/0`)
    let content = await res.json()

    // collect results
    const row = [
      user.user_id,
      user.user_name,
      contentInboxes.data.inboxes.pageInfo.total,
      content.count,
    ]
    console.log(row)

    fs.appendFile('result_list_count_struktural.csv', row.join(';') + "\n", console.log)
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
        people.nip,
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

