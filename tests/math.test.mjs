import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const markdown = require("../android/assets/markdown-it.js");
const katex = require("../android/assets/katex/katex.min.js");
const mathPlugin = readFileSync(new URL("../android/assets/math.js", import.meta.url), "utf8");
const window = {};
runInNewContext(mathPlugin, { window });
const md = markdown({ html: false, breaks: true });
window.installMath(md, katex);

test("renders inline formulas without consuming nearby prices", () => {
  const html = md.render("费用 $5 和 $10。公式 $x^2$、\\(\\frac{1}{2}\\)。");
  assert.match(html, /费用 \$5 和 \$10/);
  assert.equal(html.match(/class="katex"/g)?.length, 2);
  assert.match(html, /<mfrac>/);
});

test("renders display math, multiline matrices and environments", () => {
  const source = [
    "$$x^2$$ and $$y^2$$",
    "",
    "\\[",
    "\\begin{matrix} a & b \\\\ c & d \\end{matrix}",
    "\\]",
    "",
    "\\begin{align}",
    "x &= y \\\\",
    "z &= 2",
    "\\end{align}"
  ];
  const html = md.render(source.join("\n"));
  assert.equal(html.match(/class="math-scroll"/g)?.length, 4);
  assert.equal(html.match(/<mtable/g)?.length, 2);
});

test("preserves escaped, unfinished and code-delimited math as text", () => {
  const html = md.render(["\\$x$", "未结束 $a", "", "`$b$`", "", "```", "$c$", "```"].join("\n"));
  assert.doesNotMatch(html, /class="katex"/);
  assert.match(html, /<code>\$b\$<\/code>/);
  assert.match(html, /<pre><code>\$c\$/);
});

test("disables trusted commands and escapes invalid source", () => {
  const html = md.render("$\\includegraphics{https://example.com/x}$ $\\frac{<script>}$");
  assert.doesNotMatch(html, /<img|<script>/);
  assert.match(html, /class="math-fallback"/);
});
