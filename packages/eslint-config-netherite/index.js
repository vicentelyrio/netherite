module.exports = {
  "extends": [
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
  "parser": "@typescript-eslint/parser",
  "rules": {
    "semi": "off",
    "@typescript-eslint/semi": "off"
  },
  "settings": {
    "import/resolver": {
      "typescript": {
        "extensions": [".ts", ".tsx"]
      }
    }
  }
}
