# Fixing Node Display Issues - Implementation Plan

**Date:** 2025-11-22
**Issue:** Graph nodes are too large, overlapping, clustering together, and not properly centered

---

## Problem Analysis

### Current Issues

1. **Nodes too large**
   - Base calculation: `baseSize + value * 3` creates nodes 50-100px in size
   - For pagerank=0.15: size = 5 + (0.15 * 100) * 3 = 50px (too large)
   - Should be 8-20px range for optimal visibility

2. **Nodes overlapping**
   - NO collision detection implemented
   - Missing `d3ForceCollide` force in physics simulation
   - Nodes can stack on top of each other

3. **Nodes clustering/clumping**
   - Weak repulsion force: `-1500` insufficient for proper spacing
   - Short link distances: `150px` creates tight clusters
   - Weak centering force allows drift

4. **Poor centering**
   - `zoomToFit(400, 50)` has inadequate padding
   - Only triggers on node count change (not on resize or initial load)
   - Doesn't account for varying node sizes

5. **Physics simulation issues**
   - Fast convergence (d3AlphaDecay=0.05) doesn't allow proper settling
   - Too few warmup ticks (100) for pre-stabilization
   - Short cooldown (5000ms) stops physics prematurely

---

## Files to Modify

### Primary File
- **`frontend/components/SemanticGraph.tsx`** (Lines 54-144)
  - Node sizing logic
  - Physics force configuration
  - Auto-zoom behavior
  - Canvas rendering

### Secondary Files (No changes needed, but review for context)
- `frontend/hooks/useRealtimeGraph.ts` - Data flow is correct
- `frontend/app/patients/[patientId]/sessions/[sessionId]/page.tsx` - Graph integration is correct

---

## Step-by-Step Implementation

### Step 1: Fix Node Sizing

**File:** `frontend/components/SemanticGraph.tsx`
**Lines:** 54-72

**Current code:**
```typescript
const getNodeSize = (node: any) => {
  const baseSize = 5;
  let value = 0;

  switch (highlightMetric) {
    case 'weighted_degree':
      value = node.weightedDegree || 0;
      break;
    case 'pagerank':
      value = (node.pagerank || 0.15) * 100;
      break;
    case 'betweenness':
      value = (node.betweenness || 0) * 100;
      break;
  }

  return baseSize + value * 3;  // PROBLEM: multiplier too high
};
```

**New code:**
```typescript
const getNodeSize = (node: any) => {
  const baseSize = 4;  // Reduced from 5 to 4
  let value = 0;

  switch (highlightMetric) {
    case 'weighted_degree':
      value = node.weightedDegree || 0;
      break;
    case 'pagerank':
      value = (node.pagerank || 0.15) * 100;
      break;
    case 'betweenness':
      value = (node.betweenness || 0) * 100;
      break;
  }

  // FIXED: Reduced multiplier from 3 to 0.2 for realistic sizing
  return baseSize + value * 0.2;
};
```

**Expected result:**
- Pagerank 0.15 node: 4 + (15 * 0.2) = 7px (was 50px)
- Pagerank 0.50 node: 4 + (50 * 0.2) = 14px (was 155px)
- Node sizes now in 4-20px range (optimal)

---

### Step 2: Add Collision Detection

**File:** `frontend/components/SemanticGraph.tsx`
**Lines:** 106-108 (add after d3ForceCenter)

**Current code:**
```typescript
// Force simulation configuration (match demo appearance)
d3ForceCharge={() => -1500}
d3ForceLink={(link) => link.value ? 150 / link.value : 150}
d3ForceCenter={() => ({ x: 0, y: 0, strength: 0.03 })}
```

**New code:**
```typescript
// Force simulation configuration
d3ForceCharge={() => -2500}  // Increased repulsion from -1500
d3ForceLink={(link) => link.value ? 250 / link.value : 250}  // Increased from 150
d3ForceCenter={() => ({ x: 0, y: 0, strength: 0.05 })}  // Increased from 0.03

// COLLISION DETECTION - Prevents node overlap
d3ForceCollide={(node: any) => {
  const nodeSize = getNodeSize(node);
  return nodeSize + 8;  // Node radius + 8px minimum spacing
}}
```

