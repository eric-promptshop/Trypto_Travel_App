#!/usr/bin/env ts-node

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

interface ComponentUsage {
  component: string
  usedIn: string[]
  isDead: boolean
  duplicates: string[]
}

class ComponentAnalyzer {
  private components: Map<string, ComponentUsage> = new Map()
  private projectRoot: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
  }

  async analyze() {
    console.log('🔍 Analyzing component usage...\n')
    
    // Find all component files
    const componentFiles = await this.findComponents()
    
    // Find all usage
    await this.findUsages(componentFiles)
    
    // Identify duplicates
    this.identifyDuplicates()
    
    // Generate report
    this.generateReport()
  }

  private async findComponents(): Promise<string[]> {
    const includePatterns = [
      'components/**/*.tsx',
      'components/**/*.ts',
      'app/**/components/**/*.tsx'
    ]
    
    const allFiles: string[] = []
    for (const pattern of includePatterns) {
      try {
        const files = glob.sync(pattern, { 
          cwd: this.projectRoot,
          ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**']
        })
        allFiles.push(...files)
      } catch (e) {
        console.error('Error with pattern:', pattern, e)
      }
    }
    
    const files = [...new Set(allFiles)]
    
    files.forEach((file: string) => {
      const componentName = path.basename(file, path.extname(file))
      this.components.set(file, {
        component: componentName,
        usedIn: [],
        isDead: true,
        duplicates: []
      })
    })

    return files
  }

  private async findUsages(componentFiles: string[]) {
    // Find all source files that might import components
    const patterns = [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'pages/**/*.{ts,tsx}'
    ]
    
    const allSourceFiles: string[] = []
    for (const pattern of patterns) {
      try {
        const files = glob.sync(pattern, { 
          cwd: this.projectRoot,
          ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**']
        })
        allSourceFiles.push(...files)
      } catch (e) {
        console.error('Error with pattern:', pattern, e)
      }
    }
    
    const sourceFiles = [...new Set(allSourceFiles)]

    for (const sourceFile of sourceFiles) {
      const content = fs.readFileSync(
        path.join(this.projectRoot, sourceFile), 
        'utf-8'
      )

      // Check each component
      componentFiles.forEach(componentFile => {
        const componentName = path.basename(componentFile, path.extname(componentFile))
        
        // Check various import patterns
        const importPatterns = [
          `from ['"].*${componentName}['"]`,
          `from ['"].*${componentFile.replace(/\.[^/.]+$/, '')}['"]`,
          `import.*${componentName}`,
          `<${componentName}[ />]`
        ]

        const isUsed = importPatterns.some(pattern => 
          new RegExp(pattern).test(content)
        )

        if (isUsed && sourceFile !== componentFile) {
          const usage = this.components.get(componentFile)
          if (usage) {
            usage.isDead = false
            usage.usedIn.push(sourceFile)
          }
        }
      })
    }
  }

  private identifyDuplicates() {
    const nameGroups = new Map<string, string[]>()

    // Group by similar names
    this.components.forEach((usage, file) => {
      const baseName = usage.component
        .replace(/[-_]?v\d+$/i, '')
        .replace(/[-_]?(enhanced|modern|legacy|old|new)$/i, '')
        .replace(/[-_]?(wrapper|container)$/i, '')
        .toLowerCase()

      if (!nameGroups.has(baseName)) {
        nameGroups.set(baseName, [])
      }
      nameGroups.get(baseName)!.push(file)
    })

    // Mark duplicates
    nameGroups.forEach((files, baseName) => {
      if (files.length > 1) {
        files.forEach(file => {
          const usage = this.components.get(file)
          if (usage) {
            usage.duplicates = files.filter(f => f !== file)
          }
        })
      }
    })
  }

  private generateReport() {
    console.log('📊 Component Usage Report\n')
    console.log('=' . repeat(80))

    // Dead components
    const deadComponents = Array.from(this.components.entries())
      .filter(([_, usage]) => usage.isDead)
    
    console.log(`\n🧟 Dead Components (${deadComponents.length}):\n`)
    deadComponents.forEach(([file, usage]) => {
      console.log(`  ❌ ${file}`)
      if (usage.duplicates.length > 0) {
        console.log(`     📁 Potential duplicates: ${usage.duplicates.join(', ')}`)
      }
    })

    // Duplicate groups
    const duplicateGroups = new Map<string, string[]>()
    this.components.forEach((usage, file) => {
      if (usage.duplicates.length > 0) {
        const key = [file, ...usage.duplicates].sort().join('|')
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, [file, ...usage.duplicates])
        }
      }
    })

    console.log(`\n👯 Duplicate Component Groups (${duplicateGroups.size}):\n`)
    Array.from(duplicateGroups.values()).forEach((files, index) => {
      console.log(`  Group ${index + 1}:`)
      files.forEach(file => {
        const usage = this.components.get(file)!
        const status = usage.isDead ? '❌ unused' : `✅ used in ${usage.usedIn.length} files`
        console.log(`    - ${file} (${status})`)
      })
      console.log()
    })

    // Most used components
    const activeComponents = Array.from(this.components.entries())
      .filter(([_, usage]) => !usage.isDead)
      .sort((a, b) => b[1].usedIn.length - a[1].usedIn.length)
      .slice(0, 10)

    console.log('\n🌟 Top 10 Most Used Components:\n')
    activeComponents.forEach(([file, usage]) => {
      console.log(`  ${usage.usedIn.length}x - ${file}`)
    })

    // Summary
    console.log('\n📈 Summary:')
    console.log(`  Total components: ${this.components.size}`)
    console.log(`  Dead components: ${deadComponents.length}`)
    console.log(`  Active components: ${this.components.size - deadComponents.length}`)
    console.log(`  Duplicate groups: ${duplicateGroups.size}`)
    
    // Size estimate
    let totalSize = 0
    let deadSize = 0
    
    this.components.forEach((usage, file) => {
      try {
        const stats = fs.statSync(path.join(this.projectRoot, file))
        totalSize += stats.size
        if (usage.isDead) {
          deadSize += stats.size
        }
      } catch (e) {
        // Ignore
      }
    })

    console.log(`\n💾 Size Impact:`)
    console.log(`  Total component size: ${(totalSize / 1024).toFixed(2)} KB`)
    console.log(`  Dead code size: ${(deadSize / 1024).toFixed(2)} KB`)
    console.log(`  Potential savings: ${((deadSize / totalSize) * 100).toFixed(1)}%`)

    // Action items
    console.log('\n🎯 Recommended Actions:')
    console.log('  1. Delete or archive dead components')
    console.log('  2. Consolidate duplicate component groups')
    console.log('  3. Review components with single usage for inline potential')
    console.log('  4. Consider code-splitting for large, rarely-used components')
    
    // Save detailed report
    const report = {
      summary: {
        total: this.components.size,
        dead: deadComponents.length,
        active: this.components.size - deadComponents.length,
        duplicateGroups: duplicateGroups.size,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        deadSizeKB: (deadSize / 1024).toFixed(2),
        savingsPercent: ((deadSize / totalSize) * 100).toFixed(1)
      },
      deadComponents: deadComponents.map(([file, usage]) => ({
        file,
        duplicates: usage.duplicates
      })),
      duplicateGroups: Array.from(duplicateGroups.values()),
      componentUsage: Array.from(this.components.entries()).map(([file, usage]) => ({
        file,
        ...usage
      }))
    }

    fs.writeFileSync(
      path.join(this.projectRoot, 'component-analysis-report.json'),
      JSON.stringify(report, null, 2)
    )
    
    console.log('\n📄 Detailed report saved to: component-analysis-report.json')
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new ComponentAnalyzer()
  analyzer.analyze().catch(console.error)
}