# Final Draft (FDX) Fidelity Validation

Rewrite Studio's FDX export is **structurally tested in code** (every paragraph
type maps correctly, round-trips, and the format sidecar stays out of the
pages). What automated tests cannot check is whether the real **Final Draft**
application opens the file cleanly and shows each element as the right type.
This folder is where that human check lives.

## The test files

Regenerate any time (dev server on :5213 must be running):

```
cd /Users/quantumcode/CODE/REWRITING-GAUNTLET && node scripts/export-validation-fdx.mjs
```

- `rewrite-studio-sample-feature.fdx` — the shipped "LAS GARZAS" sample, exported
  as a **feature** (no metadata sidecar at all). Use this for the full checklist.
- `rewrite-studio-pilot-onehour.fdx` — a short **one-hour pilot**. Its only
  extra content is one line, an XML comment, right before `</FinalDraft>`:
  `<!-- rewrite-studio docFormat="one_hour" -->`. Use this to confirm that
  comment never appears anywhere on a Final Draft page.

## How to open them in your real Final Draft

1. Copy the two `.fdx` files out of this folder to somewhere easy, e.g. your Desktop.
   Terminal, one block:
   ```
   cp "/Users/quantumcode/CODE/REWRITING-GAUNTLET/docs/validation/rewrite-studio-sample-feature.fdx" "/Users/quantumcode/CODE/REWRITING-GAUNTLET/docs/validation/rewrite-studio-pilot-onehour.fdx" ~/Desktop/
   ```
2. Open Final Draft.
3. File → Open… and choose `rewrite-studio-sample-feature.fdx` from your Desktop.
4. If Final Draft asks to assign a template, choose "Screenplay" (or No Template).
   Skip pagination re-flow prompts.
5. Repeat for `rewrite-studio-pilot-onehour.fdx`.

## Verification checklist (fill in `results.md`)

For `rewrite-studio-sample-feature.fdx`:

- [ ] Opens without any error or repair dialog
- [ ] Scene headings show as **Scene Heading** (blue/scene element)
- [ ] Action shows as **Action**
- [ ] Character cues show as **Character** (centered, caps)
- [ ] Dialogue shows as **Dialogue**
- [ ] Parentheticals show as **Parenthetical**
- [ ] Transitions show as **Transition** (right-aligned)
- [ ] Page count is reasonable for the length (roughly 9–11 pages)
- [ ] No stray metadata or code text appears on any page

For `rewrite-studio-pilot-onehour.fdx`:

- [ ] Opens without error
- [ ] The `rewrite-studio docFormat` comment appears **nowhere** on any page
- [ ] All six element types render correctly

## Record the result

Copy `results-template.md` to `results.md` and fill it in. Commit `results.md`
so the outcome is on the record. If anything fails, note the exact element and
what Final Draft showed instead — that becomes the next fix.

> Until `results.md` exists and passes, the app UI keeps its honest caveat on
> FDX export: "Structurally valid FDX. Not yet validated inside the Final Draft
> application." Once you confirm a clean open, tell me and I will update that
> caveat to say it has been validated (and in which Final Draft version).
