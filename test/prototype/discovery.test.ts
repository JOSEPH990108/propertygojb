import assert from "node:assert/strict";
import test from "node:test";
import {
  discoverProperties,
  parseDiscoveryQuery,
  sortOptions,
} from "../../src/prototypes/properties/discovery";
import {
  findProperty,
  formatFloorArea,
  properties,
  propertyAreas,
  propertyTypes,
  prototypeNotice,
  type SyntheticProperty,
} from "../../src/prototypes/properties/fixtures";

test("exactly five unique fictional fixtures contain complete illustrative fields only", () => {
  assert.equal(properties.length, 5);
  assert.equal(new Set(properties.map((property) => property.slug)).size, 5);
  assert.equal(new Set(properties.map((property) => property.name)).size, 5);
  assert.equal(
    new Set(properties.map((property) => property.featuredOrder)).size,
    5,
  );
  for (const property of properties) {
    assert.equal(property.fictional, true);
    assert.match(property.slug, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(propertyTypes.includes(property.type));
    assert.ok(propertyAreas.includes(property.area));
    for (const value of [
      property.bedrooms,
      property.bathrooms,
      property.floorAreaSqFt,
      property.featuredOrder,
    ]) {
      assert.ok(Number.isInteger(value) && value > 0);
    }
    assert.equal(property.highlights.length, 3);
    assert.ok(property.introduction.length > 40);
    assert.ok(property.locationDescription.length > 40);
    assert.deepEqual(
      Object.keys(property).sort(),
      [
        "slug",
        "name",
        "type",
        "area",
        "bedrooms",
        "bathrooms",
        "floorAreaSqFt",
        "featuredOrder",
        "palette",
        "introduction",
        "highlights",
        "locationDescription",
        "fictional",
      ].sort(),
    );
    assert.doesNotMatch(
      JSON.stringify(property),
      /https?:|RM\s?\d|@\w|\bavailable now\b/i,
    );
    assert.equal(findProperty(property.slug), property);
  }
  assert.match(prototypeNotice, /Fictional demonstration only/);
  assert.equal(findProperty("not-a-concept"), undefined);
  assert.equal(findProperty("../canopy-court"), undefined);
});

test("missing and cleared selections restore editorial defaults without warnings", () => {
  for (const query of [{}, { type: "", area: "", sort: "" }]) {
    assert.deepEqual(parseDiscoveryQuery(query), {
      filters: { type: "", area: "", sort: "featured" },
      issues: [],
    });
  }
});

test("all supported type, area and sort selections parse exactly", () => {
  for (const type of ["", ...propertyTypes]) {
    for (const area of ["", ...propertyAreas]) {
      for (const { value: sort } of sortOptions) {
        assert.deepEqual(parseDiscoveryQuery({ type, area, sort }), {
          filters: { type, area, sort },
          issues: [],
        });
      }
    }
  }
});

test("unknown, case-mismatched and repeated parameters produce explicit reset notices", () => {
  for (const query of [
    { type: "villa", area: "Unknown", sort: "price" },
    { type: ["Townhouse", "Condominium"], area: ["Kulai"], sort: ["name"] },
    { type: "townhouse", area: "kulai", sort: "NAME" },
  ]) {
    const result = parseDiscoveryQuery(query);
    assert.deepEqual(result.filters, { type: "", area: "", sort: "featured" });
    assert.equal(result.issues.length, 3);
    assert.ok(result.issues.every((issue) => issue.includes("has been reset")));
  }
});

test("combined filters use AND semantics for every type and area combination", () => {
  for (const type of ["", ...propertyTypes] as const) {
    for (const area of ["", ...propertyAreas] as const) {
      const result = discoverProperties(properties, {
        type,
        area,
        sort: "featured",
      });
      assert.deepEqual(
        result.map((property) => property.slug),
        properties
          .filter(
            (property) =>
              (!type || property.type === type) &&
              (!area || property.area === area),
          )
          .map((property) => property.slug),
      );
    }
  }
  assert.deepEqual(
    discoverProperties(properties, {
      type: "Detached home",
      area: "Pasir Gudang",
      sort: "featured",
    }),
    [],
  );
  assert.deepEqual(
    discoverProperties([], { type: "", area: "", sort: "featured" }),
    [],
  );
});

test("all four sort orders produce the exact required sequence without mutating fixtures", () => {
  const original = structuredClone(properties);
  const expected = {
    featured: [
      "canopy-court",
      "terracotta-mews",
      "serein-house",
      "tideline-residences",
      "fernwalk-terraces",
    ],
    name: [
      "canopy-court",
      "fernwalk-terraces",
      "serein-house",
      "terracotta-mews",
      "tideline-residences",
    ],
    "size-asc": [
      "tideline-residences",
      "canopy-court",
      "fernwalk-terraces",
      "terracotta-mews",
      "serein-house",
    ],
    "size-desc": [
      "serein-house",
      "terracotta-mews",
      "fernwalk-terraces",
      "canopy-court",
      "tideline-residences",
    ],
  };
  for (const { value: sort } of sortOptions) {
    assert.deepEqual(
      discoverProperties(properties, { type: "", area: "", sort }).map(
        (property) => property.slug,
      ),
      expected[sort],
    );
  }
  assert.deepEqual(properties, original);
});

test("sort ties resolve by slug deterministically regardless of input order", () => {
  const a: SyntheticProperty = {
    ...properties[0],
    slug: "alpha",
    name: "Same",
    featuredOrder: 1,
    floorAreaSqFt: 1000,
  };
  const b: SyntheticProperty = { ...a, slug: "beta" };
  for (const { value: sort } of sortOptions) {
    for (const source of [
      [a, b],
      [b, a],
    ]) {
      assert.deepEqual(
        discoverProperties(source, { type: "", area: "", sort }).map(
          (property) => property.slug,
        ),
        ["alpha", "beta"],
      );
    }
  }
});

test("floor area uses fixed en-MY formatting and does not imply pricing", () => {
  assert.equal(formatFloorArea(1420), "1,420 sq ft");
});
