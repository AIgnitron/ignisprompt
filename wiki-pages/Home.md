# Welcome to IgnisPrompt

**IgnisPrompt** is a local-first, open-source AI routing control plane for understanding where your requests go, why they go there, and keeping sensitive work on device.

**Aethra** is the local observability dashboard that makes routing decisions visible.

## Current Status

**Latest Release:** `v0.1.3-local-preview`

IgnisPrompt is local-preview infrastructure. The milestone is proving the local routing control plane works: classify requests, explain routing decisions, audit locally, and reject unsafe cloud fallback. The default path requires no Ollama, GGUF, model weights, or network access.

## What You Can Do Now

- ✅ Route legal requests locally to Tier 3 with a human-readable explanation
- ✅ Inspect audit events for each routing decision
- ✅ See model and runner status hints
- ✅ View local-only sustainability proxy estimates
- ✅ Optional: run local GGUF models with our subprocess spike
- ✅ Experimental: use stdio MCP for read-only local observability tools

## What You Can't Do Yet

- ❌ Production legal advice (this is a routing scaffold, not a legal system)
- ❌ Cloud provider integration (unless you build it yourself)
- ❌ Real-time telemetry or global aggregation (we don't collect any)
- ❌ Production model quality (baseline models are pipes for validation)
- ❌ Signed, tamper-evident audit chains (not yet implemented)

## Quick Links

- **[Project Overview](Project-Overview)** — What IgnisPrompt is and why it exists
- **[Local-Preview Quickstart](Local-Preview-Quickstart)** — Get started in 5 minutes
- **[Architecture](Architecture)** — How the daemon, CLI, and Aethra fit together
- **[Aethra Dashboard](Aethra-Dashboard)** — Tour the observability UI
- **[Routing & Policy](Routing-and-Policy)** — How requests are classified and routed
- **[Security & Supply Chain](Security-and-Supply-Chain)** — Our security posture and gaps
- **[FAQ](FAQ)** — Common questions answered
- **[Roadmap](Roadmap)** — What we're planning next

## Where to Go From Here

- **New to IgnisPrompt?** Start with [Project Overview](Project-Overview) or the [Quickstart](Local-Preview-Quickstart).
- **Want to understand the code?** Read [Architecture](Architecture) and link to the main repo docs.
- **Running the demo?** See [Golden Legal & Demo Flows](Golden-Legal-and-Demo-Flows).
- **Interested in sustainability?** Check [Sustainability Preview](Sustainability-Preview).
- **Want to contribute?** See [Contributing](Contributing).

---

**License:** Apache-2.0  
**Repository:** https://github.com/AIgnitron/ignisprompt  
**Issues & Feedback:** https://github.com/AIgnitron/ignisprompt/issues
