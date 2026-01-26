import * as fs from "fs/promises";
import * as path from "path";

/**
 * Utility functions for path handling and validation
 */
export class PathUtils {
  /**
   * Normalize and validate a path, ensuring it exists and is accessible
   */
  static async validatePath(inputPath: string): Promise<{ isValid: boolean; normalizedPath: string; error?: string }> {
    try {
      // First decode any URL encoding (e.g., %20 for spaces)
      let decodedPath = inputPath;
      try {
        decodedPath = decodeURIComponent(inputPath);
      } catch {
        // If decoding fails, use the original path
        decodedPath = inputPath;
      }
      // Normalize the path to handle different path separators and resolve relative paths
      const normalizedPath = path.resolve(decodedPath.trim());
      // Check if the path exists and is accessible
      await fs.stat(normalizedPath);
      return {
        isValid: true,
        normalizedPath,
      };
    } catch (error) {
      return {
        isValid: false,
        normalizedPath: inputPath,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Safely construct a path by joining components and normalizing
   */
  static safePath(...components: string[]): string {
    return path.resolve(path.join(...components));
  }
}
