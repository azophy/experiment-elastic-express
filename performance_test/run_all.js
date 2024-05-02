const spawnSync = require('child_process').spawnSync;

process.env.K6_INFLUXDB_PUSH_INTERVAL = "1s"
process.env.K6_OUT = "influxdb=http://localhost:8086/k6"

let script_paths = [
  './performance_test/scenario_breakpoint_test.js',
  './performance_test/scenario_breakpoint_test.js',
  './performance_test/scenario_breakpoint_test.js',
  './performance_test/scenario_stress_test.js',
]

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
