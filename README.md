# 🧠 Duotronics

> *"Dr. Daystrom would be proud."*

Two hemispheres. One voice. Smart AI on a budget.

---

**Duotronics** is an open-source cognitive architecture that makes local LLMs meaningfully smarter through structured, multi-pass processing — inspired by the human brain's hemispheric specialization.

Run it on a gaming PC. Keep your data private. Get results that don't feel like talking to a brick.

---

## Why This Exists

Local LLMs are amazing: free, private, yours. But let's be honest — they feel *dumb* compared to GPT-4 or Claude. Not because they're broken, but because they're smaller. And we can't change that.

**But we can change how we use them.**

Duotronics adds *structure* where we can't add *scale*:
- **Two processing passes** instead of one
- **Specialized "hemispheres"** with different strengths
- **Optional learning** that improves quality over time
- **Privacy-first** design — your data stays on your machine

The result: local AI that feels more complete, more human, more *useful*.

---

## How It Works

### Mode 1: Refine (Quality Now)

Your query passes through two "hemispheres":

```
[You] → [Logic Brain: Local] → [Artist Brain: API] → [Response]
```

1. **Logic hemisphere** (local): Analyzes, structures, gets the facts right
2. **Artist hemisphere** (API or local): Adds voice, rhythm, humanity

Same truth, but alive.

### Mode 2: Learn (Quality Over Time)

The system gets smarter with use:

```
[You] → [Local: Attempt] → [Confident?] → Yes → [Response]
                               ↓ No
                    [API: Refine + Teach]
                               ↓
                    [Store in Memory]
```

Every API call *teaches* the local system. Over time:
- More queries handled locally
- API costs decrease
- Your AI develops expertise in *your* domains

---

## Quick Start

```bash
# Clone
git clone https://github.com/DevCabin/duotronics.git
cd duotronics

# Install
pip install -r requirements.txt

# Configure
cp config.example.yaml config.yaml
# Edit config.yaml with your model paths and (optional) API keys

# Run
python duotronics.py "What's the best way to learn Python?"
```

---

## Requirements

### v1 (Current - API Only)

**Any computer that can run Node.js:**
- MacBook Air ✅
- Windows laptop ✅
- Linux desktop ✅
- **RAM:** 4GB+ (8GB comfortable)
- **Storage:** 500MB for the app

**You need:**
- Node.js 18+
- Two API keys (Anthropic, OpenAI, or mix)
- Internet connection

**No GPU required!** This version uses cloud APIs for both hemispheres.

---

### v2 (Future - Local Models)

When we add local model support, you'll want:

| Tier | Use Case | Hardware |
|------|----------|----------|
| **Minimum** | Testing, light use | 8GB VRAM GPU, 16GB RAM |
| **Recommended** | Daily use | 12GB VRAM GPU, 32GB RAM |
| **Optimal** | Power user | 24GB VRAM GPU, 32GB+ RAM |

See **[EQUIPMENT.md](./EQUIPMENT.md)** for detailed hardware recommendations and budget builds.

---

## Configuration

```yaml
# config.yaml
mode: refine  # or "learn"

hemispheres:
  logic:
    backend: ollama
    model: mistral:7b
    
  artist:
    backend: openai  # or "ollama" for full local
    model: gpt-4o

privacy:
  mode: hybrid  # "local", "hybrid", or "learning"
  strip_pii: true

personality:
  name: "Assistant"
  voice: "Warm, direct, slightly witty"
```

---

## Privacy Modes

| Mode | Description | Data Leaves Machine? |
|------|-------------|----------------------|
| 🔒 `local` | Everything runs locally | Never |
| 🔓 `hybrid` | Local logic, API artist | Yes (queries to API) |
| 📚 `learning` | API early, decreasing over time | Yes, but less over time |

---

## Roadmap

- [x] Core architecture design
- [ ] Basic orchestrator (Mode 1: Refine)
- [ ] Learning mode with vector storage
- [ ] Confidence-based routing
- [ ] Personality system
- [ ] Web UI
- [ ] One-click installers

---

## Philosophy

1. **VRAM > Everything.** Spend your budget on GPU memory.
2. **Privacy by default.** Local unless you choose otherwise.
3. **Honest about limits.** Local 7B won't match GPT-4. But it can get *closer*.
4. **Accessible.** If you have a gaming PC, you can run this.

---

## Contributing

We're just getting started. Contributions welcome:
- Code improvements
- Documentation
- Hardware testing on different configs
- Model recommendations

---

## License

[MIT](./LICENSE) — do whatever you want, just don't blame us.

---

## Acknowledgments

Inspired by:
- The human brain (pretty good design, TBH)
- [Dr. Richard Daystrom](https://memory-alpha.fandom.com/wiki/Richard_Daystrom) and his duotronic computer systems
- Marvin Minsky's "Society of Mind"
- Everyone who said local AI "isn't good enough" (challenge accepted)

---

*Built with 🧠 by [DevCabin](https://devcabin.com) and friends.*
