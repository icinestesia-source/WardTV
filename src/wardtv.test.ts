import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { EDITION, FIRST_CENTRAL_CHANNEL, LAST_CENTRAL_CHANNEL, LAST_CHANNEL_NUMBER } from './edition.ts'
import { prefixedStorage, siteName } from './app/site.ts'
import { currentEntryMode } from './state/entry.ts'
import { guideTabs, nextGuideTab } from './state/guide-tabs.ts'
import { randomCentralChannel } from './state/startup-channel.ts'
import { editorScope } from './view/channel-edit.ts'
import { loadStoredSources } from './services/user-db.ts'
import { readNetworkBase } from './data/user-overlay.ts'
import { claimStarterInstall } from './data/user-network/starter.ts'
import { defaultFavouritesDue } from './services/preferences.ts'
import { loadShippedRefusals } from './services/embed-refusals.ts'
import { LEGAL_SECTIONS } from './legal/legal-text.ts'
import { surfLabel } from './view/info-shortcuts.ts'
import { ASSIST_DEFAULTS, loadAssist, tapCommand } from './view/assist.ts'
import type { Channel } from './types/channel.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    key: (index) => [...map.keys()][index] ?? null,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    clear: () => map.clear(),
  }
}

const channel = (number: number, origin = 'independent'): Channel => ({ id: `ch-${number}`, number, name: `Channel ${number}`, enabled: true, origin }) as unknown as Channel

describe('WardTV edition', () => {
  it('is WardTV 1.0.0 for wardtv.uk, without a User Network', () => {
    expect(EDITION.name).toBe('WardTV')
    expect(EDITION.version).toBe('1.0.0')
    expect(EDITION.domain).toBe('wardtv.uk')
    expect(EDITION.tagline).toBe('Television for everyone.')
    expect(EDITION.userNetwork).toBe(false)
    expect([FIRST_CENTRAL_CHANNEL, LAST_CENTRAL_CHANNEL, LAST_CHANNEL_NUMBER]).toEqual([1, 999, 1000])
  })

  it('never loads, seeds or reads a User Network', async () => {
    await expect(loadStoredSources()).resolves.toEqual([])
    const store = memoryStorage()
    store.setItem('tvn.network-base.v1', 'new')
    expect(readNetworkBase(store)).toBe('tvn')
    expect(claimStarterInstall(memoryStorage())).toBe(false)
    expect(defaultFavouritesDue()).toBe(false)
  })

  it('fetches only the curated playback list, never /user-network/', async () => {
    const asked: string[] = []
    await loadShippedRefusals((async (path: string) => {
      asked.push(String(path))
      return new Response('{}', { status: 404 })
    }) as typeof fetch)
    expect(asked).toEqual(['/independent/playback.json'])
  })

  it('has only the All and Favourites tabs', () => {
    expect(guideTabs(['someone'])).toEqual(['all', 'favourites'])
    expect(nextGuideTab('all', [])).toBe('favourites')
    expect(nextGuideTab('user', [])).toBe('all')
  })

  it('edits no central or user channel; Local Media and the 000 settings stay', () => {
    expect(editorScope(channel(1))).toBeNull()
    expect(editorScope(channel(999))).toBeNull()
    expect(editorScope(channel(1001, 'user-import'))).toBeNull()
    expect(editorScope(channel(0, 'tvn'))).toBe('tvn')
    expect(editorScope(channel(1000, 'session'))).toBe('local')
  })

  it('labels the surf button SURF, not a network name', () => {
    expect(surfLabel('TVN')).toBe('SURF')
  })

  it('has one entry: every address starts the television normally', () => {
    expect(currentEntryMode()).toBe('television')
  })
})

describe('WardTV startup channel', () => {
  const channels = [channel(0, 'tvn'), channel(1), channel(42), channel(999), channel(1000, 'session'), channel(1001, 'user-import')]

  it('is always a central channel 001–999, never 000, Local Media or 1001+', () => {
    for (let step = 0; step < 200; step += 1) {
      const picked = randomCentralChannel(channels, () => step / 200)
      expect(picked && picked.number >= 1 && picked.number <= 999).toBe(true)
    }
    expect(randomCentralChannel(channels, () => 0)?.number).toBe(1)
    expect(randomCentralChannel(channels, () => 0.9999)?.number).toBe(999)
  })

  it('skips channels that are off air and finds none when nothing central is on', () => {
    expect(randomCentralChannel([{ ...channel(5), enabled: false } as Channel, channel(7)], () => 0)?.number).toBe(7)
    expect(randomCentralChannel([channel(0, 'tvn'), channel(1000, 'session')])).toBeUndefined()
  })
})

