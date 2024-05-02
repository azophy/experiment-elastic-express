import { dateTime, defaultBreakpointTestOption, defaultBreakpointTestThreshold } from './common.js'
export { setup, default, handleSummary } from './common.js'

export const options = {
  scenarios: {
    sidebar_web_v2_breakpoint_test: defaultBreakpointTestOption,
  },
  thresholds: defaultBreakpointTestThreshold,
  tags: {
    runs_name: 'sidebar_experiment_elastic_breakpoint_test_' + dateTime(),
    test_type: 'breakpoint_test',
  },
};

