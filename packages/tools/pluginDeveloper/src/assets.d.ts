declare module "*.md" {
  const content: string;
  export default content;
}

declare module "pluginDeveloper:bundledSdk" {
  export const digest: string;
  export const data: string;
}
