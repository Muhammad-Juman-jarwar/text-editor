"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
  Undo,
  Redo,
} from "lucide-react"

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  disabled?: boolean
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  className,
  minHeight = 200,
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Color options for text and highlighting
  const textColors = [
    "#000000", // Black
    "#374151", // Gray-700
    "#DC2626", // Red-600
    "#EA580C", // Orange-600
    "#D97706", // Amber-600
    "#65A30D", // Lime-600
    "#16A34A", // Green-600
    "#059669", // Emerald-600
    "#0891B2", // Cyan-600
    "#0284C7", // Sky-600
    "#2563EB", // Blue-600
    "#7C3AED", // Violet-600
    "#C026D3", // Fuchsia-600
    "#DC2626", // Rose-600
  ]

  const highlightColors = [
    "#FEF3C7", // Yellow-100
    "#DCFCE7", // Green-100
    "#DBEAFE", // Blue-100
    "#F3E8FF", // Purple-100
    "#FCE7F3", // Pink-100
    "#FED7AA", // Orange-100
    "#D1FAE5", // Emerald-100
    "#CFFAFE", // Cyan-100
    "#E0E7FF", // Indigo-100
    "#F9A8D4", // Pink-300
    "#A7F3D0", // Emerald-200
    "#BFDBFE", // Blue-200
  ]

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const executeCommand = (command: string, value?: string) => {
    if (disabled) return

    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const insertLink = () => {
    if (disabled) return

    const url = prompt("Enter the URL:")
    if (url) {
      executeCommand("createLink", url)
    }
  }

  const insertImage = () => {
    if (disabled) return

    const url = prompt("Enter the image URL:")
    if (url) {
      executeCommand("insertImage", url)
    }
  }

  const setTextColor = (color: string) => {
    executeCommand("foreColor", color)
  }

  const setHighlightColor = (color: string) => {
    executeCommand("hiliteColor", color)
  }

  const formatHeading = (level: string) => {
    executeCommand("formatBlock", level)
  }

  const formatAlignment = (alignment: string) => {
    executeCommand(`justify${alignment}`)
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Undo/Redo */}
          <Button variant="ghost" size="sm" onClick={() => executeCommand("undo")} disabled={disabled} title="Undo">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("redo")} disabled={disabled} title="Redo">
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <Button variant="ghost" size="sm" onClick={() => formatHeading("h1")} disabled={disabled} title="Heading 1">
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatHeading("h2")} disabled={disabled} title="Heading 2">
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => formatHeading("h3")} disabled={disabled} title="Heading 3">
            <Heading3 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Formatting */}
          <Button variant="ghost" size="sm" onClick={() => executeCommand("bold")} disabled={disabled} title="Bold">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("italic")} disabled={disabled} title="Italic">
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("underline")}
            disabled={disabled}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("strikeThrough")}
            disabled={disabled}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Colors */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" disabled={disabled} title="Text Color">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <p className="text-sm font-medium">Text Color</p>
                <div className="grid grid-cols-7 gap-1">
                  {textColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" disabled={disabled} title="Highlight Color">
                <Highlighter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <p className="text-sm font-medium">Highlight Color</p>
                <div className="grid grid-cols-6 gap-1">
                  {highlightColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setHighlightColor(color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatAlignment("Left")}
            disabled={disabled}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatAlignment("Center")}
            disabled={disabled}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatAlignment("Right")}
            disabled={disabled}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("insertUnorderedList")}
            disabled={disabled}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("insertOrderedList")}
            disabled={disabled}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Special Elements */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("formatBlock", "blockquote")}
            disabled={disabled}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("formatBlock", "pre")}
            disabled={disabled}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Media */}
          <Button variant="ghost" size="sm" onClick={insertLink} disabled={disabled} title="Insert Link">
            <Link className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={insertImage} disabled={disabled} title="Insert Image">
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "p-4 focus:outline-none overflow-y-auto prose prose-sm max-w-none",
            "prose-headings:mt-4 prose-headings:mb-2",
            "prose-p:my-2 prose-ul:my-2 prose-ol:my-2",
            "prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic",
            "prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded",
            "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
            disabled && "opacity-50 cursor-not-allowed",
            isFocused && "ring-2 ring-ring ring-offset-2",
          )}
          style={{ minHeight }}
          suppressContentEditableWarning={true}
          data-placeholder={placeholder}
        />

        {/* Placeholder */}
        {!value && !isFocused && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">{placeholder}</div>
        )}
      </div>
    </div>
  )
}
