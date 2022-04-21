import { MethodArgs } from '../../../args';
import { TestCommandResult } from '../../../commands/types';
import { validateCredentials } from '../validate-credentials';
import { validateTestOptions } from '../validate-test-options';
import { setDefaultTestOptions } from '../set-default-test-options';
import { processCommandArgs } from '../../process-command-args';
import { hasFeatureFlag } from '../../../../lib/feature-flags';
import { getIacOrgSettings } from './local-execution/measurable-methods';
import config from '../../../../lib/config';
import { UnsupportedEntitlementError } from '../../../../lib/errors/unsupported-entitlement-error';
import { buildOutput, printInitialMessage } from './output';
import { initRulesAndScanPaths } from './scan';
import { assertIaCOptionsFlags } from './local-execution/assert-iac-options-flag';

export default async function(...args: MethodArgs): Promise<TestCommandResult> {
  assertIaCOptionsFlags(process.argv);

  const { options: originalOptions, paths } = processCommandArgs(...args);

  const options = setDefaultTestOptions(originalOptions);
  validateTestOptions(options);
  validateCredentials(options);

  const isNewIacOutputSupported = await hasFeatureFlag('iacCliOutput', options);

  printInitialMessage(options, isNewIacOutputSupported);

  const orgPublicId = (options.org as string) ?? config.org;
  const iacOrgSettings = await getIacOrgSettings(orgPublicId);

  if (!iacOrgSettings.entitlements?.infrastructureAsCode) {
    throw new UnsupportedEntitlementError('infrastructureAsCode');
  }

  const {
    results,
    resultOptions,
    iacScanFailures,
    iacIgnoredIssuesCount,
    iacOutputMeta,
  } = await initRulesAndScanPaths(options, paths, orgPublicId, iacOrgSettings);

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
