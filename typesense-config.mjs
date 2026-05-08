/**
 * Typesense 搜索配置模块
 *
 * 负责根据环境变量与构建配置解析 Typesense 搜索参数，
 * 并提供 Starlight 插件及 CSP connect-src 所需的外部源地址。
 *
 * 环境变量一览：
 * - TYPESENSE_COLLECTION_NAME   - Typesense 集合名称，默认 "docs"
 * - TYPESENSE_USE_PROXY         - 是否强制使用代理（"true" / "false"）
 * - TYPESENSE_PROXY_PATH        - 代理路径前缀，默认 "/typesense"
 * - TYPESENSE_SEARCH_ENDPOINT   - 自定义搜索端点（优先级最高）
 * - TYPESENSE_NODE_URL          - 直连 Typesense 节点地址
 * - TYPESENSE_SEARCH_API_KEY    - 直连时使用的搜索 API Key
 * - TYPESENSE_PROXY_CLIENT_API_KEY - 通过代理时使用的客户端 API Key
 * - PUBLIC_SITE_URL             - 站点 URL（用于拼接代理 URL）
 * - WORDBOOK_BUILD_PROFILE      - 构建模式（release / local）
 * - CF_PAGES                    - Cloudflare Pages 构建标记
 */

import starlightDocSearchTypesense from "starlight-docsearch-typesense";

// ---- 构建模式判断 ----
const buildProfile =
  process.env.WORDBOOK_BUILD_PROFILE === "release" ? "release" : "local";
const isReleaseBuild = buildProfile === "release";
const isCloudflarePagesBuild = process.env.CF_PAGES === "1";

// ---- 站点 URL ----
const siteUrl = new URL(
  process.env.PUBLIC_SITE_URL || "https://word.lovejade.cn/"
).toString();

// ---- 代理决策 ----
// 当显式设置为 "true"，或在 release / Cloudflare Pages 构建且未显式关闭时启用代理
const useTypesenseProxy =
  process.env.TYPESENSE_USE_PROXY === "true" ||
  ((isReleaseBuild || isCloudflarePagesBuild) &&
    process.env.TYPESENSE_USE_PROXY !== "false");

// ---- 集合名称 ----
const collectionName =
  process.env.TYPESENSE_COLLECTION_NAME || "docs";

// ---- 搜索端点 ----
const proxyPath = process.env.TYPESENSE_PROXY_PATH || "/typesense";
const proxyUrl = new URL(proxyPath, siteUrl).toString();

const searchEndpoint =
  process.env.TYPESENSE_SEARCH_ENDPOINT ||
  (useTypesenseProxy
    ? proxyUrl
    : process.env.TYPESENSE_NODE_URL || "https://typesense.yuxuanda.cn");

// ---- API Key ----
const clientApiKey = useTypesenseProxy
  ? process.env.TYPESENSE_PROXY_CLIENT_API_KEY || "proxy-search"
  : process.env.TYPESENSE_SEARCH_API_KEY;

// ---- 搜索是否可用 ----
const hasSearch = useTypesenseProxy || Boolean(clientApiKey);

// ---- CSP connect-src 所需的外部源 ----
const connectOrigin = new URL(searchEndpoint).origin;

/**
 * 完整的 Typesense 配置对象，供外部直接读取使用。
 */
export const typesenseConfig = {
  /** 是否启用 Typesense 搜索 */
  hasSearch,
  /** 是否通过 Cloudflare 代理转发搜索请求 */
  useProxy: useTypesenseProxy,
  /** Typesense 集合名称 */
  collectionName,
  /** 实际使用的搜索端点 URL */
  searchEndpoint,
  /** 客户端 API Key */
  clientApiKey,
  /** 搜索端点 origin，用于 CSP connect-src 白名单 */
  connectOrigin,
};

/**
 * 创建 Starlight Typesense 搜索插件。
 *
 * 若搜索未启用则返回 `null`，同时打印提示信息；
 * 调用方可通过返回值决定是否将插件注入 Starlight 的 plugins 数组。
 *
 * @returns {import("@astrojs/starlight").StarlightPlugin | null}
 */
export function createTypesensePlugin() {
  if (!hasSearch) {
    console.warn(
      "[wordbook] Typesense search is disabled. " +
        "Set TYPESENSE_SEARCH_API_KEY for direct local search, " +
        "or build with WORDBOOK_BUILD_PROFILE=release to use the Cloudflare proxy."
    );
    return null;
  }

  return starlightDocSearchTypesense({
    typesenseCollectionName: collectionName,
    typesenseServerConfig: {
      nodes: [{ url: searchEndpoint }],
      apiKey: clientApiKey,
      sendApiKeyAsQueryParam: false,
    },
  });
}
