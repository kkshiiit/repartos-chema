// Compatibilidad con query-string7 (CommonJS/API0.2), usando el decodificador lineal upstream0.5.
const decode = require('./decoder.cjs').default;
module.exports = function decodeUriComponent(value) {
  return decode(typeof value === 'string' ? value.replace(/\+/g, ' ') : value);
};
