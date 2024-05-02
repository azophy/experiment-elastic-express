export function randomString(length = 20) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let counter = 0; counter < length; counter++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function dateTime() {
    let date_ob = new Date();

    const date = ("0" + date_ob.getDate()).slice(-2);
    const month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    const year = date_ob.getFullYear();
    const hours = date_ob.getHours().toString().padStart(2,'0');
    const minutes = date_ob.getMinutes().toString().padStart(2,'0');
    const seconds = date_ob.getSeconds().toString().padStart(2,'0');

    return `${year}${month}${date}_${hours}${minutes}${seconds}`;
}

export function dateFormat() {
    let date_ob = new Date();

    const date = ("0" + date_ob.getDate()).slice(-2);
    const month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    const year = date_ob.getFullYear();

    return `${year}-${month}-${date}`;
}

export const defaultBreakpointTestOption = {
  executor: 'ramping-arrival-rate',
  preAllocatedVUs: 1000,
  startTime: '15s', // the ramping API test starts a little later
  stages: [
    { duration: '2h', target: 5000 },
  ],
  tags: {
    test_type: 'breakpoint_test',
  },
}

export const defaultBreakpointTestThreshold = {
  http_req_failed: [{ threshold: 'rate<0.02', abortOnFail: true, delayAbortEval: '10s' }],
  http_req_duration: [{ threshold: 'p(95) < 2000', abortOnFail: true, delayAbortEval: '10s' }],
}

export const defaultStressTestOption = {
  executor: 'ramping-vus',
  startTime: '15s', // the ramping API test starts a little later
  stages: [
    { duration: '10s', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '10s', target: 250 },
    { duration: '5m', target: 250 },
    { duration: '10s', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '10s', target: 750 },
    { duration: '5m', target: 750 },
    { duration: '10s', target: 1000 },
    { duration: '5m', target: 1000 },
  ],
  tags: {
    test_type: 'stress_test',
  },
}

export const defaultStressTestThreshold = {
  http_req_failed: [{ threshold: 'rate<0.5', abortOnFail: true, delayAbortEval: '10s' }],
  http_req_duration: [{ threshold: 'p(95) < 60000', abortOnFail: true, delayAbortEval: '10s' }],
}

import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import exec from 'k6/execution';

export function handleSummary(data) {
    var fileName = exec.vu.tags.runs_name + '_summary.html'
    return {
        [fileName]: htmlReport(data),
    };
}

// main scenario function
export default function () {
  const res = http.get(`http://localhost:9200/inboxes/568/20/0`)
  const body = JSON.parse(res.body);
}

