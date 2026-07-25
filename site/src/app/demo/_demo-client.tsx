'use client'

import { useState } from 'react'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { PortableTextBlock } from '@portabletext/types'

// Category A
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Marquee } from '@/components/ui/marquee'
import { Tag } from '@/components/ui/tag'
// Category B
import { Heading } from '@/components/ui/heading'
import { PortableText } from '@/components/ui/portable-text'
import { Text } from '@/components/ui/text'
// Category C
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
// Category D
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Toast, ToastDescription, ToastTitle } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
// Category E
import { Container } from '@/components/ui/container'
import { Divider } from '@/components/ui/divider'
import { Image } from '@/components/ui/image'
import { VideoEmbed } from '@/components/ui/video-embed'
// Sub-task
import { Icon } from '@/components/ui/icon'

// =============================================================================
// Mock Sanity-shaped data
// =============================================================================

const mockSanityImage = {
  asset: { _ref: 'image-aaaa1111bbbb2222cccc-1200x800-jpg', _type: 'reference' as const },
  alt: 'Mock Sanity image',
}

const mockPortableText: PortableTextBlock[] = [
  { _type: 'block', _key: '1', style: 'h2', children: [{ _type: 'span', _key: 's1', text: 'PortableText demo — H2 heading', marks: [] }], markDefs: [] },
  { _type: 'block', _key: '2', style: 'normal', children: [
    { _type: 'span', _key: 'a', text: 'Standard paragraph with ', marks: [] },
    { _type: 'span', _key: 'b', text: 'bold', marks: ['strong'] },
    { _type: 'span', _key: 'c', text: ' + ', marks: [] },
    { _type: 'span', _key: 'd', text: 'italic', marks: ['em'] },
    { _type: 'span', _key: 'e', text: ' + ', marks: [] },
    { _type: 'span', _key: 'f', text: 'inline code', marks: ['code'] },
    { _type: 'span', _key: 'g', text: ' + ', marks: [] },
    { _type: 'span', _key: 'h', text: 'a link', marks: ['link-1'] },
    { _type: 'span', _key: 'i', text: '.', marks: [] },
  ], markDefs: [{ _key: 'link-1', _type: 'link', href: 'https://anthropic.com', blank: true }] },
  { _type: 'block', _key: '3', style: 'h3', children: [{ _type: 'span', _key: 's3', text: 'H3 sub-heading (renders at h4 visual)', marks: [] }], markDefs: [] },
  { _type: 'block', _key: '4', style: 'normal', listItem: 'bullet', level: 1, children: [{ _type: 'span', _key: 's4', text: 'Bullet item one', marks: [] }], markDefs: [] },
  { _type: 'block', _key: '5', style: 'normal', listItem: 'bullet', level: 1, children: [{ _type: 'span', _key: 's5', text: 'Bullet item two', marks: [] }], markDefs: [] },
  { _type: 'block', _key: '6', style: 'normal', listItem: 'number', level: 1, children: [{ _type: 'span', _key: 's6', text: 'Numbered step one', marks: [] }], markDefs: [] },
  { _type: 'block', _key: '7', style: 'normal', listItem: 'number', level: 1, children: [{ _type: 'span', _key: 's7', text: 'Numbered step two', marks: [] }], markDefs: [] },
  { _type: 'block', _key: '8', style: 'blockquote', children: [{ _type: 'span', _key: 's8', text: 'A blockquote — full 4-side border + auto-quote glyph + 24px font.', marks: [] }], markDefs: [] },
]

// =============================================================================
// Form schema
// =============================================================================

const contactSchema = z.object({
  email: z.string().email('Enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  experience: z.string().min(1, 'Please select your experience'),
  agree: z.boolean().refine((v) => v === true, 'You must agree to the terms'),
  contactPref: z.string().min(1, 'Pick a contact preference'),
})
type ContactValues = z.infer<typeof contactSchema>

// =============================================================================
// Section helper
// =============================================================================

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-brand-tertiary/10 py-12">
      <Container>
        <Heading as="h2" className="mb-6">{title}</Heading>
        <div className="flex flex-col gap-6">{children}</div>
      </Container>
    </section>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <Text size="small" className="text-text-default/60 uppercase tracking-wide">{children}</Text>
}

// =============================================================================
// Main demo
// =============================================================================

