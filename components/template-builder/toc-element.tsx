"use client"
import { cn } from "@/lib/utils"

interface TocEntry {
  title: string
  level: number
  page: number
}

interface TocElementProps {
  element: {
    id: string
    content: {
      title: string
      titleColor: string
      fontFamily: string
      fontSize: number
      textColor: string
      includedLevels: number[]
      bulletStyle: "bullet" | "number" | "none"
      indentSize: number
      showBorder: boolean
      borderStyle: "solid" | "dashed" | "dotted"
      borderColor: string
      borderWidth: number
      entries: TocEntry[]
    }
    position: { x: number; y: number; width: number; height: number }
  }
  zoom: number
  isSelected: boolean
  onSelect: () => void
}

export function TocElement({ element, zoom, isSelected, onSelect }: TocElementProps) {
  const { content, position } = element
  const scale = zoom / 100

  const getBulletSymbol = (level: number, index: number) => {
    switch (content.bulletStyle) {
      case "bullet":
        return "•"
      case "number":
        return `${index + 1}.`
      case "none":
        return ""
      default:
        return "•"
    }
  }

  const getIndentLevel = (level: number) => {
    return (level - 1) * content.indentSize
  }

  return (
    <div
      className={cn(
        "absolute cursor-pointer transition-all duration-200",
        isSelected && "ring-2 ring-blue-500 ring-offset-2",
      )}
      style={{
        left: position.x * scale,
        top: position.y * scale,
        width: position.width * scale,
        height: position.height * scale,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
      onClick={onSelect}
    >
      <div
        className="w-full h-full p-4 bg-white"
        style={{
          border: content.showBorder
            ? `${content.borderWidth}px ${content.borderStyle} ${content.borderColor}`
            : "none",
          fontFamily: content.fontFamily,
        }}
      >
        {/* Title */}
        <h3
          className="font-semibold mb-4"
          style={{
            color: content.titleColor,
            fontSize: `${content.fontSize + 2}px`,
            fontFamily: content.fontFamily,
          }}
        >
          {content.title}
        </h3>

        {/* TOC Entries */}
        <div className="space-y-2">
          {content.entries
            .filter((entry) => content.includedLevels.includes(entry.level))
            .map((entry, index) => (
              <div
                key={index}
                className="flex items-start gap-2"
                style={{
                  marginLeft: `${getIndentLevel(entry.level)}px`,
                  color: content.textColor,
                  fontSize: `${content.fontSize}px`,
                  fontFamily: content.fontFamily,
                }}
              >
                {content.bulletStyle !== "none" && (
                  <span className="flex-shrink-0 mt-0.5">{getBulletSymbol(entry.level, index)}</span>
                )}
                <div className="flex-1 flex justify-between items-start">
                  <span className="leading-tight">{entry.title}</span>
                  <span className="ml-2 flex-shrink-0 font-mono text-sm">{entry.page}</span>
                </div>
              </div>
            ))}
        </div>

        {/* Placeholder if no entries */}
        {content.entries.length === 0 && (
          <div
            className="text-gray-400 italic text-center py-8"
            style={{
              fontSize: `${content.fontSize}px`,
              fontFamily: content.fontFamily,
            }}
          >
            Table of contents will be generated automatically
          </div>
        )}
      </div>
    </div>
  )
}
