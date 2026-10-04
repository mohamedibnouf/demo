import nextCore from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCore,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", "data/**"],
  },
];

export default eslintConfig;
