/** Comprobación estructural acotada antes de persistir un adjunto importado. */
export function validJpeg(bytes: Uint8Array) {
  if (
    bytes.length < 12 ||
    bytes.length > 2 * 1024 * 1024 ||
    bytes[0] !== 255 ||
    bytes[1] !== 216 ||
    bytes.at(-2) !== 255 ||
    bytes.at(-1) !== 217
  )
    return false;
  let offset = 2,
    frame = false;
  while (offset + 4 < bytes.length) {
    if (bytes[offset++] !== 255) return false;
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === undefined || marker === 217 || marker === 216) return false;
    const length = bytes[offset]! * 256 + bytes[offset + 1]!;
    if (length < 2 || offset + length > bytes.length - 2) return false;
    if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
      if (length < 8) return false;
      const height = bytes[offset + 3]! * 256 + bytes[offset + 4]!;
      const width = bytes[offset + 5]! * 256 + bytes[offset + 6]!;
      if (!width || !height || width > 1024 || height > 1024) return false;
      frame = true;
    }
    if (marker === 218) return frame && length >= 6 && offset + length < bytes.length - 2;
    offset += length;
  }
  return false;
}
