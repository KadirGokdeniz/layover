
## Global Gate — Multilingual Translation Console

A professional split-screen translator for Istanbul Airport ground staff. Turkish on the left (staff), selectable passenger language on the right. Each message is sent through a backend `/translate` endpoint and rendered in both languages simultaneously.

### Files to create

- `src/lib/api.ts` — `API_BASE` constant + `translate()` function with mock fallback.
- `src/lib/types.ts` — shared types (`Lang`, `Context`, `ForceReportItem`, `TranslateResponse`, `Message`).
- `src/components/global-gate/TopBar.tsx` — brand + aviation icon + passenger language selector.
- `src/components/global-gate/ContextTabs.tsx` — Boarding / Check-in / Transfer / Security / Passport.
- `src/components/global-gate/ChatColumn.tsx` — header, scrollable message list, input + Send.
- `src/components/global-gate/MessageBubble.tsx` — bubble with "🔒 Doğrulandı" badge (expandable force_report panel) and "düzeltildi" note.
- `src/components/global-gate/MockIndicator.tsx` — small corner badge when mock mode active.
- `src/routes/index.tsx` — replaces the placeholder; composes the console.
- `src/styles.css` — add Turkish Airlines-inspired tokens (deep red `#C8102E`, white bg, charcoal/navy text).

### Conversation model

State lives in `index.tsx`:
- `passengerLang: "en" | "it" | "ar" | "ru"` (default `en`)
- `context: "boarding" | "check-in" | "transfer" | "security" | "passport"` (default `boarding`)
- `messages: Message[]` where each `Message` stores: `id`, `sender: "staff" | "passenger"`, `tr: string`, `foreign: string`, `langForeign: Lang`, `forceReport`, `corrected: boolean` (true when `raw_llm_output !== translation`).
- `pending: boolean` for spinner / input disable.

On send:
- Staff send → call `translate({ source_text, source_lang:"tr", target_lang:passengerLang, context })`. Store `tr=input`, `foreign=response.translation`.
- Passenger send → call `translate({ source_text, source_lang:passengerLang, target_lang:"tr", context })`. Store `foreign=input`, `tr=response.translation`.

Rendering:
- Left column always renders `message.tr`; right always renders `message.foreign`.
- Sender's column uses filled red-accent bubble; receiver's column uses neutral surface bubble — same vertical row alignment so they read as one thread.
- The translated-side bubble (receiver) shows the "🔒 Doğrulandı" badge when `forceReport.length > 0`; click toggles a panel listing each `{label → expected, method}` with `detail` as muted subtext.
- The translated-side bubble shows a subtle "düzeltildi" note when `corrected` is true.
- When `passengerLang === "ar"`, the right column root gets `dir="rtl"`.

### Mock mode

`translate()` does `try { fetch(...) } catch { mock = true; return { translation: "[mock] " + source_text, raw_llm_output: same, force_report: [] } }`. Also treat non-OK responses as failures. A module-level `isMockActive` flag flips on first failure and is exposed via a tiny subscribe helper; `MockIndicator` reads it and renders a fixed bottom-right "mock" pill.

### Aesthetic

Design tokens added to `src/styles.css` under `:root` (oklch equivalents):
- `--primary` ≈ deep red `#C8102E`, `--primary-foreground` white.
- `--background` white, `--foreground` charcoal/navy.
- `--muted` very light slate, `--border` slate-200-ish.
- Larger base font sizing (`text-base`/`text-lg`) for projector legibility, generous padding, sharp-but-soft radii (`rounded-lg`).
- Header uses a thin red bottom border; active tab uses red underline; bubbles are flat (no gradients), monospace timestamps for departure-board feel.
- Use shadcn `Button`, `Input` (or `Textarea`), `Tabs`, `Select`, `Badge`, `Popover` (for force_report panel), `ScrollArea`.

### Technical notes

- All copy on staff side in Turkish ("Yer Hizmetleri (TR)", "Mesaj yazın…", "Gönder"). Passenger side header is the language's native name ("English", "Italiano", "العربية", "Русский") with matching placeholder per language.
- Auto-scroll each column to bottom after new message.
- Disable Send + show inline spinner while `pending`.
- No backend code; spec defines an external `API_BASE`.
- No new dependencies; aviation icon from `lucide-react` (`Plane`).

### Out of scope

- Persistence across reloads, auth, multi-thread history, voice input, real backend implementation.
