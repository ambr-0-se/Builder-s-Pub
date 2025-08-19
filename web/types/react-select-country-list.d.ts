declare module 'react-select-country-list' {
  export interface CountryOption {
    value: string
    label: string
  }

  export default function countryList(): {
    getData: () => CountryOption[]
  }
}


