/**
 * Validates the magic bytes of a buffer to ensure it is a valid image format.
 * Checks for JPEG, PNG, GIF, and WebP signatures.
 *
 * @param {Buffer} buffer - The file buffer to check
 * @returns {boolean} - true if it matches an allowed image signature
 */
function verifyImageSignature(buffer) {
  if (!buffer || buffer.length < 12) {
    return false;
  }

  // Convert first few bytes to hex string for easier matching
  const hex = buffer.toString('hex', 0, 12).toUpperCase();

  // JPEG: FF D8 FF
  if (hex.startsWith('FFD8FF')) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (hex.startsWith('89504E470D0A1A0A')) {
    return true;
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (hex.startsWith('47494638')) {
    return true;
  }

  // WebP: RIFF ... WEBP (52 49 46 46 ... 57 45 42 50)
  // Indices 0-3: RIFF
  // Indices 8-11: WEBP
  const riff = hex.substring(0, 8); // 4 bytes
  const webp = hex.substring(16, 24); // next 4 bytes at offset 8
  if (riff === '52494646' && webp === '57454250') {
    return true;
  }

  return false;
}

module.exports = {
  verifyImageSignature
};
