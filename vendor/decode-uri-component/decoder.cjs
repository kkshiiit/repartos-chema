"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var upstream_exports = {};
__export(upstream_exports, {
  default: () => decodeUriComponent
});
module.exports = __toCommonJS(upstream_exports);
const token = "%[a-f0-9]{2}";
const multiMatcher = new RegExp(`(${token})+`, "gi");
const hexPair = /^[a-f\d]{2}$/i;
function parsePercentByte(input, position) {
  if (input.codePointAt(position) !== 37 || position + 3 > input.length) {
    return;
  }
  const digits = input.slice(position + 1, position + 3);
  if (!hexPair.test(digits)) {
    return;
  }
  return { byte: Number.parseInt(digits, 16), next: position + 3 };
}
function utf8SequenceLength(byte) {
  if (byte <= 127) {
    return 1;
  }
  if (byte >= 194 && byte <= 223) {
    return 2;
  }
  if (byte >= 224 && byte <= 239) {
    return 3;
  }
  if (byte >= 240 && byte <= 244) {
    return 4;
  }
  return 0;
}
function isContinuationByte(byte) {
  return byte >= 128 && byte <= 191;
}
function decode(input) {
  try {
    return decodeURIComponent(input);
  } catch {
    let output = "";
    let position = 0;
    while (position < input.length) {
      if (input.codePointAt(position) !== 37) {
        output += input.charAt(position);
        position++;
        continue;
      }
      const firstByte = parsePercentByte(input, position);
      if (!firstByte) {
        output += input.charAt(position);
        position++;
        continue;
      }
      const sequenceLength = utf8SequenceLength(firstByte.byte);
      if (sequenceLength === 0) {
        output += input.slice(position, position + 3);
        position += 3;
        continue;
      }
      let end = firstByte.next;
      let validSequence = true;
      for (let index = 1; index < sequenceLength; index++) {
        const nextByte = parsePercentByte(input, end);
        if (!nextByte || !isContinuationByte(nextByte.byte)) {
          validSequence = false;
          break;
        }
        end = nextByte.next;
      }
      if (validSequence) {
        const encodedSequence = input.slice(position, end);
        try {
          output += decodeURIComponent(encodedSequence);
          position = end;
          continue;
        } catch {
        }
      }
      output += input.slice(position, position + 3);
      position += 3;
    }
    return output;
  }
}
function customDecodeURIComponent(input) {
  const replaceMap = {
    "%FE%FF": "\uFFFD\uFFFD",
    "%FF%FE": "\uFFFD\uFFFD"
  };
  let match = multiMatcher.exec(input);
  while (match) {
    try {
      replaceMap[match[0]] = decodeURIComponent(match[0]);
    } catch {
      const result = decode(match[0]);
      if (result !== match[0]) {
        replaceMap[match[0]] = result;
      }
    }
    match = multiMatcher.exec(input);
  }
  replaceMap["%C2"] = "\uFFFD";
  const entries = Object.keys(replaceMap);
  for (const key of entries) {
    input = input.replace(new RegExp(key, "g"), replaceMap[key]);
  }
  return input;
}
function decodeUriComponent(encodedURI) {
  if (typeof encodedURI !== "string") {
    throw new TypeError(`Expected \`encodedURI\` to be of type \`string\`, got \`${typeof encodedURI}\``);
  }
  try {
    return decodeURIComponent(encodedURI);
  } catch {
    return customDecodeURIComponent(encodedURI);
  }
}
