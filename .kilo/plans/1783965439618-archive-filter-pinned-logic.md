# Archive Page: Conditional Pinned Artworks Display

## Goal
When filters are applied (any filter ≠ "All"), hide pinned/featured artworks. When no filters are selected (default state), show pinned artworks.

## Current Behavior (ArchivePage.tsx:918-954)
- `featuredWorks` are ALWAYS computed from `archive.filter(r => r.featured && r.status === 'Archive')` (ignoring all filters)
- `regularWorks` are filtered by ALL active filters (year, medium, series, category)
- Featured section **always renders** at lines 1162-1175

## Required Behavior
- `activeFilterCount === 0` (default): Show featured works + regular filtered works
- `activeFilterCount > 0` (any filter active): Hide featured works, show only regular filtered works

## Implementation Plan

### 1. Modify `featuredWorks` computation (ArchivePage.tsx:918-922)
Change from:
```typescript
const featuredWorks = useMemo(() => 
  archive.filter(r => r.featured && r.status === 'Archive').slice(0, 4),
  [archive]
);
```

To:
```typescript
const featuredWorks = useMemo(() => {
  if (activeFilterCount > 0) return [];
  return archive.filter(r => r.featured && r.status === 'Archive').slice(0, 4);
}, [archive, activeFilterCount]);
```

### 2. No rendering changes needed
The existing render at lines 1162-1175 already conditionally renders based on `featuredWorks.length > 0`, so it will naturally hide when empty.

### 3. Edge case: "Clear filters" button (line 1129)
The "Clear filters" button already calls `clearAll()` which resets all filters to "All" → `activeFilterCount` becomes 0 → featured works reappear. ✓ No change needed.

### 4. Edge case: URL params on initial load
Filter state is initialized from URL params (lines 855-858). If user lands on URL with filters, `activeFilterCount > 0` → featured hidden. ✓ Works correctly.

## Files to Modify
- `src/pages/ArchivePage.tsx` - Lines 918-922 (add `activeFilterCount` dependency)

## Testing Scenarios
1. **Default load** (no URL params): featured works shown ✓
2. **URL with `?year=2023`**: featured hidden ✓
3. **Select year filter**: featured hidden ✓
4. **Select medium filter**: featured hidden ✓
5. **Clear all filters**: featured shown ✓
6. **Multiple filters active**: featured hidden ✓