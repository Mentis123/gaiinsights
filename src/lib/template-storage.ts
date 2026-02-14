import { put, list, del } from "@vercel/blob";
import type { TemplateLibrary, TemplateConfig } from "./types";

const LIBRARY_KEY = "templates/library.json";

/**
 * Read the template library from Vercel Blob.
 * Returns empty library if none exists.
 */
export async function getLibrary(): Promise<TemplateLibrary> {
  try {
    const { blobs } = await list({ prefix: LIBRARY_KEY });
    if (blobs.length === 0) {
      return { activeId: null, templates: [] };
    }
    const res = await fetch(blobs[0].url);
    if (!res.ok) {
      return { activeId: null, templates: [] };
    }
    return await res.json();
  } catch {
    return { activeId: null, templates: [] };
  }
}

/**
 * Save the template library to Vercel Blob.
 */
export async function saveLibrary(library: TemplateLibrary): Promise<void> {
  await put(LIBRARY_KEY, JSON.stringify(library, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

/**
 * Get the currently active template config, or null for default.
 */
export async function getActiveTemplate(): Promise<TemplateConfig | null> {
  const library = await getLibrary();
  if (!library.activeId) return null;
  return library.templates.find((t) => t.id === library.activeId) || null;
}

/**
 * Add a template to the library and set it as active.
 */
export async function addTemplate(config: TemplateConfig): Promise<TemplateLibrary> {
  const library = await getLibrary();
  library.templates.push(config);
  library.activeId = config.id;
  await saveLibrary(library);
  return library;
}

/**
 * Update a template in the library by ID.
 */
export async function updateTemplate(config: TemplateConfig): Promise<TemplateLibrary> {
  const library = await getLibrary();
  const idx = library.templates.findIndex((t) => t.id === config.id);
  if (idx === -1) throw new Error("Template not found");
  library.templates[idx] = config;
  await saveLibrary(library);
  return library;
}

/**
 * Delete a template from the library by ID. Also deletes the blob .pptx file.
 * If deleted template was active, resets to default.
 */
export async function deleteTemplate(id: string): Promise<TemplateLibrary> {
  const library = await getLibrary();
  const template = library.templates.find((t) => t.id === id);
  if (template) {
    // Try to delete the .pptx blob
    try {
      await del(template.blobUrl);
    } catch {
      // Best-effort cleanup
    }
  }
  library.templates = library.templates.filter((t) => t.id !== id);
  if (library.activeId === id) {
    library.activeId = null;
  }
  await saveLibrary(library);
  return library;
}

/**
 * Set the active template by ID (or null for default).
 */
export async function setActiveTemplate(id: string | null): Promise<TemplateLibrary> {
  const library = await getLibrary();
  if (id && !library.templates.find((t) => t.id === id)) {
    throw new Error("Template not found");
  }
  library.activeId = id;
  await saveLibrary(library);
  return library;
}

/**
 * Generate a unique template ID.
 */
export function generateTemplateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