export default function DemoClient() {
  return (
    <main className="bg-surface-base">
      <Container className="py-12">
        <Heading as="h1" size="display">Design System Demo</Heading>
        <Text size="lead" className="mt-2 text-text-default/80">
          Kitchen-sink composition of all 22 inventory primitives + Icon system.
          Dev-only route (404 in production). MYGRATR-DESIGN-1 Step 2.18.
        </Text>
      </Container>

      {/* Category A — Foundation */}
      <Section id="A" title="A — Foundation: Buttons / Links / Tags / Cards / Accordion / Marquee">
        <SubLabel>A1 Button — variants × sizes</SubLabel>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary-teal" size="sm">Primary teal · sm</Button>
          <Button variant="primary-teal">Primary teal · md</Button>
          <Button variant="primary-teal" size="lg">Primary teal · lg</Button>
          <Button variant="primary-yellow">Primary yellow</Button>
          <Button variant="primary-navy">Primary navy</Button>
          <Button variant="icon-only" aria-label="Share">
            <Icon name="copy-link" size="sm" />
          </Button>
          <Button loading>Loading…</Button>
          <Button disabled>Disabled</Button>
        </div>

        <SubLabel>A2 Link — tones</SubLabel>
        <div className="flex flex-wrap gap-6">
          <Link href="/demo">Default link</Link>
          <Link href="/demo" tone="cc-blue">Blue link</Link>
          <span className="bg-brand-tertiary p-2 rounded">
            <Link href="/demo" tone="cc-white">White link on dark</Link>
          </span>
          <Link href="https://anthropic.com" external>External link</Link>
        </div>

        <SubLabel>A3 Tag — decorative + routable</SubLabel>
        <div className="flex flex-wrap gap-2">
          <Tag>Default decorative</Tag>
          <Tag tone="cc-blue">cc-blue decorative</Tag>
          <Tag href="/blog/category/hiring">Default routable</Tag>
          <Tag href="/blog/category/scaling" tone="cc-blue">cc-blue routable</Tag>
        </div>

        <SubLabel>A4 Card — compound composition</SubLabel>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card tone="default">
            <CardHeader>
              <div className="aspect-video bg-brand-tertiary/10 rounded flex items-center justify-center text-text-default/40">
                Header media
              </div>
            </CardHeader>
            <CardContent>
              <Heading as="h3" size="h4">Default tone</Heading>
              <Text>White surface with subtle navy border. Dominant CE pattern.</Text>
            </CardContent>
            <CardFooter>
              <Link href="/demo">Read more</Link>
            </CardFooter>
          </Card>
          <Card tone="muted">
            <CardContent>
              <Heading as="h3" size="h4">Muted tone</Heading>
              <Text>Light-gray surface — testimonial chassis pattern.</Text>
            </CardContent>
          </Card>
          <Card as="article">
            <CardContent>
              <Heading as="h3" size="h4">As article</Heading>
              <Text>Polymorphic <code>as</code> — semantic upgrade for content.</Text>
            </CardContent>
          </Card>
        </div>

        <SubLabel>A5 Accordion — single-mode, collapsed by default</SubLabel>
        <Accordion type="single" collapsible className="max-w-2xl">
          <AccordionItem value="q-1">
            <AccordionTrigger>How do you manage time zone differences?</AccordionTrigger>
            <AccordionContent>We align our working hours with your time zone, and ensure overlap for real-time collaboration.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q-2">
            <AccordionTrigger>How is Cloud Employee different from a recruitment agency?</AccordionTrigger>
            <AccordionContent>We are entirely different — we don't take any placement fees, and we focus on long-term retention.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q-3">
            <AccordionTrigger>Is there a minimum number of employees I need to hire?</AccordionTrigger>
            <AccordionContent>No — you can hire just one employee and receive the same quality service.</AccordionContent>
          </AccordionItem>
        </Accordion>

        <SubLabel>A6 Marquee — left, normal speed, pause-on-hover</SubLabel>
        <Marquee>
          {['Salmon', 'Willo', 'Travel Tech', 'Aspire', 'Healthpointe', 'BladeFS'].map((name) => (
            <span key={name} className="mx-4 inline-flex h-12 items-center text-h4 font-medium text-text-default/40">
              {name}
            </span>
          ))}
        </Marquee>
      </Section>

      {/* Category B — Typography */}
      <Section id="B" title="B — Typography: Heading / Text / PortableText">
        <SubLabel>B1 Heading — all 5 size variants</SubLabel>
        <div className="space-y-2">
          <Heading as="h1" size="display">Display — 60px CTA size</Heading>
          <Heading as="h1" size="h1">H1 — 48px page title</Heading>
          <Heading as="h2" size="h2">H2 — 40px section</Heading>
          <Heading as="h4" size="h4">H4 — 24px card title</Heading>
          <Heading as="span" size="eyebrow">EYEBROW — 18px kicker</Heading>
        </div>

        <SubLabel>B2 Text — all 4 size variants</SubLabel>
        <div className="space-y-2">
          <Text size="large">Large — 20px / 500 (testimonial body)</Text>
          <Text size="lead">Lead — 18px / 400 (intro paragraph)</Text>
          <Text size="default">Default — 16px / 400 (dominant body)</Text>
          <Text size="small">Small — 14px / 400 (caption / fine print)</Text>
        </div>

        <SubLabel>B3 PortableText — all block + mark types</SubLabel>
        <div className="max-w-2xl">
          <PortableText value={mockPortableText} />
        </div>
      </Section>

      {/* Category C — Forms */}
      <Section id="C" title="C — Forms: Live form with rhf + zod + Toast on submit">
        <DemoForm />
      </Section>

      {/* Category D — Overlays */}
      <Section id="D" title="D — Overlays: Dialog / Tooltip / DropdownMenu / Toast">
        <DemoOverlays />
      </Section>

      {/* Category E — Media + Layout */}
      <Section id="E" title="E — Media + Layout: Image / VideoEmbed / Container / Divider">
        <SubLabel>E1 Image — intrinsic-dimensions + fill mode</SubLabel>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Text size="small" className="mb-2">Plain URL `src` + intrinsic dimensions:</Text>
            {/* Sanity-source mode normally accepts asset references via the
              * source prop — demoed here with plain URL for visual clarity.
              * Real templates pass actual Sanity assets (e.g. post.thumbnailImage).
              */}
            <Image src="/og-default.png" alt="Image primitive demo" width={400} height={300} />
          </div>
          <div>
            <Text size="small" className="mb-2">Plain-URL `src` mode + `fill`:</Text>
            <div className="relative aspect-video">
              <Image src="/og-default.png" alt="OG default" fill sizes="50vw" />
            </div>
          </div>
        </div>

        <SubLabel>E2 VideoEmbed — lite mode (poster + click-to-play)</SubLabel>
        <div className="max-w-2xl">
          <VideoEmbed
            url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            poster={mockSanityImage}
            title="Demo video — click play to load iframe"
          />
        </div>

        <SubLabel>E3 Container — all 4 width variants</SubLabel>
        <div className="space-y-2">
          {(['narrow', 'default', 'wide', 'full'] as const).map((w) => (
            <Container key={w} width={w} className="border border-brand-primary/30 bg-surface-elevated py-2">
              <Text size="small" className="text-brand-primary">
                width="{w}"
              </Text>
            </Container>
          ))}
        </div>

        <SubLabel>E4 Divider — horizontal + vertical inline</SubLabel>
        <div>
          <Divider />
          <div className="mt-4 flex items-center gap-3">
            <span>Home</span>
            <Divider orientation="vertical" className="h-4" />
            <span>Services</span>
            <Divider orientation="vertical" className="h-4" />
            <span>About</span>
          </div>
        </div>

        <SubLabel>Icon — sprite icons</SubLabel>
        <div className="flex flex-wrap items-center gap-4">
          {(['menu', 'copy-link', 'linkedin', 'linkedin-filled', 'x-twitter', 'facebook', 'chevron-right', 'close', 'more-vertical'] as const).map((name) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <Icon name={name} size="lg" ariaLabel={name} />
              <Text size="small" className="text-text-default/60">{name}</Text>
            </div>
          ))}
        </div>
      </Section>

      <Container className="py-12">
        <Text size="small" className="text-text-default/60">
          End of demo. Step 2.18 HALT 10. Visit /_demo only in development.
        </Text>
      </Container>
    </main>
  )
}

