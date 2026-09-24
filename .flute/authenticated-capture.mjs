// Authenticate Flute's stock capture adapter through the ordinary local login.
// Credentials are supplied only in the process environment; nothing is persisted.
import { chromium } from 'playwright';

const { FLUTE_CAPTURE_IDENTIFIER: identifier, FLUTE_CAPTURE_PASSWORD: password } = process.env;
if (!identifier || !password) throw new Error('Supply the local capture account in the process environment.');
delete process.env.FLUTE_CAPTURE_IDENTIFIER;
delete process.env.FLUTE_CAPTURE_PASSWORD;
const originalFetch = globalThis.fetch;
const response = await originalFetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-school-slug': 'alma-mater' },
  body: JSON.stringify({ email: identifier, password, school_slug: 'alma-mater' }),
});
if (!response.ok) throw new Error(`Local capture login failed (${response.status}).`);
const { token, user } = await response.json();
if (!token || !user) throw new Error('Local login returned no capture session.');
const cookies = [
  {name:'token', value:encodeURIComponent(token), domain:'localhost', path:'/', httpOnly:false, secure:false, sameSite:'Lax'},
  {name:'user', value:encodeURIComponent(JSON.stringify(user)), domain:'localhost', path:'/', httpOnly:false, secure:false, sameSite:'Lax'},
];
// CLI host verification and its isolated capture page need the same authorized session.
globalThis.fetch = (input, init) => {
  if (new URL(typeof input === 'string' || input instanceof URL ? input : input.url).origin !== 'http://localhost:3000') return originalFetch(input, init);
  const headers = new Headers(init?.headers);
  headers.set('Cookie', cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '));
  return originalFetch(input, {...init, headers});
};
const launch = chromium.launch.bind(chromium);
chromium.launch = async options => {
  const browser = await launch(options);
  const newPage = browser.newPage.bind(browser);
  browser.newPage = async options => {
    const page = await newPage({...options, storageState:{cookies, origins:[]}});
    for (const method of ['goto', 'waitForFunction', 'waitForLoadState', 'evaluate', 'screenshot']) {
      const original = page[method].bind(page);
      page[method] = async (...args) => {
        try {
          // A cold Next development compile may outlast Flute's 5-second bridge wait.
          if (method === 'waitForFunction' && args[2]?.timeout === 5000) {
            args[2] = {...args[2], timeout:30000};
          }
          const result = await original(...args);
          if (method === 'waitForLoadState' && args[0] === 'networkidle') {
            await page.waitForFunction(() =>
              document.querySelector('[data-flute-scene]')?.getAttribute('data-flute-valid') === 'true'
              && !document.querySelector('[data-flute-id="analytics-loading"]'),
              undefined, {timeout:30000});
          }
          return result;
        }
        catch (error) {
          console.error(`Capture ${method}: ${error.message.split('\n')[0]}`);
          if (method === 'evaluate') console.error(await original(() => ({
            diagnostics: document.querySelector('[data-flute-diagnostics]')?.textContent,
            surfaces: Array.from(document.querySelectorAll('[data-flute-id]')).map(el => el.getAttribute('data-flute-id')),
            dataError: document.querySelector('[data-flute-id="analytics-error"]')?.textContent,
          })).catch(() => 'Capture diagnostics unavailable.'));
          throw error;
        }
      };
    }
    return page;
  };
  return browser;
};
await import('../node_modules/@webprodigies/flute/dist/cli/flute.js');