describe('WardTV storage', () => {
  it('names every browser setting and database wardtv:', () => {
    expect(siteName('tvn-local-media')).toBe('wardtv:tvn-local-media')
    expect(EDITION.storagePrefix).toBe('wardtv:')
  })

  it('never sees TVN settings saved on the same origin', () => {
    const shared = memoryStorage()
    shared.setItem('tvn.notice.v1', 'seen')
    shared.setItem('tvn.favourites.v1', '[1,2,3]')
    const own = prefixedStorage(shared)
    expect(own.getItem('tvn.notice.v1')).toBeNull()
    expect(own.length).toBe(0)
    own.setItem('tvn.notice.v1', 'wardtv')
    expect(shared.getItem('wardtv:tvn.notice.v1')).toBe('wardtv')
    expect(shared.getItem('tvn.notice.v1')).toBe('seen')
    own.clear()
    expect(shared.getItem('tvn.favourites.v1')).toBe('[1,2,3]')
  })
})

describe('WardTV text', () => {
  it('has no User Network section and names WardTV, powered by TVN', () => {
    expect(LEGAL_SECTIONS.some((section) => section.id === 'user-network')).toBe(false)
    const text = JSON.stringify(LEGAL_SECTIONS)
    expect(text).toContain('About WardTV')
    expect(text).toContain('Powered by TVN')
    expect(text).not.toMatch(/1001 and up/)
  })

  it('welcomes with WATCH TV, CHANNEL GUIDE and INFORMATION, and no TVN choice', () => {
    const notice = read('src/legal/FirstRunNotice.tsx')
    for (const label of ['WATCH TV', 'CHANNEL GUIDE', 'INFORMATION', 'Choose a channel, explore the guide or simply start watching.']) expect(notice).toContain(label)
    expect(notice).not.toMatch(/TVN - CONTINUE|NEW USER/)
  })
})

describe('WardTV site', () => {
  it('is named WardTV in the page, the manifest and the install name', () => {
    const html = read('index.html')
    expect(html).toContain('<title>WardTV · Television for everyone</title>')
    expect(html).toContain('<meta name="application-name" content="WardTV" />')
    expect(html).toContain('<meta name="apple-mobile-web-app-title" content="WardTV" />')
    const manifest = JSON.parse(read('public/site.webmanifest')) as { name: string; short_name: string; start_url: string }
    expect([manifest.name, manifest.short_name, manifest.start_url]).toEqual(['WardTV', 'WardTV', '/'])
  })

  it('publishes to GitHub Pages at wardtv.uk from the root, with no Netlify or User Network files', () => {
    expect(read('public/CNAME').trim()).toBe('wardtv.uk')
    expect(read('vite.config.ts')).toContain("base: '/'")
    for (const gone of ['netlify.toml', 'netlify', 'public/_redirects', 'public/user-network', 'server', 'harvester']) expect(existsSync(resolve(root, gone))).toBe(false)
    const workflow = read('.github/workflows/deploy.yml')
    for (const part of ['pages: write', 'id-token: write', 'actions/upload-pages-artifact', 'actions/deploy-pages', 'npm ci', 'npm run build', 'path: dist']) expect(workflow).toContain(part)
  })

  it('ships 1 to 30 square WardTV logos and the WardTV icons', () => {
    const logos = readdirSync(resolve(root, 'src/assets/logos')).filter((name) => name.endsWith('.png'))
    expect(logos.length).toBeGreaterThanOrEqual(1)
    expect(logos.length).toBeLessThanOrEqual(30)
    for (const name of logos) expect(statSync(resolve(root, 'src/assets/logos', name)).size).toBeGreaterThan(4096)
    const supplied = resolve(root, 'favicon_io(5)')
    for (const icon of ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png']) {
      expect(existsSync(resolve(root, 'public', icon))).toBe(true)
      if (existsSync(supplied)) expect(readFileSync(resolve(root, 'public', icon))).toEqual(readFileSync(resolve(supplied, icon)))
    }
  })

  it('keeps no API key in src or public', () => {
    const key = /AIza[0-9A-Za-z_-]{30}/
    const scan = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = resolve(dir, name)
        if (statSync(path).isDirectory()) return scan(path)
        return /\.(ts|tsx|json|html|css|txt|webmanifest)$/.test(name) && key.test(readFileSync(path, 'utf8')) ? [path] : []
      })
    expect([...scan(resolve(root, 'src')), ...scan(resolve(root, 'public'))]).toEqual([])
  })
})

