"use client"

import { Badge } from "@/components/ui/badge"

interface TemplateBuilderPreviewProps {
  template: any
  zoom: number
}

export function TemplateBuilderPreview({ template, zoom }: TemplateBuilderPreviewProps) {
  // A4 dimensions in pixels (at 96 DPI)
  const pageWidth = 794
  const pageHeight = 1123

  const renderMarkdown = (content: string) => {
    let html = content
      // Handle special elements first
      .replace(
        /\[CHART: ([^\]]+)\]\s*\nTitle: ([^\n]+)\s*\nData:\s*\n((?:- [^\n]+\n?)*)/g,
        (match, type, title, data) => {
          const dataLines = data
            .trim()
            .split("\n")
            .map((line: string) => {
              const [name, value] = line.replace("- ", "").split(": ")
              return { name, value: Number.parseInt(value) || 0 }
            })

          return `<div class="border border-gray-300 rounded-lg p-4 my-4">
          <div class="flex items-center gap-2 mb-4">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 9h2v9h-2v-9zm4-3h2v12h-2V9z"/></svg>
            <span class="font-medium">${title}</span>
          </div>
          <div class="h-48 bg-gray-50 rounded flex items-center justify-center">
            <div class="text-center text-gray-500">
              <div class="text-sm font-medium mb-2">${type}</div>
              ${dataLines.map((item: any) => `<div class="text-xs">${item.name}: ${item.value}</div>`).join("")}
            </div>
          </div>
        </div>`
        },
      )

      .replace(/\[TIMELINE: ([^\]]+)\]\s*\n((?:- [^\n]+\n?)*)/g, (match, title, events) => {
        const eventLines = events
          .trim()
          .split("\n")
          .map((line: string) => {
            const eventText = line.replace("- ", "")
            const [date, ...rest] = eventText.split(": ")
            const [eventTitle, description] = rest.join(": ").split(" - ")
            return { date, title: eventTitle, description }
          })

        return `<div class="border border-gray-300 rounded-lg p-4 my-4">
          <div class="flex items-center gap-2 mb-4">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
            <span class="font-medium">${title}</span>
          </div>
          <div class="space-y-3">
            ${eventLines
              .map(
                (event: any) => `
              <div class="flex gap-3">
                <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div class="font-medium text-sm">${event.title}</div>
                  <div class="text-xs text-gray-500">${event.date}</div>
                  <div class="text-sm text-gray-600">${event.description || ""}</div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>`
      })

      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-3 mt-6 text-gray-900">$1</h3>')
      .replace(
        /^## (.*$)/gm,
        '<h2 class="text-xl font-semibold mb-4 mt-8 text-gray-900 border-b border-gray-200 pb-2">$1</h2>',
      )
      .replace(
        /^# (.*$)/gm,
        '<h1 class="text-2xl font-bold mb-6 mt-8 text-gray-900 border-b-2 border-gray-200 pb-3">$1</h1>',
      )

      // Bold and Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold"><em class="italic">$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-900">$1</em>')

      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del class="line-through text-gray-500">$1</del>')

      // Code blocks
      .replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        '<pre class="bg-gray-100 border border-gray-300 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-gray-900">$2</code></pre>',
      )

      // Inline code
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm font-mono border border-gray-300">$1</code>',
      )

      // Links
      .replace(
        /\[([^\]]+)\]$$([^)]+)$$/g,
        '<a href="$2" class="text-blue-600 hover:text-blue-800 underline transition-colors" target="_blank" rel="noopener noreferrer">$1</a>',
      )

      // Images
      .replace(
        /!\[([^\]]*)\]$$([^)]+)$$/g,
        '<img src="$2" alt="$1" class="max-w-full h-auto my-4 rounded border border-gray-300" />',
      )

      // Blockquotes
      .replace(
        /^> (.*$)/gm,
        '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-900 italic">$1</blockquote>',
      )

      // Horizontal rules
      .replace(/^---$/gm, '<hr class="border-t border-gray-300 my-6">')

      // Tables
      .replace(/\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
        const headerCells = header
          .split("|")
          .map((cell: string) => cell.trim())
          .filter((cell: string) => cell)
        const rowData = rows
          .trim()
          .split("\n")
          .map((row: string) =>
            row
              .split("|")
              .map((cell: string) => cell.trim())
              .filter((cell: string) => cell),
          )

        return `<table class="w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr class="bg-gray-50">
              ${headerCells.map((cell: string) => `<th class="border border-gray-300 p-2 text-left text-sm font-medium">${cell}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rowData
              .map(
                (row: string[]) => `
              <tr>
                ${row.map((cell: string) => `<td class="border border-gray-300 p-2 text-sm">${cell}</td>`).join("")}
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>`
      })

      // Unordered lists
      .replace(/^- (.*$)/gm, '<li class="ml-4 my-1 text-gray-900 list-disc list-inside">$1</li>')

      // Ordered lists
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 my-1 text-gray-900 list-decimal list-inside">$1</li>')

      // Variables
      .replace(
        /\{\{([^}]+)\}\}/g,
        '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-mono border border-yellow-300">{{$1}}</span>',
      )

      // Line breaks
      .replace(/\n/g, "<br>")

    // Wrap consecutive list items
    html = html.replace(/(<li[^>]*>.*?<\/li>(<br>)*)+/g, (match) => {
      return '<ul class="my-3">' + match.replace(/<br>/g, "") + "</ul>"
    })

    return html
  }

  return (
    <div className="flex-1 bg-muted/30 overflow-auto">
      <div className="p-8">
        {/* Preview Container */}
        <div
          className="bg-white shadow-lg mx-auto relative"
          style={{
            width: pageWidth * (zoom / 100),
            minHeight: pageHeight * (zoom / 100),
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top left",
          }}
        >
          {/* Header */}
          {template.header?.enabled && (
            <div className="border-b border-gray-200 p-4 text-center text-sm text-gray-600 bg-gray-50">
              {template.header.content}
            </div>
          )}

          {/* Content */}
          <div className="p-16">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(template.content) }}
            />
          </div>

          {/* Footer */}
          {template.footer?.enabled && (
            <div className="absolute bottom-4 left-4 right-4 text-center text-sm text-gray-500 border-t border-gray-200 pt-2">
              {template.footer.content}
              {template.footer.showPageNumbers && <span className="ml-4">Page 1</span>}
            </div>
          )}
        </div>

        {/* Page Info */}
        <div className="flex justify-center mt-4">
          <Badge variant="secondary">
            Preview • {template.pageSettings.size} • {zoom}%
          </Badge>
        </div>
      </div>
    </div>
  )
}