// =============================================================================
// Form section — composes C-category primitives + fires Toast on submit
// =============================================================================

function DemoForm() {
  const [toastOpen, setToastOpen] = useState(false)
  const [toastTone, setToastTone] = useState<'default' | 'success' | 'warning' | 'error'>('success')
  const methods = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
    defaultValues: { email: '', message: '', experience: '', agree: false, contactPref: 'email' },
  })

  return (
    <FormProvider {...methods}>
      <form
        className="grid max-w-2xl gap-4"
        onSubmit={methods.handleSubmit((_data) => {
          setToastTone('success')
          setToastOpen(true)
        }, () => {
          setToastTone('error')
          setToastOpen(true)
        })}
      >
        <FormField name="email" label="Email" required description="We'll never share this">
          <Input type="email" placeholder="you@example.com" />
        </FormField>

        <FormField name="message" label="Message" required>
          <Textarea placeholder="Your message here…" />
        </FormField>

        <FormField name="experience" label="Experience" required>
          <Controller
            control={methods.control}
            name="experience"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">0–1 years</SelectItem>
                  <SelectItem value="2-5">2–5 years</SelectItem>
                  <SelectItem value="5+">5+ years</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField name="contactPref" label="Contact preference" required>
          <Controller
            control={methods.control}
            name="contactPref"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="email" id="cp-email" />
                  <label htmlFor="cp-email">Email</label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="phone" id="cp-phone" />
                  <label htmlFor="cp-phone">Phone</label>
                </div>
              </RadioGroup>
            )}
          />
        </FormField>

        <FormField name="agree" label="Agreements">
          <Controller
            control={methods.control}
            name="agree"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="agree" />
                <label htmlFor="agree">I agree to the terms</label>
              </div>
            )}
          />
        </FormField>

        <Button type="submit">Submit (fires Toast)</Button>

        <Toast tone={toastTone} open={toastOpen} onOpenChange={setToastOpen} duration={4000}>
          <ToastTitle>{toastTone === 'success' ? 'Form submitted' : 'Validation failed'}</ToastTitle>
          <ToastDescription>
            {toastTone === 'success'
              ? 'rhf + zod validation passed; ToastProvider fired this notification.'
              : 'Check the field errors above. ToastProvider routes errors via tone="error".'}
          </ToastDescription>
        </Toast>
      </form>
    </FormProvider>
  )
}

