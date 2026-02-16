# Scaffold Editor

A graph editor for building scaffold (location) trees. Drag node types from the sidebar onto the canvas, name them in a popup, and connect nodes so the graph stays a tree. Export and import JSON in the same format used by [helpwave tasks](https://github.com/helpwave/tasks) scaffold.

## Prerequisites

Node.js 18+ or 20+.

## Setup

```bash
cd web
npm ci
```

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – typecheck and production build
- `npm run lint` – run ESLint

## Usage

- **Add nodes:** Drag a node type (HOSPITAL, PRACTICE, CLINIC, WARD, ROOM, BED, TEAM, USER) from the left sidebar onto the canvas. Enter a name in the popup to create the node.
- **Connect nodes:** Drag from the bottom handle of one node to the top handle of another. The graph must remain a tree (each node at most one parent, no cycles).
- **Export:** Download the current graph as a JSON file (name, type, children).
- **Import:** Load a scaffold JSON file to replace the graph.
- **Clear:** Remove all nodes and edges (with confirmation). Also clears persisted state.

Editor state (nodes and edges) is saved to `localStorage` and restored on reload.