describe('WardTV Disability Assist', () => {
  it('keeps the standard tap and opens the Guide on a long press unless changed', () => {
    expect(ASSIST_DEFAULTS).toEqual({ tap: 'info', holdGuide: true })
    expect(loadAssist(memoryStorage())).toEqual(ASSIST_DEFAULTS)
  })

  it('reads a saved choice and ignores one it does not know', () => {
    const store = memoryStorage()
    store.setItem('wardtv.assist.v1', JSON.stringify({ tap: 'random', holdGuide: false }))
    expect(loadAssist(store)).toEqual({ tap: 'random', holdGuide: false })
    store.setItem('wardtv.assist.v1', JSON.stringify({ tap: 'explode' }))
    expect(loadAssist(store)).toEqual(ASSIST_DEFAULTS)
    store.setItem('wardtv.assist.v1', 'not json')
    expect(loadAssist(store)).toEqual(ASSIST_DEFAULTS)
  })

  it('sends information, the next channel in order, or a random channel', () => {
    expect(tapCommand('info')).toEqual({ type: 'info' })
    expect(tapCommand('next')).toEqual({ type: 'channel-up' })
    expect(tapCommand('random')).toEqual({ type: 'random-channel' })
  })
})

describe('WardTV channels for hospital television', () => {
  const plan = { 729: 'Cosy Kitchen', 776: 'Slow TV', 777: 'Armchair Travel' } as const
  const sources = {
    729: ['src_dianxi_xiaoge', 'src_li_ziqi', 'src_made_with_lau', 'src_pasta_grannies'],
    776: ['src_balu_nature', 'src_national_rail_scenic', 'src_nature_relaxation_films', 'src_rail_relaxation', 'src_relaxation_film'],
    777: ['src_lonely_planet', 'src_rick_steves', 'src_wolters_world'],
  } as const

  it('ships no podcast edits', () => {
    expect(JSON.parse(read('src/data/central-edits.json')).channels).toEqual({})
    const all = read('src/data/canonical-network.json') + read('src/data/central-edits.json') + read('src/data/independent/manifest.json')
    expect(all).not.toMatch(/FOR THE LOVE OF TRUTH|VERITAS|CRROW777|veritas7|crrow777radio|buzzsprout/i)
  })

  it('names 729, 776 and 777 and routes them to shipped creators', () => {
    const canon = JSON.parse(read('src/data/canonical-network.json')) as { channels: { number: number; name: string }[] }
    const manifest = JSON.parse(read('src/data/independent/manifest.json')) as { routes: { number: number; sourceIds: string[] }[] }
    for (const [number, name] of Object.entries(plan)) {
      expect(canon.channels.find((channel) => channel.number === Number(number))?.name).toBe(name)
      expect(manifest.routes.find((route) => route.number === Number(number))?.sourceIds).toEqual(sources[Number(number) as keyof typeof sources])
    }
  })

  it('dedicates those creators to the channel, so the network keeps their programmes there', async () => {
    const { DEDICATED } = await import('./director/fit.ts')
    for (const [number, ids] of Object.entries(sources)) for (const id of ids) expect(DEDICATED[id]).toContain(Number(number))
  })

  it('gives each of them a full schedule from those creators only', () => {
    const playable = JSON.parse(read('public/independent/playable.json')) as { items: [string, string, number, string, number[]][] }
    for (const number of [729, 776, 777] as const) {
      const on = playable.items.filter((item) => item[4].includes(number))
      expect(on.length).toBeGreaterThan(400)
      expect(new Set(on.map((item) => item[3]))).toEqual(new Set(sources[number]))
    }
  })
})
