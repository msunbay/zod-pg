import type { ZodPgTableInfo } from '../../../../src/types.js';

import {
  formatEnumConstantName,
  formatEnumTypeName,
  formatJsonSchemaName,
  formatTableRecordName,
  formatTableSchemaName,
  getSchemaPrefix,
} from '../../../../src/generate/format.js';

describe('format', () => {
  // Helper function to create a mock ZodPgTableInfo
  const createMockTableInfo = (
    overrides: Partial<ZodPgTableInfo> = {}
  ): ZodPgTableInfo => ({
    type: 'table',
    name: 'users',
    schemaName: 'public',
    columns: [],
    ...overrides,
  });

  describe('getSchemaPrefix', () => {
    it('should return "Table" for table type', () => {
      const tableInfo = createMockTableInfo({ type: 'table', name: 'users' });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('Table');
    });

    it('should return "Table" for foreign_table type', () => {
      const tableInfo = createMockTableInfo({
        type: 'foreign_table',
        name: 'external_data',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('Table');
    });

    it('should return "Mv" for materialized_view type', () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'user_stats',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('Mv');
    });

    it('should return empty string for materialized_view with mv_ prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'mv_user_stats',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('');
    });

    it('should return empty string for materialized_view with mview_ prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'mview_user_stats',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('');
    });

    it('should return "View" for view type', () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'user_summary',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('View');
    });

    it('should return empty string for view with v_ prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'v_user_summary',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('');
    });

    it('should return empty string for view with view_ prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'view_user_summary',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('');
    });

    it('should return empty string for unknown type', () => {
      const tableInfo = createMockTableInfo({
        type: 'unknown',
        name: 'unknown_object',
      });
      const result = getSchemaPrefix(tableInfo);
      expect(result).toBe('');
    });
  });

  describe('formatTableSchemaName', () => {
    it('should format read schema name for table with default PascalCase', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName(tableInfo, 'read');
      expect(result).toBe('UserPostsTableSchema');
    });

    it('should format insert schema name for table', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName(tableInfo, 'insert');
      expect(result).toBe('UserPostsTableInsertSchema');
    });

    it('should format update schema name for table', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName(tableInfo, 'update');
      expect(result).toBe('UserPostsTableUpdateSchema');
    });

    it('should format schema name for view', () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'user_summary',
      });
      const result = formatTableSchemaName(tableInfo, 'read');
      expect(result).toBe('UserSummaryViewSchema');
    });

    it('should format schema name for view with prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'v_user_summary',
      });
      const result = formatTableSchemaName(tableInfo, 'read');
      expect(result).toBe('VUserSummarySchema');
    });

    it('should format schema name for materialized view', () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'user_stats',
      });
      const result = formatTableSchemaName(tableInfo, 'read');
      expect(result).toBe('UserStatsMvSchema');
    });

    it('should format schema name for materialized view with prefix', () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'mv_user_stats',
      });
      const result = formatTableSchemaName(tableInfo, 'read');
      expect(result).toBe('MvUserStatsSchema');
    });

    it('should respect camelCase casing', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableSchemaName(tableInfo, 'read', 'camelCase');
      expect(result).toBe('userPostsTableSchema');
    });

    it('should respect snake_case casing', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'UserPosts',
      });
      const result = formatTableSchemaName(tableInfo, 'read', 'snake_case');
      expect(result).toBe('user_postsTableSchema');
    });

    it('should respect kebab-case casing', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'UserPosts',
      });
      const result = formatTableSchemaName(tableInfo, 'read', 'kebab-case');
      expect(result).toBe('user-postsTableSchema');
    });

    it('should respect passthrough casing', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'UserPosts',
      });
      const result = formatTableSchemaName(tableInfo, 'read', 'passthrough');
      expect(result).toBe('UserPostsTableSchema');
    });
  });

  describe('formatTableRecordName', () => {
    it('should format read record name with default PascalCase', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName(tableInfo, 'read');
      expect(result).toBe('UserPostRecord');
    });

    it('should format insert record name', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName(tableInfo, 'insert');
      expect(result).toBe('UserPostInsertRecord');
    });

    it('should format update record name', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName(tableInfo, 'update');
      expect(result).toBe('UserPostUpdateRecord');
    });

    it('should singularize plural table names', () => {
      const tableInfo = createMockTableInfo({ type: 'table', name: 'users' });
      const result = formatTableRecordName(tableInfo, 'read');
      expect(result).toBe('UserRecord');
    });

    it('should handle already singular table names', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_profile',
      });
      const result = formatTableRecordName(tableInfo, 'read');
      expect(result).toBe('UserProfileRecord');
    });

    it('should respect camelCase casing', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'user_posts',
      });
      const result = formatTableRecordName(tableInfo, 'read', 'camelCase');
      expect(result).toBe('userPostRecord');
    });

    it('should respect snake_case casing', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'UserPosts',
      });
      const result = formatTableRecordName(tableInfo, 'read', 'snake_case');
      expect(result).toBe('user_postRecord');
    });

    it('should handle complex plural forms', () => {
      const tableInfo = createMockTableInfo({
        type: 'table',
        name: 'categories',
      });
      const result = formatTableRecordName(tableInfo, 'read');
      expect(result).toBe('CategoryRecord');
    });
  });

  describe('formatJsonSchemaName', () => {
    it('should format JSON schema name with default PascalCase', () => {
      const result = formatJsonSchemaName('user_posts', 'metadata');
      expect(result).toBe('UserPostMetadataSchema');
    });

    it('should handle plural table names by singularizing', () => {
      const result = formatJsonSchemaName('users', 'preferences');
      expect(result).toBe('UserPreferencesSchema');
    });

    it('should handle camelCase column names', () => {
      const result = formatJsonSchemaName('users', 'userPreferences');
      expect(result).toBe('UserUserPreferencesSchema');
    });

    it('should respect camelCase casing', () => {
      const result = formatJsonSchemaName(
        'user_posts',
        'metadata',
        'camelCase'
      );
      expect(result).toBe('userPostMetadataSchema');
    });

    it('should respect snake_case casing', () => {
      const result = formatJsonSchemaName(
        'UserPosts',
        'MetaData',
        'snake_case'
      );
      expect(result).toBe('userpost_meta_data_schema');
    });

    it('should respect kebab-case casing', () => {
      const result = formatJsonSchemaName(
        'UserPosts',
        'MetaData',
        'kebab-case'
      );
      expect(result).toBe('userpost-meta-data-schema');
    });

    it('should respect passthrough casing', () => {
      const result = formatJsonSchemaName(
        'user_posts',
        'metadata',
        'passthrough'
      );
      expect(result).toBe('UserPostMetadataSchema');
    });

    it('should handle complex table and column names', () => {
      const result = formatJsonSchemaName(
        'user_account_settings',
        'notification_preferences'
      );
      expect(result).toBe('UserAccountSettingNotificationPreferencesSchema');
    });
  });

  describe('formatEnumConstantName', () => {
    it('should format enum constant name in UPPER_SNAKE_CASE', () => {
      const result = formatEnumConstantName('users', 'status');
      expect(result).toBe('USER_STATUSES');
    });

    it('should handle plural table names by singularizing then pluralizing', () => {
      const result = formatEnumConstantName('user_posts', 'category');
      expect(result).toBe('USER_POST_CATEGORIES');
    });

    it('should handle camelCase column names', () => {
      const result = formatEnumConstantName('users', 'accountType');
      expect(result).toBe('USER_ACCOUNT_TYPES');
    });

    it('should handle PascalCase column names', () => {
      const result = formatEnumConstantName('users', 'AccountType');
      expect(result).toBe('USER_ACCOUNT_TYPES');
    });

    it('should handle snake_case table names', () => {
      const result = formatEnumConstantName(
        'user_account_settings',
        'notification_type'
      );
      expect(result).toBe('USER_ACCOUNT_SETTING_NOTIFICATION_TYPES');
    });

    it('should handle kebab-case inputs', () => {
      const result = formatEnumConstantName('user-posts', 'post-status');
      expect(result).toBe('USER_POST_POST_STATUSES');
    });

    it('should handle single character names', () => {
      const result = formatEnumConstantName('a', 'b');
      expect(result).toBe('A_BS');
    });

    it('should handle special pluralization cases', () => {
      const result = formatEnumConstantName('categories', 'type');
      expect(result).toBe('CATEGORY_TYPES');
    });
  });

  describe('formatEnumTypeName', () => {
    it('should format enum type name with default PascalCase', () => {
      const result = formatEnumTypeName('users', 'status');
      expect(result).toBe('UserStatus');
    });

    it('should handle plural table names by singularizing', () => {
      const result = formatEnumTypeName('user_posts', 'category');
      expect(result).toBe('UserPostCategory');
    });

    it('should handle camelCase column names', () => {
      const result = formatEnumTypeName('users', 'accountType');
      expect(result).toBe('UserAccountType');
    });

    it('should handle PascalCase column names', () => {
      const result = formatEnumTypeName('users', 'AccountType');
      expect(result).toBe('UserAccountType');
    });

    it('should respect camelCase casing', () => {
      const result = formatEnumTypeName('users', 'status', 'camelCase');
      expect(result).toBe('userStatus');
    });

    it('should respect snake_case casing', () => {
      const result = formatEnumTypeName('Users', 'Status', 'snake_case');
      expect(result).toBe('user_status');
    });

    it('should respect kebab-case casing', () => {
      const result = formatEnumTypeName('Users', 'Status', 'kebab-case');
      expect(result).toBe('user-status');
    });

    it('should respect passthrough casing', () => {
      const result = formatEnumTypeName('users', 'status', 'passthrough');
      expect(result).toBe('UserStatus');
    });

    it('should handle complex table and column names', () => {
      const result = formatEnumTypeName(
        'user_account_settings',
        'notification_type'
      );
      expect(result).toBe('UserAccountSettingNotificationType');
    });

    it('should handle special characters in names', () => {
      const result = formatEnumTypeName('user_2fa_settings', 'auth_method');
      expect(result).toBe('User2faSettingAuthMethod');
    });
  });

  describe('edge cases and combinations', () => {
    it('should handle empty string table names gracefully', () => {
      const result = formatEnumConstantName('', 'status');
      expect(result).toBe('_STATUSES');
    });

    it('should handle empty string column names gracefully', () => {
      const result = formatEnumConstantName('users', '');
      expect(result).toBe('USER_s');
    });

    it('should handle very long names', () => {
      const longTableName = 'very_long_table_name_that_exceeds_normal_length';
      const longColumnName =
        'very_long_column_name_that_also_exceeds_normal_length';
      const result = formatEnumConstantName(longTableName, longColumnName);
      expect(result).toBe(
        'VERY_LONG_TABLE_NAME_THAT_EXCEED_NORMAL_LENGTH_VERY_LONG_COLUMN_NAME_THAT_ALSO_EXCEEDS_NORMAL_LENGTHS'
      );
    });

    it('should handle names with numbers', () => {
      const result = formatEnumTypeName('table_v2', 'status_2fa');
      expect(result).toBe('TableV2Status2fa');
    });

    it('should handle names with underscores only', () => {
      const result = formatJsonSchemaName('_', '_');
      expect(result).toBe('Schema');
    });
  });
});
