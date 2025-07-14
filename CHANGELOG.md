# Changelog

### v0.2.2 (2025-07-14)

- Fixed a performance issue with the schema query.

### v0.2.0 (2025-07-14)

- Added support for output module type (`esm` or `commonjs`) via `--module` option.
- Added support for configuration files using `cosmiconfig`.
- Added `--silent` option to suppress output.
- Added progress output.
- Project now uses esm modules by default.

### v0.1.1 (2025-07-14)

- Fixed issue with parsing check constraints in column definitions.

### v0.1.0 (2025-07-14)

- Improved pluralization / singularization handling using `pluralize` library.
- Fixed column parsing to correctly handle allowed values.
- Fixed column parsing to correctly handle serial columns.
