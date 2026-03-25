import { WidgetType } from "@/components/ui/dashboard/types";

export interface PublicApiTemplate {
  id: string;
  title: string;
  description: string;
  type: WidgetType;
  apiUrl: string;
  category: string;
  emoji: string;
  tags: string[];
}

export const PUBLIC_API_TEMPLATES: PublicApiTemplate[] = [
  // ── Finance ────────────────────────────────────────────────────────────────
  {
    id: "crypto-market",
    title: "Crypto Market",
    description: "Top 10 coins by market cap — live prices & 24h changes",
    type: "crypto",
    apiUrl:
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1",
    category: "Finance",
    emoji: "📈",
    tags: ["crypto", "market", "finance"],
  },
  {
    id: "exchange-rates-usd",
    title: "Exchange Rates",
    description: "Live forex rates — interactive base currency & converter",
    type: "exchangeRates",
    apiUrl: "https://open.er-api.com/v6/latest/USD",
    category: "Finance",
    emoji: "💱",
    tags: ["forex", "currency", "exchange"],
  },

  // ── Tech / Dev ──────────────────────────────────────────────────────────────
  {
    id: "hacker-news",
    title: "Hacker News",
    description: "Front-page tech stories — category tabs, live links & scores",
    type: "news",
    apiUrl:
      "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10",
    category: "Tech",
    emoji: "📰",
    tags: ["tech", "news", "startups"],
  },
  {
    id: "github-nextjs",
    title: "GitHub Repo",
    description: "Stars, forks, issues — enter any repo owner/name",
    type: "github",
    apiUrl: "https://api.github.com/repos/vercel/next.js",
    category: "Tech",
    emoji: "⭐",
    tags: ["github", "open-source", "code"],
  },
  {
    id: "public-apis-list",
    title: "Public APIs Directory",
    description: "Browse public APIs categorised by topic",
    type: "table",
    apiUrl: "https://api.publicapis.org/entries",
    category: "Tech",
    emoji: "🔌",
    tags: ["apis", "dev", "directory"],
  },

  // ── Space ───────────────────────────────────────────────────────────────────
  {
    id: "spacex-latest",
    title: "SpaceX Launch",
    description: "Latest mission details — patch, crew, landing info & links",
    type: "spacex",
    apiUrl: "https://api.spacexdata.com/v4/launches/latest",
    category: "Space",
    emoji: "🚀",
    tags: ["space", "spacex", "launches"],
  },
  {
    id: "nasa-apod",
    title: "NASA Photo of the Day",
    description: "Astronomy picture of the day — date-picker included",
    type: "nasaApod",
    apiUrl: "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY",
    category: "Space",
    emoji: "🌌",
    tags: ["nasa", "astronomy", "photo"],
  },

  // ── Weather ─────────────────────────────────────────────────────────────────
  {
    id: "weather",
    title: "Weather",
    description: "Current conditions + 8-hour forecast — pick any of 8 cities",
    type: "weather",
    apiUrl:
      "https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current_weather=true",
    category: "Weather",
    emoji: "🌤️",
    tags: ["weather", "forecast", "temperature"],
  },

  // ── World / Geo ─────────────────────────────────────────────────────────────
  {
    id: "world-countries",
    title: "World Countries",
    description: "Search & filter 250 countries by name, region, population",
    type: "countries",
    apiUrl:
      "https://restcountries.com/v3.1/all?fields=name,population,region,area",
    category: "World",
    emoji: "🌍",
    tags: ["countries", "geography", "world"],
  },
  {
    id: "ip-info",
    title: "My IP & Location",
    description: "IP address, city, ISP, timezone, currency & more",
    type: "ipInfo",
    apiUrl: "https://ipapi.co/json/",
    category: "World",
    emoji: "📍",
    tags: ["ip", "location", "network"],
  },
  {
    id: "world-time",
    title: "Live Clock",
    description: "Live clock + timezone, DST, day of year via your IP",
    type: "worldTime",
    apiUrl: "https://worldtimeapi.org/api/ip",
    category: "World",
    emoji: "🕐",
    tags: ["time", "timezone", "clock"],
  },

  // ── Books / Education ───────────────────────────────────────────────────────
  {
    id: "open-library",
    title: "Book Search",
    description: "Search Open Library — covers, authors, publication years",
    type: "openLibrary",
    apiUrl:
      "https://openlibrary.org/search.json?q=javascript+programming&fields=title,author_name,first_publish_year,cover_i&limit=10",
    category: "Education",
    emoji: "📚",
    tags: ["books", "library", "search"],
  },

  // ── People / Data ───────────────────────────────────────────────────────────
  {
    id: "random-users",
    title: "Random Profiles",
    description: "Generated user profiles with photos — choose count",
    type: "randomUser",
    apiUrl: "https://randomuser.me/api/?results=6",
    category: "Data",
    emoji: "👥",
    tags: ["users", "people", "profiles"],
  },
  {
    id: "mock-posts",
    title: "Sample Posts",
    description: "10 sample blog posts (JSONPlaceholder)",
    type: "list",
    apiUrl: "https://jsonplaceholder.typicode.com/posts?_limit=10",
    category: "Data",
    emoji: "📝",
    tags: ["sample", "test", "posts"],
  },
  {
    id: "mock-users",
    title: "Sample Users Table",
    description: "10 sample users (JSONPlaceholder)",
    type: "table",
    apiUrl: "https://jsonplaceholder.typicode.com/users",
    category: "Data",
    emoji: "👤",
    tags: ["sample", "test", "users"],
  },
  {
    id: "mock-todos",
    title: "Sample Todos",
    description: "20 sample todos with completion status",
    type: "list",
    apiUrl: "https://jsonplaceholder.typicode.com/todos?_limit=20",
    category: "Data",
    emoji: "✅",
    tags: ["sample", "todos", "tasks"],
  },

  // ── Fun / Misc ──────────────────────────────────────────────────────────────
  {
    id: "joke",
    title: "Random Joke",
    description: "Setup → tap to reveal punchline, then refresh",
    type: "joke",
    apiUrl: "https://official-joke-api.appspot.com/random_joke",
    category: "Fun",
    emoji: "😄",
    tags: ["joke", "fun", "humor"],
  },
  {
    id: "advice",
    title: "Advice Slip",
    description: "A random actionable piece of advice",
    type: "advice",
    apiUrl: "https://api.adviceslip.com/advice",
    category: "Fun",
    emoji: "💬",
    tags: ["advice", "motivation", "fun"],
  },
  {
    id: "random-fact",
    title: "Random Fact",
    description: "An interesting (useless) fact with source",
    type: "fact",
    apiUrl: "https://uselessfacts.jsph.pl/api/v2/facts/random",
    category: "Fun",
    emoji: "💡",
    tags: ["fact", "trivia", "fun"],
  },
  {
    id: "dog-of-the-day",
    title: "Dog of the Day",
    description: "Random dog photo with breed name",
    type: "dogImage",
    apiUrl: "https://dog.ceo/api/breeds/image/random",
    category: "Fun",
    emoji: "🐕",
    tags: ["dog", "photo", "fun"],
  },
  {
    id: "cat-fact",
    title: "Cat Fact",
    description: "A random fact about cats",
    type: "text",
    apiUrl: "https://catfact.ninja/fact",
    category: "Fun",
    emoji: "🐱",
    tags: ["cat", "fact", "fun"],
  },
  {
    id: "pokemon",
    title: "Pokémon Browser",
    description: "Browse all Pokémon with sprites — paginated grid",
    type: "pokemon",
    apiUrl: "https://pokeapi.co/api/v2/pokemon?limit=20",
    category: "Fun",
    emoji: "⚡",
    tags: ["pokemon", "gaming", "fun"],
  },
];

export const TEMPLATE_CATEGORIES = [
  ...new Set(PUBLIC_API_TEMPLATES.map((t) => t.category)),
];
