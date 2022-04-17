import { EOL } from 'os';
import * as isEmpty from 'lodash.isempty';
import * as debug from 'debug';

import { IacOutputMeta } from '../../../../types';
import { colors } from '../color-utils';
import { formatScanResultsNewOutput } from './formatters';
import { formatIssue } from './issue';
import { severityValues, SeverityTitleBySeverity } from './types';
import { IacTestResponse } from '../../../../snyk-test/iac-test-result';

export function getIacDisplayedIssues(
  results: IacTestResponse[],
  outputMeta: IacOutputMeta,
): string {
  const titleOutput = colors.info.bold('Issues');

  const formattedResults = formatScanResultsNewOutput(results, outputMeta);

  if (isEmpty(formattedResults.results)) {
    return (
      titleOutput +
      EOL +
      ' '.repeat(2) +
      colors.success.bold('No vulnerable paths were found!')
    );
  }

  const severitySectionsOutput = severityValues
    .filter((severity) => !!formattedResults.results[severity])
    .map((severity) => {
      const issues = formattedResults.results[severity]!;

      const titleOutput = colors.severities[severity](
        `${SeverityTitleBySeverity[severity]} Severity Issues: ${issues.length}`,
      );

      const issuesOutput = issues.map(formatIssue).join(EOL.repeat(2));

      debug(
        `iac display output - ${severity} severity ${issues!.length} issues`,
      );

      return titleOutput + EOL.repeat(2) + issuesOutput;
    })
    .join(EOL.repeat(2));

  return titleOutput + EOL.repeat(2) + severitySectionsOutput;
}
