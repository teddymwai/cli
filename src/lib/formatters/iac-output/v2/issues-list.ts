import { EOL } from 'os';
import * as capitalize from 'lodash.capitalize';
import * as isEmpty from 'lodash.isempty';
import * as debug from 'debug';

import { FormattedResult } from '../../../../cli/commands/test/iac/local-execution/types';
import { IacOutputMeta } from '../../../types';
import { colors } from './color-utils';
import { formatScanResultsNewOutput } from './formatters';
import { FormattedIssue } from './types';

export function getIacDisplayedIssues(
  results: FormattedResult[],
  outputMeta: IacOutputMeta,
): string {
  let output = EOL + colors.info.bold('Issues') + EOL;

  const formattedResults = formatScanResultsNewOutput(results, outputMeta);

  if (isEmpty(formattedResults.results)) {
    return (
      output +
      EOL +
      ' '.repeat(2) +
      colors.success.bold('No vulnerable paths were found!')
    );
  }

  ['low', 'medium', 'high', 'critical'].forEach((severity) => {
    if (formattedResults.results[severity]) {
      const issues = formattedResults.results[severity];
      output +=
        EOL +
        colors.severities[severity](
          `${capitalize(severity)} Severity Issues: ${issues.length}`,
        ) +
        EOL.repeat(2);
      output += getIssuesOutput(issues);

      debug(
        `iac display output - ${severity} severity ${issues.length} issues`,
      );
    }
  });

  return output;
}

// CFG-1574 will continue the work on this function
function getIssuesOutput(issues: FormattedIssue[]) {
  let output = '';

  issues.forEach((issue) => {
    output += colors.info(`${issue.policyMetadata.title}`) + EOL;
  });

  return output;
}
