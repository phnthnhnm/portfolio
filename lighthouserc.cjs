const isCI = process.env.LHCI_MODE === 'ci';

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: isCI ? 3 : 1,
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: isCI ? { target: 'temporary-public-storage' } : false,
  },
};
