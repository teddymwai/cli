import { EOL } from 'os';
import * as cloneDeep from 'lodash.clonedeep';
import * as assign from 'lodash.assign';
import { MissingArgError } from '../../../../lib/errors';
import {
  IacFileInDirectory,
  IacOutputMeta,
  Options,
  TestOptions,
} from '../../../../lib/types';
import { MethodArgs } from '../../../args';
import { TestCommandResult } from '../../../commands/types';
import { TestResult } from '../../../../lib/snyk-test/legacy';
import * as utils from '../utils';
import {
  initalUserMessageOutput,
  shouldPrintIacInitialMessage,
} from '../../../../lib/formatters/iac-output';
import { getEcosystemForTest, testEcosystem } from '../../../../lib/ecosystems';
import { test as iacTest } from './local-execution';
import { validateCredentials } from '../validate-credentials';
import { validateTestOptions } from '../validate-test-options';
import { setDefaultTestOptions } from '../set-default-test-options';
import { processCommandArgs } from '../../process-command-args';
import { formatTestError } from '../format-test-error';
import { assertIaCOptionsFlags } from './local-execution/assert-iac-options-flag';
import { hasFeatureFlag } from '../../../../lib/feature-flags';
import { initRules } from './local-execution/rules';
import {
  cleanLocalCache,
  getIacOrgSettings,
} from './local-execution/measurable-methods';
import config from '../../../../lib/config';
import { UnsupportedEntitlementError } from '../../../../lib/errors/unsupported-entitlement-error';
import { buildOutput } from './output';

export default async function(...args: MethodArgs): Promise<TestCommandResult> {
  const { options: originalOptions, paths } = processCommandArgs(...args);

  const options = setDefaultTestOptions(originalOptions);
  validateTestOptions(options);
  validateCredentials(options);

  // Handles no image arg provided to the container command until
  // a validation interface is implemented in the docker plugin.
  if (options.docker && paths.length === 0) {
    throw new MissingArgError();
  }

  const ecosystem = getEcosystemForTest(options);
  if (ecosystem) {
    try {
      const commandResult = await testEcosystem(ecosystem, paths, options);
      return commandResult;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(String(error));
      }
    }
  }

  const resultOptions: Array<Options & TestOptions> = [];
  const results = [] as any[];

  // Holds an array of scanned file metadata for output.
  let iacScanFailures: IacFileInDirectory[] | undefined;
  let iacIgnoredIssuesCount = 0;
  let iacOutputMeta: IacOutputMeta | undefined;

  const isNewIacOutputSupported = await hasFeatureFlag('iacCliOutput', options);

  if (shouldPrintIacInitialMessage(options, isNewIacOutputSupported)) {
    console.log(EOL + initalUserMessageOutput);
  }

  const orgPublicId = (options.org as string) ?? config.org;
  const iacOrgSettings = await getIacOrgSettings(orgPublicId);

  if (!iacOrgSettings.entitlements?.infrastructureAsCode) {
    throw new UnsupportedEntitlementError('infrastructureAsCode');
  }

  try {
    const rulesOrigin = await initRules(iacOrgSettings, options);

    for (const path of paths) {
      // Create a copy of the options so a specific test can
      // modify them i.e. add `options.file` etc. We'll need
      // these options later.
      const testOpts = cloneDeep(options);
      testOpts.path = path;
      testOpts.projectName = testOpts['project-name'];

      let res: (TestResult | TestResult[]) | Error;
      try {
        assertIaCOptionsFlags(process.argv);
        const { results, failures, ignoreCount } = await iacTest(
          path,
          testOpts,
          orgPublicId,
          iacOrgSettings,
          rulesOrigin,
        );

        iacOutputMeta = {
          orgName: results[0]?.org,
          projectName: results[0]?.projectName,
          gitRemoteUrl: results[0]?.meta?.gitRemoteUrl,
        };

        res = results;
        iacScanFailures = failures;
        iacIgnoredIssuesCount += ignoreCount;
      } catch (error) {
        // not throwing here but instead returning error response
        // for legacy flow reasons.
        res = formatTestError(error);
      }

      // Not all test results are arrays in order to be backwards compatible
      // with scripts that use a callback with test. Coerce results/errors to be arrays
      // and add the result options to each to be displayed
      const resArray: any[] = Array.isArray(res) ? res : [res];

      for (let i = 0; i < resArray.length; i++) {
        const pathWithOptionalProjectName = utils.getPathWithOptionalProjectName(
          path,
          resArray[i],
        );
        results.push(
          assign(resArray[i], { path: pathWithOptionalProjectName }),
        );
        // currently testOpts are identical for each test result returned even if it's for multiple projects.
        // we want to return the project names, so will need to be crafty in a way that makes sense.
        if (!testOpts.projectNames) {
          resultOptions.push(testOpts);
        } else {
          resultOptions.push(
            assign(cloneDeep(testOpts), {
              projectName: testOpts.projectNames[i],
            }),
          );
        }
      }
    }
  } finally {
    cleanLocalCache();
  }

  return buildOutput(
    options,
    results,
    isNewIacOutputSupported,
    iacScanFailures,
    iacIgnoredIssuesCount,
    iacOutputMeta,
    resultOptions,
  );
}
