import { EOL } from 'os';

import { IacFileInDirectory } from '../../../../types';
import { colors } from '../color-utils';

export function formatIacTestFailures(testFailures: IacFileInDirectory[]) {
  const sectionComponents: string[] = [];

  const titleOutput = colors.info.bold(`Invalid Files: ${testFailures.length}`);
  sectionComponents.push(titleOutput);

  const testFailuresListOutput = formatFailuresList(testFailures);
  sectionComponents.push(testFailuresListOutput);

  return sectionComponents.join(EOL.repeat(2));
}

interface TestFailuresByFailureReason {
  [reason: string]: IacFileInDirectory[];
}

function groupTestFailuresByFailureReason(
  testFailures: IacFileInDirectory[],
): TestFailuresByFailureReason {
  return testFailures.reduce((groupedFailures, failure) => {
    const reason = failure.failureReason;
    if (reason) {
      if (!groupedFailures[reason]) {
        groupedFailures[reason] = [];
      }

      groupedFailures[reason].push(failure);
    }

    return groupedFailures;
  }, {});
}

function formatFailuresList(testFailures: IacFileInDirectory[]) {
  const testFailuresByReason = groupTestFailuresByFailureReason(testFailures);
  return Object.entries(testFailuresByReason)
    .map(([failureReason, testFailures]) =>
      formatFailure(failureReason, testFailures),
    )
    .join(EOL.repeat(2));
}

function formatFailure(
  failureReason: string,
  testFailures: IacFileInDirectory[],
): string {
  const pathPrefix = 'Path: ';
  const pathLeftPadding = ' '.repeat(pathPrefix.length);

  return (
    colors.failure.bold(failureReason) +
    EOL +
    pathPrefix +
    testFailures
      .map((testFailure) => testFailure.filePath)
      .join(EOL + pathLeftPadding)
  );
}
