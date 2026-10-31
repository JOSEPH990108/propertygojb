import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";

export class PlanError extends Error {
  constructor(code) {
    super(code);
    this.name = "PlanError";
    this.code = code;
  }
}

export function requireCondition(condition, code) {
  if (!condition) throw new PlanError(code);
}

const object = (properties) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});
const copy = (maximum) => ({
  type: "string",
  minLength: 1,
  maxLength: maximum,
  pattern: "^[A-Za-z0-9][A-Za-z0-9 .,!?&'\\-]*$",
});
export const HOMEPAGE_SCHEMA = object({
  headline: copy(100),
  subheading: copy(240),
  primaryCtaLabel: copy(32),
  secondaryCtaLabel: copy(32),
  feature1Title: copy(60),
  feature1Description: copy(180),
  feature2Title: copy(60),
  feature2Description: copy(180),
  feature3Title: copy(60),
  feature3Description: copy(180),
});
export const THEME_SCHEMA = object({
  background: { enum: ["#f8fafc", "#fff7ed", "#f0fdf4"] },
  foreground: { enum: ["#0f172a", "#172554", "#1c1917"] },
  accent: { enum: ["#14532d", "#1e3a8a", "#7c2d12"] },
  border: { enum: ["#64748b", "#78716c"] },
  sectionGap: { type: "integer", minimum: 32, maximum: 80, multipleOf: 8 },
  cardRadius: { type: "integer", minimum: 0, maximum: 24, multipleOf: 4 },
  contentWidth: {
    type: "integer",
    minimum: 960,
    maximum: 1200,
    multipleOf: 80,
  },
});

/** @typedef {{id: string, version: number, path: string, operation: string, fields: string[]}} ContractDefinition */
/** @type {readonly ContractDefinition[]} */
export const CONTRACT_REGISTRY = Object.freeze([
  Object.freeze({
    id: "readme-clarification",
    version: 1,
    path: "README.md",
    operation: "append-clarification",
    fields: Object.freeze([]),
  }),
  Object.freeze({
    id: "homepage-content",
    version: 1,
    path: "src/content/homepage.json",
    operation: "set-homepage-field",
    fields: Object.freeze(Object.keys(HOMEPAGE_SCHEMA.properties)),
  }),
  Object.freeze({
    id: "homepage-theme",
    version: 1,
    path: "src/content/theme.json",
    operation: "set-theme-token",
    fields: Object.freeze(Object.keys(THEME_SCHEMA.properties)),
  }),
]);
export const WEBSITE_CONTRACTS = CONTRACT_REGISTRY.slice(1);
export const WEBSITE_PATHS = WEBSITE_CONTRACTS.map((entry) => entry.path);
export const WEBSITE_FIELDS = Object.fromEntries(
  WEBSITE_CONTRACTS.map((entry) => [entry.path, entry.fields]),
);
export const WEBSITE_GRANT = {
  id: "r1-public-website-data-v1",
  risk: "R1",
  contracts: WEBSITE_CONTRACTS,
  maxChangedBytes: 16384,
  checks: ["website-schema", "website-format"],
};
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validators = new Map([
  [WEBSITE_PATHS[0], ajv.compile(HOMEPAGE_SCHEMA)],
  [WEBSITE_PATHS[1], ajv.compile(THEME_SCHEMA)],
]);
const hashText = (text) => createHash("sha256").update(text).digest("hex");

export function validateWebsiteText(file, text) {
  requireCondition(
    typeof text === "string" && text.length <= 16384,
    "WEBSITE_DOCUMENT_TOO_LARGE",
  );
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new PlanError("INVALID_WEBSITE_JSON");
    throw error;
  }
  requireCondition(validators.get(file)?.(data), "INVALID_WEBSITE_DOCUMENT");
  if (file === WEBSITE_PATHS[0]) {
    requireCondition(
      Object.values(data).every(
        (value) =>
          value.trim() === value &&
          !/\b(?:www\.|[a-z0-9-]+\.[a-z]{2,}\b)/i.test(value),
      ),
      "WEBSITE_RESOURCE_OR_WHITESPACE_FORBIDDEN",
    );
  }
  // A canonical representation also rejects duplicate keys and hidden spellings.
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  requireCondition(
    text === serialized || text === serialized.replaceAll("\n", "\r\n"),
    "NON_CANONICAL_WEBSITE_JSON",
  );
  return data;
}

const contentLabels = {
  headline: "headline",
  heading: "headline",
  subheading: "subheading",
  "primary CTA label": "primaryCtaLabel",
  "secondary CTA label": "secondaryCtaLabel",
  "feature 1 title": "feature1Title",
  "feature 1 description": "feature1Description",
  "feature 2 title": "feature2Title",
  "feature 2 description": "feature2Description",
  "feature 3 title": "feature3Title",
  "feature 3 description": "feature3Description",
};
const labels = Object.keys(contentLabels).join("|");
const contentTask = new RegExp(
  `^(?:Please )?(?:Change|Set) the homepage (${labels}) to ("[^"\\r\\n]+")\\.?$`,
  "i",
);
const themeTask =
  /^(?:Please )?(?:Change|Set) the theme (background|foreground|accent|border|sectionGap|cardRadius|contentWidth) token to ("#[a-f0-9]{6}"|[0-9]{1,4})\.?$/i;

