// Lazy loaders for the vendored animation libraries in public/vendor/.
//
// Each loader injects its script tag at most once and resolves with the
// library global (window.Proton / window.lottie). Nothing loads on the
// critical path: callers invoke these only at the moment an animation is
// actually about to run. A failed load clears the cache entry so a later
// call may retry.

const cache = new Map<string, Promise<any>>();

function loadScript(src: string, globalName: string): Promise<any> {
  const existing = cache.get(src);
  if (existing) return existing;

  const promise = new Promise<any>((resolve, reject) => {
    const w = window as any;
    if (w[globalName]) {
      resolve(w[globalName]);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      if (w[globalName]) {
        resolve(w[globalName]);
      } else {
        cache.delete(src);
        reject(new Error(`Loaded ${src} but window.${globalName} is missing`));
      }
    };
    script.onerror = () => {
      cache.delete(src);
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(script);
  });

  cache.set(src, promise);
  return promise;
}

/** Resolves with the global Proton particle engine (vendored 6.0.3). */
export function loadProton(): Promise<any> {
  return loadScript('/vendor/proton.min.js', 'Proton');
}

/** Resolves with the global lottie player (vendored lottie-web 5.13.0). */
export function loadLottie(): Promise<any> {
  return loadScript('/vendor/lottie.min.js', 'lottie');
}
