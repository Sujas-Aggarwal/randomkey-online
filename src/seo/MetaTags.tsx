import { Helmet } from "react-helmet-async";
import { SITE } from "@/lib/site";

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalPath?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function MetaTags({
  title,
  description,
  keywords,
  canonicalPath = "/",
  ogImage,
  noIndex = false,
}: MetaTagsProps): React.JSX.Element {
  const fullTitle = title
    ? `${title} — ${SITE.name}`
    : SITE.title;
  const fullDescription = description ?? SITE.description;
  const canonicalUrl = SITE.url(canonicalPath);
  const ogImageUrl = ogImage ?? `${SITE.domain}/og-image.png`;
  const allKeywords = [
    ...(keywords ?? []),
    ...SITE.keywords,
  ].join(", ");

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={allKeywords} />
      <link rel="canonical" href={canonicalUrl} />

      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* OpenGraph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:site_name" content={SITE.name} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SITE.twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* Security */}
      <meta name="referrer" content="no-referrer" />
    </Helmet>
  );
}
