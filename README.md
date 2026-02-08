# 🧠 Duotronics

> *"Dr. Daystrom would be proud."*

**Proof of concept:** Does dual-hemisphere AI processing actually work?

---

## What This Is

A simple experiment: Instead of asking one AI model for an answer, we ask **two models working in sequence** — like the left and right hemispheres of a brain.

**Hemisphere 1 (Logic):** Focuses on accuracy, structure, facts  
**Hemisphere 2 (Artist):** Adds warmth, voice, humanity

**The question:** Does this produce meaningfully better results than a single model?

---

## Why Test This?

We can't make local LLMs as smart as GPT-4 by throwing more compute at them. But maybe we can make them **more complete** by adding **structure**.

This project lets you:
- ✅ Test the hypothesis with real conversations
- ✅ Compare dual-hemisphere vs single-model outputs
- ✅ Tweak the prompts and see what works
- ✅ Run it on any computer (no GPU needed)

---

## How It Works

Your message passes through two processing stages:

```
[Your Question]
       ↓
[Logic Hemisphere] — Analyzes, structures, gets facts right
   (Anthropic Claude recommended)
       ↓
[Artist Hemisphere] — Refines for voice, rhythm, humanity
   (OpenAI GPT-4 recommended)
       ↓
[Final Response]
```

Both hemispheres are **cloud APIs** — no local models, no GPU required.

---

## Quick Start

```bash
# Clone
git clone https://github.com/DevCabin/duotronics.git
cd duotronics

# Install
npm install

# Run
npm run dev
# Open http://localhost:3000
```

**First run:** The wizard will walk you through:
1. Enter API key for Logic hemisphere (Anthropic or OpenAI)
2. Enter API key for Artist hemisphere (OpenAI or Anthropic)
3. Test both connections
4. Start chatting

---

## Requirements

**Any computer that can run Node.js:**
- MacBook Air ✅
- Windows laptop ✅
- Linux desktop ✅

**You need:**
- Node.js 18+
- Two API keys (Anthropic Claude + OpenAI GPT-4 recommended)
- Internet connection

**No GPU required!** This is an API-only proof of concept.

---

## Measuring Success

The point is to **test the hypothesis**. Here's how:

1. **Blind comparison:** Show someone two responses (dual-hemisphere vs single model). Which do they prefer?
2. **Subjective feel:** Does the output feel more "complete" or "human"?
3. **Factual accuracy:** Does the Artist break the Logic hemisphere's facts?
4. **Latency:** Is the extra API call worth the quality gain?

We're not claiming this definitely works — we're **testing if it works**.

---

## Configuration

After the wizard, your config is saved to `config.yaml`:

```yaml
logic:
  provider: anthropic
  apiKey: sk-ant-...
  model: claude-sonnet-4-5

artist:
  provider: openai
  apiKey: sk-...
  model: gpt-4o
```

You can edit this to try different model combinations.

---

## Roadmap

- [x] Wizard for API key setup
- [x] Chat interface with dual-hemisphere processing
- [x] Visual indicator showing Logic → Artist flow
- [ ] Side-by-side comparison mode (dual vs single)
- [ ] Export conversation logs for analysis
- [ ] Prompt tuning UI
- [ ] Cost tracking per conversation

---

## What This Is NOT

This project is **not**:
- ❌ A production-ready chat app
- ❌ A local model runner (no Ollama/LM Studio here)
- ❌ A learning/RAG system that improves over time

For local models and learning systems, see **[Duotronics M-1](https://github.com/DevCabin/duotronics-m1)**.

---

## Philosophy

1. **Test, don't assume.** We're proving (or disproving) the concept.
2. **Keep it simple.** Dual API only. No complexity.
3. **Measure honestly.** If it doesn't work, we'll say so.

---

## Contributing

This is an experiment. Contributions welcome:
- Try different model pairings and report results
- Improve the prompts
- Add comparison/measurement tools
- Document what works (and what doesn't)

---

## Related Projects

🔬 **Duotronics** (this repo) — Proof of concept with dual APIs  
🧠 **[Duotronics M-1](https://github.com/DevCabin/duotronics-m1)** — Learning system with local models

---

## License

[MIT](./LICENSE) — Experiment freely.

---

## Acknowledgments

Inspired by:
- The human brain's hemispheric specialization
- [Dr. Richard Daystrom](https://memory-alpha.fandom.com/wiki/Richard_Daystrom) and duotronic computers
- Marvin Minsky's "Society of Mind"

---

*Built with 🧠 by [DevCabin](https://devcabin.com)*
