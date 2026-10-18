/** Presentation-only conversion. Domain validation still rejects nonexistent dates. */
export function displayDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value;
}
export function serializeDateInput(value: string) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(value) ? value.split('/').reverse().join('-') : value;
}
