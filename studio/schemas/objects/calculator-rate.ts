import { defineField, defineType } from 'sanity'

// One row of the price-comparison rate card: a region, a seniority, and what a
// person at that level actually costs in-house versus through Cloud Employee.
//
// Reconstructed from the live calculator's own source, so the numbers and the
// on-costs are CE's, not invented. The formulas live in code
// (site/src/lib/calculators/price-comparison.ts) because they are tax rules; the
// numbers live here because they are market salaries with a year on them and Seb
// needs to change them without asking a developer.
//
// The US and UK on-costs genuinely differ - the US carries FICA, FUTA, Medicare
// and health benefits, the UK carries National Insurance and statutory holiday -
// so the region-specific fields are optional and only the fields for that region
// are read. Modelling them as one flat shape rather than two would mean pretending
// the two payrolls are the same, and they are not.
export default defineType({
  name: 'calculatorRate',
  title: 'Calculator rate',
  type: 'object',
  fields: [
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      options: {
        list: [
          { title: 'United States of America', value: 'usa' },
          { title: 'United Kingdom', value: 'uk' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Seniority',
      type: 'string',
      options: {
        list: [
          { title: 'Junior', value: 'junior' },
          { title: 'Mid', value: 'mid' },
          { title: 'Senior', value: 'senior' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'salary',
      title: 'In-house base salary (annual)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'cloudEmployeeCost',
      title: 'Cloud Employee cost (annual)',
      type: 'number',
      description: 'All-in. This is the number the in-house total is compared against.',
      validation: (Rule) => Rule.required().positive(),
    }),

    defineField({
      name: 'trainingCost',
      title: 'Training (annual, flat)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'recruitmentPct',
      title: 'Recruitment fee (share of salary)',
      type: 'number',
      description: '0.20 = 20% of base salary.',
      validation: (Rule) => Rule.required().min(0).max(1),
    }),

    // ---- United States only -------------------------------------------------
    defineField({
      name: 'benefitsPct',
      title: 'US: benefits (share of salary)',
      type: 'number',
      description: 'Health cover and the rest. 0.20 = 20%. US rows only.',
      hidden: ({ parent }) => (parent as { region?: string })?.region !== 'usa',
    }),
    defineField({
      name: 'ficaPct',
      title: 'US: FICA rate',
      type: 'number',
      description: '0.062 = 6.2%, applied up to the wage base below.',
      hidden: ({ parent }) => (parent as { region?: string })?.region !== 'usa',
    }),
    defineField({
      name: 'ficaWageBase',
      title: 'US: FICA wage base',
      type: 'number',
      description: 'Social Security wage cap. FICA is charged on salary up to this, not above it.',
      hidden: ({ parent }) => (parent as { region?: string })?.region !== 'usa',
    }),
    defineField({
      name: 'futaFlat',
      title: 'US: FUTA (annual, flat)',
      type: 'number',
      hidden: ({ parent }) => (parent as { region?: string })?.region !== 'usa',
    }),
    defineField({
      name: 'medicarePct',
      title: 'US: Medicare rate',
      type: 'number',
      description: '0.0145 = 1.45%. Uncapped, unlike FICA.',
      hidden: ({ parent }) => (parent as { region?: string })?.region !== 'usa',
    }),

    // ---- United Kingdom only ------------------------------------------------
    defineField({
      name: 'niPct',
      title: 'UK: employer National Insurance (share of salary)',
      type: 'number',
      description: '0.17 = 17%. UK rows only.',
      hidden: ({ parent }) => (parent as { region?: string })?.region !== 'uk',
    }),
    defineField({
      name: 'holidayWeeks',
      title: 'UK: statutory holiday (weeks)',
      type: 'number',
      description: '5.6 weeks. Costed as salary / 52 * weeks.',
      hidden: ({ parent }) => (parent as { region?: string })?.region !== 'uk',
    }),
  ],
  preview: {
    select: { region: 'region', role: 'role', salary: 'salary' },
    prepare({ region, role, salary }) {
      return {
        title: `${String(region ?? '?').toUpperCase()} - ${role ?? '?'}`,
        subtitle: salary ? `Salary ${salary.toLocaleString()}` : 'No salary set',
      }
    },
  },
})
