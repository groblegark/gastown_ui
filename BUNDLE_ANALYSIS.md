# Bundle Analysis Report

Generated: 2026-01-08

## Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Initial JS (gzipped) | ~70KB | <200KB | ✅ Pass |
| Initial CSS (gzipped) | ~13KB | <50KB | ✅ Pass |
| Total Initial (gzipped) | ~83KB | <200KB | ✅ Pass |

## Chunk Breakdown

### Critical Path (Initial Load)

| Chunk | Raw Size | Gzipped | Contents |
|-------|----------|---------|----------|
| entry/app.*.js | 12KB | 4KB | SvelteKit app entry |
| entry/start.*.js | 0.1KB | 0.1KB | Boot loader |
| nodes/0.*.js | 17KB | 5KB | Root layout |
| 7oje_f5E.js | 52KB | 18KB | Svelte 5 runtime |
| B3DuLl8F.js | 122KB | 23KB | Components + Icons |
| Bp4Q0WxN.js | 34KB | 12KB | tailwind-merge |
| Dl5Vqj1J.js | 38KB | 15KB | SvelteKit internals |
| CSS (0.*.css) | 77KB | 13KB | Tailwind styles |

### Largest Page Chunks

| Page | Size (gzipped) |
|------|----------------|
| settings | 6.5KB |
| seance | 6.1KB |
| agents | 5.1KB |
| stats | 4.5KB |
| layout | 4.6KB |

## Dependency Analysis

### Large Dependencies

1. **lucide-svelte** (~50KB contribution)
   - 60+ icons imported across components
   - Tree-shaking works but cumulative size is significant
   - Recommendation: Audit unused icons

2. **tailwind-variants** (~15KB contribution)
   - Used for component styling
   - Worth the DX improvement

3. **tailwind-merge** (~12KB contribution)
   - Required for class merging
   - Necessary dependency

4. **dompurify** (~8KB contribution)
   - XSS protection
   - Security requirement, keep

### Well-Optimized

- **clsx**: <1KB
- **Svelte 5 runtime**: Efficient, no action needed

## Recommendations

### Immediate (Low Effort)

1. **Audit Lucide icons** - Remove unused imports
   ```bash
   # Find all lucide imports
   rg "from 'lucide-svelte'" src/
   ```

2. **Enable compression** - ✅ Precompression enabled in adapter-static
   - `.gz` and `.br` files generated at build time
   - Serve with proper Content-Encoding headers

### Medium Term

3. **Route-based code splitting** - Already implemented by SvelteKit
   - Pages lazy-load automatically
   - Monitor for regression

4. **CSS purging** - Tailwind purges unused styles
   - Verify `content` paths in tailwind.config.js

### Future Consideration

5. **Icon sprite** - If icon count exceeds 100, consider:
   - SVG sprite sheet
   - Custom icon component with lazy loading

6. **Bundle analyzer** - Add for CI monitoring:
   ```bash
   bun add -D rollup-plugin-visualizer
   ```

## Monitoring

Run bundle analysis:
```bash
bun run build
# Check .svelte-kit/output/client/_app/immutable/
du -h build/_app/immutable/chunks/*.js | sort -h
```

## Conclusion

The bundle is **well within the 200KB target** at ~83KB gzipped initial load.
The architecture follows best practices with automatic code-splitting per route.
No immediate action required, but icon usage should be monitored as features grow.