// =============================================================================
// Overlays section — Dialog / Tooltip / DropdownMenu / Toast triggers
// =============================================================================

function DemoOverlays() {
  const [toastOpen, setToastOpen] = useState(false)
  const [toastTone, setToastTone] = useState<'default' | 'success' | 'warning' | 'error'>('default')
  const [checkboxItem, setCheckboxItem] = useState(false)
  const [radioItem, setRadioItem] = useState('a')

  return (
    <>
      <SubLabel>D1 Dialog</SubLabel>
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>
              This dialog uses Radix Dialog with focus-trap, ESC-to-close, and the
              built-in close button (top-right) composed from Button icon-only +
              Icon close.
            </DialogDescription>
            <div className="mt-2 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="primary-yellow">Cancel</Button>
              </DialogClose>
              <Button>Confirm</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <SubLabel>D2 Tooltip — hover any of these</SubLabel>
      <div className="flex flex-wrap gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="icon-only" aria-label="Info">
              <Icon name="more-vertical" size="sm" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Helpful hint via Radix Tooltip</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="primary-yellow">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltip below; sideOffset default 4</TooltipContent>
        </Tooltip>
      </div>

      <SubLabel>D3 DropdownMenu — full compose</SubLabel>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => {}}>Item 1</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => {}}>Item 2</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={checkboxItem} onCheckedChange={setCheckboxItem}>
              Toggle setting
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={radioItem} onValueChange={setRadioItem}>
              <DropdownMenuRadioItem value="a">Option A</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="b">Option B</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="c">Option C</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Disabled item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SubLabel>D4 Toast — fire one of each tone</SubLabel>
      <div className="flex flex-wrap gap-2">
        {(['default', 'success', 'warning', 'error'] as const).map((tone) => (
          <Button
            key={tone}
            variant={tone === 'error' ? 'primary-navy' : 'primary-teal'}
            onClick={() => {
              setToastTone(tone)
              setToastOpen(true)
            }}
          >
            Fire {tone} toast
          </Button>
        ))}
      </div>
      <Toast tone={toastTone} open={toastOpen} onOpenChange={setToastOpen} duration={4000}>
        <ToastTitle>
          {toastTone === 'default' && 'Default notification'}
          {toastTone === 'success' && 'Success'}
          {toastTone === 'warning' && 'Heads up'}
          {toastTone === 'error' && 'Error'}
        </ToastTitle>
        <ToastDescription>
          tone="{toastTone}" — left-border accent driven by --color-{toastTone === 'default' ? 'brand-tertiary/40' : toastTone}.
        </ToastDescription>
      </Toast>
    </>
  )
}
