"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, 
  Combine, Split, Trash2, Plus, Minus, 
  Grid, Type
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Toggle } from "../ui/toggle"
import { ColorPicker } from "@/components/ui/color-picker"
import { useCallback, useEffect, useState } from 'react'

interface EnhancedTableComponentProps {
  initialContent?: string
  onUpdate?: (html: string) => void
  tableId?: string
  theme?: any
}

export function EnhancedTableComponent({ 
  initialContent = '<table><tbody><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr><tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr><tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr></tbody></table>',
  onUpdate,
  tableId = 'table-' + Date.now(),
  theme
}: EnhancedTableComponentProps) {
  // Table styling options
  const [borderColor, setBorderColor] = useState('#d1d5db')
  const [borderWidth, setBorderWidth] = useState(1)
  const [headerBgColor, setHeaderBgColor] = useState('#f8f9fa')
  const [cellBgColor, setCellBgColor] = useState('#ffffff')
  const [textColor, setTextColor] = useState('#1f2937')
  const [cellPadding, setCellPadding] = useState(8)
  const [showBorders, setShowBorders] = useState(true)
  const [hasHeader, setHasHeader] = useState(true)

  // Apply theme defaults if provided
  useEffect(() => {
    if (theme) {
      setTextColor(theme.colors.text || '#1f2937')
      setBorderColor(theme.colors.secondary || '#d1d5db')
    }
  }, [theme])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        blockquote: false,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'enhanced-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (onUpdate) onUpdate(html)
    },
    editorProps: {
      attributes: {
        class: 'outline-none p-2',
      },
    },
  })

  const updateTableStyles = useCallback(() => {
    if (!editor) return

    // Get the root element and apply table styles
    const root = document.getElementById(tableId)
    if (!root) return

    const tableElement = root.querySelector('table.enhanced-table')
    if (!tableElement) return

    // Apply border styles
    const borderStyle = showBorders ? `${borderWidth}px solid ${borderColor}` : 'none'
    ;(tableElement as HTMLElement).style.borderCollapse = 'collapse'
    ;(tableElement as HTMLElement).style.width = '100%'

    // Apply styles to table cells
    const cells = tableElement.querySelectorAll('td, th')
    cells.forEach(cell => {
      const cellElement = cell as HTMLElement
      cellElement.style.border = borderStyle
      cellElement.style.padding = `${cellPadding}px`
      cellElement.style.color = textColor

      // Apply header background color to header cells
      const tagName = cell.tagName ? cell.tagName.toLowerCase() : ''
      if (tagName === 'th') {
        cellElement.style.backgroundColor = headerBgColor
      } else {
        cellElement.style.backgroundColor = cellBgColor
      }
    })
  }, [editor, borderColor, borderWidth, cellBgColor, headerBgColor, textColor, cellPadding, showBorders, tableId])

  useEffect(() => {
    updateTableStyles()
  }, [updateTableStyles])

  // Add row function
  const addRow = () => {
    if (!editor) return
    editor.chain().focus().addRowAfter().run()
    updateTableStyles()
  }

  // Add column function
  const addColumn = () => {
    if (!editor) return
    editor.chain().focus().addColumnAfter().run()
    updateTableStyles()
  }

  // Delete row function
  const deleteRow = () => {
    if (!editor) return
    editor.chain().focus().deleteRow().run()
    updateTableStyles()
  }

  // Delete column function
  const deleteColumn = () => {
    if (!editor) return
    editor.chain().focus().deleteColumn().run()
    updateTableStyles()
  }

  // Merge cells function
  const mergeCells = () => {
    if (!editor) return
    editor.chain().focus().mergeCells().run()
    updateTableStyles()
  }

  // Split cell function
  const splitCell = () => {
    if (!editor) return
    editor.chain().focus().splitCell().run()
    updateTableStyles()
  }

  // Toggle borders function
  const toggleBorders = (pressed: boolean) => {
    setShowBorders(pressed)
    updateTableStyles()
  }

  // Optional: Add styling controls for individual cells in selection
  const setCellBackground = (color: string) => {
    if (!editor) return
    // Apply background color to selected cells
    editor.chain().focus().setCellAttribute('background', color).run()
    updateTableStyles()
  }

  // Toggle header function
  const toggleHeader = () => {
    setHasHeader(!hasHeader)
    if (editor) {
      editor.chain().focus().toggleHeaderRow().run()
      updateTableStyles()
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="table-editor-container" id={tableId}>
      <div className="table-toolbar flex flex-wrap gap-1 mb-2 p-2 bg-muted/20 rounded-md">
        <div className="flex items-center gap-1 mr-2 border-r pr-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={addRow} 
            className="h-8 w-8"
            title="Add Row"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={deleteRow} 
            className="h-8 w-8"
            title="Delete Row"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1 mr-2 border-r pr-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={addColumn} 
            className="h-8 w-8"
            title="Add Column"
          >
            <Plus className="rotate-90 h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={deleteColumn} 
            className="h-8 w-8"
            title="Delete Column"
          >
            <Minus className="rotate-90 h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1 mr-2 border-r pr-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={mergeCells} 
            className="h-8 w-8"
            title="Merge Cells"
          >
            <Combine className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={splitCell} 
            className="h-8 w-8" 
            title="Split Cell"
          >
            <Split className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1 mr-2 border-r pr-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            className={`h-8 w-8 ${editor.isActive('bold') ? 'bg-muted' : ''}`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            className={`h-8 w-8 ${editor.isActive('italic') ? 'bg-muted' : ''}`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1 mr-2 border-r pr-2">
          <Toggle 
            pressed={hasHeader} 
            onPressedChange={toggleHeader}
            title="Toggle Header Row"
            className="h-8"
            size="sm"
          >
            <Type className="h-4 w-4 mr-1" /> Header
          </Toggle>
          <Toggle 
            pressed={showBorders} 
            onPressedChange={toggleBorders}
            title="Toggle Borders"
            className="h-8"
            size="sm"
          >
            <Grid className="h-4 w-4 mr-1" /> Borders
          </Toggle>
        </div>
      </div>
      
      <div className="table-content-editor border rounded-md">
        <EditorContent editor={editor} />
      </div>
      
      <div className="table-styles-controls p-2 bg-muted/20 mt-2 rounded-md grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium block mb-1">Border Color</label>
          <ColorPicker value={borderColor} onChange={(color) => {
            setBorderColor(color)
            updateTableStyles()
          }} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Header Background</label>
          <ColorPicker value={headerBgColor} onChange={(color) => {
            setHeaderBgColor(color)
            updateTableStyles()
          }} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Cell Background</label>
          <ColorPicker value={cellBgColor} onChange={(color) => {
            setCellBgColor(color)
            updateTableStyles()
          }} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Text Color</label>
          <ColorPicker value={textColor} onChange={(color) => {
            setTextColor(color)
            updateTableStyles()
          }} />
        </div>
      </div>
    </div>
  )
}
