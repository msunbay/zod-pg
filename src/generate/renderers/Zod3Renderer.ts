import type { ZodPgColumnType, ZodPgConfig } from '../../types.js';

import { DefaultRenderer } from './DefaultRenderer.js';

export class Zod3Renderer extends DefaultRenderer {
  protected override renderZodType(
    zodType: ZodPgColumnType,
    config: ZodPgConfig,
    isReadField: boolean
  ): string {
    const renderedType = super.renderZodType(zodType, config, isReadField);

    switch (zodType) {
      case 'email':
        return 'z.string().email()';
      case 'url':
        return 'z.string().url()';
      case 'int':
        return 'z.number().int()';
      case 'uuid':
        return 'z.string().uuid()';
      default:
        return renderedType;
    }
  }
}
