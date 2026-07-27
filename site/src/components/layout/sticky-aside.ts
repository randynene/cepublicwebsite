// The intro column of a two-column FAQ section pins beside the accordion on
// desktop, so the heading and the "can't find your question" card stay in view
// while the questions scroll past. One constant, because every FAQ on the site
// uses it and per-template copies would drift.
//
// 104px clears the floating pill header plus the announcement bar (same offset
// the How It Works stage rows already use).
//
// `self-start` is load-bearing: a grid item stretches to the row height by
// default, and a full-height item has no room to travel, so sticky silently
// does nothing without it.
//
// Desktop only. Below lg the grid collapses to one column and the intro is
// already directly above the questions.
export const STICKY_ASIDE = 'lg:sticky lg:top-[104px] lg:self-start'
