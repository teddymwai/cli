import * as path from 'path';
import * as fs from 'fs';
import { IacOutputMeta } from '../../../../../../../../src/lib/types';
import { formatScanResultsNewOutput } from '../../../../../../../../src/lib/formatters/iac-output/v2/issues-list/formatters';
import { TestData } from '../../../../../../../../src/lib/formatters/iac-output/v2/issues-list/types';
import { IacTestResponse } from '../../../../../../../../src/lib/snyk-test/iac-test-result';

// import x from '../../../../../iac/process-results/fixtures/formatted-results.json'

describe('IaC Output Mapper', () => {
  const fixtureContent = fs.readFileSync(
    path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'iac',
      'process-results',
      'fixtures',
      'formatted-results.json',
    ),
    'utf-8',
  );
  const fixture: IacTestResponse[] = JSON.parse(fixtureContent);

  const formattedFixtureContent = fs.readFileSync(
    path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'iac',
      'process-results',
      'fixtures',
      'new-output-formatted-results.json',
    ),
    'utf-8',
  );
  const formattedFixture: TestData = JSON.parse(formattedFixtureContent);

  const outputMeta: IacOutputMeta = {
    orgName: 'Shmulik.Kipod',
    projectName: 'project-name',
  };

  it('checks that the new output formatter groups issues by severity', () => {
    expect(formatScanResultsNewOutput(fixture, outputMeta)).toEqual(
      formattedFixture,
    );
  });
});
