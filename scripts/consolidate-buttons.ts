#!/usr/bin/env ts-node

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

class ButtonConsolidator {
  private projectRoot: string
  
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
  }

  async consolidate() {
    console.log('🔧 Starting button component consolidation...\n')
    
    // Find all files importing the old Button
    const files = await this.findFilesWithOldButton()
    
    console.log(`Found ${files.length} files using atoms/Button component\n`)
    
    // Update imports in each file
    let updatedCount = 0
    for (const file of files) {
      if (await this.updateImports(file)) {
        updatedCount++
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} files`)
    
    // Archive old Button component
    await this.archiveOldButton()
    
    console.log('\n🎉 Button consolidation complete!')
  }
  
  private async findFilesWithOldButton(): Promise<string[]> {
    const patterns = [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      '!components/atoms/Button.tsx',
      '!components/atoms/__tests__/**'
    ]
    
    const files: string[] = []
    for (const pattern of patterns) {
      const matched = glob.sync(pattern, {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '**/*.test.*']
      })
      files.push(...matched)
    }
    
    // Filter files that actually import atoms/Button
    const filesWithOldButton: string[] = []
    for (const file of files) {
      const content = fs.readFileSync(path.join(this.projectRoot, file), 'utf-8')
      if (content.includes('@/components/atoms/Button') || 
          content.includes('@/components/atoms') ||
          content.includes('from "./atoms/Button"') ||
          content.includes('from "../atoms/Button"')) {
        filesWithOldButton.push(file)
      }
    }
    
    return filesWithOldButton
  }
  
  private async updateImports(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.projectRoot, filePath)
    let content = fs.readFileSync(fullPath, 'utf-8')
    let updated = false
    
    // Pattern replacements
    const replacements = [
      // Direct Button imports
      {
        pattern: /import\s+{\s*Button\s*}\s+from\s+['"]@\/components\/atoms\/Button['"]/g,
        replacement: 'import { Button } from "@/components/ui/button"'
      },
      {
        pattern: /import\s+{\s*Button\s*}\s+from\s+['"]@\/components\/atoms['"]/g,
        replacement: 'import { Button } from "@/components/ui/button"'
      },
      // Relative imports
      {
        pattern: /import\s+{\s*Button\s*}\s+from\s+['"]\.\.?\/atoms\/Button['"]/g,
        replacement: 'import { Button } from "@/components/ui/button"'
      },
      {
        pattern: /import\s+{\s*Button\s*}\s+from\s+['"]\.\.?\/atoms['"]/g,
        replacement: 'import { Button } from "@/components/ui/button"'
      },
      // Mixed imports (Button with other components)
      {
        pattern: /import\s+{\s*([^}]*),?\s*Button\s*,?\s*([^}]*)\s*}\s+from\s+['"]@\/components\/atoms['"]/g,
        replacement: (match: string, before: string, after: string) => {
          const otherImports = [before, after].filter(Boolean).join(', ')
          if (otherImports.trim()) {
            return `import { ${otherImports} } from "@/components/atoms"\nimport { Button } from "@/components/ui/button"`
          } else {
            return 'import { Button } from "@/components/ui/button"'
          }
        }
      }
    ]
    
    for (const { pattern, replacement } of replacements) {
      const newContent = content.replace(pattern, replacement)
      if (newContent !== content) {
        content = newContent
        updated = true
      }
    }
    
    if (updated) {
      fs.writeFileSync(fullPath, content)
      console.log(`✓ Updated imports in: ${filePath}`)
    }
    
    return updated
  }
  
  private async archiveOldButton() {
    const sourcePath = path.join(this.projectRoot, 'components/atoms/Button.tsx')
    const testPath = path.join(this.projectRoot, 'components/atoms/__tests__/Button.test.tsx')
    const archivePath = path.join(this.projectRoot, '.archive/components/atoms')
    
    if (fs.existsSync(sourcePath)) {
      // Create archive directory
      fs.mkdirSync(archivePath, { recursive: true })
      
      // Move Button component
      fs.renameSync(sourcePath, path.join(archivePath, 'Button.tsx'))
      console.log('\n📦 Archived components/atoms/Button.tsx')
      
      // Move test if exists
      if (fs.existsSync(testPath)) {
        fs.mkdirSync(path.join(archivePath, '__tests__'), { recursive: true })
        fs.renameSync(testPath, path.join(archivePath, '__tests__/Button.test.tsx'))
        console.log('📦 Archived Button tests')
      }
      
      // Update atoms/index.ts to remove Button export
      const indexPath = path.join(this.projectRoot, 'components/atoms/index.ts')
      if (fs.existsSync(indexPath)) {
        let indexContent = fs.readFileSync(indexPath, 'utf-8')
        indexContent = indexContent.replace(/export.*Button.*\n?/g, '')
        fs.writeFileSync(indexPath, indexContent)
        console.log('✓ Updated atoms/index.ts')
      }
    }
  }
}

// Run the consolidation
if (require.main === module) {
  const consolidator = new ButtonConsolidator()
  consolidator.consolidate().catch(console.error)
}