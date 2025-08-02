import { promises } from 'fs';
import path from 'path';
import mustache from 'mustache';

export const loadTemplate = async (templateName: string): Promise<string> => {
  const __dirname = import.meta.dirname;

  const templatePath = path.join(
    __dirname,
    '../../templates',
    `${templateName}.mustache`
  );

  try {
    const templateContent = await promises.readFile(templatePath, 'utf-8');
    return templateContent;
  } catch (error: any) {
    throw new Error(`Template not found: ${templatePath}. ${error.message}`);
  }
};

export const renderTemplate = async (
  templateName: string,
  data: Record<string, any>,
  partials: Record<string, string> = {}
): Promise<string> => {
  const templateContent = await loadTemplate(templateName);
  const rendered = mustache.render(templateContent, data, partials);
  return rendered;
};
