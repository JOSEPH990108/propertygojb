import type { SyntheticProperty } from "./fixtures";

export function createDemoInquiryHref(
  property?: Pick<SyntheticProperty, "name" | "slug">,
): string {
  const message = property
    ? `Hello, I'm exploring the fictional PropertyGOJB concept "${property.name}" (${property.slug}). I understand this is not a real property listing. Please share current verified Johor property listings if available.`
    : "Hello, I'm exploring property in Johor. Please share current verified PropertyGOJB listings if available.";

  return `https://wa.me/?${new URLSearchParams({ text: message })}`;
}
