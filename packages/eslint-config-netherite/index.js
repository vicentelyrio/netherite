module.exports = {
  env: {
    browser: true,
    es2020: true
  },
  extends: [
    "turbo",
    "prettier",
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/electron",
    "plugin:import/typescript",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['react-refresh'],
  rules: {
    "semi": "off",
    "@typescript-eslint/semi": "off",
    'react-refresh/only-export-components': 'warn'
  },
  settings: {
    "import/resolver": {
      "typescript": {
        "extensions": [".ts", ".tsx"]
      }
    }
  }
}
