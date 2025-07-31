import { sql } from '../../../src/utils/sql.js';

describe('sql template tag', () => {
  it('should return template string as-is when no parameters', () => {
    const query = sql`SELECT * FROM users`;

    expect(query).toBe('SELECT * FROM users');
  });

  it('should handle template with values', () => {
    const userId = 123;
    const status = 'active';

    const query = sql`SELECT * FROM users WHERE id = ${userId} AND status = ${status}`;

    expect(query).toBe(
      'SELECT * FROM users WHERE id = 123 AND status = active'
    );
  });

  it('should handle empty template', () => {
    const query = sql``;

    expect(query).toBe('');
  });

  it('should handle multiline template', () => {
    const table = 'users';
    const limit = 10;

    const query = sql`
      SELECT id, name, email
      FROM ${table}
      WHERE active = true
      LIMIT ${limit}
    `;

    expect(query).toContain('SELECT id, name, email');
    expect(query).toContain('FROM users');
    expect(query).toContain('WHERE active = true');
    expect(query).toContain('LIMIT 10');
  });

  it('should handle null values', () => {
    const value = null;

    const query = sql`SELECT * FROM users WHERE deleted_at = ${value}`;

    expect(query).toContain('deleted_at = null');
  });

  it('should handle undefined values', () => {
    const value = undefined;

    const query = sql`SELECT * FROM users WHERE optional_field = ${value}`;

    expect(query).toContain('optional_field = undefined');
  });

  it('should handle boolean values', () => {
    const isActive = true;
    const isDeleted = false;

    const query = sql`SELECT * FROM users WHERE active = ${isActive} AND deleted = ${isDeleted}`;

    expect(query).toContain('active = true');
    expect(query).toContain('deleted = false');
  });

  it('should handle numeric values', () => {
    const id = 42;
    const score = 98.5;
    const count = 0;

    const query = sql`SELECT * FROM records WHERE id = ${id} AND score = ${score} AND count = ${count}`;

    expect(query).toContain('id = 42');
    expect(query).toContain('score = 98.5');
    expect(query).toContain('count = 0');
  });

  it('should preserve whitespace and formatting', () => {
    const query = sql`
      SELECT 
        id,
        name,
        email
      FROM users
      WHERE active = true
        AND role = 'admin'
      ORDER BY created_at DESC
    `;

    expect(query).toMatch(/SELECT\s+id,\s+name,\s+email/);
    expect(query).toMatch(/WHERE active = true\s+AND role = 'admin'/);
  });
});
