import assert from "node:assert/strict";
import test from "node:test";
import { properties } from "../../src/prototypes/properties/fixtures";

const configuredBase = process.env.PROPERTY_PROTOTYPE_BASE_URL;
const base = configuredBase ? new URL(configuredBase) : undefined;
if (
  base &&
  (base.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) ||
    base.username ||
    base.password)
) {
  throw new Error(
    "Prototype HTTP tests require a credential-free HTTP loopback URL.",
  );
}
const skip = base
  ? false
  : "Set PROPERTY_PROTOTYPE_BASE_URL to a running local prototype server.";

async function get(path: string) {
  assert.ok(base);
  const response = await fetch(new URL(path, base), {
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, "");
  return { response, html };
}

function cardNames(html: string): string[] {
  return [...html.matchAll(/<h3[^>]*>([^<]+)/g)].map((match) => match[1] ?? "");
}

function assertNoIndex(html: string) {
  assert.match(
    html,
    /<meta name="robots" content="[^"]*noindex[^"]*nofollow[^"]*"/,
  );
}

test(
  "HTTP discovery renders all five cards, GET controls, fictional labels and noindex",
  { skip },
  async () => {
    const { response, html } = await get("/prototype/properties");
    assert.equal(response.status, 200);
    assert.deepEqual(
      cardNames(html),
      properties.map((property) => property.name),
    );
    assertNoIndex(html);
    assert.match(html, /Fictional concepts\. Not real listings\./);
    assert.match(html, /<details[^>]*>/);
    assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|>|\s)/);
    assert.match(html, /<summary[^>]*>Filter &amp; sort/);
    assert.match(html, /aria-label="Applied selection"/);
    assert.match(html, /Showing:/);
    assert.match(html, /All property types/);
    assert.match(html, /Fictional architectural artwork/);
    assert.match(html, /<strong>3<\/strong> bedrooms/);
    assert.match(html, /<strong>2<\/strong> bathrooms/);
    assert.match(html, /aria-label="Floor area: 1,420 sq ft"/);
    for (const { palette } of properties) {
      assert.match(html, new RegExp(`data-artwork="${palette}"`));
    }
    const artworkPaths = [
      ...html.matchAll(/<article[\s\S]*?<svg[\s\S]*?<\/svg>/g),
    ].map(([artwork]) =>
      [...artwork.matchAll(/<path[^>]*\sd="([^"]+)"/g)]
        .map((match) => match[1])
        .join("|"),
    );
    assert.equal(artworkPaths.length, 5);
    assert.equal(new Set(artworkPaths).size, 5);
    assert.match(html, /<form[^>]*action="\/prototype\/properties"/);
    assert.doesNotMatch(html, /<div hidden[^>]*id="S:/);
    for (const name of ["type", "area", "sort"])
      assert.match(html, new RegExp(`<select[^>]*name="${name}"`));
    assert.doesNotMatch(html, /type="(?:email|tel|password)"/);
  },
);

test(
  "HTTP public discovery supports search, filters, sorting and public detail links",
  { skip },
  async () => {
    const all = await get("/properties");
    assert.equal(all.response.status, 200);
    assert.deepEqual(
      cardNames(all.html),
      properties.map(({ name }) => name),
    );
    assertNoIndex(all.html);
    assert.match(all.html, /Fictional concepts\. Not real listings\./);
    assert.match(all.html, /<form[^>]*action="\/properties"[^>]*method="get"/);
    for (const name of ["q", "type", "area", "sort"]) {
      assert.match(
        all.html,
        new RegExp(`<input[^>]*name="${name}"|<select[^>]*name="${name}"`),
      );
    }
    assert.match(all.html, /href="\/properties\/canopy-court"/);
    assert.match(all.html, /No verified prices/);

    const filtered = await get(
      "/properties?q=fernwalk&type=Townhouse&area=Iskandar%20Puteri&sort=name",
    );
    assert.equal(filtered.response.status, 200);
    assert.deepEqual(cardNames(filtered.html), ["Fernwalk Terraces"]);
    assert.match(filtered.html, /1 fictional concept matching your selection/);

    const sorted = await get("/properties?sort=size-desc");
    assert.deepEqual(cardNames(sorted.html), [
      "Serein House",
      "Terracotta Mews",
      "Fernwalk Terraces",
      "Canopy Court",
      "Tideline Residences",
    ]);

    const noMatches = await get("/properties?q=not-a-real-place");
    assert.equal(noMatches.response.status, 200);
    assert.match(noMatches.html, /No concepts match this search/);
    assert.match(noMatches.html, /Explore all demo concepts/);
  },
);

