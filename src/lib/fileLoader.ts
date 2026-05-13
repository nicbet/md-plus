export interface MdPlusDocument {
  name: string;
  markdown: string;
  style: string | null;
  script: string | null;
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
  fileName: string
): Promise<string | null> {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

export async function loadDocument(
  dirHandle: FileSystemDirectoryHandle,
  entry: DirectoryEntry
): Promise<MdPlusDocument> {
  const markdown = (await readFileIfExists(dirHandle, entry.name)) ?? "";
  const style = await readFileIfExists(dirHandle, `${entry.baseName}.mds`);
  const script = await readFileIfExists(dirHandle, `${entry.baseName}.mdt`);

  return { name: entry.name, markdown, style, script };
}
