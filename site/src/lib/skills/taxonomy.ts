// The technology list behind the quick hiring form's stack step.
//
// WHY THIS IS A FILE AND NOT A SANITY QUERY. Sanity holds 101 technologies, but
// those exist because each one has a marketing page. A search box has a different
// job: it must never come up empty. Someone typing Kubernetes, Terraform or Rust
// and getting nothing reads as "these people are not technical", and that
// impression is formed in the first three seconds of the form. So the search index
// is deliberately wider than the page catalogue, and the two are allowed to differ.
//
// WHAT IS DELIBERATELY NOT HERE. This is not a scrape of every technology ever
// named. COBOL, Delphi, jQuery and ColdFusion are real technologies and putting
// them in the picker would make CE read as a legacy shop, which is the opposite of
// the positioning. The rule for inclusion is: would CE take that brief in 2026.
//
// THE LIST DOES NOT NEED TO BE COMPLETE, AND THAT IS THE POINT. Anything a visitor
// types is accepted whether it is here or not (see `search.ts`). Every accepted
// term that is NOT in this list gets logged, so what people ask for that CE has no
// page for becomes visible instead of being silently dropped. That log is the
// maintenance mechanism: the list grows from real demand rather than from someone
// guessing once a year.
//
// ORDERING. `tier` decides what shows before anyone types. Tier 1 is what CE sells
// most and what the market asks for most; the AI and platform roles sit at the top
// on purpose, because the first screen of a form is positioning, not just input.

/** Groups map to the role step, so picking a role can filter the pill set. */
export const SKILL_CATEGORIES = {
  ai: 'AI & machine learning',
  data: 'Data & analytics',
  devops: 'Cloud, DevOps & platform',
  backend: 'Backend',
  frontend: 'Frontend',
  mobile: 'Mobile',
  database: 'Databases',
  qa: 'QA & testing',
  nocode: 'No-code & automation',
} as const

export type SkillCategory = keyof typeof SKILL_CATEGORIES

export interface Skill {
  /** Stable key. Lowercase, hyphenated. Never change one; the CRM stores labels. */
  id: string
  label: string
  category: SkillCategory
  /** 1 shows before anyone types. 2 is common. 3 is findable by search only. */
  tier: 1 | 2 | 3
  /** Alternative spellings people actually type. Matched on search, never shown. */
  aliases?: string[]
}

/**
 * Compact tuple form so the list stays readable as a list rather than sprawling
 * into 2,000 lines of object literals: [id, label, category, tier, ...aliases].
 */
type Row = [string, string, SkillCategory, 1 | 2 | 3, ...string[]]

