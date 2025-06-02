// Demo: Frontend should add timestamp to API calls to bypass cache

// BAD: Static URL (có thể bị cache)
// fetch('https://api.loltips.net/api/pc-build/builds')

// GOOD: Add timestamp parameter to force refresh
const fetchWithCacheBust = (url: string) => {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return fetch(`${url}${separator}_t=${timestamp}`);
};

// Example usage:
// fetchWithCacheBust('https://api.loltips.net/api/pc-build/builds')
// fetchWithCacheBust('https://api.loltips.net/api/home')

// Or use version parameter:
const fetchWithVersion = (url: string) => {
  const version = 'v2'; // Increment this when you want to bust cache
  const separator = url.includes('?') ? '&' : '?';
  return fetch(`${url}${separator}v=${version}`);
};

export { fetchWithCacheBust, fetchWithVersion }; 