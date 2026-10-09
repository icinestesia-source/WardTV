import { execSync } from 'node:child_process'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/** WardTV was made from this TVN commit; it is shown in the build information, never updated from TVN automatically. */
const TVN_SOURCE_COMMIT = '4242c2b'

/** The commit being built: GitHub Actions names it in GITHUB_SHA; a local build asks git. */
function buildCommit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    const head = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    const dirty = execSync('git status --porcelain --untracked-files=no', { encoding: 'utf8' }).trim()
    return dirty ? `${head}+changes` : head
  } catch {
    return 'unknown'
  }
}

const builtAt = Date.now()

/**
 * GitHub Pages answers an unknown path with 404.html. A copy of the app's own page there means any address on
 * wardtv.uk opens WardTV instead of GitHub's error page.
 */
function pagesFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'wardtv-pages-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

export default defineConfig({
  // Served from the root of wardtv.uk.
  base: '/',
  plugins: [react(), pagesFallback()],
  // Each build has its own id; channel pools kept by an earlier build are never reused by a later one.
  define: {
    __TVN_BUILD__: JSON.stringify(builtAt.toString(36)),
    __TVN_COMMIT__: JSON.stringify(buildCommit()),
    __TVN_BUILT_AT__: JSON.stringify(new Date(builtAt).toISOString()),
    __TVN_SOURCE_COMMIT__: JSON.stringify(TVN_SOURCE_COMMIT),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
})