const ROWS: Row[] = [
  // AI and machine learning. Tier 1 heavy on purpose: this is the part of the
  // catalogue CE is actively selling and the part buyers cannot hire for locally.
  ['openai', 'OpenAI', 'ai', 1, 'gpt', 'chatgpt', 'gpt-4', 'gpt4'],
  ['anthropic', 'Anthropic / Claude', 'ai', 1, 'claude'],
  ['langchain', 'LangChain', 'ai', 1],
  ['llamaindex', 'LlamaIndex', 'ai', 1, 'llama index'],
  ['rag', 'RAG pipelines', 'ai', 1, 'retrieval augmented generation', 'retrieval'],
  ['llm-fine-tuning', 'LLM fine-tuning', 'ai', 1, 'fine tuning', 'finetuning'],
  ['ai-agents', 'AI agents', 'ai', 1, 'agentic', 'agents', 'autonomous agents'],
  ['langgraph', 'LangGraph', 'ai', 1, 'lang graph', 'agent orchestration'],
  ['llm-evals', 'LLM evals & observability', 'ai', 1, 'evals', 'langsmith', 'braintrust', 'tracing'],
  ['voice-ai', 'Voice AI', 'ai', 1, 'realtime voice', 'speech agents', 'stt', 'tts'],
  ['pytorch', 'PyTorch', 'ai', 1, 'torch'],
  ['tensorflow', 'TensorFlow', 'ai', 1],
  ['hugging-face', 'Hugging Face', 'ai', 1, 'huggingface', 'transformers'],
  ['computer-vision', 'Computer vision', 'ai', 2, 'cv', 'image recognition'],
  ['nlp', 'NLP', 'ai', 2, 'natural language processing'],
  ['mlops', 'MLOps', 'ai', 2, 'ml ops'],
  ['vector-databases', 'Vector databases', 'ai', 1, 'vector db', 'embeddings'],
  ['pinecone', 'Pinecone', 'ai', 2],
  ['weaviate', 'Weaviate', 'ai', 2],
  ['chroma', 'Chroma', 'ai', 3, 'chromadb'],
  ['qdrant', 'Qdrant', 'ai', 3],
  ['pgvector', 'pgvector', 'ai', 3],
  ['vertex-ai', 'Vertex AI', 'ai', 2, 'google vertex'],
  ['aws-bedrock', 'AWS Bedrock', 'ai', 2, 'bedrock'],
  ['azure-openai', 'Azure OpenAI', 'ai', 2],
  ['mistral', 'Mistral', 'ai', 3],
  ['llama', 'Llama', 'ai', 3, 'meta llama', 'llama 3'],
  ['stable-diffusion', 'Stable Diffusion', 'ai', 3, 'diffusion'],
  ['whisper', 'Whisper', 'ai', 3, 'speech to text'],
  ['scikit-learn', 'scikit-learn', 'ai', 3, 'sklearn'],
  ['keras', 'Keras', 'ai', 3],
  ['mcp', 'MCP (Model Context Protocol)', 'ai', 2, 'model context protocol'],
  ['n8n-ai', 'n8n AI workflows', 'ai', 3],
  ['recommendation-systems', 'Recommendation systems', 'ai', 3, 'recsys'],
  ['forecasting', 'Forecasting & time series', 'ai', 3, 'time series'],

  // Data and analytics. Python is deliberately NOT repeated here: one canonical
  // entry per technology, or the picker offers the same thing twice and the CRM
  // ends up with two spellings of the same skill.
  ['sql', 'SQL', 'data', 1],
  ['snowflake', 'Snowflake', 'data', 1],
  ['databricks', 'Databricks', 'data', 1],
  ['bigquery', 'BigQuery', 'data', 1, 'big query'],
  ['dbt', 'dbt', 'data', 1, 'data build tool'],
  ['streaming-data', 'Streaming data', 'data', 2, 'real time data', 'cdc', 'change data capture'],
  ['airflow', 'Apache Airflow', 'data', 1, 'airflow'],
  ['spark', 'Apache Spark', 'data', 2, 'spark', 'pyspark'],
  ['kafka', 'Apache Kafka', 'data', 2, 'kafka'],
  ['redshift', 'Redshift', 'data', 2],
  ['power-bi', 'Power BI', 'data', 2, 'powerbi'],
  ['tableau', 'Tableau', 'data', 2],
  ['looker', 'Looker', 'data', 2, 'looker studio'],
  ['metabase', 'Metabase', 'data', 3],
  ['fivetran', 'Fivetran', 'data', 3],
  ['segment', 'Segment', 'data', 3],
  ['posthog', 'PostHog', 'data', 3],
  ['ga4', 'Google Analytics 4', 'data', 3, 'ga4', 'google analytics'],
  ['data-warehousing', 'Data warehousing', 'data', 2, 'warehouse'],
  ['etl', 'ETL / ELT pipelines', 'data', 2, 'etl', 'elt', 'pipelines'],
  ['flink', 'Apache Flink', 'data', 3, 'flink'],
  ['duckdb', 'DuckDB', 'data', 3],
  ['clickhouse', 'ClickHouse', 'data', 3],
  ['prefect', 'Prefect', 'data', 3],
  ['dagster', 'Dagster', 'data', 3],

  // Cloud, DevOps and platform.
  ['aws', 'AWS', 'devops', 1, 'amazon web services'],
  ['azure', 'Azure', 'devops', 1, 'microsoft azure'],
  ['gcp', 'Google Cloud', 'devops', 1, 'gcp', 'google cloud platform'],
  ['kubernetes', 'Kubernetes', 'devops', 1, 'k8s'],
  ['docker', 'Docker', 'devops', 1, 'containers'],
  ['terraform', 'Terraform', 'devops', 1, 'iac', 'infrastructure as code'],
  ['ci-cd', 'CI/CD', 'devops', 1, 'cicd', 'continuous integration', 'pipelines'],
  ['github-actions', 'GitHub Actions', 'devops', 1],
  ['linux', 'Linux', 'devops', 2, 'unix'],
  ['site-reliability', 'Site reliability (SRE)', 'devops', 2, 'sre', 'reliability'],
  ['observability', 'Observability & monitoring', 'devops', 2, 'monitoring', 'datadog', 'grafana'],
  ['vercel', 'Vercel', 'devops', 2],
  ['cloudflare', 'Cloudflare', 'devops', 2, 'workers'],
  ['serverless', 'Serverless', 'devops', 2, 'lambda', 'aws lambda'],
  ['ansible', 'Ansible', 'devops', 3],
  ['pulumi', 'Pulumi', 'devops', 3],
  ['argocd', 'Argo CD', 'devops', 3, 'argo'],
  ['helm', 'Helm', 'devops', 3],
  ['jenkins', 'Jenkins', 'devops', 3],
  ['gitlab-ci', 'GitLab CI', 'devops', 3],
  ['prometheus', 'Prometheus', 'devops', 3],
  ['grafana', 'Grafana', 'devops', 3],
  ['datadog', 'Datadog', 'devops', 3],
  ['nginx', 'NGINX', 'devops', 3],
  ['cloud-migration', 'Cloud migration', 'devops', 2, 'migration'],
  ['cost-optimisation', 'Cloud cost optimisation', 'devops', 3, 'finops'],
  ['security-engineering', 'Security engineering', 'devops', 2, 'appsec', 'devsecops', 'cyber'],
  ['platform-engineering', 'Platform engineering', 'devops', 2],

  // Backend.
  ['nodejs', 'Node.js', 'backend', 1, 'node'],
  ['python', 'Python', 'backend', 1, 'pandas', 'numpy'],
  ['typescript-backend', 'TypeScript', 'backend', 1, 'ts'],
  ['go', 'Go', 'backend', 1, 'golang'],
  ['java', 'Java', 'backend', 1],
  ['dotnet', '.NET', 'backend', 1, 'dot net', 'c#', 'csharp', 'asp.net'],
  ['php', 'PHP', 'backend', 1],
  ['laravel', 'Laravel', 'backend', 1],
  ['ruby-on-rails', 'Ruby on Rails', 'backend', 2, 'rails', 'ruby'],
  ['django', 'Django', 'backend', 2],
  ['fastapi', 'FastAPI', 'backend', 2],
  ['nestjs', 'NestJS', 'backend', 2, 'nest'],
  ['express', 'Express', 'backend', 2, 'expressjs'],
  ['spring-boot', 'Spring Boot', 'backend', 2, 'spring'],
  ['rust', 'Rust', 'backend', 1],
  ['elixir', 'Elixir', 'backend', 3, 'phoenix'],
  ['scala', 'Scala', 'backend', 3],
  ['kotlin-backend', 'Kotlin', 'backend', 3],
  ['graphql', 'GraphQL', 'backend', 2],
  ['rest-apis', 'REST APIs', 'backend', 2, 'api', 'apis'],
  ['grpc', 'gRPC', 'backend', 3],
  ['microservices', 'Microservices', 'backend', 2],
  ['event-driven', 'Event-driven architecture', 'backend', 3, 'events'],
  ['symfony', 'Symfony', 'backend', 3],
  ['flask', 'Flask', 'backend', 3],
  ['deno', 'Deno', 'backend', 3],
  ['bun', 'Bun', 'backend', 3],
  ['websockets', 'WebSockets', 'backend', 3, 'realtime'],
  ['webassembly', 'WebAssembly', 'backend', 3, 'wasm'],
  ['payments', 'Payments (Stripe)', 'backend', 2, 'stripe', 'billing'],
  ['auth', 'Auth & identity', 'backend', 2, 'oauth', 'sso', 'auth0', 'clerk'],

  // Frontend.
  ['react', 'React', 'frontend', 1, 'reactjs', 'react.js'],
  ['nextjs', 'Next.js', 'frontend', 1, 'next', 'nextjs'],
  ['edge-runtime', 'Edge & serverless runtimes', 'devops', 2, 'edge functions', 'workers'],
  ['typescript', 'TypeScript', 'frontend', 1, 'ts'],
  ['javascript', 'JavaScript', 'frontend', 1, 'js', 'es6'],
  ['vue', 'Vue.js', 'frontend', 1, 'vue', 'vuejs', 'nuxt'],
  ['angular', 'Angular', 'frontend', 1],
  ['tailwind', 'Tailwind CSS', 'frontend', 1, 'tailwind'],
  ['svelte', 'Svelte', 'frontend', 2, 'sveltekit'],
  ['html-css', 'HTML & CSS', 'frontend', 2, 'html', 'css', 'css3'],
  ['remix', 'Remix', 'frontend', 3],
  ['astro', 'Astro', 'frontend', 3],
  ['solid', 'SolidJS', 'frontend', 3],
  ['redux', 'Redux', 'frontend', 3, 'state management'],
  ['storybook', 'Storybook', 'frontend', 3],
  ['design-systems', 'Design systems', 'frontend', 2],
  ['accessibility', 'Accessibility (WCAG)', 'frontend', 2, 'a11y', 'wcag'],
  ['web-performance', 'Web performance', 'frontend', 3, 'core web vitals', 'lighthouse'],
  ['three-js', 'Three.js', 'frontend', 3, 'webgl', '3d'],
  ['figma-to-code', 'Figma to code', 'frontend', 3, 'figma'],

  // Mobile.
  ['react-native', 'React Native', 'mobile', 1],
  ['flutter', 'Flutter', 'mobile', 1, 'dart'],
  ['swift', 'Swift', 'mobile', 1, 'ios', 'swiftui'],
  ['kotlin', 'Kotlin', 'mobile', 1, 'android'],
  ['ios', 'iOS', 'mobile', 1, 'iphone', 'apple'],
  ['android', 'Android', 'mobile', 1],
  ['expo', 'Expo', 'mobile', 2],
  ['java-android', 'Java (Android)', 'mobile', 3],
  ['ionic', 'Ionic', 'mobile', 3],
  ['xamarin', 'Xamarin', 'mobile', 3],
  ['unity', 'Unity', 'mobile', 3, 'game development', 'games'],
  ['app-store', 'App Store & Play release', 'mobile', 3, 'app store', 'play store'],

  // Databases.
  ['postgresql', 'PostgreSQL', 'database', 1, 'postgres'],
  ['mysql', 'MySQL', 'database', 1],
  ['mongodb', 'MongoDB', 'database', 1, 'mongo'],
  ['redis', 'Redis', 'database', 2],
  ['supabase', 'Supabase', 'database', 2],
  ['firebase', 'Firebase', 'database', 2, 'firestore'],
  ['dynamodb', 'DynamoDB', 'database', 3],
  ['elasticsearch', 'Elasticsearch', 'database', 3, 'elastic', 'opensearch'],
  ['sql-server', 'SQL Server', 'database', 3, 'mssql', 't-sql'],
  ['oracle', 'Oracle', 'database', 3],
  ['neo4j', 'Neo4j', 'database', 3, 'graph database'],
  ['prisma', 'Prisma', 'database', 3, 'orm'],

  // QA and testing.
  ['test-automation', 'Test automation', 'qa', 1, 'automated testing', 'qa automation'],
  ['playwright', 'Playwright', 'qa', 1],
  ['cypress', 'Cypress', 'qa', 1],
  ['selenium', 'Selenium', 'qa', 2],
  ['jest', 'Jest', 'qa', 2, 'vitest'],
  ['manual-qa', 'Manual QA', 'qa', 2, 'manual testing'],
  ['performance-testing', 'Performance testing', 'qa', 3, 'load testing', 'k6'],
  ['api-testing', 'API testing', 'qa', 3, 'postman'],
  ['mobile-testing', 'Mobile testing', 'qa', 3, 'appium'],
  ['accessibility-testing', 'Accessibility testing', 'qa', 3],
  ['security-testing', 'Security testing', 'qa', 3, 'pen testing', 'penetration testing'],

  // No-code and automation.
  ['webflow', 'Webflow', 'nocode', 1],
  ['n8n', 'n8n', 'nocode', 1],
  ['zapier', 'Zapier', 'nocode', 1],
  ['make', 'Make (Integromat)', 'nocode', 2, 'integromat'],
  ['bubble', 'Bubble', 'nocode', 2],
  ['airtable', 'Airtable', 'nocode', 2],
  ['hubspot', 'HubSpot', 'nocode', 2, 'crm'],
  ['salesforce', 'Salesforce', 'nocode', 2, 'sfdc'],
  ['shopify', 'Shopify', 'nocode', 2, 'ecommerce'],
  ['wordpress', 'WordPress', 'nocode', 2, 'wp'],
  ['sanity', 'Sanity', 'nocode', 3, 'headless cms'],
  ['contentful', 'Contentful', 'nocode', 3],
  ['xano', 'Xano', 'nocode', 3],
  ['retool', 'Retool', 'nocode', 3],
  ['power-automate', 'Power Automate', 'nocode', 3, 'power platform'],
  ['dynamics', 'Microsoft Dynamics', 'nocode', 3, 'erp'],
  ['netsuite', 'NetSuite', 'nocode', 3],
  ['sharepoint', 'SharePoint', 'nocode', 3],
  ['twilio', 'Twilio', 'nocode', 3],
  ['sitecore', 'Sitecore', 'nocode', 3],
  ['magento', 'Magento', 'nocode', 3, 'adobe commerce'],
]

