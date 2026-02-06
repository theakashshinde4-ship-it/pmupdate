const fs = require('fs');
const path = require('path');

class DuplicateCodeCleaner {
  constructor() {
    this.duplicates = [];
    this.fixedFiles = [];
  }

  // Find duplicate functions in a file
  findDuplicateFunctions(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const functions = new Map();
      const duplicates = [];

      lines.forEach((line, index) => {
        // Match function declarations
        const functionMatch = line.match(/(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:function|\([^)]*\)\s*=>))/);
        if (functionMatch) {
          const functionName = functionMatch[1] || functionMatch[2];
          const lineNumber = index + 1;
          
          if (functions.has(functionName)) {
            duplicates.push({
              name: functionName,
              firstOccurrence: functions.get(functionName),
              duplicateAt: lineNumber,
              file: filePath
            });
          } else {
            functions.set(functionName, lineNumber);
          }
        }
      });

      return duplicates;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  // Find duplicate imports
  findDuplicateImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const imports = new Map();
      const duplicates = [];

      const importRegex = /(?:import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]|const\s+{([^}]+)}\s*=\s*require\(['"]([^'"]+)['"])/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importItems = (match[1] || match[3]).split(',').map(item => item.trim());
        const source = match[2] || match[4];
        
        importItems.forEach(item => {
          const key = `${item} from ${source}`;
          if (imports.has(key)) {
            duplicates.push({
              import: item,
              source,
              firstOccurrence: imports.get(key),
              file: filePath
            });
          } else {
            imports.set(key, true);
          }
        });
      }

      return duplicates;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  // Scan directory for duplicate code
  scanDirectory(dirPath) {
    const files = this.getAllFiles(dirPath, ['.js', '.jsx']);
    const allDuplicates = [];

    files.forEach(file => {
      const functionDuplicates = this.findDuplicateFunctions(file);
      const importDuplicates = this.findDuplicateImports(file);
      
      allDuplicates.push(...functionDuplicates, ...importDuplicates);
    });

    this.duplicates = allDuplicates;
    return allDuplicates;
  }

  // Get all files with specific extensions
  getAllFiles(dirPath, extensions) {
    const files = [];
    
    function traverse(currentPath) {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }
    
    traverse(dirPath);
    return files;
  }

  // Generate cleanup report
  generateReport() {
    const report = {
      totalDuplicates: this.duplicates.length,
      duplicateFunctions: this.duplicates.filter(d => d.name),
      duplicateImports: this.duplicates.filter(d => d.import),
      filesWithDuplicates: [...new Set(this.duplicates.map(d => d.file))],
      duplicates: this.duplicates
    };

    return report;
  }

  // Fix duplicate imports in a file
  fixDuplicateImports(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const imports = new Map();
      const linesToRemove = new Set();

      lines.forEach((line, index) => {
        const importMatch = line.match(/(?:import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]|const\s+{([^}]+)}\s*=\s*require\(['"]([^'"]+)['"])/);
        if (importMatch) {
          const importItems = (importMatch[1] || importMatch[3]).split(',').map(item => item.trim());
          const source = importMatch[2] || importMatch[4];
          
          importItems.forEach(item => {
            const key = `${item} from ${source}`;
            if (imports.has(key)) {
              linesToRemove.add(index);
            } else {
              imports.set(key, index);
            }
          });
        }
      });

      // Remove duplicate lines
      const cleanedLines = lines.filter((_, index) => !linesToRemove.has(index));
      const cleanedContent = cleanedLines.join('\n');

      fs.writeFileSync(filePath, cleanedContent);
      this.fixedFiles.push(filePath);
      
      return {
        file: filePath,
        duplicatesRemoved: linesToRemove.size,
        success: true
      };
    } catch (error) {
      console.error(`Error fixing file ${filePath}:`, error);
      return {
        file: filePath,
        error: error.message,
        success: false
      };
    }
  }

  // Auto-fix all duplicates
  autoFixDuplicates() {
    const results = [];
    const filesToFix = [...new Set(this.duplicates.map(d => d.file))];

    filesToFix.forEach(file => {
      const result = this.fixDuplicateImports(file);
      results.push(result);
    });

    return results;
  }

  // Create optimized file structure
  createOptimizedStructure() {
    const optimizations = [
      {
        type: 'constants',
        description: 'Extract common constants',
        files: ['src/constants/index.js']
      },
      {
        type: 'utils',
        description: 'Common utility functions',
        files: ['src/utils/index.js']
      },
      {
        type: 'api',
        description: 'API service consolidation',
        files: ['src/services/api.js']
      },
      {
        type: 'components',
        description: 'Shared components',
        files: ['src/components/shared/index.js']
      }
    ];

    return optimizations;
  }
}

module.exports = DuplicateCodeCleaner;
