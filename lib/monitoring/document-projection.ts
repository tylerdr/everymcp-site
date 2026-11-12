import { canonicalJson, sha256, validateProjection, type DocumentProjection, type Observation, type Source } from "./source-contract";

// Only this pinned decoder is used: the bundled DOM parser's markup repair is never invoked.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Next's pinned bundle is untyped; constrain its required surface explicitly.
const { TextNode } = require("next/dist/compiled/node-html-parser") as {
  TextNode: new (text: string) => { readonly text: string };
};
const PROFILE = "static-document-v1";
const MAX_BODY_BYTES = 1024 * 1024;
const UNSAFE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/;
const SPACE = /[\t\n\r\f ]/;
const WORDS = /[^\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/gu;
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
type BoundSource = Pick<Source, "url" | "relationships">;
type Token = ["start", string, [string, string | null][]] | ["end", string] | ["text", string];
type Part = { heading: string; level: number; tokens: Token[]; text: string[] };
class ProjectionLimit extends Error {}
class MarkupError extends Error {}
const raw = (value: unknown) => canonicalJson(value).subarray(0, -1);
const length = (value: string) => [...value].length;
const whitespaceOnly = (value: string) => [...value.matchAll(WORDS)].length === 0;
function trim(value: string): string {
  const words = [...value.matchAll(WORDS)], first = words[0], last = words[words.length - 1];
  return first && last ? value.slice(first.index ?? 0, (last.index ?? 0) + last[0].length) : "";
}

function unavailable(source: BoundSource, observation: Observation): DocumentProjection {
  const relationships = [...source.relationships].sort((a, b) => Buffer.compare(raw(a), raw(b)));
  return {
    profileVersion: PROFILE, state: "not_captured", reason: "legacy_body_not_retained", sourceUrl: source.url,
    sourceIdentity: sha256(raw({ url: source.url, relationships })), bodyHash: observation.contentHash,
    bodyObservedAt: null, mediaType: null, projectionHash: null, sections: [], omissions: [],
  };
}

function decode(value: string): string {
  // HTML5 decoders preserve a few references Python removes. Reject that subset rather than
  // silently produce different static-document-v1 hashes or maintain another entity table.
  for (const match of value.matchAll(/&#(?:[xX]([0-9a-fA-F]+)|([0-9]+));?/g)) {
    const point = Number.parseInt(match[1] ?? match[2], match[1] ? 16 : 10);
    if (!Number.isSafeInteger(point) || point >= 1 && point <= 8 || point === 11 || point >= 14 && point <= 31 || point === 127 || point >= 0xfdd0 && point <= 0xfdef || point <= 0x10ffff && (point & 0xffff) >= 0xfffe) {
      throw new MarkupError("Unsupported character-reference subset");
    }
  }
  return new TextNode(value).text;
}

function clip(value: string, words: number): { value: string; truncated: boolean; used: number } {
  const matches = [...value.matchAll(WORDS)];
  const match = words && matches.length ? matches[Math.min(words, matches.length) - 1] : undefined;
  const end = match ? (match.index ?? 0) + match[0].length : 0;
  const text = [...value.slice(0, end)].slice(0, 160).join("");
  return { value: text, truncated: text !== value, used: [...text.matchAll(WORDS)].length };
}

/** Strict bounded event tokenizer. Unsupported syntax is unavailable; no tree repair occurs. */
function htmlParts(input: string): { parts: Part[]; omissions: string[] } {
  const stack: string[] = [], parts: Part[] = [], omissions = new Set<string>();
  let count = 0, position = 0;
  function section(heading: string, level: number) {
    if (parts.length >= 16) throw new ProjectionLimit();
    parts.push({ heading, level, tokens: [], text: [] });
  }
  function token(value: Token) {
    if (++count > 20000) throw new ProjectionLimit();
    parts[parts.length - 1].tokens.push(value);
  }
  function start(tag: string, attrs: [string, string | null][]) {
    if (attrs.length > 64 || attrs.some(([key, value]) => length(key) > 256 || length(value ?? "") > 8192)) throw new ProjectionLimit();
    if (new Set(attrs.map(([key]) => key)).size !== attrs.length || attrs.some(([key, value]) => UNSAFE.test(key) || UNSAFE.test(value ?? ""))) throw new MarkupError();
    if (stack.length >= 128) throw new ProjectionLimit();
    if (/^h[1-6]$/.test(tag)) section("", Number(tag[1]));
    token(["start", tag, attrs.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)]);
    if (!VOID.has(tag)) stack.push(tag);
    if (tag === "script" || tag === "style") omissions.add(tag);
  }
  function end(tag: string) {
    if (stack.pop() !== tag) throw new MarkupError();
    token(["end", tag]);
  }
  function data(value: string) {
    if (!value) return;
    const text = decode(value);
    if (UNSAFE.test(text)) throw new MarkupError();
    token(["text", text]);
    if (stack.some(tag => /^h[1-6]$/.test(tag))) parts[parts.length - 1].heading += text;
    else parts[parts.length - 1].text.push(text);
  }
  section("preamble", 0);
  while (position < input.length) {
    const top = stack[stack.length - 1];
    if (top === "script" || top === "style") {
      const close = new RegExp(`</${top}[\\t\\n\\r\\f ]*>`, "ig");
      close.lastIndex = position;
      const match = close.exec(input);
      if (!match) throw new MarkupError();
      end(top); position = match.index + match[0].length; continue;
    }
    if (input[position] !== "<") {
      const next = input.indexOf("<", position);
      const stop = next < 0 ? input.length : next;
      if (next < 0) {
        const ampersand = input.lastIndexOf("&");
        if (ampersand >= Math.max(position, input.length - 34) && !/[\t\n\r\f ;]/.test(input.slice(ampersand))) throw new MarkupError();
      }
      data(input.slice(position, stop)); position = stop; continue;
    }
    if (input.startsWith("<!--", position)) {
      const stop = input.indexOf("-->", position + 4);
      if (stop < 0 || input.slice(position + 4, stop).includes("--")) throw new MarkupError();
      omissions.add("comment"); position = stop + 3; continue;
    }
    if (/^<!doctype(?:[\t\n\r\f ]|>)/i.test(input.slice(position, position + 11))) {
      const stop = input.indexOf(">", position + 2);
      if (stop < 0 || !/^<!doctype[\t\n\r\f ]+[A-Za-z][A-Za-z0-9:_.-]*[\t\n\r\f ]*>$/i.test(input.slice(position, stop + 1))) throw new MarkupError();
      omissions.add("declaration"); position = stop + 1; continue;
    }
    if (input.startsWith("</", position)) {
      const match = /^<\/([A-Za-z][A-Za-z0-9:_.-]*)[\t\n\r\f ]*>/.exec(input.slice(position));
      if (!match) throw new MarkupError();
      end(match[1].toLowerCase()); position += match[0].length; continue;
    }
    const tagMatch = /^<([A-Za-z][A-Za-z0-9:_.-]*)/.exec(input.slice(position));
    if (!tagMatch) throw new MarkupError();
    const tag = tagMatch[1].toLowerCase(), attrs: [string, string | null][] = [];
    position += tagMatch[0].length;
    let selfClosing = false;
    while (true) {
      const beforeSpace = position;
      while (position < input.length && SPACE.test(input[position])) position++;
      if (input.startsWith("/>", position)) { position += 2; selfClosing = true; break; }
      if (input[position] === ">") { position++; break; }
      if (position === beforeSpace || position >= input.length) throw new MarkupError();
      const attribute = /^[A-Za-z_:][A-Za-z0-9_.:-]*/.exec(input.slice(position));
      if (!attribute) throw new MarkupError();
      const name = attribute[0].toLowerCase(); position += attribute[0].length;
      const afterName = position;
      while (position < input.length && SPACE.test(input[position])) position++;
      let value: string | null = null;
      if (input[position] === "=") {
        position++;
        while (position < input.length && SPACE.test(input[position])) position++;
        const quote = input[position];
        if (quote === "\"" || quote === "'") {
          const stop = input.indexOf(quote, position + 1);
          if (stop < 0) throw new MarkupError();
          value = decode(input.slice(position + 1, stop)); position = stop + 1;
        } else {
          const unquoted = /^[^\t\n\r\f >"'<=`]+/.exec(input.slice(position));
          if (!unquoted) throw new MarkupError();
          value = decode(unquoted[0]); position += unquoted[0].length;
        }
      } else position = afterName;
      attrs.push([name, value]);
      if (attrs.length > 64 || length(name) > 256 || length(value ?? "") > 8192) throw new ProjectionLimit();
    }
    start(tag, attrs);
    if (selfClosing && !VOID.has(tag)) end(tag);
  }
  if (stack.length) throw new MarkupError();
  return { parts, omissions: [...omissions].sort() };
}

/** Project only already-observed bytes; never fetches, executes, repairs or infers semantic impact. */
export function projectDocument(body: Buffer, headers: Record<string, string>, source: BoundSource, observation: Observation, previous?: Observation | null): DocumentProjection {
  const result = unavailable(source, observation);
  if (observation.httpStatus === 304 && (observation.state !== "reachable" || !observation.bodyComplete)) return { ...result, state: "incomplete", reason: "body_unavailable" };
  if (observation.httpStatus === 304) {
    const projection = previous?.documentProjection;
    if (projection && previous) {
      validateProjection(projection, previous, source);
      if (previous.contentHash !== observation.contentHash) throw new Error("304 body lineage mismatch");
      const copy = { ...projection, sections: projection.sections.map(section => ({ ...section })), omissions: [...projection.omissions] };
      validateProjection(copy, observation, source);
      return copy;
    }
    return result;
  }
  if (observation.state !== "reachable" || !observation.bodyComplete) return { ...result, state: "incomplete", reason: "body_unavailable" };
  result.bodyObservedAt = observation.checkedAt;
  const contentType = headers["content-type"] ?? "";
  const media = trim(contentType.split(";", 1)[0]).toLowerCase();
  result.mediaType = ["text/html", "text/plain", "text/markdown"].includes(media) ? media : null;
  if (!result.mediaType) return { ...result, state: "unsupported", reason: "unsupported_media_type" };
  if (trim(headers["content-encoding"] ?? "identity").toLowerCase() !== "identity") return { ...result, state: "unsupported", reason: "unsupported_encoding" };
  if (contentType.split(";").slice(1).some(parameter => !["charset=utf-8", 'charset="utf-8"'].includes(trim(parameter).toLowerCase()))) return { ...result, state: "unsupported", reason: "unsupported_charset" };
  if (body.length > MAX_BODY_BYTES) return { ...result, state: "incomplete", reason: "projection_limit" };
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(body); }
  catch { return { ...result, state: "unsupported", reason: "invalid_utf8" }; }
  if (UNSAFE.test(text)) return { ...result, state: "unsupported", reason: "unsafe_text" };
  let parts: Part[], omissions: string[];
  try {
    ({ parts, omissions } = media === "text/html" ? htmlParts(text) : { parts: [{ heading: "document", level: 0, tokens: [["text", text]] as Token[], text: [text] }], omissions: [] });
  } catch (error) {
    if (error instanceof ProjectionLimit) return { ...result, state: "incomplete", reason: "projection_limit" };
    if (error instanceof MarkupError) return { ...result, state: "unsupported", reason: "malformed_markup" };
    throw error;
  }
  if (!parts.some(part => !whitespaceOnly(part.text.join("")) || part.level > 0 && !whitespaceOnly(part.heading))) return { ...result, state: "unsupported", reason: "empty_document" };
  const counts = new Map<string, number>(); let budget = 24;
  result.sections = parts.map(part => {
    const key = sha256(raw([part.level, part.heading]));
    const occurrence = (counts.get(key) ?? 0) + 1; counts.set(key, occurrence);
    const heading = clip(part.heading, Math.min(6, budget)); budget -= heading.used;
    const excerpt = clip(part.text.join(""), Math.min(12, budget)); budget -= excerpt.used;
    return { id: `${key}:${occurrence}`, heading: heading.value, headingTruncated: heading.truncated, excerpt: excerpt.value, excerptTruncated: excerpt.truncated, contentHash: sha256(raw(part.tokens)) };
  });
  result.state = "captured"; result.reason = "complete_static_projection"; result.omissions = omissions;
  result.projectionHash = sha256(raw({ sections: result.sections.map(({ id, contentHash }) => ({ id, contentHash })), omissions }));
  validateProjection(result, observation, source);
  return result;
}
