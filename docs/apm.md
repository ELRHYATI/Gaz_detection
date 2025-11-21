# APM (Surveillance et performance applicative)

Ce projet intègre Firebase Performance pour tracer des actions clés du front et collecter les Core Web Vitals.

## Ce qui est inclus

- Initialisation Firebase Performance via `src/config/firebase.ts`.
- Utilitaires APM dans `src/utils/apm.ts`:
  - `startTrace(name, attrs?)` pour créer des traces personnalisées.
  - `measureAsync(name, fn, attrs?)` pour mesurer une fonction async.
  - `recordWebVitals()` pour capturer LCP, CLS, FID et FCP.
  - `markNavigation(route)` pour tracer une navigation.
- Collecte des Web Vitals automatiquement depuis `src/main.tsx`.
- Traces de démarrage du Dashboard dans `src/pages/Dashboard.tsx`.

## Comment l'utiliser

### Tracer une opération synchronisée

```ts
import { startTrace } from '@/utils/apm'

const t = startTrace('fetch_thresholds', { source: 'dashboard' })
// ... opération à mesurer ...
t?.stop()
```

### Mesurer une opération asynchrone

```ts
import { measureAsync } from '@/utils/apm'

await measureAsync('load_latest_reading', async () => {
  await api.getLatest()
})
```

### Marquer une navigation

```ts
import { markNavigation } from '@/utils/apm'
markNavigation('/settings')
```

### Enregistrer les Web Vitals

`recordWebVitals()` est déjà appelé dans `src/main.tsx`. Si vous souhaitez le désactiver, supprimez l'appel.

## Où voir les métriques

- Dans la console Firebase > Performance. Les traces apparaissent avec les noms:
  - `web_vitals` (avec métriques LCP/CLS/FID/FCP)
  - `dashboard_initial_reading`
  - `dashboard_initial_render_fallback`
  - vos traces personnalisées

## Bonnes pratiques

- Donnez des noms courts et explicites à vos traces.
- Fermez toujours les traces (`stop()`), même en cas d'erreur.
- Ajoutez des `attrs` (attributs) pour filtre/analyse (ex: `route`, `source`).