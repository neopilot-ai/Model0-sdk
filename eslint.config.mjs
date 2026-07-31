import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: [
			'**/dist/**',
			'**/node_modules/**',
			'**/coverage/**',
			'**/.next/**',
			'**/build/**',
			'**/out/**',
			'**/*.config.*',
			'**/*.d.ts'
		]
	},
	{
		files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}']
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_' }
			],
			'no-undef': 'off'
		}
	},
	{
		files: [
			'packages/model0-sdk/src/scripts/generate.ts',
			'packages/model0-sdk/src/sdk/v0.ts',
			'packages/model0-sdk/src/sdk/core.ts',
			'packages/react/src/**',
			'**/__tests__/**',
			'**/tests/**',
			'**/*.test.ts',
			'**/*.spec.ts'
		],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off'
		}
	},
	{
		files: ['packages/create-model0-sdk-app/src/**'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off'
		}
	}
);
