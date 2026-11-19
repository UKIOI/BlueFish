"use strict";

window.installMath = (md, katex) => {
  if (!katex) return;
  const inlineDelimiters = { "\\(": "\\)", "\\[": "\\]", "$$": "$$", "$": "$" };
  const blockDelimiters = { "\\[": "\\]", "$$": "$$" };
  const keys = Object.keys(inlineDelimiters);

  function findClosing(source, closing, start, stop) {
    let position = source.indexOf(closing, start);
    while (position >= 0 && position + closing.length <= stop) {
      let before = position;
      while (before > start && source[before - 1] === "\\") before--;
      const escaped = (position - before) % 2;
      if (!escaped) {
        if (closing === "$" && (/\s|\$/.test(source[position - 1] || "") || /[\d$]/.test(source[position + 1] || ""))) return -1;
        return position;
      }
      position = source.indexOf(closing, position + 1);
    }
    return -1;
  }

  function inline(state, silent) {
    const start = state.pos;
    const opening = keys.find(mark => state.src.startsWith(mark, start));
    if (!opening) return false;
    const from = start + opening.length;
    if (opening === "$" && (state.src[start - 1] === "$" || /\s/.test(state.src[from] || ""))) return false;
    const stop = findClosing(state.src, inlineDelimiters[opening], from, state.posMax);
    if (stop < 0 || !state.src.slice(from, stop).trim()) return false;
    const end = stop + opening.length;
    if (!silent) {
      const token = state.push("math_inline", "", 0);
      token.content = state.src.slice(from, stop);
      token.meta = { source: state.src.slice(start, end), display: opening in blockDelimiters };
    }
    state.pos = end;
    return true;
  }

  function block(state, start, end, silent) {
    if (state.sCount[start] - state.blkIndent >= 4) return false;
    const line = index => state.src.slice(state.bMarks[index] + state.tShift[index], state.eMarks[index]);
    const first = line(start);
    const environment = /^\\begin\{(equation|align|alignat|gather|multline)\*?\}/.exec(first);
    const opening = Object.keys(blockDelimiters).find(mark => first.startsWith(mark));
    if (!opening && !environment) return false;
    const prefix = environment ? environment[0] : opening;
    const closing = environment ? prefix.replace("\\begin", "\\end") : blockDelimiters[opening];
    const lines = [];
    for (let last = start; last < end; last++) {
      if (!state.isEmpty(last) && state.sCount[last] < state.blkIndent) break;
      const current = line(last);
      const stop = findClosing(current, closing, last === start ? prefix.length : 0, current.length);
      lines.push(current);
      if (stop < 0) continue;
      if (current.slice(stop + closing.length).trim()) return false;
      const raw = lines.join("\n").trimEnd();
      const formula = environment ? raw : raw.slice(prefix.length, -closing.length).trim();
      if (!formula) return false;
      if (silent) return true;
      const token = state.push("math_block", "", 0);
      token.map = [start, last + 1];
      token.content = formula;
      token.meta = { source: raw, display: true };
      state.line = last + 1;
      return true;
    }
    return false;
  }

  function render(tokens, index) {
    const token = tokens[index];
    const { source, display } = token.meta;
    try {
      const math = katex.renderToString(token.content, {
        displayMode: display,
        trust: false,
        strict: "ignore",
        maxSize: 20,
        maxExpand: 1000
      });
      return display ? '<span class="math-scroll" tabindex="0">' + math + '</span>\n' : math;
    } catch {
      return '<span class="math-fallback">' + md.utils.escapeHtml(source) + '</span>';
    }
  }

  md.inline.ruler.before("escape", "math_inline", inline);
  md.block.ruler.before("fence", "math_block", block, { alt: ["paragraph", "reference", "blockquote", "list"] });
  md.renderer.rules.math_inline = render;
  md.renderer.rules.math_block = render;
};
