EXPERIMENT ELASTIC EXPRESS
==========================

## Links
- experiment wiki: https://wiki.digitalservice.id/doc/experiment-inbox_receiver-dengan-elasticsearch-VA2bPlga3e
- clickup card: https://app.clickup.com/t/9003239225/GOS-5931

## Implemented features
- 'migrate.js' -> migration from mysql table into elasticsearch index
- API '/inboxes/:id/:page_count/:from' -> attempt to simulate 'Inboxes' query in Mobile API v1

## Setup
1. clone this repo
2. docker compose up
3. Try to check `localhost:9200`. if it didn't shows anything, check "Troubleshoot" section below
4. To run the express app, execute `docker compose exec app npm run start:dev`

## Troubleshoot
- if you encounter error during elasticsearch's startup, this SO thread may be helpful: https://stackoverflow.com/questions/56937171/efk-elasticsearch-1-exited-with-code-78-when-install-elasticsearch

## Performance test
- we provided `performance_test` folder which contain k6 scripts to run performance test against this API
- requirements:
  - k6 & nodejs installed locally (without docker)
- how to run: from root of this repo run `node ./performance_test/run_all.js`

## References
- elasticsearch with nestjs tutorial, include setup es & nestjs module: https://wanago.io/2020/09/07/api-nestjs-elasticsearch/
- getting started es client for js: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/getting-started-js.html#_creating_an_index
- https://www.elastic.co/blog/a-practical-introduction-to-elasticsearch
