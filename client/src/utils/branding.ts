export type BrandingConfig = {
  appTitle: string;
  appDescription: string;
  logoPath: string;
  ogImagePath: string;
  faviconPath: string;
};

export type DeployClientConfig = {
  branding?: Partial<BrandingConfig>;
  [key: string]: unknown;
};

const defaultBranding: BrandingConfig = {
  appTitle: "DLLM Library",
  appDescription: "Decentralized Local Library Module",
  logoPath: "/logo512.png",
  ogImagePath: "/logo512.png",
  faviconPath: "/favicon.ico",
};

declare global {
  interface Window {
    __DLLM_CLIENT_CONFIG__?: DeployClientConfig;
  }
}

const normalizeAssetPath = (value: string): string => {
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//")
  ) {
    return value;
  }

  return value.startsWith("/") ? value : `/${value}`;
};

export const resolveBranding = (
  config?: DeployClientConfig,
): BrandingConfig => {
  const branding = config?.branding ?? {};

  return {
    appTitle: branding.appTitle || defaultBranding.appTitle,
    appDescription: branding.appDescription || defaultBranding.appDescription,
    logoPath: normalizeAssetPath(branding.logoPath || defaultBranding.logoPath),
    ogImagePath: normalizeAssetPath(
      branding.ogImagePath || branding.logoPath || defaultBranding.ogImagePath,
    ),
    faviconPath: normalizeAssetPath(
      branding.faviconPath || branding.logoPath || defaultBranding.faviconPath,
    ),
  };
};

export const loadDeployClientConfig = async (): Promise<DeployClientConfig> => {
  try {
    const response = await fetch("/dllm-client-config.json", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Config request failed with status ${response.status}`);
    }

    return (await response.json()) as DeployClientConfig;
  } catch (error) {
    console.warn(
      "Failed to load deploy-time client config, using defaults.",
      error,
    );
    return {};
  }
};

const setOrCreateLink = (rel: string, href: string) => {
  let link = document.querySelector(
    `link[rel='${rel}']`,
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
};

export const applyBrowserBranding = (config?: DeployClientConfig) => {
  const branding = resolveBranding(config);

  document.title = branding.appTitle;
  setOrCreateLink("icon", branding.faviconPath);
  setOrCreateLink("apple-touch-icon", branding.logoPath);

  return branding;
};
