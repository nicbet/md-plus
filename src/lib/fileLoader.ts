export interface MdPlusDocument {
  name: string;
  markdown: string;
  styles: string[];
  scripts: string[];
}

export interface DirectoryEntry {
  name: string;
  baseName: string;
}

export async function openDirectory(): Promise<FileSystemDirectoryHandle> {
  return await window.showDirectoryPicker();
}

export async function listMarkdownFiles(
  dirHandle: FileSystemDirectoryHandle
): Promise<DirectoryEntry[]> {
  const entries: DirectoryEntry[] = [];
  for await (const [name, handle] of dirHandle) {
    if (handle.kind === "file" && name.endsWith(".md")) {
      entries.push({ name, baseName: name.replace(/\.md$/, "") });
    }
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

async function readFileIfExists(
  dirHandle: FileSystemDirectoryHandle,
  filePath: string
): Promise<string | null> {
  try {
    const parts = filePath.replace(/^\.\//, "").split("/");
    let currentDir = dirHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(parts[i]);
    }
    const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1]);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

interface Frontmatter {
  style?: string | string[];
  script?: string | string[];
}

function parseFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };

  const fm: Frontmatter = {};
  const lines = match[1].split("\n");
  let currentKey: string | null = null;
  let listItems: string[] = [];

  for (const line of lines) {
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      if (currentKey && listItems.length) {
        (fm as Record<string, string[]>)[currentKey] = listItems;
        listItems = [];
      }
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val) {
        (fm as Record<string, string>)[currentKey] = val;
        currentKey = null;
      }
    } else if (currentKey) {
      const itemMatch = line.match(/^\s+-\s+(.+)$/);
      if (itemMatch) {
        listItems.push(itemMatch[1].trim());
      }
    }
  }
  if (currentKey && listItems.length) {
    (fm as Record<string, string[]>)[currentKey] = listItems;
  }

  return { frontmatter: fm, body: match[2] };
}

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export async function loadDocument(
  dirHandle: FileSystemDirectoryHandle,
  entry: DirectoryEntry
): Promise<MdPlusDocument> {
  const rawMarkdown = (await readFileIfExists(dirHandle, entry.name)) ?? "";
  const { frontmatter, body } = parseFrontmatter(rawMarkdown);

  const styles: string[] = [];
  const scripts: string[] = [];

  // frontmatter imports load first (shared libraries)
  for (const path of toArray(frontmatter.style)) {
    const content = await readFileIfExists(dirHandle, path);
    if (content) styles.push(content);
  }
  for (const path of toArray(frontmatter.script)) {
    const content = await readFileIfExists(dirHandle, path);
    if (content) scripts.push(content);
  }

  // convention-based companions load after (doc-specific overrides)
  const companionStyle = await readFileIfExists(dirHandle, `${entry.baseName}.mds`);
  if (companionStyle) styles.push(companionStyle);
  const companionScript = await readFileIfExists(dirHandle, `${entry.baseName}.mdt`);
  if (companionScript) scripts.push(companionScript);

  return { name: entry.name, markdown: body, styles, scripts };
}
