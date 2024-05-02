import { dateTime, defaultStressTestOption, defaultStressTestThreshold } from './common.js'
export { setup, default, handleSummary } from './common.js'

export const options = {
  scenarios: {
    sidebar_web_v2_stress_test: defaultStressTestOption,
  },
  thresholds: defaultStressTestThreshold,
  tags: {
    runs_name: 'sidebar_experiment_elastic_stress_test_' + dateTime(),
    test_type: 'stress_test',
  },
};
