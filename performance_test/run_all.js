// k6 & influxdb configuration
process.env.K6_INFLUXDB_PUSH_INTERVAL = "1s"
process.env.K6_OUT = "influxdb=http://localhost:8086/k6"
process.env.APP_HOST='localhost'

var { runQuery } = require('../mysql_client')

// select random struktural account for testing data
runQuery(`
  select PeopleId, PeopleName, PeoplePosition from people
  where PeopleIsActive = 1 and Eselon in ('II.a', 'II.b')
  order by RAND()
  limit 100
`).then(results => {
  const struktural_ids = results.flatMap(item => item.PeopleId)
  console.log(struktural_ids)

  process.env.STRUKTURAL_IDS = struktural_ids.join(',')

  // list of scenario files to be executed
  let script_paths = [
    './performance_test/scenario_breakpoint_test.js',
    './performance_test/scenario_breakpoint_test.js',
    './performance_test/scenario_breakpoint_test.js',
    './performance_test/scenario_stress_test.js',
  ]

  const spawnSync = require('child_process').spawnSync;
  for (let k in script_paths) {
    try {
      let path = script_paths[k]
      console.log("\n\n=========================\nrunning scenario: " + path)
      let output = spawnSync('k6 run ' + path, {
        encoding: 'utf-8', 
        stdio: 'inherit',
        shell: true,
      });
      console.log('result:')
      console.log(output)

      spawnSync('sleep 15', {
        encoding: 'utf-8', 
        stdio: 'inherit',
        shell: true,
      }); // wait for 60s
    } catch (e){
      console.log('encounter error: ' + e.message)
    }
  }
})

