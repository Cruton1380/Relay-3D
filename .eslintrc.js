/** @type {import('eslint').Linter.Config} */
module.exports = {
  // === PERFORMANCE OPTIMIZATIONS ===
  
  // Enable caching for better performance
  cache: true,
  cacheLocation: '.eslintcache',
  
  // Ignore performance-heavy directories
  ignorePatterns: [
    'node_modules/',
    'logs/',
    'data/',
    'dist/',
    'build/',
    'coverage/',
    '*.log',
    '*.tmp',
    '.cache/',
    '.npm/'
  ],

  // ...existing config
  rules: {
    // ...existing rules
    
    // Replace the existing filenames/match-regex rule
    'no-unused-vars': 'warn',
    'import/no-unused-modules': 'off'
  },
  overrides: [
    {
      // For backend files
      files: ['backend/**/*.mjs'],
      rules: {
        'no-unused-vars': 'warn'
      }
    },
    {
      // For React components
      files: ['frontend/**/*.jsx'],
      rules: {
        'no-unused-vars': 'warn'
      }
    },
    {
      // For test files
      files: ['test/**/*.{js,mjs,jsx}'],
      rules: {
        'no-unused-vars': 'warn'
      }
    }
  ]
};