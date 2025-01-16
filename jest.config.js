/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  preset: 'ts-jest',
  setupFiles: ["./src/__tests__/globals.js"],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest', {
        tsconfig: 'src/__tests__/tsconfig.jest.json',
        isolatedModules: true,
      }
    ]
  },
  verbose: false,
};
