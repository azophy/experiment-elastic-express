EXPERIMENT ELASTIC EXPRESS
==========================

## Implemented API
- '/elastic/create_index' -> create index to be filled
- '/elastic/insert_dummies/:count' -> populate with dummy data
- '/elastic/refresh_index' -> refresh index before we could search
- '/elastic/list_by_position/:position' -> search by position

## Setup
1. clone this repo
2. docker compose up
3. Try to check `localhost:9200`. if it didn't shows anything, check "Troubleshoot" section below
4. To run the express app, execute `docker compose exec app npm run start:dev`

## Troubleshoot
- if you encounter error during elasticsearch's startup, this SO thread may be helpful: https://stackoverflow.com/questions/56937171/efk-elasticsearch-1-exited-with-code-78-when-install-elasticsearch

## References
- elasticsearch with nestjs tutorial, include setup es & nestjs module: https://wanago.io/2020/09/07/api-nestjs-elasticsearch/
- getting started es client for js: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/getting-started-js.html#_creating_an_index
- https://www.elastic.co/blog/a-practical-introduction-to-elasticsearch
