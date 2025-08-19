# Changelog

### v3.0.0 (2025-08-25)

- Added support for Zod v4 mini.
- Added support to provide a custom `dbConnector` implementation for more flexible database connections.
- Added support to provide a custom `renderer` implementation for custom template rendering.

#### BREAKING CHANGES:

- Renamed the `onColumnModelCreated` hook to `onColumnInfoCreated` to better reflect its purpose and avoid confusion with the model rendering process. The column info object is the model collected from the database schema, not the rendered model.
- Renamed the `onTableModelCreated` hook to `onTableInfoCreated` to better reflect its purpose and avoid confusion with the model rendering process. The table info object is the model collected from the database schema, not the rendered model.

### v2.0.1 (2025-08-20)

- Fixed a bug in the `onColumnModelCreated` hook that caused incorrect schema generation when changing the column type.
- Added missing `unknown` column type option.
- Removed kebab casing option as it produced invalid code output.
- Improved test suites to ensure better coverage and reliability.

### v2.0.0 (2025-08-18)

- Moved field transforms into base schemas and marked nullable fields as optional.
- Added more exports from the generated files to allow extending the read/write Zod schemas.
- Fixed casing and singularization issues.
- Added new option: `disable-case-transform` to skip transforming / converting db record field name casing. This is useful if your db columns are already in the case format you want or that you want to handle it in a different way.

#### BREAKING CHANGES:

- Moved generated schema files to named folders to prevent naming collsions and allow breaking up the generated code into separate files per table/view.
- Renamed the `--coerce-dates` to `--disable-coerce-dates`. Meaning that date coersion is now default on for the read schemas.
- Renamed the `--stringify-json` option to `--disable-stringify-json`. Previously this option was not respected and it was already on by default.

### v1.0.2 (2025-08-09)

- Included missing templates directory in package files.

### v1.0.1 (2025-08-03)

- Added Node.js 20+ engine requirement to package.json

### v1.0.0 (2025-08-03)

- Improved postgresql type / zod mapping.
- More options like `coerceDates`.
- Uses mustache templates for rendering.
- Model hook support.
- Exports interfaces instead of types.
- Comprehensive test coverage.

### v0.2.3 (2025-07-17)

- Added support for Zod v4

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
