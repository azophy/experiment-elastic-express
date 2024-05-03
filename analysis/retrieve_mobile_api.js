var fs = require('fs');

const APP_HOST = process.env.APP_HOST
const USER_ID = 2811

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

async function run() {
  let resLogin = await MobileApiRequest({
    'query': '# di bagian query/mutation\nmutation login ($loginInput:LoginInput) {\n  login(input: $loginInput) {\n    message\n    access_token\n    token_type\n    profile {\n      id\n      name\n      email\n    }\n    expires_in\n  }\n}\n\n# di bagian query variables\n',
    'variables': {
      'loginInput': {
        'username': '197108131997031007',
        'password': 'example_password',
        'device': 'test',
        'fcm_token': 'test_local' + randomNumber(10000000),
      }
    }
  })
  let contentLogin = await resLogin.json()
  let token = contentLogin.data.login.access_token
  let after = 'OTAw'

  if (token) console.log('login succeed')

  while (true) {
    console.log('retrieving from cursor: ' + after)

    const afterQuery = after? `after: "${after}"` : ''
    let resInboxes = await MobileApiRequest({
      'query': `query {
          inboxes(
            filter: { scope: INTERNAL, receiverTypes: "cc1, nondisposition" }
            first: 100
            ${afterQuery}
          ) {
            edges {
              node {
                date
                id
                inboxId
              }
            }
            pageInfo {
              hasNextPage
              endCursor
              total
              count
            }
          }
        }`,
    }, token)
    let contentInboxes = await resInboxes.json()
    let countThisPage = contentInboxes.data.inboxes.pageInfo.count

    console.log('countThisPage: ' + countThisPage)

    if (!resInboxes.ok || contentInboxes.errors.length || countThisPage <= 0) break;

    after = contentInboxes.data.inboxes.pageInfo.endCursor

    // collect results
    const rows = contentInboxes.data.inboxes.edges.map(row => [
      row.node.date,
      row.node.id,
      row.node.inboxId,
    ])
    console.log(rows)
    const csv = rows.map(r => r.join(';')).join("\n")

    fs.appendFile(`retrieve_mobileapi_${USER_ID}.csv`, csv + "\n", console.log)
  }
}

run()
