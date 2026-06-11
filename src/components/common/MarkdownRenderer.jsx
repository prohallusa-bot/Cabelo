import { useMemo } from 'react'

/**
 * Simple Markdown renderer without external dependencies
 * Supports: bold, italic, links, code, lists, headers
 */
const MarkdownRenderer = ({ content, className = '' }) => {
  const rendered = useMemo(() => {
    if (!content) return ''
    
    let html = content
    
    // Escape HTML to prevent XSS
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    // Code blocks (```code```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono">$1</pre>')
    
    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
    
    // Bold (**text** or __text__)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
    html = html.replace(/__([^_]+)__/g, '<strong class="font-bold">$1</strong>')
    
    // Italic (*text* or _text_)
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
    html = html.replace(/_([^_]+)_/g, '<em class="italic">$1</em>')
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary-dark">$1</a>')
    
    // Headers (## Header)
    html = html.replace(/^### (.+)$/gm, '<h3 class="font-bold text-base mt-3 mb-1">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg mt-3 mb-1">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-3 mb-2">$1</h1>')
    
    // Unordered lists (- item or * item)
    html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    
    // Numbered lists (1. item)
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    
    // Wrap consecutive list items
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      return `<ul class="my-2 space-y-1">${match}</ul>`
    })
    
    // Line breaks (double newline = paragraph)
    html = html.replace(/\n\n/g, '</p><p class="mt-2">')
    html = html.replace(/\n/g, '<br/>')
    
    // Wrap in paragraph
    html = `<p>${html}</p>`
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '')
    html = html.replace(/<p>\s*<\/p>/g, '')
    
    return html
  }, [content])

  return (
    <div 
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  )
}

export default MarkdownRenderer
