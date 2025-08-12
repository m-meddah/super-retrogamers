"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Calendar, User, Trophy, Zap, Heart, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Console } from '@prisma/client'

interface EditorialArticleProps {
  console: Console & {
    editorialTitle?: string | null
    editorialContent?: string | null
    editorialAuthor?: string | null
    editorialPublishedAt?: Date | null
  }
}

export function EditorialArticle({ console }: EditorialArticleProps) {
  if (!console.editorialContent) {
    return null
  }

  const formatPublishDate = (date: Date | null) => {
    if (!date) return null
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  }

  return (
    <article className="mx-auto max-w-8xl">
      {/* Header de l'article */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-8 dark:border-gray-800 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="mb-6 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300">
            Article Éditorial
          </span>
        </div>
        
        {console.editorialTitle && (
          <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl">
            {console.editorialTitle}
          </h1>
        )}
        
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          {console.editorialAuthor && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Par {console.editorialAuthor}</span>
            </div>
          )}
          
          {console.editorialPublishedAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Publié {formatPublishDate(console.editorialPublishedAt)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span>{console.name} ({console.releaseYear})</span>
          </div>
        </div>
      </div>

      {/* Contenu de l'article */}
      <div className="prose prose-lg prose-gray max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:px-4 prose-th:py-2 prose-th:font-semibold prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2 dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-strong:text-white dark:prose-blockquote:border-blue-400 dark:prose-blockquote:bg-blue-950/20 dark:prose-code:bg-gray-800 dark:prose-code:text-gray-300 dark:prose-th:border-gray-600 dark:prose-th:bg-gray-800 dark:prose-td:border-gray-600">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            // Personnalisation des émojis en début de titre
            h1: ({ children, ...props }) => (
              <h1 {...props} className="flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 {...props} className="flex items-center gap-2 mt-8 mb-4">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 {...props} className="flex items-center gap-2 mt-6 mb-3">
                <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                {children}
              </h3>
            ),
            // Amélioration des tableaux
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto my-6">
                <table {...props} className="w-full rounded-lg border border-gray-200 dark:border-gray-700">
                  {children}
                </table>
              </div>
            ),
            // Style des blockquotes
            blockquote: ({ children, ...props }) => (
              <blockquote {...props} className="border-l-4 border-blue-500 bg-blue-50 py-4 px-6 my-6 italic dark:border-blue-400 dark:bg-blue-950/20">
                {children}
              </blockquote>
            ),
            // Style des liens
            a: ({ children, href, ...props }) => (
              <a 
                {...props} 
                href={href}
                className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            ),
          }}
        >
          {console.editorialContent}
        </ReactMarkdown>
      </div>

      {/* Footer de l'article */}
      <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Article sur {console.name}
            </span>
          </div>
          
          {console.editorialAuthor && (
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rédigé par
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {console.editorialAuthor}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}