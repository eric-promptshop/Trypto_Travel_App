#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive security audit script
 */
class SecurityAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      dependencies: [],
      codeAnalysis: [],
      configurationIssues: [],
      recommendations: []
    };
  }

  async runAudit() {
    console.log('🔒 Starting comprehensive security audit...\n');

    await this.checkDependencyVulnerabilities();
    await this.analyzePrismaSchema();
    await this.checkEnvironmentVariables();
    await this.auditAPIEndpoints();
    await this.checkFilePermissions();
    await this.scanForSecrets();
    await this.generateReport();

    console.log('\n✅ Security audit completed!');
    console.log(`📊 Report saved to: ${path.join(__dirname, 'security-report.json')}`);
  }

  async checkDependencyVulnerabilities() {
    console.log('🔍 Checking dependency vulnerabilities...');
    
    try {
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditOutput);
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([name, vuln]) => {
          this.results.vulnerabilities.push({
            package: name,
            severity: vuln.severity,
            via: vuln.via,
            fixAvailable: vuln.fixAvailable,
            title: vuln.title || 'Unknown vulnerability'
          });
        });
      }

      console.log(`   Found ${this.results.vulnerabilities.length} vulnerabilities`);
    } catch (error) {
      console.log('   ⚠️  Could not run npm audit:', error.message);
    }
  }

  async analyzePrismaSchema() {
    console.log('🗃️  Analyzing database schema security...');
    
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Check for potential security issues
      const issues = [];
      
      // Check for missing @unique constraints on sensitive fields
      if (schema.includes('email') && !schema.includes('email String @unique')) {
        issues.push({
          type: 'data_integrity',
          severity: 'medium',
          message: 'Email field should have @unique constraint'
        });
      }
      
      // Check for proper indexing on sensitive queries
      if (schema.includes('User') && !schema.includes('@@index')) {
        issues.push({
          type: 'performance',
          severity: 'low',
          message: 'Consider adding database indexes for performance'
        });
      }
      
      // Check for proper field types for sensitive data
      if (schema.includes('password') && schema.includes('password String')) {
        issues.push({
          type: 'data_security',
          severity: 'high',
          message: 'Password field detected - ensure proper hashing is implemented'
        });
      }

      this.results.codeAnalysis.push(...issues);
      console.log(`   Found ${issues.length} potential schema issues`);
    }
  }

  async checkEnvironmentVariables() {
    console.log('🔐 Checking environment variable security...');
    
    const requiredSecureVars = [
      'NEXTAUTH_SECRET',
      'DATABASE_URL',
      'NEXTAUTH_URL'
    ];
    
    const optionalSecureVars = [
      'OPENAI_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ];
    
    const issues = [];
    
    // Check if required variables are set
    requiredSecureVars.forEach(varName => {
      if (!process.env[varName]) {
        issues.push({
          type: 'configuration',
          severity: 'high',
          variable: varName,
          message: `Required environment variable ${varName} is not set`
        });
      }
    });
    
    // Check for weak secrets
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      issues.push({
        type: 'configuration',
        severity: 'medium',
        variable: 'NEXTAUTH_SECRET',
        message: 'NEXTAUTH_SECRET should be at least 32 characters long'
      });
    }
    
    // Check if environment files exist in production-like environments
    const envFiles = ['.env.local', '.env.development', '.env.production'];
    envFiles.forEach(file => {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        issues.push({
          type: 'configuration',
          severity: 'low',
          message: `Environment file ${file} detected - ensure it's not committed to version control`
        });
      }
    });

    this.results.configurationIssues.push(...issues);
    console.log(`   Found ${issues.length} configuration issues`);
  }

  async auditAPIEndpoints() {
    console.log('🔌 Auditing API endpoint security...');
    
    const apiDir = path.join(process.cwd(), 'app', 'api');
    const issues = [];
    
    if (fs.existsSync(apiDir)) {
      const scanDirectory = (dir) => {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            scanDirectory(filePath);
          } else if (file === 'route.ts' || file === 'route.js') {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for authentication
            if (!content.includes('getServerSession') && !content.includes('auth')) {
              issues.push({
                type: 'authentication',
                severity: 'medium',
                file: filePath.replace(process.cwd(), ''),
                message: 'API route may lack authentication'
              });
            }
            
            // Check for input validation
            if (!content.includes('zod') && !content.includes('validate') && !content.includes('schema')) {
              issues.push({
                type: 'input_validation',
                severity: 'medium',
                file: filePath.replace(process.cwd(), ''),
                message: 'API route may lack input validation'
              });
            }
            
            // Check for rate limiting
            if (!content.includes('rateLimit') && !content.includes('throttle')) {
              issues.push({
                type: 'rate_limiting',
                severity: 'low',
                file: filePath.replace(process.cwd(), ''),
                message: 'API route may lack rate limiting'
              });
            }
          }
        });
      };
      
      scanDirectory(apiDir);
    }

    this.results.codeAnalysis.push(...issues);
    console.log(`   Found ${issues.length} API security issues`);
  }

  async checkFilePermissions() {
    console.log('📁 Checking file permissions...');
    
    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'prisma/schema.prisma',
      'next.config.js'
    ];
    
    const issues = [];
    
    sensitiveFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const mode = stats.mode & parseInt('777', 8);
          
          // Check if file is world-readable (security risk)
          if (mode & parseInt('004', 8)) {
            issues.push({
              type: 'file_permissions',
              severity: 'medium',
              file: file,
              message: `File ${file} is world-readable`
            });
          }
        } catch (error) {
          // Ignore permission errors
        }
      }
    });

    this.results.configurationIssues.push(...issues);
    console.log(`   Found ${issues.length} file permission issues`);
  }

  async scanForSecrets() {
    console.log('🔍 Scanning for exposed secrets...');
    
    const secretPatterns = [
      { name: 'API Key', pattern: /[Aa][Pp][Ii]_?[Kk][Ee][Yy].*['"][0-9a-zA-Z]{32,}['"]/ },
      { name: 'Password', pattern: /[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd].*['"][^'"]{8,}['"]/ },
      { name: 'JWT Secret', pattern: /[Jj][Ww][Tt].*['"][0-9a-zA-Z]{32,}['"]/ },
      { name: 'Database URL', pattern: /postgresql:\/\/[^'"]*['"]/ },
      { name: 'Private Key', pattern: /-----BEGIN PRIVATE KEY-----/ }
    ];
    
    const issues = [];
    const scanDir = path.join(process.cwd(), 'app');
    
    if (fs.existsSync(scanDir)) {
      const scanFiles = (dir) => {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanFiles(filePath);
          } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            secretPatterns.forEach(pattern => {
              if (pattern.pattern.test(content)) {
                issues.push({
                  type: 'exposed_secret',
                  severity: 'high',
                  file: filePath.replace(process.cwd(), ''),
                  secretType: pattern.name,
                  message: `Potential ${pattern.name} found in source code`
                });
              }
            });
          }
        });
      };
      
      scanFiles(scanDir);
    }

    this.results.codeAnalysis.push(...issues);
    console.log(`   Found ${issues.length} potential exposed secrets`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Based on findings, generate recommendations
    if (this.results.vulnerabilities.length > 0) {
      recommendations.push({
        category: 'Dependencies',
        priority: 'high',
        action: 'Run `npm audit fix` to automatically fix vulnerabilities',
        details: 'Update vulnerable dependencies to their secure versions'
      });
    }
    
    const authIssues = this.results.codeAnalysis.filter(issue => issue.type === 'authentication');
    if (authIssues.length > 0) {
      recommendations.push({
        category: 'Authentication',
        priority: 'high',
        action: 'Implement authentication for all sensitive API endpoints',
        details: 'Use NextAuth.js or similar authentication middleware'
      });
    }
    
    const validationIssues = this.results.codeAnalysis.filter(issue => issue.type === 'input_validation');
    if (validationIssues.length > 0) {
      recommendations.push({
        category: 'Input Validation',
        priority: 'medium',
        action: 'Add input validation using Zod or similar validation library',
        details: 'Validate all user inputs to prevent injection attacks'
      });
    }
    
    recommendations.push({
      category: 'Security Headers',
      priority: 'medium',
      action: 'Implement security headers in next.config.js',
      details: 'Add CSP, HSTS, and other security headers'
    });
    
    recommendations.push({
      category: 'Rate Limiting',
      priority: 'low',
      action: 'Implement rate limiting for API endpoints',
      details: 'Prevent abuse and DoS attacks with proper rate limiting'
    });

    this.results.recommendations = recommendations;
  }

  async generateReport() {
    console.log('📊 Generating security report...');
    
    this.generateRecommendations();
    
    const summary = {
      total_issues: this.results.vulnerabilities.length + 
                   this.results.codeAnalysis.length + 
                   this.results.configurationIssues.length,
      high_severity: this.getAllIssues().filter(issue => issue.severity === 'high').length,
      medium_severity: this.getAllIssues().filter(issue => issue.severity === 'medium').length,
      low_severity: this.getAllIssues().filter(issue => issue.severity === 'low').length
    };
    
    const report = {
      summary,
      ...this.results
    };
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📋 Security Audit Summary:');
    console.log(`   Total Issues: ${summary.total_issues}`);
    console.log(`   High Severity: ${summary.high_severity}`);
    console.log(`   Medium Severity: ${summary.medium_severity}`);
    console.log(`   Low Severity: ${summary.low_severity}`);
    
    if (summary.high_severity > 0) {
      console.log('\n⚠️  HIGH SEVERITY ISSUES FOUND - Immediate action required!');
      return 1;
    } else if (summary.medium_severity > 5) {
      console.log('\n⚠️  Multiple medium severity issues found - Review recommended');
      return 1;
    }
    
    return 0;
  }

  getAllIssues() {
    return [
      ...this.results.vulnerabilities,
      ...this.results.codeAnalysis,
      ...this.results.configurationIssues
    ];
  }
}

// Run the audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Security audit failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityAuditor;