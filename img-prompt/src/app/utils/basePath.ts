// 单源 basePath 字面量。同时被客户端代码和 next.config.ts 消费。
// 构建期由 SUB2API_EMBEDDED 控制；客户端 bundle 不保证暴露非 NEXT_PUBLIC_ 环境变量，
// 因此运行于 /img-prompt/ 时也从当前 URL 推断前缀，避免词库分块请求掉到域名根路径。
const embeddedByBuild = process.env.SUB2API_EMBEDDED === "1";
const embeddedByURL = typeof window !== "undefined" && window.location.pathname.startsWith("/img-prompt/");

export const BASE_PATH = embeddedByBuild || embeddedByURL ? "/img-prompt" : "";
