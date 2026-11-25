# Automata Visualizer

A small draw.io-like editor for automata state diagrams, with a Run mode that steps a DFA/NFA, PDA, or Turing machine on an input. It is for constructing and simulating those automata, not a general diagram tool.

The editor snaps states to a grid and exports the shortest TikZ that still matches that grid. Placement is relative, using the positioning library (`right=of`, `left=of`, `above=of`, `below=of`). The grid step is `node distance`, measured center to center because `on grid` is on.

Inspiration: https://raw.org/tool/graph-editor/

## Goal

Complex automata, simple TikZ. Nodes sit on integer cells. Each node except the anchor is placed relative to another node. Edges, loops, bends, and label offsets are explicit. Nothing is emitted with absolute coordinates.

The picture below is the motivating example. It uses the legacy spelling `right of=`. That spelling is not generated. Export uses `right=of`, and `node distance` is center-to-center rather than the border gap in this picture. A default of `3cm` is therefore tighter than this example.

```latex
\begin{tikzpicture}[
    ->,
    >=stealth',
    shorten >=1pt,
    auto,
    node distance=3cm,
    scale=1,
    transform shape
]
    \node[state,accepting] (qa) {$q_a$};
    \node[state] (q1) [below of=qa] {$q_1$};
    \node[state,initial] (q0) [right of=q1] {$q_0$};
    \node[state] (q9) [right of=q0] {$q_9$};
    \node[state] (q7) [below of=q1] {$q_7$};
    \node[state] (q2) [right of=q7] {$q_2$};
    \node[state] (q3) [right of=q2] {$q_3$};
    \node[state] (q6) [below of=q7] {$q_6$};
    \node[state] (q5) [right of=q6] {$q_5$};
    \node[state] (q4) [right of=q5] {$q_4$};

    \path
    (q0) edge node {$1\to y,R$} (q9)
    (q9) edge node {$1\to 1,L$} (q3)
    (q3) edge node {$y\to x,R$} (q4)
    (q4) edge [loop right] node {$\begin{array}{c}
        z\to z,R\\
        y\to y,R
    \end{array}$} ()
    (q4) edge node {$1\to z,L$} (q5)
    (q5) edge [loop below] node {$z\to z,L$} ()
    (q5) edge node [right] {$y\to y,L$} (q2)
    (q5) edge node {$x\to x,R$} (q6)
    (q6) edge [loop left] node {$z\to y,R$}
    (q6) edge node {$1\to y,R$} (q7)
    (q7) edge node {$1\to y,R$} (q1)
    (q1) edge node [below=0.8cm] {$1\to 1,L$} (q2)
    (q2) edge node [below] {$x\to x,R$} (q3)
    (q2) edge [loop above] node {$y\to y,L$} ()
    (q1) edge node {$\sqcup \to \sqcup,R$} (qa)
    (q0) edge node [right=0.5em]{$\sqcup \to \sqcup,R$} (qa)
    (q9) edge [bend right] node [above=.5em]{$\sqcup \to \sqcup,R$} (qa);
\end{tikzpicture}
```

The same layout, as export should emit it:

```latex
\begin{tikzpicture}[
    ->,
    >=stealth',
    shorten >=1pt,
    auto,
    on grid,
    node distance=3cm,
    scale=1,
    transform shape
]
    \node[state,accepting] (qa) {$q_a$};
    \node[state] (q1) [below=of qa] {$q_1$};
    \node[state,initial] (q0) [right=of q1] {$q_0$};
    \node[state] (q9) [right=of q0] {$q_9$};
    \node[state] (q7) [below=of q1] {$q_7$};
    \node[state] (q2) [right=of q7] {$q_2$};
    \node[state] (q3) [right=of q2] {$q_3$};
    \node[state] (q6) [below=of q7] {$q_6$};
    \node[state] (q5) [right=of q6] {$q_5$};
    \node[state] (q4) [right=of q5] {$q_4$};

    \path
    (q0) edge node {$1\to y,R$} (q9)
    (q9) edge node {$1\to 1,L$} (q3)
    (q3) edge node {$y\to x,R$} (q4)
    (q4) edge [loop right] node {$\begin{array}{c}
        z\to z,R\\
        y\to y,R
    \end{array}$} ()
    (q4) edge node {$1\to z,L$} (q5)
    (q5) edge [loop below] node {$z\to z,L$} ()
    (q5) edge node [right] {$y\to y,L$} (q2)
    (q5) edge node {$x\to x,R$} (q6)
    (q6) edge [loop left] node {$z\to y,R$}
    (q6) edge node {$1\to y,R$} (q7)
    (q7) edge node {$1\to y,R$} (q1)
    (q1) edge node [below=0.8cm] {$1\to 1,L$} (q2)
    (q2) edge node [below] {$x\to x,R$} (q3)
    (q2) edge [loop above] node {$y\to y,L$} ()
    (q1) edge node {$\sqcup \to \sqcup,R$} (qa)
    (q0) edge node [right=0.5em]{$\sqcup \to \sqcup,R$} (qa)
    (q9) edge [bend right] node [above=.5em]{$\sqcup \to \sqcup,R$} (qa);
\end{tikzpicture}
```