**Rationale:**
- `d3ForceCollide` creates invisible collision radius around each node
- Returns radius = node visual size + 8px buffer
- Physics engine prevents nodes from getting closer than this distance
- Dynamically adjusts per node based on actual size

---

### Step 3: Optimize Physics Simulation

**File:** `frontend/components/SemanticGraph.tsx`
**Lines:** 98-103

**Current code:**
```typescript
// PERFORMANCE OPTIMIZATIONS:
// 1. Faster physics convergence
d3AlphaDecay={0.05}  // Faster convergence (was 0.02)
d3VelocityDecay={0.4}  // More damping (was 0.3)
warmupTicks={100}  // Pre-stabilize before render
cooldownTime={5000}  // Stop physics after 5s
```

**New code:**
```typescript
// PERFORMANCE OPTIMIZATIONS:
// 1. Balanced physics convergence
d3AlphaDecay={0.02}  // Slower for better settling (reverted from 0.05)
d3VelocityDecay={0.3}  // Natural damping (reverted from 0.4)
warmupTicks={200}  // Increased pre-stabilization ticks
cooldownTime={10000}  // Increased to 10s for complex graphs
```

**Explanation:**
- Slower alpha decay = more iterations = better final layout
- Less velocity decay = more natural movement (not over-damped)
- More warmup ticks = graph appears more stable on initial render
- Longer cooldown = physics continues longer for large/complex graphs

---

### Step 4: Improve Auto-Zoom Behavior

**File:** `frontend/components/SemanticGraph.tsx`
**Lines:** 39-44

**Current code:**
```typescript
// Auto-fit graph when new nodes appear
useEffect(() => {
  if (graphRef.current && graphData.nodes.length > 0) {
    graphRef.current.zoomToFit(400, 50);
  }
}, [graphData.nodes.length]);
```

**New code:**
```typescript
// Auto-fit graph when new nodes appear or on initial load
useEffect(() => {
  if (graphRef.current && graphData.nodes.length > 0) {
    // Delay to allow physics to settle before zooming
    const timer = setTimeout(() => {
      graphRef.current.zoomToFit(1000, 100);  // Longer duration, more padding
    }, 500);

    return () => clearTimeout(timer);
  }
}, [graphData.nodes.length]);
```

**Improvements:**
- 500ms delay allows physics simulation to settle first
- Duration increased from 400ms to 1000ms for smoother zoom
- Padding increased from 50px to 100px for better framing
- Cleanup function prevents multiple simultaneous zoom calls

---

### Step 5: Verify Canvas Rendering (No changes needed)

**File:** `frontend/components/SemanticGraph.tsx`
**Lines:** 120-137

**Current implementation is correct:**
```typescript
nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
  const label = node.label;
  const fontSize = 12 / globalScale;
  ctx.font = `${fontSize}px Sans-Serif`;

  // Draw node circle
  const size = getNodeSize(node);  // Uses corrected getNodeSize
  ctx.fillStyle = getNodeColor(node);
  ctx.beginPath();
  ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
  ctx.fill();

  // Draw label (always visible like demo)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(label, node.x, node.y + size + fontSize);
}}
```

**Why no changes:**
- Already uses `getNodeSize(node)` which will automatically use new calculation
- Label positioning adjusts based on node size
- Canvas rendering is performant and correct

---

## Complete Modified Code Block

**File:** `frontend/components/SemanticGraph.tsx`
**Lines:** 54-144

