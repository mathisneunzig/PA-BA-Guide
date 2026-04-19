import 'server-only'
import MiniSearch from 'minisearch'
import { prisma } from '@/lib/prisma'

interface BookDoc {
  id: string
  title: string
  author: string
  description: string
  tags: string
  programmiersprachen: string
}

// Module-level singleton — rebuilt on demand, invalidated on mutations
let searchIndex: MiniSearch<BookDoc> | null = null

function buildIndex(docs: BookDoc[]): MiniSearch<BookDoc> {
  const ms = new MiniSearch<BookDoc>({
    fields: ['title', 'author', 'description', 'tags', 'programmiersprachen'],
    storeFields: ['id'],
    searchOptions: {
      fuzzy: 0.2,
      prefix: true,
      combineWith: 'OR',
    },
  })
  ms.addAll(docs)
  return ms
}

export async function getSearchIndex(): Promise<MiniSearch<BookDoc>> {
  if (searchIndex) return searchIndex

  const books = await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      author: true,
      description: true,
      tags: true,
      programmiersprachen: true,
    },
  })

  const docs: BookDoc[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    description: b.description ?? '',
    tags: b.tags ?? '',
    programmiersprachen: b.programmiersprachen ?? '',
  }))

  searchIndex = buildIndex(docs)
  return searchIndex
}

/** Call after any book create / update / delete to force a rebuild on next search. */
export function invalidateSearchIndex(): void {
  searchIndex = null
}
