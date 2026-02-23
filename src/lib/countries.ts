import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import {
  getCountryCallingCode,
  getCountries as getPhoneCountries,
  type CountryCode,
} from "libphonenumber-js";

countries.registerLocale(en);

export type CountryOption = {
  value: CountryCode;
  label: string;
  code: string;
};

// ✅ libphonenumber-js already guarantees these are valid CountryCode
const PHONE_SUPPORTED = getPhoneCountries();

export const countryOptions: CountryOption[] = PHONE_SUPPORTED.map(
  (iso) => ({
    value: iso,
    label:
      countries.getName(iso, "en", { select: "official" }) ?? iso,
    code: `+${getCountryCallingCode(iso)}`,
  })
);

// Optional UX priority
const PRIORITY: CountryCode[] = ["MY", "SG", "US"];

export const sortedCountries: CountryOption[] = [
  ...countryOptions.filter((c) => PRIORITY.includes(c.value)),
  ...countryOptions.filter((c) => !PRIORITY.includes(c.value)),
];
