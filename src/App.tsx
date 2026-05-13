import { useState } from "react";
import {
  openDirectory,
  listMarkdownFiles,
  loadDocument,
  type MdPlusDocument,
  type DirectoryEntry,
} from "./lib/fileLoader";
import { demoFiles } from "./lib/demoContent";
import MarkdownRenderer from "./components/MarkdownRenderer";
import "./App.css";

function App() {
  const [dirHandle, setDirHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [files, setFiles] = useState<DirectoryEntry[]>([]);
  const [activeDoc, setActiveDoc] = useState<MdPlusDocument | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  async function handleOpenFolder() {
    try {
      const handle = await openDirectory();
      setDirHandle(handle);
      const mdFiles = await listMarkdownFiles(handle);
      setFiles(mdFiles);
      setActiveDoc(null);
      setActiveFile(null);
    } catch {
      // user cancelled
    }
  }

  function handleLoadDemo() {
    setDirHandle(null);
    setFiles(demoFiles.map((d) => ({ name: d.name, baseName: d.baseName })));
    setActiveDoc(demoFiles[0].doc);
    setActiveFile(demoFiles[0].name);
  }

  async function handleSelectFile(entry: DirectoryEntry) {
    setActiveFile(entry.name);
    if (dirHandle) {
      const doc = await loadDocument(dirHandle, entry);
      setActiveDoc(doc);
    } else {
      const demo = demoFiles.find((d) => d.name === entry.name);
      if (demo) setActiveDoc(demo.doc);
    }
  }

  return (
    <div className="app">
      <header className="toolbar">
        <h1 className="logo">MD+</h1>
        <button onClick={handleOpenFolder}>Open Folder</button>
        <button onClick={handleLoadDemo}>Load Demo</button>
        {dirHandle && (
          <span className="dir-name">{dirHandle.name}</span>
        )}
      </header>

      <div className="main">
        {files.length > 0 && (
          <nav className="sidebar">
            {files.map((f) => (
              <button
                key={f.name}
                className={`file-entry ${activeFile === f.name ? "active" : ""}`}
                onClick={() => handleSelectFile(f)}
              >
                {f.name}
              </button>
            ))}
          </nav>
        )}

        <div className="content" key={activeFile}>
          {activeDoc ? (
            <>
              <div className="doc-meta">
                <span className="badge">md</span>
                {activeDoc.styles.length > 0 && (
                  <span className="badge badge-style">mds</span>
                )}
                {activeDoc.scripts.length > 0 && (
                  <span className="badge badge-script">mdt</span>
                )}
              </div>
              <MarkdownRenderer document={activeDoc} />
            </>
          ) : (
            <div className="empty-state">
              {files.length > 0
                ? "Select a Markdown file from the sidebar"
                : "Open a folder containing .md files to get started"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