```typescript
// Node size based on selected metric
const getNodeSize = (node: any) => {
  const baseSize = 4;  // CHANGED: from 5 to 4
  let value = 0;

  switch (highlightMetric) {
    case 'weighted_degree':
      value = node.weightedDegree || 0;
      break;
    case 'pagerank':
      value = (node.pagerank || 0.15) * 100;
      break;
    case 'betweenness':
      value = (node.betweenness || 0) * 100;
      break;
  }

  return baseSize + value * 0.2;  // CHANGED: from * 3 to * 0.2
};

// Node color based on type (match landing page demo)
const getNodeColor = (node: any) => {
  return node.type === 'emotion' ? '#d98282' : '#6ea8d3';  // demo red vs demo blue
};

return (
  <div className="w-full h-full border rounded-lg overflow-hidden bg-slate-950 relative">
    <ForceGraph2D
      ref={graphRef}
      graphData={graphData}
      nodeLabel={(node: any) => `${node.label} (${highlightMetric}: ${
        highlightMetric === 'weighted_degree' ? node.weightedDegree?.toFixed(2) :
        highlightMetric === 'pagerank' ? node.pagerank?.toFixed(3) :
        node.betweenness?.toFixed(3)
      })`}
      nodeRelSize={1}
      nodeVal={getNodeSize}
      nodeColor={getNodeColor}
      linkWidth={link => (link.value || 0.75) * 3}
      linkDirectionalParticles={2}
      linkDirectionalParticleSpeed={0.005}
      backgroundColor="#020617"
      linkColor={() => '#64748b'}

      // PERFORMANCE OPTIMIZATIONS:
      // CHANGED: Reverted to slower convergence for better layout
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      warmupTicks={200}  // CHANGED: from 100 to 200
      cooldownTime={10000}  // CHANGED: from 5000 to 10000

      // Force simulation configuration
      d3ForceCharge={() => -2500}  // CHANGED: from -1500 to -2500
      d3ForceLink={(link) => link.value ? 250 / link.value : 250}  // CHANGED: from 150 to 250
      d3ForceCenter={() => ({ x: 0, y: 0, strength: 0.05 })}  // CHANGED: from 0.03 to 0.05

      // NEW: Collision detection to prevent overlap
      d3ForceCollide={(node: any) => {
        const nodeSize = getNodeSize(node);
        return nodeSize + 8;
      }}

      // Node visibility filtering for large graphs
      nodeVisibility={(node: any) => {
        if (graphData.nodes.length > 200) {
          return (node.pagerank || 0) > 0.2 || (node.weightedDegree || 0) > 1.0;
        }
        return true;
      }}

      // Canvas rendering (uses corrected getNodeSize)
      nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.label;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;

        // Draw node circle
        const size = getNodeSize(node);
        ctx.fillStyle = getNodeColor(node);
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
        ctx.fill();

        // Draw label (always visible like demo)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(label, node.x, node.y + size + fontSize);
      }}

      onNodeClick={(node) => {
        console.log('Node clicked:', node);
        // TODO: Show node details in sidebar
      }}
    />
  </div>
);
```

---

## Testing Procedure

### Test 1: Node Size Verification
1. Start backend and frontend
2. Navigate to active session with existing nodes
3. Inspect node sizes in browser DevTools
4. Expected: Nodes between 4-20px diameter
5. Verify: No nodes larger than 25px

### Test 2: Collision Detection
1. Load session with 10+ nodes
2. Wait for physics to settle (10 seconds)
3. Zoom in to inspect node spacing
4. Expected: Minimum 8px gap between all nodes
5. Verify: No overlapping circles

### Test 3: Node Spacing
1. Create new session
2. Send transcript chunks to generate nodes
3. Observe node distribution as graph grows
4. Expected: Nodes spread out evenly, not clustered
5. Verify: Graph uses full available space

### Test 4: Auto-Zoom Behavior
1. Start with empty session
2. Add first 3 nodes via transcript
3. Observe zoom animation
4. Expected: Smooth 1-second zoom centering all nodes with 100px padding
5. Verify: All nodes visible without manual zoom adjustment

### Test 5: Physics Stability
1. Load session with 50+ nodes
2. Observe graph for 15 seconds
3. Expected: Movement slows and stops by 10 seconds
4. Verify: Final layout is stable (no jittering)

### Test 6: Performance (Large Graphs)
1. Load session with 200+ nodes
2. Monitor FPS in DevTools (Performance tab)
3. Expected: Maintains 30-60 FPS during physics simulation
4. Verify: Node visibility filtering kicks in (only important nodes shown)

---

## Edge Cases to Test

### Edge Case 1: Single Node
- Graph with only 1 node
- Expected: Node centered, reasonable size, no errors

