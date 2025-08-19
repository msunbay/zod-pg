import type { ZodPgColumnType, ZodPgConfig } from '../../types.js';

import { DefaultRenderer } from './DefaultRenderer.js';

export class Zod4Renderer extends DefaultRenderer {
  protected override renderZodType(
    zodType: ZodPgColumnType,
    config: ZodPgConfig,
    isReadField: boolean
  ): string {
    const renderedType = super.renderZodType(zodType, config, isReadField);

    switch (zodType) {
      case 'email':
        return 'z.email()';
      case 'url':
        return 'z.url()';
      case 'int':
        return 'z.int()';
      case 'uuid':
        return 'z.uuid()';
      case 'json':
        return 'z.json()';
      default:
        return renderedType;
    }
  }
}
