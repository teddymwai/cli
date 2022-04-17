import chalk from 'chalk';
import { EOL } from 'os';

import { printPath } from '../../../remediation-based-format-issues';
import { colors } from '../color-utils';
import { AnnotatedIssue, SeverityTitleBySeverity } from './types';

export function formatIssue(issue: AnnotatedIssue): string {
  const titleOutput = formatTitle(issue);

  const propertiesOutput = formatProperties(issue);

  return titleOutput + EOL + propertiesOutput;
}

function formatTitle(issue: AnnotatedIssue): string {
  const severity = issue.severity;
  const titleOutput = colors.severities[severity](
    `[${SeverityTitleBySeverity[issue.severity]}] ${chalk.bold(issue.title)}`,
  );

  return titleOutput;
}

function formatProperties(issue: AnnotatedIssue): string {
  const properties = [
    [
      'Info',
      `${issue.iacDescription.issue}${
        issue.iacDescription.issue.endsWith('.') ? '' : '.'
      } ${issue.iacDescription.impact}`,
    ],
    ['Rule', issue.documentation],
    ['Path', printPath(issue.cloudConfigPath, 0)],
    ['File', issue.targetFile],
    ['Resolve', issue.iacDescription.resolve],
  ].filter(([, val]) => !!val) as [string, string][];

  const maxPropertyNameLength = Math.max(
    ...properties.map(([key]) => key.length),
  );

  return properties
    .map(
      ([key, value]) =>
        `${key}: ${' '.repeat(maxPropertyNameLength - key.length)}${value}`,
    )
    .join(EOL);
}