function websiteRequest(task) {
  if (typeof task !== "string" || task.length > 2000) return null;
  const match = contentTask.exec(task) ?? themeTask.exec(task);
  if (!match) return null;
  const content = contentTask.test(task);
  const definition = WEBSITE_CONTRACTS[content ? 0 : 1];
  const field = content
    ? contentLabels[
        Object.keys(contentLabels).find(
          (label) => label.toLowerCase() === match[1].toLowerCase(),
        )
      ]
    : definition.fields.find(
        (name) => name.toLowerCase() === match[1].toLowerCase(),
      );
  let value;
  try {
    value = JSON.parse(match[2]);
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
  const schema = (content ? HOMEPAGE_SCHEMA : THEME_SCHEMA).properties[field];
  if (!ajv.validate(schema, value)) return null;
  return { definition, field, value };
}

export function operationContract(policy, task) {
  if (policy.version === 1) {
    const subject =
      "(?:local (?:validation|checks)|(?:running )?npm run validate)";
    const negative = "(?:does not|do not|doesn't|don't|will not|won't|never)";
    const effect =
      "(?:publish or deploy|deploy or publish)(?: the (?:application|app)| anything)?";
    const patterns = [
      `^(?:please )?(?:document|clarify|explain|note) in (?:the )?readme that ${subject} ${negative} ${effect}[.!]?$`,
      `^(?:please )?(?:document|clarify|explain|note) that ${subject} ${negative} ${effect} in (?:the )?readme[.!]?$`,
      `^(?:please )?add (?:a )?(?:note|clarification) (?:to|in) (?:the )?readme (?:that|saying) ${subject} ${negative} ${effect}[.!]?$`,
    ].map((pattern) => new RegExp(pattern, "i"));
    return {
      id: policy.grant.id,
      version: 1,
      path: policy.grant.path,
      matches: (request) =>
        typeof request === "string" &&
        request.length <= 2000 &&
        patterns.some((pattern) => pattern.test(request.trim())),
      paths: [policy.grant.path],
      acceptanceCriteria: [policy.grant.text],
      tests: [...policy.grant.checks],
      operation: policy.grant.operation,
      editInstructions:
        "Preserve every original byte. Append only enough newlines to end in a blank line, " +
        "then the exact acceptance text and a final newline.",
      satisfied: (text) => text.includes(policy.grant.text),
      output: (text) => {
        const separator = text.endsWith("\n\n")
          ? ""
          : text.endsWith("\n")
            ? "\n"
            : "\n\n";
        return `${text}${separator}${policy.grant.text}\n`;
      },
    };
  }
  const request = websiteRequest(task);
  requireCondition(request, "TASK_NOT_IN_CONTRACT");
  const { definition, field, value } = request;
  return {
    ...definition,
    field,
    value,
    paths: [definition.path],
    matches: (candidate) => candidate === task,
    acceptanceCriteria: [
      `Set ${definition.path}#${field} to ${JSON.stringify(value)}; preserve all other fields.`,
    ],
    tests: [...policy.grant.checks],
    editInstructions:
      "Use the supplied exact proposedText, authorized field, value and afterSha256 in the plan. " +
      "Submit that full text unchanged to apply_text_edit. No source edits or other fields.",
    satisfied: (text) =>
      validateWebsiteText(definition.path, text)[field] === value,
    output: (text) => {
      const data = validateWebsiteText(definition.path, text);
      data[field] = value;
      const serialized = `${JSON.stringify(data, null, 2)}\n`;
      const output = text.includes("\r\n")
        ? serialized.replaceAll("\n", "\r\n")
        : serialized;
      validateWebsiteText(definition.path, output);
      return output;
    },
  };
}

export function websiteChange(contract, beforeText) {
  const proposedText = contract.output(beforeText);
  return {
    path: contract.path,
    operation: contract.operation,
    beforeSha256: hashText(beforeText),
    contract: { id: contract.id, version: contract.version },
    field: contract.field,
    value: contract.value,
    proposedText,
    afterSha256: hashText(proposedText),
  };
}

export const WEBSITE_CHANGE_SCHEMA = object({
  path: { enum: WEBSITE_PATHS },
  operation: { enum: WEBSITE_CONTRACTS.map((entry) => entry.operation) },
  beforeSha256: { type: "string", pattern: "^[a-f0-9]{64}$" },
  contract: object({
    id: { enum: WEBSITE_CONTRACTS.map((entry) => entry.id) },
    version: { const: 1 },
  }),
  field: { enum: WEBSITE_CONTRACTS.flatMap((entry) => entry.fields) },
  value: { anyOf: [{ type: "string", maxLength: 240 }, { type: "integer" }] },
  proposedText: { type: "string", maxLength: 16384 },
  afterSha256: { type: "string", pattern: "^[a-f0-9]{64}$" },
});