Required libraries: `automata`, `arrows` (for `stealth'`), and `positioning`.

## Editor

- Add, move, and delete state nodes.
- Connect nodes with directed edges.
- Label nodes and edges. Label text is LaTeX, not plain text that gets escaped.
- Mark states initial, accepting, or both.
- Edit defaults, especially `node distance`.
- Snap node centers to the grid while dragging and when creating a node.
- Export a `tikzpicture` that reproduces the snapped layout.

One node per cell. Dropping or dragging a node onto an occupied cell is rejected. Deleting a node leaves the other cells where they are. Changing `node distance` changes the visual step and the preamble length. It does not renumber columns or rows.

## Automata kinds

DFA, NFA, PDA, and Turing-machine pictures use the same canvas. `initial` and `accepting` are real node options. The motivating picture is a Turing-machine diagram and is in scope.

## Model

Positions are integer grid cells. `row` increases downward, so the next row is `below=of`.

```json
{
  "defaults": {
    "nodeDistance": "3cm",
    "onGrid": true,
    "scale": 1
  },
  "nodes": [
    {
      "id": "qa",
      "label": "q_a",
      "col": 0,
      "row": 0,
      "accepting": true
    },
    {
      "id": "q1",
      "label": "q_1",
      "col": 0,
      "row": 1
    },
    {
      "id": "q0",
      "label": "q_0",
      "col": 1,
      "row": 1,
      "initial": true
    }
  ],
  "edges": [
    {
      "source": "q0",
      "target": "q9",
      "label": "1\\to y,R"
    },
    {
      "source": "q5",
      "target": "q5",
      "label": "z\\to z,L",
      "loop": "below"
    },
    {
      "source": "q1",
      "target": "q2",
      "label": "1\\to 1,L",
      "labelPos": { "side": "below", "distance": "0.8cm" }
    },
    {
      "source": "q9",
      "target": "qa",
      "label": "\\sqcup \\to \\sqcup,R",
      "bend": "right",
      "labelPos": { "side": "above", "distance": ".5em" }
    }
  ]
}
```

- **Node.** TikZ id, display label, `col`, `row`, optional `initial`, optional `accepting`. The id and the label are different: `qa` is the name, `$q_a$` is what is drawn.
- **Edge.** `source`, `target`, optional `label`, optional `labelPos` (`above`, `below`, `left`, `right`, plus an optional TeX distance such as `0.8cm` or `0.5em`), optional `loop` side, optional `bend` of `left` or `right`.
- **Defaults.** `node distance=3cm`, `on grid`, `->`, `>=stealth'`, `shorten >=1pt`, `auto`, `scale=1`, `transform shape`.
- **Ids.** Unique and matching `[A-Za-z][A-Za-z0-9]*`.
- **Labels.** Always math. Export wraps a label in `$...$` unless it already starts with `$`. Do not escape user LaTeX. The canvas renders that same math. Unknown macros are the user's responsibility in the TikZ output.
- **`node distance`.** One positive TeX length, same on both axes. Reject a two-part value such as `3cm and 4cm`. Store the number and the unit, or a string that can be parsed into those. Multiply the number and keep the unit: `3cm` times 2 is `6cm`.

This model is the source of truth for export. It is not tied to a UI toolkit.

