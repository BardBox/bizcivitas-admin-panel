import { Country, State, City } from "country-state-city";

export interface LocationValidation {
  hasStates: boolean;
  hasCities: boolean;
  isStateRequired: boolean;
  isCityRequired: boolean;
}

/**
 * Check if a country has states/subdivisions and cities
 */
export function getCountryLocationValidation(countryCode: string): LocationValidation {
  if (!countryCode) {
    return { hasStates: false, hasCities: false, isStateRequired: false, isCityRequired: false };
  }

  const states = State.getStatesOfCountry(countryCode);
  const hasStates = states && states.length > 0;

  let hasCities = false;
  if (hasStates) {
    for (let i = 0; i < Math.min(states.length, 3); i++) {
      const cities = City.getCitiesOfState(countryCode, states[i].isoCode);
      if (cities && cities.length > 0) {
        hasCities = true;
        break;
      }
    }
  } else {
    const allCities = City.getCitiesOfCountry(countryCode);
    hasCities = Boolean(allCities && allCities.length > 0);
  }

  return {
    hasStates,
    hasCities,
    isStateRequired: hasStates,
    isCityRequired: hasCities,
  };
}

/**
 * Check if selected states have cities
 */
export function doStatesHaveCities(countryCode: string, stateCodes: string[]): boolean {
  if (!countryCode || !stateCodes || stateCodes.length === 0) return false;
  return stateCodes.some(stateCode => {
    const cities = City.getCitiesOfState(countryCode, stateCode);
    return cities && cities.length > 0;
  });
}

/**
 * Get validation rules for countries
 */
export function getLocationValidationRules(countries: string[]) {
  if (!countries || countries.length === 0) {
    return { isCountryRequired: true, isStateRequired: false, isCityRequired: false, showStateField: false, showCityField: false };
  }

  if (countries.length > 1 || countries.includes("ALL_COUNTRIES")) {
    return { isCountryRequired: true, isStateRequired: false, isCityRequired: false, showStateField: true, showCityField: true };
  }

  const countryCode = countries[0];
  const validation = getCountryLocationValidation(countryCode);

  return {
    isCountryRequired: true,
    isStateRequired: validation.isStateRequired,
    isCityRequired: validation.isCityRequired,
    showStateField: validation.hasStates,
    showCityField: validation.hasCities || validation.hasStates,
  };
}

/**
 * Validate form data
//  */
export function validateLocationData(formData: { countries?: string[]; states?: string[]; cities?: string[] }) {
  const errors: { [key: string]: string } = {};
  if (!formData.countries || formData.countries.length === 0) {
    errors.countries = "At least one country is required";
    return { isValid: false, errors };
  }

  const rules = getLocationValidationRules(formData.countries);

  if (rules.isStateRequired && (!formData.states || formData.states.length === 0)) {
    errors.states = "At least one state is required for the selected country";
  }

  if (formData.states && formData.states.length > 0 && formData.countries.length === 1) {
    const countryCode = formData.countries[0];
    if (doStatesHaveCities(countryCode, formData.states) && (!formData.cities || formData.cities.length === 0)) {
      errors.cities = "At least one city is required for the selected state(s)";
    }
  } else if (rules.isCityRequired && (!formData.cities || formData.cities.length === 0)) {
    errors.cities = "At least one city is required";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Get field labels for forms
 */
export function getLocationFieldLabels(countries: string[], states?: string[]) {
  const rules = getLocationValidationRules(countries);
  let cityRequired = rules.isCityRequired;

  if (states && states.length > 0 && countries.length === 1) {
    cityRequired = doStatesHaveCities(countries[0], states);
  }

  return {
    countryLabel: "Country *",
    stateLabel: rules.isStateRequired ? "State *" : "State *",
    cityLabel: cityRequired ? "City *" : "City *",
    showRequired: { country: true, state: rules.isStateRequired, city: cityRequired },
  };
}

/**
 * Get placeholder text for dropdowns
 */
export function getLocationPlaceholders(countries: string[]) {
  const rules = getLocationValidationRules(countries);

  if (!countries || countries.length === 0) {
    return {
      countryPlaceholder: "Select Country",
      statePlaceholder: "Please select a country first",
      cityPlaceholder: "Please select a country first",
    };
  }

  const countryNames = countries.map(code => Country.getCountryByCode(code)?.name || code).join(", ");

  return {
    countryPlaceholder: "Select Country",
    statePlaceholder: rules.showStateField ? `Select states${rules.isStateRequired ? "" : " (optional)"}` : `${countryNames} doesn't have states`,
    cityPlaceholder: rules.showCityField ? `Select cities${rules.isCityRequired ? "" : " (optional)"}` : `${countryNames} doesn't have cities`,
  };
}




/**
 * Get visibility of fields - Modified to show all fields initially
 */
export function getLocationFieldVisibility(
  countries: string[] = [],
  states: string[] = [],
  cities: string[] = [],

 
) {
  let showCountry = true;
  let showState = true;
  let showCity = true;
  let showCommunity = true;

  // Disable flags
  let disableState = true;
  let disableCity = true;
  let disableCommunity = true;

  // Step 1: No country selected → only country enabled
  if (countries.length === 0) {
    disableState = true;
    disableCity = true;
    disableCommunity = true;
  } else {
    // Step 2: Country selected → enable state
    disableState = false;

    // Step 3: If state selected → enable city
    if (states.length > 0) {
      disableCity = false;

      // Step 4: If city selected → enable community
      if (cities.length > 0) {
        disableCommunity = false;
      }
    }
  }

  // Handle "ALL_" selections to hide subsequent fields
  if (countries.includes("ALL_COUNTRIES")) {
    showState = false;
    showCity = false;
    showCommunity = false;
    disableState = true;
    disableCity = true;
    disableCommunity = true;
  } else if (states.includes("ALL_STATES")) {
    showCity = false;
    showCommunity = false;
    disableCity = true;
    disableCommunity = true;
  } else if (cities.includes("ALL_CITIES")) {
    showCommunity = false;
    disableCommunity = true;
  }

  return {
    showCountry,
    showState,
    showCity,
    showCommunity,
    disableState,
    disableCity,
    disableCommunity,
  };
}
