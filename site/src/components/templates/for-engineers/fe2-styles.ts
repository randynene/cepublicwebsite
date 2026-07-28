// Hand-authored companion stylesheet for the For Engineers 2 page.
// fe2-css.ts (generated) supplies the reset + Figma variable tokens + fig-asset
// image classes for the lifted body. THIS file styles the two React parts that are
// NOT lifted - the working "build your profile" form + live preview - plus the
// motion layer (cursor spotlight on The Idea, reveal + hover on the step cards,
// pill CTA hover). Everything is scoped under `.fe2`; nothing leaks to the chrome.
// Author voice: no em/en dashes - hyphens only.

export const FE2_UI_CSS = `
/* ---- local aliases + base (form uses these; the lifted body is self-styled) ---- */
.fe2{--bg:#070D18;--navy:#0A1628;--card:#101B30;--card-2:#1B2A45;--line:#22314D;--line-2:#32435F;--lime:#D4FF3C;--teal:#4A9B9B;--ink:#060F1E;--white:#fff;--text:#B8C2D1;--dim:#7F8CA0;--serif:var(--font-source-serif),Georgia,serif;font-family:var(--font-inter),system-ui,sans-serif;color:#fff;background:var(--bg)}

/* ---- build-your-profile form (React; matches the reference form frame) ---- */
.fe2 .joinform{padding:112px 320px;background:var(--bg);border-top:1px solid var(--line)}
.fe2 .joinform .wrap{max-width:none;margin:0;padding:0}
.fe2 .joinform .eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--lime)}
.fe2 .joinform h2.section-title{font-size:46px;font-weight:700;letter-spacing:-.03em;line-height:1.08;margin-top:16px}
.fe2 .joinform h2.section-title em{font-family:var(--serif);font-style:italic;font-weight:400;color:var(--lime)}
.fe2 .joinform .lead{color:var(--text);font-size:18px;line-height:1.6;margin-top:16px;max-width:56ch}
.fe2 .jf-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;margin-top:48px;align-items:start}
.fe2 .jf-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:40px}
.fe2 .jf-progress{display:flex;gap:8px;margin-bottom:28px}
.fe2 .jf-progress .seg{height:4px;flex:1;border-radius:999px;background:var(--card-2);transition:background .3s}
.fe2 .jf-progress .seg.done{background:var(--lime)}
.fe2 .jf-step{display:none}
.fe2 .jf-step.active{display:block;animation:fe2-fade .3s ease}
@keyframes fe2-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.fe2 .jf-steplabel{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-bottom:6px}
.fe2 .jf-q{font-size:22px;font-weight:700;letter-spacing:-.01em;margin-bottom:20px}
.fe2 .jf-help{color:var(--text);font-size:14.5px;margin:-8px 0 20px;line-height:1.55}
.fe2 .jf-field{margin-bottom:18px}
.fe2 .jf-field label{display:block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin-bottom:9px}
.fe2 .jf-hint{text-transform:none;font-weight:500;color:var(--dim)}
.fe2 .jf-field input,.fe2 .jf-field select{width:100%;background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:12px;color:#fff;font-family:inherit;font-size:15.5px;padding:14px 16px}
.fe2 .jf-field input::placeholder{color:var(--dim)}
.fe2 .jf-field input:focus,.fe2 .jf-field select:focus{outline:none;border-color:var(--teal);box-shadow:0 0 0 3px rgba(74,155,155,.22)}
.fe2 .jf-field select{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237F8CA0' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center}
.fe2 .chips{display:flex;flex-wrap:wrap;gap:8px}
.fe2 .chip{background:var(--card-2);border:1px solid var(--line-2);color:var(--text);font-size:13.5px;font-weight:600;padding:9px 15px;border-radius:999px;cursor:pointer;transition:all .15s;font-family:inherit}
.fe2 .chip.on{background:var(--lime);color:var(--ink);border-color:var(--lime)}
.fe2 .chip:focus-visible{outline:2px solid var(--teal);outline-offset:2px}
.fe2 .jf-nav{display:flex;justify-content:space-between;align-items:center;margin-top:28px}
.fe2 .jf-back{background:none;border:none;color:var(--text);font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;padding:8px 0}
.fe2 .jf-back:disabled{opacity:0;pointer-events:none}
.fe2 .jf-next{display:inline-flex;align-items:center;gap:9px;background:var(--lime);color:var(--ink);border:none;font-family:inherit;font-weight:700;font-size:15px;padding:14px 24px;border-radius:999px;cursor:pointer}
.fe2 .jf-next .arw{width:20px;height:20px;border-radius:999px;background:var(--ink);display:grid;place-items:center}
.fe2 .jf-next .arw svg{width:10px;height:10px;stroke:var(--lime);stroke-width:2.6;fill:none}
.fe2 .jf-done{text-align:center;padding:20px 0}
.fe2 .jf-done .big{width:64px;height:64px;border-radius:999px;background:var(--lime);display:grid;place-items:center;margin:0 auto 18px}
.fe2 .jf-done .big svg{width:30px;height:30px;stroke:var(--ink);stroke-width:2.5;fill:none}
.fe2 .jf-done h3{font-size:24px;font-weight:700}
.fe2 .jf-done p{color:var(--text);margin-top:10px}
.fe2 .jf-preview{position:sticky;top:88px}
.fe2 .jf-preview .pl{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-bottom:14px}
.fe2 .skill-add{position:relative;margin-top:12px;max-width:360px}
.fe2 .skill-input{width:100%;background:var(--card-2);border:1px solid var(--line);border-radius:10px;padding:10px 14px;color:#fff;font:inherit;font-size:14px}
.fe2 .skill-input::placeholder{color:var(--dim)}
.fe2 .skill-input:focus{outline:none;border-color:var(--lime)}
.fe2 .skill-suggest{position:absolute;left:0;right:0;top:calc(100% + 4px);background:var(--card);border:1px solid var(--line);border-radius:10px;z-index:5;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,.4)}
.fe2 .skill-suggest button{display:block;width:100%;text-align:left;padding:9px 14px;background:none;border:none;color:var(--text);font:inherit;font-size:14px;cursor:pointer}
.fe2 .skill-suggest button:hover{background:var(--card-2);color:#fff}

/* ---- live preview profile card ---- */
.fe2 .profile-card{background:var(--card);border:1px solid var(--line);border-radius:24px;box-shadow:0 30px 80px -20px rgba(0,0,0,.6);overflow:hidden}
.fe2 .pc-top{padding:22px 24px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:14px}
.fe2 .pc-ava{width:52px;height:52px;border-radius:14px;flex:none;background:linear-gradient(135deg,#2A3A5A,#141F35);display:grid;place-items:center;font-weight:700;color:var(--text)}
.fe2 .pc-name{font-weight:700;font-size:16px}
.fe2 .pc-role{color:var(--dim);font-size:13px;margin-top:2px}
.fe2 .pc-flag{margin-left:auto;background:var(--card-2);border-radius:999px;padding:5px 12px;font-size:12px;font-weight:600;color:var(--text)}
.fe2 .pc-body{padding:22px 24px}
.fe2 .pc-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-bottom:10px}
.fe2 .pc-tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:20px}
.fe2 .pc-tags span{background:var(--card-2);border:1px solid var(--line-2);border-radius:999px;padding:7px 13px;font-size:12.5px;font-weight:600;color:var(--text)}
.fe2 .pc-match{display:flex;align-items:center;gap:10px;background:rgba(212,255,60,.08);border:1px solid rgba(212,255,60,.22);border-radius:14px;padding:14px 16px}
.fe2 .pc-match .r{width:30px;height:30px;border-radius:999px;background:var(--lime);display:grid;place-items:center;flex:none}
.fe2 .pc-match .r svg{width:15px;height:15px;stroke:var(--ink);stroke-width:2.5;fill:none}
.fe2 .pc-match .txt strong{display:block;font-size:13.5px}
.fe2 .pc-match .txt span{font-size:12.5px;color:var(--text)}
.fe2 .pc-foot{padding:16px 24px;border-top:1px solid var(--line);display:flex;justify-content:space-between}
.fe2 .pc-foot .s .n{font-family:var(--serif);font-style:italic;color:var(--lime);font-size:22px;font-weight:600}
.fe2 .pc-foot .s .l{font-size:12px;color:var(--dim);margin-top:2px}

/* ---- motion: cursor spotlight on The Idea ---- */
.fe2 [data-fe2-spotlight]{position:relative;isolation:isolate;overflow:visible}
.fe2 [data-fe2-spotlight]::before{content:"";position:absolute;inset:-320px;z-index:-1;opacity:0;transition:opacity .4s ease;pointer-events:none;background:radial-gradient(560px circle at var(--mx,50%) var(--my,50%),rgba(212,255,60,.16),rgba(212,255,60,.05) 42%,transparent 70%)}
.fe2 [data-fe2-spotlight].fe2-glowing::before{opacity:1}
.fe2 [data-fe2-glow-item]{transition:opacity .35s ease,transform .35s ease}
.fe2 [data-fe2-spotlight].fe2-glowing [data-fe2-glow-item]{opacity:.4}
.fe2 [data-fe2-spotlight].fe2-glowing [data-fe2-glow-item].fe2-lit{opacity:1;transform:translateY(-4px)}

/* ---- motion: reveal-on-scroll + hover on step cards ---- */
.fe2 [data-fe2-reveal]{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease}
.fe2 [data-fe2-reveal].fe2-in{opacity:1;transform:none}
.fe2 [data-fe2-card]{transition:transform .18s ease,box-shadow .18s ease}
.fe2 [data-fe2-card]:hover{transform:translateY(-4px);box-shadow:inset 0 0 0 1px rgba(212,255,60,.45)}

/* ---- motion: pill CTA hover lift + arrow nudge ---- */
.fe2 [data-fe2-cta]{cursor:pointer;transition:transform .14s ease,filter .14s ease}
.fe2 [data-fe2-cta]:hover{transform:translateY(-2px);filter:brightness(1.05)}
.fe2 [data-fe2-cta] > *:first-child{transition:transform .14s ease}
.fe2 [data-fe2-cta]:hover > *:first-child{transform:translateX(2px)}

/* ---- full-viewport hero + See more control ----
 * The hero block is wrapped in .fe2-hero-vh, whose min-height is set in JS
 * (viewport height under the chrome, divided by the canvas zoom factor). The
 * hero centres itself in that space and the See more control pins to the
 * bottom, so "Applying is broken" always starts below the fold. */
.fe2 .fe2-hero-vh{position:relative;display:flex;flex-direction:column;justify-content:center;gap:56px}
.fe2 .fe2-hero-vh > div:first-child{width:100%}\n  /* Client logo strip closing the hero. The fe2 canvas is a fixed 1920px\n     Figma frame that gets scaled, so the bar is banded to the same 1440/64\n     content width the other marketing pages use. */\n  .fe2-trust{width:100%;max-width:1440px;margin:0 auto;padding:0 64px}
.fe2 
.fe2 
.fe2 
.fe2 
.fe2 
}
@media(max-width:720px){.fe2 }

/* ---- responsive form ---- */
@media(max-width:920px){.fe2 .jf-grid{grid-template-columns:1fr;gap:32px}.fe2 .jf-preview{position:static;order:-1}.fe2 .jf-card{padding:30px}}

/* ---- reduced motion: everything lands visible, no follow/animation ---- */
@media(prefers-reduced-motion:reduce){
.fe2 [data-fe2-reveal]{opacity:1!important;transform:none!important}
.fe2 [data-fe2-spotlight].fe2-glowing::before{opacity:0}
.fe2 [data-fe2-spotlight].fe2-glowing [data-fe2-glow-item]{opacity:1}
.fe2 [data-fe2-card],.fe2 [data-fe2-cta]{transition:none}
.fe2 [data-fe2-card]:hover,.fe2 [data-fe2-cta]:hover{transform:none}
.fe2 
}
`