export const SKILLS: Skill[] = ROWS.map(([id, label, category, tier, ...aliases]) => ({
  id,
  label,
  category,
  tier,
  ...(aliases.length > 0 ? { aliases } : {}),
}))

export const SKILLS_BY_ID = new Map(SKILLS.map((s) => [s.id, s]))

/**
 * What shows before anyone types. Kept short, because a wall of pills is not a
 * choice, it is a wall.
 *
 * With no role chosen the pills are taken one category at a time rather than
 * straight off the top of the list. Source order alone would show twelve AI pills
 * to someone who came to hire a Laravel developer, which reads as though CE only
 * does one thing. AI still leads, because the category order here is the order of
 * `SKILL_CATEGORIES` and that is deliberate, but it does not crowd out the rest.
 */
export function defaultSkills(category?: SkillCategory, limit = 16): Skill[] {
  if (category) {
    const pool = SKILLS.filter((s) => s.category === category)
    const tier1 = pool.filter((s) => s.tier === 1)
    return [...tier1, ...pool.filter((s) => s.tier === 2)].slice(0, limit)
  }

  const byCategory = new Map<SkillCategory, Skill[]>()
  for (const key of Object.keys(SKILL_CATEGORIES) as SkillCategory[]) {
    byCategory.set(
      key,
      SKILLS.filter((s) => s.category === key && s.tier === 1),
    )
  }

  const picked: Skill[] = []
  for (let round = 0; picked.length < limit; round++) {
    let addedThisRound = false
    for (const list of byCategory.values()) {
      const next = list[round]
      if (!next) continue
      picked.push(next)
      addedThisRound = true
      if (picked.length === limit) break
    }
    if (!addedThisRound) break
  }
  return picked
}
