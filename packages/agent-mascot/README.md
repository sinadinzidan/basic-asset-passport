# @adnoc/agent-mascot

An animated robot mascot for Flows apps: the ADNOC robot, drawn as five picture layers that the stylesheet floats, blinks, waves and swaps by mood. It is decoration only (every picture is hidden from assistive technology), so the control around it carries the accessible name. It knows nothing about the app that shows it.

The package is shared as source and is never published. An app uses it through a local link.

## Use it in an app

1. **Link the package.** In this repository it is an npm workspace (`workspaces: ["packages/*"]`) and an app depends on it with `"@adnoc/agent-mascot": "*"`. From another repository, copy `packages/agent-mascot` next to the app and depend on it with `"@adnoc/agent-mascot": "file:../agent-mascot"`.
2. **Provide the peer dependency:** `react`. The mascot needs no Tailwind, no Aura and no query client; its stylesheet and pictures are imported by the component itself, so the bundler must handle `.css` and `.png` imports (Vite does).
3. **When linked with `file:`, share one copy of React.** In `vite.config.ts` set `resolve.dedupe: ['react', 'react-dom']`.
4. **Render it in a box with a size.** The mascot fills its parent, so the host sets the size:

   ```tsx
   import { AgentMascot } from '@adnoc/agent-mascot';

   <button aria-label="Assistant" className="agent-mascot-wave-on-hover" style={{ width: '8rem', height: '8rem' }}>
     <AgentMascot mood={isBusy ? 'THINKING' : 'IDLE'} isWaving={isGreeting} />
   </button>
   ```

## Props

| Prop | What it does |
| --- | --- |
| `mood` | `'IDLE'` shows the smiling eyes, which blink. `'THINKING'` shows the round eyes, which look from side to side. |
| `isWaving` | Raises the arm and tilts the hand at the wrist while `true`. Default `false`. |
| `className` | Added to the root, to place it. |

A host can also make the mascot wave while it is hovered or focused by keyboard, without any state: give the element around it the class `agent-mascot-wave-on-hover`.

## Motion

The mascot bobs, blinks and waves only when the visitor has not asked for reduced motion; with `prefers-reduced-motion: reduce` it stays still and the arm and eyes swap without moving.

## Layout

| Path | What is in it |
| --- | --- |
| `src/AgentMascot.tsx`, `src/mascot.css` | The component and its stylesheet |
| `src/assets/` | The five layers: `mascot.png` (at rest), `mascot-wave.png` (arm raised), `mascot-hand.png` (the raised hand alone), `mascot-eyes.png` and `mascot-eyes-think.png` |
