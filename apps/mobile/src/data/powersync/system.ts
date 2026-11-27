import { PowerSyncDatabase } from '@powersync/react-native';
import { SupabaseConnector } from './connector';
import { AppSchema } from './schema';

// @powersync/react-native 2.x bundles the op-sqlite adapter (the separate package is legacy).
export const powerSync = new PowerSyncDatabase({
  schema: AppSchema,
  database: { dbFilename: 'healthypaw.db' },
});

export const connector = new SupabaseConnector();
