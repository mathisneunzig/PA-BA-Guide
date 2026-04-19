import 'server-only'
import { readFileSync } from 'fs'
import { join } from 'path'

const cache = new Map<string, string>()
const TEMPLATES_DIR = join(process.cwd(), 'lib', 'email', 'templates')

/**
 * Load an HTML email template by name (without .html extension),
 * replace {{key}} placeholders, and return the rendered string.
 *
 * Templates are cached after first read (per process lifetime).
 */
export function renderTemplate(name: string, vars: Record<string, string | null | undefined>): string {
  let template = cache.get(name)
  if (!template) {
    template = readFileSync(join(TEMPLATES_DIR, `${name}.html`), 'utf-8')
    cache.set(name, template)
  }

  // Replace {{key}} placeholders
  let rendered = template
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value ?? '')
  }

  // Strip unresolved {{#if ...}}...{{/if}} blocks for missing optional vars
  rendered = rendered.replace(/\{\{#if \w+\}\}[\s\S]*?\{\{\/if\}\}/g, '')

  return rendered
}