## Grid

`on grid` is set on the picture, so `node distance` is the distance between node centers and the editor's snap step. It is not a pixel grid, and it is not a border gap.

Let `N` be that length. A node `k` cells away on one axis is `k * N` from the anchor's center. Do not add the state diameter. With `N = 3cm`, two cells to the right is `6cm`, not `7cm`.

A diagonal of `dx` columns and `dy` rows is `|dy| * N` vertically and `|dx| * N` horizontally.

Wide labels do not move centers. Do not switch those nodes to absolute coordinates.

## Placement export

Never emit a node with absolute coordinates. Never emit the legacy form `right of=`.

The anchor is the occupied cell with the smallest `row`, then the smallest `col`. Emit it with no placement option. In the motivating picture that is `qa`.

Emit the remaining nodes in row-major order (`row`, then `col`). For each node, choose an already emitted anchor in this order:

1. Left neighbor: same row, smaller `col`, nearest occupied cell.
2. Else above neighbor: same column, smaller `row`, nearest occupied cell.
3. Else right neighbor: same row, larger `col`.
4. Else below neighbor: same column, larger `row`.
5. Else the already emitted node with the smallest `|dx| + |dy|`.

Write the placement after the node name: `\node[state] (q1) [below=of qa] {$q_1$};`.

- One cardinal step: `right=of`, `left=of`, `above=of`, or `below=of`, with no extra dimension.
- `k` cardinal steps, `k ≠ 1`: `right=<k*N> of <id>` (same for `left`, `above`, and `below`). Two cells right at `3cm` is `right=6cm of q0`.
- Both axes nonzero: `below right=of`, `below left=of`, `above right=of`, or `above left=of`. These are positioning-library options. Each axis is an independent center distance.
- Add `<vertical> and <horizontal>` only when a part is not `N`. The first length is vertical. Two cells right and one cell below at `3cm` is `below right=3cm and 6cm of <id>`. One step on both axes is just `below right=of <id>`.

A gap is preserved. If the cell immediately left of a node is empty, the left anchor may be two or more columns away, and the export uses `right=<k*N> of` that node rather than inventing a state in the hole.

## Edges

After every node, emit one `\path`, in edge-creation order.

- Straight: `(q0) edge node {$1\to y,R$} (q9)`.
- Label position is an option on the label node, not on the state: `node [right]`, `node [below]`, `node [below=0.8cm]`, `node [above=.5em]`. Omit it when unset so `auto` applies. `node [below=0.8cm]` is not state placement. State placement is `below=of`.
- Self-loop: the target is `()`, and a side is required: `(q4) edge [loop right] node {...} ()`. If the user does not choose a side, use `right`.
- Bend: `(q9) edge [bend right] node [above=.5em] {...} (qa)`. Use `bend left` or `bend right`. Omit the angle unless the user set one. Do not emit control points, and do not auto-bend a second edge between the same pair.

## Document shape

```latex
\usetikzlibrary{automata,arrows,positioning}
\begin{tikzpicture}[
    ->,
    >=stealth',
    shorten >=1pt,
    auto,
    on grid,
    node distance=3cm,
    scale=1,
    transform shape
]
    \node[state,accepting] (qa) {$q_a$};
    \node[state] (q1) [below=of qa] {$q_1$};
\end{tikzpicture}
```

`scale` is a preamble default. It does not change grid indices.

## Out of scope

- Absolute node coordinates.
- Legacy `right of=` / `below of=` in generated output.
- Border-gap spacing, and any export rule that adds the node diameter to `node distance`.
- A second grid for mixed node sizes.
- Automatic edge routing.
- Simulators, or structured PDA and Turing-machine fields.
- A UI framework choice.
- A fixed pixel snap size.

## Export checks

- The motivating layout exports with `below=of` / `right=of` only, no extra dimension, anchor `qa`, and `on grid` set.
- A node two cells to the right of its anchor exports as `right=6cm of` when `node distance=3cm`.
- A node two cells right and one cell below exports as `below right=3cm and 6cm of`.
- A self-loop is `[loop right]` (or the chosen side) with target `()`.
- `initial` and `accepting` appear only as node options.
- The output compiles with `automata`, `arrows`, and `positioning`.

