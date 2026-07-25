import type { Meta, StoryObj } from '@storybook/nextjs'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './index'

const meta = {
  title: 'Primitives/Accordion',
  parameters: {
    docs: {
      description: {
        component:
          'Radix accordion with thin plus trigger. For dark marketing templates (Tool, Download, Compare), use **Primitives/FaqList** instead — lime circle +/× on `#101B30` cards matches Tool.html and Download.html.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

const items = [
  {
    value: 'q-1',
    question: 'Sample question one — what does this primitive do?',
    answer:
      'Sample answer one. The accordion trigger renders as a semantic button with a thin plus glyph that rotates 45° to form an × on open.',
  },
  {
    value: 'q-2',
    question: 'Sample question two — how is this animated?',
    answer:
      'Sample answer two. Content height animates via Radix CSS variables driven by --duration-reveal and --ease-accordion tokens.',
  },
  {
    value: 'q-3',
    question: 'Sample question three — single vs multiple?',
    answer:
      'Sample answer three. Default mode is single+collapsible (FAQ pattern); use type="multiple" for nested expansion.',
  },
]

export const Default: Story = {
  render: () => (
    <div className="max-w-2xl p-6">
      <Accordion type="single" collapsible>
        {items.map((it, i) => (
          <AccordionItem key={it.value} value={it.value}>
            <AccordionTrigger>
              {/* Optional lime index (composed by the consumer, not the
                  primitive) to match the new-design FAQ reference. */}
              <span className="flex items-center gap-4">
                <span className="text-body-sm font-semibold tabular-nums text-accent-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{it.question}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>{it.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          single + collapsible (default — first item open)
        </span>
        <Accordion type="single" collapsible defaultValue="q-1">
          {items.slice(0, 2).map((it) => (
            <AccordionItem key={it.value} value={it.value}>
              <AccordionTrigger>{it.question}</AccordionTrigger>
              <AccordionContent>{it.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-default/70">
          multiple (nested expansion)
        </span>
        <Accordion type="multiple" defaultValue={['q-1', 'q-2']}>
          {items.slice(0, 2).map((it) => (
            <AccordionItem key={it.value} value={it.value}>
              <AccordionTrigger>{it.question}</AccordionTrigger>
              <AccordionContent>{it.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <p className="text-body-sm text-text-default/70">
        Hover/focus visible on interaction — trigger color shifts to brand-primary,
        focus-visible ring renders on keyboard tab.
      </p>
    </div>
  ),
}
