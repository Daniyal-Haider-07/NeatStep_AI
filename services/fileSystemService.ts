
import { FileMetadata, AIAnalysisResult } from "../types";
import { SUPPORTED_TEXT_EXTENSIONS } from "../constants";

/**
 * Recursively scans a directory and all its subdirectories for files.
 * This utilizes the File System Access API which is compatible with Chrome/Edge on Windows and macOS.
 */
export async function scanDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  path = ""
): Promise<FileMetadata[]> {
  const files: FileMetadata[] = [];
  
  try {
    // Request permission if at the root. Standard cross-platform security check.
    if (path === "") {
      const permissionStatus = await (directoryHandle as any).queryPermission({ mode: 'readwrite' });
      if (permissionStatus !== 'granted') {
        const result = await (directoryHandle as any).requestPermission({ mode: 'readwrite' });
        if (result !== 'granted') {
          throw new Error("Permission to access the folder was denied.");
        }
      }
    }

    // Iterate through directory entries. 
    // @ts-ignore
    for await (const entry of directoryHandle.values()) {
      const currentPath = path ? `${path}/${entry.name}` : entry.name;

      if (entry.kind === 'file') {
        const file = await (entry as FileSystemFileHandle).getFile();
        let snippet = "";
        
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        // Performance optimization: only read content for known text-based extensions
        if (SUPPORTED_TEXT_EXTENSIONS.includes(ext) || file.type.startsWith('text/')) {
          try {
            const text = await file.slice(0, 500).text();
            snippet = text.replace(/\n/g, ' ').substring(0, 200);
          } catch (e) {
            snippet = "Analysis restricted: Content unreadable.";
          }
        }

        files.push({
          name: file.name,
          size: file.size,
          type: file.type || ext || 'application/octet-stream',
          lastModified: file.lastModified,
          handle: entry as FileSystemFileHandle,
          path: currentPath,
          contentSnippet: snippet
        });
      } else if (entry.kind === 'directory') {
        // Recurse into subdirectories. This logic is identical for Win/Mac.
        const subFiles = await scanDirectory(entry as FileSystemDirectoryHandle, currentPath);
        files.push(...subFiles);
      }
    }
  } catch (error: any) {
    console.warn(`Encountered access limitation at "${path}":`, error.message);
    // Continue scanning other nodes even if one fails
  }
  
  return files;
}

/**
 * Physically renames and moves a file in the user's file system.
 * Uses the modern FileSystemHandle.move() API which handles both move and rename in one atomic step.
 */
export async function organizeFile(
  rootHandle: FileSystemDirectoryHandle,
  file: FileMetadata,
  result: AIAnalysisResult
): Promise<void> {
  const handle = file.handle;
  
  if (!handle) {
    throw new Error(`Critical: Missing file handle for ${file.name}`);
  }

  // Cross-platform check for the 'move' capability (standard in Chrome/Edge on Win/Mac)
  if (typeof (handle as any).move !== 'function') {
    throw new Error("MOVE_NOT_SUPPORTED: This browser environment does not support atomic file relocation.");
  }

  try {
    let targetFolderHandle = rootHandle;

    // Create nested directory structure if defined by the AI strategy
    if (result.suggestedFolder && result.suggestedFolder !== '.' && result.suggestedFolder !== '/') {
      // Normalize paths: splitting by '/' works for the virtual handle path structure on both Win/Mac
      const segments = result.suggestedFolder.split('/').filter(s => s.trim().length > 0);
      for (const segment of segments) {
        targetFolderHandle = await targetFolderHandle.getDirectoryHandle(segment, { create: true });
      }
    }

    // Perform move and rename operation
    await (handle as any).move(targetFolderHandle, result.suggestedName);
  } catch (err: any) {
    console.error(`Organization failed for node [${file.name}]:`, err);
    throw new Error(`Operation restricted by system: ${err.message}`);
  }
}

/**
 * Recursively removes empty folders within the given directory handle.
 * If a directory's contents are all deleted (because they were empty subfolders),
 * then that directory itself is deleted.
 */
export async function removeEmptyFolders(handle: FileSystemDirectoryHandle): Promise<boolean> {
  let hasContent = false;
  const subDirEntries: { name: string, handle: FileSystemDirectoryHandle }[] = [];

  try {
    // Collect all child directory handles first to avoid modification-during-iteration issues
    // @ts-ignore
    for await (const entry of handle.values()) {
      if (entry.kind === 'directory') {
        subDirEntries.push({ name: entry.name, handle: entry as FileSystemDirectoryHandle });
      } else {
        // Any file means the folder is not empty
        hasContent = true;
      }
    }

    // Recurse into subdirectories bottom-up
    for (const subDir of subDirEntries) {
      const isSubDirEmpty = await removeEmptyFolders(subDir.handle);
      if (isSubDirEmpty) {
        // Subdirectory is empty, remove it from parent
        await handle.removeEntry(subDir.name, { recursive: true });
      } else {
        // Subdirectory had at least one file or non-empty child
        hasContent = true;
      }
    }
  } catch (e) {
    console.error("Cleanup error in recursive folder removal:", e);
    // If we can't read it, assume it has content to be safe
    return false;
  }

  // Returns true if this specific folder is now completely empty
  return !hasContent;
}
