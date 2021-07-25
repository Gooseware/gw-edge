import fs from 'fs'
import path from 'path'

export function lookupFile({ dir, formats, pathOnly = false, bubble = false }) {
  for (const format of formats) {
    const fullPath = path.join(dir, format)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return pathOnly ? fullPath : fs.readFileSync(fullPath, 'utf-8')
    }
  }

  if (bubble) {
    const parentDir = path.dirname(dir)
    if (parentDir !== dir) {
      return lookupFile(parentDir, formats, pathOnly)
    }
  }
}
