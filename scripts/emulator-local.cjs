// firebase-tools 15.33 applies HTTPS_PROXY even to its local emulators.
// Keep the inherited proxy for every external destination; use local transport
// only for the explicitly configured emulator ports on the loopback interface.
const originalFetch = globalThis.fetch;
const { Agent } = require('undici');
const localAgent = new Agent();
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      ['8080', '9199', '9099', '5001', '4400', '9150'].includes(url.port)) {
    return originalFetch(input, { ...init, dispatcher: localAgent });
  }
  return originalFetch(input, init);
};