test(
  "HTTP combined filters and sorting change actual rendered cards",
  { skip },
  async () => {
    const { response, html } = await get(
      "/prototype/properties?type=Townhouse&area=Iskandar%20Puteri&sort=name",
    );
    assert.equal(response.status, 200);
    assert.deepEqual(cardNames(html), ["Fernwalk Terraces"]);
    assert.match(html, /1 fictional concept/);
    assert.match(
      html,
      /Showing:<\/span> All concepts \/ Townhouse \/ Iskandar Puteri \/ Name: A to Z/,
    );
    const sorted = await get("/prototype/properties?sort=size-desc");
    assert.deepEqual(cardNames(sorted.html), [
      "Serein House",
      "Terracotta Mews",
      "Fernwalk Terraces",
      "Canopy Court",
      "Tideline Residences",
    ]);
  },
);

test(
  "HTTP unmatched selection renders recovery instead of cards",
  { skip },
  async () => {
    const { response, html } = await get(
      "/prototype/properties?type=Detached%20home&area=Pasir%20Gudang",
    );
    assert.equal(response.status, 200);
    assert.match(html, /No concepts match this combination/);
    assert.match(html, /Explore all concepts/);
    assert.match(html, /0 fictional concepts/);
    for (const { slug } of properties) {
      assert.ok(!html.includes(`href="/prototype/properties/${slug}"`));
    }
  },
);

test(
  "HTTP invalid and repeated selections display explicit warnings",
  { skip },
  async () => {
    const { response, html } = await get(
      "/prototype/properties?type=invalid&area=Kulai&area=Johor%20Bahru&sort=price",
    );
    assert.equal(response.status, 200);
    assert.match(html, /role="alert"/);
    assert.match(html, /Property type was not recognized/);
    assert.match(html, /Area was not recognized/);
    assert.match(html, /Sort order was not recognized/);
    assert.deepEqual(
      cardNames(html),
      properties.map((property) => property.name),
    );
  },
);

test(
  "HTTP all five details have unique titles, specifications, illustrations and noindex",
  { skip },
  async () => {
    for (const property of properties) {
      const { response, html } = await get(
        `/prototype/properties/${property.slug}`,
      );
      assert.equal(response.status, 200);
      assert.match(html, new RegExp(`<h1[^>]*>${property.name}</h1>`));
      assert.match(
        html,
        new RegExp(
          `<title>${property.name} \\| Fictional PropertyGOJB concept</title>`,
        ),
      );
      assertNoIndex(html);
      assert.match(html, /Illustrative specifications/);
      assert.match(html, /Regional inspiration/);
      assert.match(html, /Fictional illustration/);
      assert.match(html, /No real address or map is provided/);
      assert.match(html, /Not provided in this prototype/);
      assert.doesNotMatch(html, /<form|type="(?:email|tel|password)"/);
    }
  },
);

test(
  "HTTP public property details include demo-safe metadata, inquiry and related concepts",
  { skip },
  async () => {
    for (const property of properties) {
      const { response, html } = await get(`/properties/${property.slug}`);
      assert.equal(response.status, 200);
      assert.match(html, new RegExp(`<h1[^>]*>${property.name}</h1>`));
      assert.match(
        html,
        new RegExp(
          `<title>${property.name} demo concept \\| PropertyGOJB</title>`,
        ),
      );
      assertNoIndex(html);
      assert.match(html, /Fictional illustration/);
      assert.match(html, /Illustrative specifications/);
      assert.match(html, /href="https:\/\/wa\.me\/\?text=/);
      assert.match(html, /No PropertyGOJB number is configured/);
      assert.match(html, /Related demo concepts/);
      assert.doesNotMatch(html, /RM\s?\d|available now/i);
      const inquiryHref = html.match(
        /href="(https:\/\/wa\.me\/\?text=[^"]+)"/,
      )?.[1];
      assert.ok(inquiryHref);
      const inquiryMessage = new URL(
        inquiryHref.replaceAll("&amp;", "&"),
      ).searchParams.get("text");
      assert.ok(inquiryMessage?.includes(property.name));
      assert.ok(inquiryMessage?.includes("not a real property listing"));
    }
  },
);

test(
  "HTTP unknown concept is a real 404 and remains excluded from indexing",
  { skip },
  async () => {
    const { response, html } = await get("/prototype/properties/not-a-concept");
    assert.equal(response.status, 404);
    assert.match(html, /noindex/);
    assert.match(html, /This concept is not in the collection/);
    assert.match(html, /Back to the collection/);

    const publicPage = await get("/properties/not-a-concept");
    assert.equal(publicPage.response.status, 404);
    assert.match(publicPage.html, /This concept is not in the collection/);
    assert.match(publicPage.html, /Back to the demo collection/);
  },
);

test(
  "HTTP original homepage remains available without prototype indexing policy or controls",
  { skip },
  async () => {
    const { response, html } = await get("/");
    assert.equal(response.status, 200);
    assert.match(html, /No verified property listings are published yet/);
    assert.match(html, /Search demo property concepts/);
    assert.match(html, /New developments/);
    assert.match(html, /Johor areas/);
    assert.match(html, /<form[^>]*action="\/properties"[^>]*method="get"/);
    assert.doesNotMatch(
      html,
      /SYNTHETIC PROTOTYPE|name="robots"[^>]*noindex|name="property-type"/,
    );
  },
);
