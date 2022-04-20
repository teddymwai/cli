import { IacTestResponse } from '../../../../snyk-test/iac-test-result';
import { IacOutputMeta } from '../../../../types';
import { TestData } from './types';

export function formatScanResultsNewOutput(
  oldFormattedResults: IacTestResponse[],
  outputMeta: IacOutputMeta,
): TestData {
  const newFormattedResults: TestData = {
    results: {},
    metadata: outputMeta,
  };

  oldFormattedResults.forEach((oldFormattedResult) => {
    oldFormattedResult.result.cloudConfigResults.forEach((issue) => {
      if (!newFormattedResults.results[issue.severity]) {
        newFormattedResults.results[issue.severity] = [];
      }

      newFormattedResults.results[issue.severity]!.push({
        ...issue,
        targetFile: oldFormattedResult.targetFile,
        projectType: oldFormattedResult.result.projectType,
      });
    });
  });

  return newFormattedResults;
}
