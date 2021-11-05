/**
 * Frontmatter looks like
    ogType: website # default is 'article'
    ogTitle: OG/TWITTER TITLE HERE
    title: PAGE TITLE HERE
    description: A description of your page here.
    date: 2021-10-30T04:20:42.00Z 
    image: /images/og_image_homepage.jpg
 */

module.exports = (options = {}, context) => {
  options = Object.assign(defaultOptions, options);

  return {
    name: "vuepress-seo-plugin",

    extendsPageData: ($page) => {
      let $site = { ...context.siteData, ...context.options };
      let head = $page.frontmatter.head || [];
      let addMeta = getAddMeta(head);
      let optionArgs = [$page, $site, $page.path];

      // add cannonical
      addCanonical(head, $page, $site);

      let metaContext = {
        $page,
        $site,
        siteTitle: options.siteTitle(...optionArgs),
        title: options.title(...optionArgs),
        description: options.description(...optionArgs),
        author: options.author(...optionArgs),
        tags: options.tags(...optionArgs),
        twitterCard: options.twitterCard(...optionArgs),
        type: options.type(...optionArgs),
        url: options.url(...optionArgs),
        image: options.image(...optionArgs),
        publishedAt: options.publishedAt(...optionArgs),
        modifiedAt: options.modifiedAt(...optionArgs),
      };

      options.defaultMeta(addMeta, metaContext);
      options.customMeta(addMeta, metaContext);
      $page.frontmatter.head = head;
    },
  };
};

function getAddMeta(head) {
  return (name, content, attribute = null) => {
    // check if meta tag already exists
    const isExists =
      head.findIndex((item) =>
        // if any of hid, name or property fields are same as 'name'
        [item[1].hid, item[1].name, item[1].property].includes(name)
      ) != -1;
    // skip if it does
    if (isExists) return;

    if (!content) return;
    if (!attribute)
      attribute = ["article:", "og:"].some((type) => name.startsWith(type))
        ? "property"
        : "name";

    // push it to 'head' array
    head.push([
      "meta",
      {
        hid: name,
        [attribute]: name,
        content: content,
      },
    ]);
  };
}

// add cannonical tag
function addCanonical(head, $page, $site) {
  // check if canonical tag exists already
  let isExists =
    head.findIndex((item) => {
      return item[1].rel == "canonical";
    }) != -1;

  // if it does not, auto generate it
  if (!isExists)
    head.push([
      "link",
      {
        rel: "canonical",
        href: ($site.themeConfig.domain || "") + $page.path,
      },
    ]);
}

const defaultOptions = {
  siteTitle: (_, $site) => $site.title,
  title: ($page) =>
    $page.frontmatter.ogTitle || $page.frontmatter.title || $page.title,
  description: ($page) => $page.frontmatter.description,
  author: ($page) => $page.frontmatter.author,
  tags: ($page) => $page.frontmatter.tags,
  twitterCard: (_) => "summary_large_image",
  type: ($page) => $page.frontmatter.ogType || "article",
  url: (_, $site, path) => ($site.themeConfig.domain || "") + path,
  image: ($page, $site) => {
    if ($page.frontmatter.image) {
      return $site.themeConfig.domain &&
        !$page.frontmatter.image.startsWith("http")
        ? $site.themeConfig.domain + $page.frontmatter.image
        : $page.frontmatter.image;
    }
    return "";
  },
  publishedAt: ($page) =>
    $page.frontmatter.date && new Date($page.frontmatter.date).toISOString(),
  modifiedAt: ($page) =>
    $page.lastUpdated && new Date($page.lastUpdated).toISOString(),
  customMeta: () => {},

  defaultMeta(add, ctx) {
    const { author, tags } = ctx;

    // Basics.
    add("article:published_time", ctx.publishedAt);
    add("article:modified_time", ctx.modifiedAt);
    add("og:site_name", ctx.siteTitle);
    add("og:title", ctx.title);
    add("og:description", ctx.description);
    add("og:type", ctx.type);
    add("og:url", ctx.url);
    add("og:image", ctx.image);
    add("twitter:title", ctx.title);
    add("twitter:description", ctx.description);
    add("twitter:url", ctx.url);
    add("twitter:card", ctx.twitterCard);
    add("twitter:image", ctx.image);

    // Author.
    if (author) {
      add("twitter:label1", "Written by");
      add("twitter:data1", author.name);
      add("twitter:creator", author.twitter);
    }

    // Tags.
    if (tags && Array.isArray(tags)) {
      add("twitter:label2", "Filed under");
      add("twitter:data2", tags.join(", "));
      tags.forEach((tag) => add("article:tag", tag));
    }
  },
};