### Edge Case 2: Two Connected Nodes
- Minimal graph (2 nodes, 1 edge)
- Expected: Nodes separated by link distance, not overlapping

### Edge Case 3: Dense Cluster
- 10 nodes all connected to each other
- Expected: Circular distribution, no overlap despite high connectivity

### Edge Case 4: Rapid Node Addition
- Send 5 transcript chunks in quick succession
- Expected: Graph handles batch additions smoothly
- Physics continues running until all nodes settle

### Edge Case 5: Window Resize
- Resize browser window while graph is active
- Expected: Graph maintains proportions, auto-zoom adjusts

---

## Rollback Plan

If issues arise after implementation:

### Rollback Step 1: Revert Node Size
```typescript
return baseSize + value * 1;  // Middle ground between old (3) and new (0.2)
```

### Rollback Step 2: Disable Collision Detection
```typescript
// Comment out d3ForceCollide line
// d3ForceCollide={(node: any) => { ... }}
```

### Rollback Step 3: Revert Physics
```typescript
d3AlphaDecay={0.05}  // Back to faster convergence
d3VelocityDecay={0.4}
warmupTicks={100}
cooldownTime={5000}
```

### Full Rollback
```bash
git checkout frontend/components/SemanticGraph.tsx
```

---

## Expected Outcomes

### Before Fix
- Node sizes: 50-100px (too large)
- Overlap: Frequent
- Spacing: Clustered, tight groups
- Centering: Off-center, poor padding
- Visual quality: Crowded, hard to read

### After Fix
- Node sizes: 4-20px (optimal)
- Overlap: None (collision prevention active)
- Spacing: Even distribution, clear gaps
- Centering: Centered with 100px padding
- Visual quality: Clean, professional, readable

### Metrics
- Average node size reduction: 70-80%
- Minimum inter-node distance: 8px guaranteed
- Graph coverage area: Increased by ~40%
- Physics settle time: ~8-10 seconds (was ~3-5)
- Visual clarity: Significant improvement

---

## Additional Recommendations

### Future Enhancement 1: Adaptive Sizing
Implement dynamic node sizing based on total node count:
```typescript
const getNodeSize = (node: any) => {
  const baseSize = graphData.nodes.length > 100 ? 3 : 4;
  // Smaller base size for crowded graphs
  // ...
};
```

### Future Enhancement 2: Zoom Controls
Add manual zoom controls UI:
- Zoom In button
- Zoom Out button
- Reset Zoom button
- Fit to View button

### Future Enhancement 3: Layout Presets
Add different force layouts:
- Tight clustering (current -2500 charge)
- Spread out (-4000 charge)
- Organic (-2000 charge, longer links)

### Future Enhancement 4: Performance Monitoring
Add FPS counter in development:
```typescript
const [fps, setFps] = useState(60);
// Track canvas render performance
// Display in UI during development
```

---

## Implementation Checklist

- [ ] Backup current SemanticGraph.tsx
- [ ] Implement Step 1: Fix node sizing (lines 54-72)
- [ ] Implement Step 2: Add collision detection (after line 108)
- [ ] Implement Step 3: Optimize physics (lines 98-103)
- [ ] Implement Step 4: Improve auto-zoom (lines 39-44)
- [ ] Test 1: Node size verification
- [ ] Test 2: Collision detection
- [ ] Test 3: Node spacing
- [ ] Test 4: Auto-zoom behavior
- [ ] Test 5: Physics stability
- [ ] Test 6: Performance (large graphs)
- [ ] Edge case testing (all 5 scenarios)
- [ ] Code review
- [ ] Commit changes with descriptive message
- [ ] Document any unexpected behaviors
- [ ] Update CLAUDE.md if needed

---

## Success Criteria

Implementation is successful when:

1. All nodes are clearly visible (4-20px range)
2. Zero node overlaps after physics settles
3. Even spacing throughout graph
4. Automatic centering works on all screen sizes
5. Physics simulation is stable and performant
6. No console errors or warnings
7. All 6 tests pass
8. All 5 edge cases handled correctly

---

**End of Implementation Plan**
