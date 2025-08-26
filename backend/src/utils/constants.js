import { env } from "~/config/environment";

export const WEBSITE_DOMAIN = ( env.BUILD_MODE === 'production' ? env.WEBSITE_DOMAIN_PRODUCTION: env.WEBSITE_DOMAIN_DEVELOPER)

//pagination
export const DEFAULT_ITEM_PER_PAGE = 9
export const DEFAULT_PAGE = 1