import { LatexLabel } from "../canvas/LatexLabel";

export default function Reference({ kind }: { kind: "dfa" | "pda" | "tm" }) {
  if (kind === "pda") {
    return (
      <div className="help-list">
        <p>
          A pushdown automaton (PDA) is a 6-tuple <LatexLabel label="(Q,\Sigma,\Gamma,\delta,q_0,F)" />:
        </p>
        <ol>
          <li>
            <LatexLabel label="Q" /> is a finite set of <i>states</i>.
          </li>
          <li>
            <LatexLabel label="\Sigma" /> is the <i>input</i> alphabet.
          </li>
          <li>
            <LatexLabel label="\Gamma" /> is the <i>stack</i> alphabet.
          </li>
          <li>
            <LatexLabel label="\delta:Q\times(\Sigma\cup\{\varepsilon\})\times(\Gamma\cup\{\varepsilon\})\to \mathcal{P}(Q\times(\Gamma\cup\{\varepsilon\}))" />{" "}
            is the <i>transition</i> function.
            <br />
            <span className="muted">
              <LatexLabel label="a,b\to c" />{" "}
              reads <LatexLabel label="a" /> from input,
              pops <LatexLabel label="b" /> and pushes <LatexLabel label="c" /> to the stack.
            </span>
          </li>
          <li>
            <LatexLabel label="q_0\in Q" /> is the <i>start</i> state.
          </li>
          <li>
            <LatexLabel label="F\subseteq Q" /> is the set of <i>accepting</i> states.
          </li>
        </ol>
      </div>
    );
  }
  if (kind === "tm") {
    return (
      <div className="help-list">
        <p>
          A Turing machine (TM) is a 7-tuple <LatexLabel label="(Q,\Sigma,\Gamma,\delta,q_0,q_a,q_r)" />:
        </p>
        <ol>
          <li>
            <LatexLabel label="Q" /> is a finite set of <i>states</i>.
          </li>
          <li>
            <LatexLabel label="\Sigma" /> is the <i>input</i> alphabet.
          </li>
          <li>
            <LatexLabel label="\Gamma" /> is the <i>tape</i> alphabet.
            <ul className="muted dash">
              <li><LatexLabel label="\sqcup\in\Gamma" /> (a blank space on the tape)</li>
              <li><LatexLabel label="\sqcup\notin\Sigma" /></li>
              <li><LatexLabel label="\Sigma \subsetneq \Gamma" /></li>
            </ul>
          </li>
          <li>
            <LatexLabel label="\delta:Q\times\Gamma\to Q\times\Gamma\times\{L,R\}" />{" "}
            is the <i>transition</i> function.
            <ul className="dash muted">
              <li>
                <LatexLabel label="a\to b,c" />{" "}
                reads <LatexLabel label="a" /> and writes <LatexLabel label="b" /> to tape,
                moves tape head in direction <LatexLabel label="c\in\{L,R\}" />.
              </li>
            </ul>
          </li>
          <li>
            <LatexLabel label="q_0\in Q" /> is the <i>start</i> state.
          </li>
          <li>
            <LatexLabel label="q_a\in Q" /> is the <i>accept</i> state.
          </li>
          <li>
            <LatexLabel label="q_r\in Q" /> is the <i>reject</i> state.
          </li>
        </ol>
        A nondeterministic TM (NTM) is defined similarly, but it can have more than one transition from reading the same symbol at a state. I.e.,
        {" "}
        <LatexLabel label="\delta:Q\times\Gamma\to \mathcal{P}(Q\times\Gamma\times\{L,R\})" />.
      </div>
    );
  }
  return (
    <div className="help-list">
      <p>
        A deterministic finite automaton (DFA) is a 5-tuple <LatexLabel label="(Q,\Sigma,\delta,q_0,F)" />:
      </p>
      <ol>
        <li>
          <LatexLabel label="Q" /> is a finite set of <i>states</i>.
        </li>
        <li>
          <LatexLabel label="\Sigma" /> is the <i>input</i> alphabet.
        </li>
        <li>
          <LatexLabel label="\delta:Q\times\Sigma\to Q" /> is the <i>transition</i> function.
          <ul className="dash muted">
            <li>
              Every state and input symbol has one next state.
            </li>
          </ul>
        </li>
        <li>
          <LatexLabel label="q_0\in Q" /> is the <i>start</i> state.
        </li>
        <li>
          <LatexLabel label="F\subseteq Q" /> is the set of <i>accepting</i> states.
        </li>
      </ol>
      <p>
        A nondeterministic finite automaton (NFA) is defined similarly, but it can have:
        <ul>
          <li><i>more than one transition</i> from the same state that reads the same symbol.</li>
          <li><i><LatexLabel label="\varepsilon" />-transitions</i>, which are taken without reading from the input.</li>
        </ul>
        For a NFA, <LatexLabel label="\delta:Q\times(\Sigma\cup\varepsilon)\to\mathcal{P}(Q)" />.
      </p>
    </div>
  );
}