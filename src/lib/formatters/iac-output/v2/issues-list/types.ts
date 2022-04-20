import * as capitalize from 'lodash.capitalize';

import { SEVERITY } from '../../../../snyk-test/common';
import { AnnotatedIacIssue } from '../../../../snyk-test/iac-test-result';
import { IacOutputMeta } from '../../../../types';

export const severityValues = [...Object.values(SEVERITY)] as const;

export type SeverityTitleBySeverity = {
  [severity in typeof severityValues[number]]: string;
};

export const SeverityTitleBySeverity = severityValues.reduce(
  (severityTitles, severity: string) => {
    severityTitles[severity] = capitalize(severity);
    return severityTitles;
  },
  {} as SeverityTitleBySeverity,
);

export interface AnnotatedIssue extends AnnotatedIacIssue {
  targetFile: string;
  projectType: string;
}

type IssuesBySeverity = {
  [severity in SEVERITY]?: AnnotatedIssue[];
};

export type TestData = {
  results: IssuesBySeverity;
  metadata: IacOutputMeta;
};
