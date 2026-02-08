# Equipment Guide

> **TL;DR:** Spend on GPU VRAM. Everything else is secondary. A $700 used RTX 3090 beats a $2000 "balanced" build for local AI.

---

## Priority Ranking

| Priority | Component | Impact | Budget Allocation |
|----------|-----------|--------|-------------------|
| 🥇 1st | GPU VRAM | 10x | 60-70% of budget |
| 🥈 2nd | System RAM | 2x | 15-20% of budget |
| 🥉 3rd | SSD | 1.5x | 10% of budget |
| 🏅 4th | CPU | 1x | Whatever's left |

---

## GPU Recommendations (The Important Part)

### Budget Tier (~$100-200 used)

| GPU | VRAM | What You Can Run | Notes |
|-----|------|------------------|-------|
| GTX 1080 Ti | 11GB | 7B-13B quantized | Great value, power hungry |
| RTX 2080 Ti | 11GB | 7B-13B quantized | Slightly better than 1080 Ti |
| RTX 3060 | 12GB | 7B-13B quantized | Lower power, good starter |
| Tesla P40 | 24GB | 30B quantized | Datacenter card, needs cooling mod, no video out |

**Best budget pick:** RTX 3060 12GB (~$180 used) — modern, efficient, good ecosystem support.

### Sweet Spot Tier (~$400-800 used)

| GPU | VRAM | What You Can Run | Notes |
|-----|------|------------------|-------|
| RTX 3080 12GB | 12GB | 7B-13B comfortably | Good all-rounder |
| RTX 3090 | 24GB | 30B+ quantized | **THE GOAT** — best value/performance |
| RTX 3090 Ti | 24GB | 30B+ quantized | Marginal gains over 3090 |
| RTX 4070 Ti Super | 16GB | 13B-20B | New, efficient, but pricey |

**Best sweet spot pick:** RTX 3090 24GB (~$700 used) — 24GB VRAM unlocks serious models. This is the answer for most people.

### Serious Tier (~$1000-2500)

| GPU | VRAM | What You Can Run | Notes |
|-----|------|------------------|-------|
| RTX 4090 | 24GB | 30B+ (faster) | Best consumer card, overkill for most |
| RTX A5000 | 24GB | 30B+ | Workstation, blower cooler |
| RTX A6000 | 48GB | 70B quantized | The dream, expensive |
| 2x RTX 3090 | 48GB* | 70B split | Complex setup, not for beginners |

*Multi-GPU requires specific software support and doesn't simply "add" VRAM for most workloads.

**Serious pick:** Single RTX 4090 if you want speed, or hunt for a used A6000 if you want 48GB.

### What About AMD/Intel?

- **AMD GPUs:** ROCm support is improving but still behind CUDA. Expect rougher setup. Can work with 7900 XTX (24GB) but community support is thinner.
- **Intel Arc:** Not recommended yet. Drivers and ecosystem not mature for LLM inference.
- **Apple Silicon:** M1/M2/M3 unified memory is interesting (up to 192GB on M2 Ultra), but inference is slower than NVIDIA. Good for experimentation, not for speed.

**Recommendation:** Stick with NVIDIA unless you have a specific reason not to.

---

## System RAM

| Amount | Use Case | Notes |
|--------|----------|-------|
| 16GB | Minimum | Will struggle with larger models |
| 32GB | Recommended | Comfortable for most setups |
| 64GB | Power user | Enables CPU offloading, multiple models |
| 128GB+ | Overkill | Only if doing CPU-only inference |

**What to buy:**
- DDR4 3200MHz is fine, don't overpay for DDR5
- 2x16GB kit for 32GB (~$50-70)
- Used server RAM (ECC) works if your board supports it

---

## Storage

| Type | Speed | Notes |
|------|-------|-------|
| SATA SSD | ~500 MB/s | Fine, models load in 15-30s |
| NVMe Gen3 | ~3000 MB/s | Good, models load in 5-15s |
| NVMe Gen4 | ~7000 MB/s | Diminishing returns for this use |

**What to buy:**
- Any 1TB NVMe (~$60-80) is plenty
- Models are 4-40GB each, you won't fill 1TB quickly
- Don't waste money on Gen4/Gen5 for this use case

---

## CPU

The CPU matters less than you think for LLM inference. The GPU does the heavy lifting.

| Type | Notes |
|------|-------|
| Modern 4-core | Minimum (i5-8400, Ryzen 3600) |
| 6-8 core | Comfortable (i5-12400, Ryzen 5600) |
| 12+ core | Only matters for CPU offloading |

**What to buy:**
- Whatever comes with your used system is probably fine
- Don't upgrade CPU to improve LLM performance — buy more VRAM instead

---

## Power Supply

Often overlooked! High-end GPUs are power hungry.

| GPU | Minimum PSU | Recommended PSU |
|-----|-------------|-----------------|
| RTX 3060 | 500W | 550W |
| RTX 3080 | 650W | 750W |
| RTX 3090 | 750W | 850W |
| RTX 4090 | 850W | 1000W |

**Tips:**
- Check your existing PSU before buying a GPU
- Used server PSUs are cheap but loud
- 80+ Gold efficiency saves money over time

---

## Complete Build Examples

### The $400 Starter
- Used Dell Optiplex or HP Z-series (~$100-150)
- RTX 3060 12GB (~$180)
- 32GB DDR4 (~$50)
- 500GB NVMe (~$35)
- **Total: ~$400**
- **Runs:** 7B-13B models comfortably

### The $900 Sweet Spot
- Used workstation with 650W+ PSU (~$150)
- RTX 3090 24GB (~$700)
- 32GB DDR4 (often included)
- 1TB NVMe (~$70)
- **Total: ~$900**
- **Runs:** 30B+ models, serious capability

### The $600 Sleeper (My Favorite)
- Used HP Z440 workstation (~$120)
- Tesla P40 24GB (~$200) + cooling mod
- 32GB DDR4 ECC (often included)
- 1TB NVMe (~$70)
- Cheap GT 710 for display output (~$30)
- **Total: ~$420-500**
- **Runs:** 30B+ models, but no gaming/display from main GPU

---

## Where to Buy (Used)

- **eBay:** Best selection, use "Buy It Now" + filter by seller rating
- **r/hardwareswap:** Good deals, some risk
- **Facebook Marketplace:** Local pickup, cash deals
- **Craigslist:** Hit or miss
- **Amazon Renewed:** Overpriced but has returns

**Tips:**
- RTX 3090 prices have dropped significantly — great time to buy
- Avoid mining cards with visible damage, but "mined on" isn't automatic disqualification
- Test GPU immediately, most failures happen in first 48 hours

---

## Don't Waste Money On

❌ RGB everything  
❌ Fancy cases  
❌ Expensive motherboards  
❌ High-end CPUs (for this use case)  
❌ NVMe Gen4/Gen5  
❌ DDR5 (unless your platform requires it)  
❌ AIO liquid cooling (air is fine for most GPUs)  

---

## The One-Sentence Summary

**Buy the biggest VRAM you can afford (ideally 24GB), make sure your PSU can handle it, and spend the rest on making it actually turn on.**
