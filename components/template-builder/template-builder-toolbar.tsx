"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  ImageIcon,
  Table,
  BarChart3,
  Type,
  Palette,
  Heading,
  ChevronDown,
  Columns,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"

interface TemplateBuilderToolbarProps {
  template: any
  selectedPage: any
  onUpdatePage: (pageId: string, updates: any) => void
}

const fontFamilies = ["Arial", "Times New Roman", "Helvetica", "Georgia", "Verdana", "Calibri", "Inter", "Roboto"]

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48]

const headingLevels = [
  { value: "h1", label: "Title 1", size: "32px" },
  { value: "h2", label: "Title 2", size: "28px" },
  { value: "h3", label: "Title 3", size: "24px" },
  { value: "h4", label: "Title 4", size: "20px" },
  { value: "h5", label: "Title 5", size: "18px" },
]

export function TemplateBuilderToolbar({ template, selectedPage, onUpdatePage }: TemplateBuilderToolbarProps) {
  const [currentFont, setCurrentFont] = useState("Arial")
  const [currentSize, setCurrentSize] = useState("14")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [currentHeadingLevel, setCurrentHeadingLevel] = useState<string | null>(null)

  // Default theme values with proper fallbacks
  const defaultTheme = {
    colors: {
      text: "#000000",
      pageBackground: "#ffffff",
      primary: "#dc2626", // Red color for headings
      secondary: "#6b7280",
    },
    typography: {
      bodyFont: "Arial, sans-serif",
      headingFont: "Arial, sans-serif",
      bodyFontSize: 14,
      headingFontSize: 18,
      lineSpacing: 1.5,
    },
  }

  // Merge template theme with defaults
  const effectiveTheme = {
    colors: {
      ...defaultTheme.colors,
      ...template?.theme?.colors,
    },
    typography: {
      ...defaultTheme.typography,
      ...template?.theme?.typography,
    },
  }

  const defaultTocSettings = {
    title: "Table of Contents",
    titleColor: effectiveTheme.colors.primary, // Use primary color for TOC title
    fontFamily: effectiveTheme.typography.bodyFont,
    fontSize: effectiveTheme.typography.bodyFontSize,
    textColor: effectiveTheme.colors.text,
    headingLevels: [1, 2, 3],
    bulletStyle: "numbers",
    indentSize: 20,
    showBorder: false,
    borderStyle: "solid",
    borderColor: "#d1d5db",
    borderWidth: 1,
  }

  const defaultChartSettings = {
    title: "Chart Title",
    type: "bar",
    width: 400,
    height: 300,
    showTitle: true,
    showLegend: true,
    showValues: true,
    titleColor: effectiveTheme.colors.primary, // Use primary color for chart title
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    data: [
      { label: "Critical", value: 5, color: "#dc2626" },
      { label: "High", value: 12, color: "#ea580c" },
      { label: "Medium", value: 8, color: "#d97706" },
      { label: "Low", value: 3, color: "#65a30d" },
      { label: "Info", value: 2, color: "#0891b2" },
    ],
  }

  const defaultTableSettings = {
    rows: 3,
    columns: 3,
    showBorders: true,
    borderColor: "#d1d5db",
    borderWidth: 1,
    headerBackgroundColor: "#f8f9fa",
    headerTextColor: effectiveTheme.colors.primary, // Use primary color for table headers
    cellBackgroundColor: "#ffffff",
    cellTextColor: effectiveTheme.colors.text,
    cellPadding: 12,
    fontSize: effectiveTheme.typography.bodyFontSize,
    fontFamily: effectiveTheme.typography.bodyFont,
  }

  const dummyTocEntries = [
    { title: "Executive Summary", level: 1, page: 3 },
    { title: "Methodology", level: 1, page: 5 },
    { title: "Findings", level: 1, page: 8 },
    { title: "Risk Assessment", level: 1, page: 15 },
    { title: "Recommendations", level: 1, page: 20 },
    { title: "Scope and Limitations", level: 2, page: 6 },
    { title: "Testing Approach", level: 2, page: 7 },
    { title: "High Risk Issues", level: 2, page: 12 },
    { title: "Business Impact", level: 2, page: 16 },
    { title: "Technical Risks", level: 2, page: 18 },
    { title: "Immediate Actions", level: 2, page: 21 },
    { title: "Data Exposure", level: 3, page: 14 },
    { title: "Financial Impact", level: 3, page: 17 },
    { title: "Operational Risk", level: 3, page: 19 },
    { title: "API Endpoints", level: 4, page: 14 },
  ]

  useEffect(() => {
    const updateToolbarState = () => {
      try {
        setIsBold(document.queryCommandState("bold"))
        setIsItalic(document.queryCommandState("italic"))
        setIsUnderline(document.queryCommandState("underline"))
      } catch (e) {
        /* Ignore */
      }
    }
    document.addEventListener("selectionchange", updateToolbarState)
    return () => document.removeEventListener("selectionchange", updateToolbarState)
  }, [])

  const execCommand = (command: string, value?: string) => {
    try {
      const editor =
        (document.querySelector('[contenteditable="true"]:not(.layout-column-content)') as HTMLElement) ||
        (document.activeElement as HTMLElement)
      if (editor && (editor.isContentEditable || (editor.closest && editor.closest('[contenteditable="true"]')))) {
        const targetEditor = editor.closest('[contenteditable="true"]') || editor
        ;(targetEditor as HTMLElement).focus()
        document.execCommand(command, false, value)
        ;(targetEditor as HTMLElement).focus()
      } else {
        // Fallback to the main editor if no specific contenteditable is focused
        const mainEditor = document.querySelector(
          '.template-builder-editor-content-area [contenteditable="true"]',
        ) as HTMLElement
        if (mainEditor) {
          mainEditor.focus()
          document.execCommand(command, false, value)
          mainEditor.focus()
        }
      }
    } catch (e) {
      console.error("Command execution failed:", e)
    }
  }

  const handleFontChange = (font: string) => {
    setCurrentFont(font)
    execCommand("fontName", font)
  }

  const handleSizeChange = (size: string) => {
    setCurrentSize(size)
    const htmlSize = Math.min(7, Math.max(1, Math.round(Number.parseInt(size) / 6)))
    execCommand("fontSize", htmlSize.toString())
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (!range.collapsed) {
        const span = document.createElement("span")
        span.style.fontSize = `${size}px`
        try {
          range.surroundContents(span)
        } catch (e) {
          execCommand("insertHTML", `<span style="font-size: ${size}px">${range.toString()}</span>`)
        }
      }
    }
  }

  const insertHeading = (level: string) => {
    const selection = window.getSelection()
    const selectedText = selection?.toString() || `Heading ${level.toUpperCase()}`
    const headingConfig = headingLevels.find((h) => h.value === level)
    const fontSize = headingConfig?.size || "24px"
    const headingHTML = `<${level} style="font-size: ${fontSize}; font-weight: bold; margin: 16px 0 12px 0; line-height: 1.2; color: ${effectiveTheme.colors.primary};">${selectedText}</${level}><p><br></p>`
    execCommand("insertHTML", headingHTML)
  }

  const toRoman = (num: number): string => {
    const romanNumerals = [
      { value: 1000, symbol: "M" },
      { value: 900, symbol: "CM" },
      { value: 500, symbol: "D" },
      { value: 400, symbol: "CD" },
      { value: 100, symbol: "C" },
      { value: 90, symbol: "XC" },
      { value: 50, symbol: "L" },
      { value: 40, symbol: "XL" },
      { value: 10, symbol: "X" },
      { value: 9, symbol: "IX" },
      { value: 5, symbol: "V" },
      { value: 4, symbol: "IV" },
      { value: 1, symbol: "I" },
    ]
    let result = ""
    for (const { value, symbol } of romanNumerals) {
      while (num >= value) {
        result += symbol
        num -= value
      }
    }
    return result
  }

  const getBulletSymbol = (entry: any, index: number, filteredEntries: any[]) => {
    if (defaultTocSettings.bulletStyle === "none") return ""
    if (defaultTocSettings.bulletStyle === "numbers") {
      const numbering: number[] = []
      for (let level = 1; level <= entry.level; level++) {
        const entriesAtLevel = filteredEntries.slice(0, index + 1).filter((e) => e.level === level)
        if (level === entry.level) {
          numbering.push(entriesAtLevel.length)
        } else {
          const lastParent = entriesAtLevel[entriesAtLevel.length - 1]
          if (lastParent) {
            const parentIndex = filteredEntries.indexOf(lastParent)
            if (parentIndex <= index) {
              numbering.push(entriesAtLevel.length)
            }
          }
        }
      }
      return numbering.join(".") + "."
    }
    if (defaultTocSettings.bulletStyle === "roman") {
      if (entry.level === 1) {
        const h1Count = filteredEntries.slice(0, index + 1).filter((e) => e.level === 1).length
        return toRoman(h1Count) + "."
      } else if (entry.level === 2) {
        const h2Count = filteredEntries.slice(0, index + 1).filter((e) => e.level === 2).length
        return toRoman(h2Count).toLowerCase() + ")"
      } else if (entry.level === 3) {
        const h3Count = filteredEntries.slice(0, index + 1).filter((e) => e.level === 3).length
        const letter = String.fromCharCode(96 + h3Count)
        return letter + ")"
      } else {
        const count = filteredEntries.slice(0, index + 1).filter((e) => e.level === entry.level).length
        return `(${count})`
      }
    }
    if (defaultTocSettings.bulletStyle === "bullets") {
      const bullets = ["•", "◦", "▪", "▫", "‣"]
      return bullets[Math.min(entry.level - 1, bullets.length - 1)]
    }
    return ""
  }

  const detectCurrentHeadingLevel = useCallback(() => {
    try {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        setCurrentHeadingLevel(null)
        return
      }
      const range = selection.getRangeAt(0)
      let element = range.startContainer
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentNode
      }
      while (element && element !== document.body) {
        if (element.nodeType === Node.ELEMENT_NODE) {
          const tagName = (element as Element).tagName.toLowerCase()
          if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
            setCurrentHeadingLevel(tagName)
            return
          }
        }
        element = element.parentNode
      }
      setCurrentHeadingLevel(null)
    } catch (e) {
      setCurrentHeadingLevel(null)
    }
  }, [])

  const handleAlignment = (alignment: "left" | "center" | "right" | "justify") => {
    const selectedElement = document.querySelector("[data-element-type].selected") as HTMLElement
    if (selectedElement) {
      const alignmentStyles = { left: "flex-start", center: "center", right: "flex-end", justify: "stretch" }
      const container = selectedElement.parentElement
      if (container && container.classList.contains("element-container")) {
        container.style.justifyContent = alignmentStyles[alignment]
      } else {
        const newContainer = document.createElement("div")
        newContainer.className = "element-container"
        newContainer.style.cssText = `display: flex; width: 100%; margin: 16px 0; justify-content: ${alignmentStyles[alignment]};`
        selectedElement.parentNode?.insertBefore(newContainer, selectedElement)
        newContainer.appendChild(selectedElement)
      }
    } else {
      const commands = { left: "justifyLeft", center: "justifyCenter", right: "justifyRight", justify: "justifyFull" }
      execCommand(commands[alignment])
    }
  }

  useEffect(() => {
    const handleSelectionChange = () => detectCurrentHeadingLevel()
    document.addEventListener("selectionchange", handleSelectionChange)
    return () => document.removeEventListener("selectionchange", handleSelectionChange)
  }, [detectCurrentHeadingLevel])

  const generateTocHtml = () => {
    const filteredEntries = dummyTocEntries.filter((entry) => defaultTocSettings.headingLevels.includes(entry.level))
    return `
     <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
       <div style="background: white; font-family: ${defaultTocSettings.fontFamily}; position: relative; ${defaultTocSettings.showBorder ? `border: ${defaultTocSettings.borderWidth}px ${defaultTocSettings.borderStyle} ${defaultTocSettings.borderColor};` : ""}" data-element-type="toc" data-element-id="toc-${Date.now()}" draggable="false" contenteditable="false">
         <div class="drag-handle content-element-drag-handle" style="position: absolute; top: 8px; left: -24px; width: 16px; height: 16px; background: #cbd5e1; border-radius: 50%; cursor: grab; display: flex; align-items: center; justify-content: center; opacity: 0.5; transition: opacity 0.2s;" title="Select ToC"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
         <div style="padding: 16px;">
           <h3 style="color: ${defaultTocSettings.titleColor}; font-family: ${defaultTocSettings.fontFamily}; font-size: ${defaultTocSettings.fontSize + 4}px; font-weight: 600; margin: 0 0 16px 0;">${defaultTocSettings.title}</h3>
           <div style="display: flex; flex-direction: column; gap: 8px;">
             ${filteredEntries
               .map((entry, index) => {
                 const bullet = getBulletSymbol(entry, index, filteredEntries)
                 const indent = (entry.level - 1) * defaultTocSettings.indentSize
                 return `<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-left: ${indent}px; color: ${defaultTocSettings.textColor}; font-family: ${defaultTocSettings.fontFamily}; font-size: ${defaultTocSettings.fontSize}px; line-height: 1.4;">
                           <div style="display: flex; align-items: flex-start; flex: 1; min-width: 0;">
                             ${bullet ? `<span style="margin-right: 8px; flex-shrink: 0; font-weight: 500; min-width: ${defaultTocSettings.bulletStyle === "roman" ? "40px" : "30px"};">${bullet}</span>` : ""}
                             <span style="flex: 1; word-break: break-word;">${entry.title}</span>
                           </div>
                           <span style="margin-left: 16px; flex-shrink: 0; font-family: 'Courier New', monospace; font-size: ${Math.max(defaultTocSettings.fontSize - 1, 10)}px; color: ${defaultTocSettings.textColor}; opacity: 0.8;">${entry.page}</span>
                         </div>`
               })
               .join("")}
           </div>
         </div>
       </div>
     </div>`
  }

  const generateChartHtml = () => {
    const { title, width, height, showTitle, showLegend, data, titleColor, backgroundColor, borderColor, borderWidth } =
      defaultChartSettings
    const chartAreaHeight = height - (showTitle ? 40 : 0) - (showLegend ? 60 : 0)
    const maxValue = Math.max(...data.map((d) => d.value))
    const barWidth = Math.max(20, (width - 80) / data.length - 10)
    return `
     <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
       <div style="width: ${width}px; height: ${height}px; background: ${backgroundColor}; border: ${borderWidth}px solid ${borderColor}; border-radius: 8px; padding: 16px; font-family: ${effectiveTheme.typography.bodyFont}; cursor: default; position: relative;" data-element-type="chart" data-element-id="chart-${Date.now()}" data-chart-settings='${JSON.stringify(defaultChartSettings)}' draggable="false" contenteditable="false">
         <div class="drag-handle content-element-drag-handle" style="position: absolute; top: 8px; left: -24px; width: 16px; height: 16px; background: #cbd5e1; border-radius: 50%; cursor: grab; display: flex; align-items: center; justify-content: center; opacity: 0.5; transition: opacity 0.2s;" title="Select Chart"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
         ${showTitle ? `<h3 style="margin: 0 0 16px 0; text-align: center; color: ${titleColor}; font-size: 16px; font-weight: bold;">${title}</h3>` : ""}
         <div style="display: flex; align-items: end; justify-content: center; height: ${chartAreaHeight - 40}px; padding: 20px;">
           ${data
             .map(
               (item) => `<div style="display: flex; flex-direction: column; align-items: center; margin: 0 5px;">
                                 <div style="width: ${barWidth}px; height: ${(item.value / maxValue) * (chartAreaHeight - 80)}px; background-color: ${item.color}; border-radius: 4px 4px 0 0; position: relative;">
                                   <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 12px; font-weight: bold; color: ${effectiveTheme.colors.text};">${item.value}</div>
                                 </div>
                                 <div style="margin-top: 8px; font-size: 12px; text-align: center; max-width: ${barWidth + 10}px; word-wrap: break-word; color: ${effectiveTheme.colors.text};">${item.label}</div>
                               </div>`,
             )
             .join("")}
         </div>
         ${
           showLegend
             ? `<div style="display: flex; justify-content: center; flex-wrap: wrap; margin-top: 16px; gap: 12px;">
                           ${data
                             .map(
                               (item) => `<div style="display: flex; align-items: center; gap: 6px;">
                                                 <div style="width: 12px; height: 12px; background: ${item.color}; border-radius: 2px;"></div>
                                                 <span style="font-size: 12px; color: ${effectiveTheme.colors.text};">${item.label}</span>
                                               </div>`,
                             )
                             .join("")}
                         </div>`
             : ""
         }
       </div>
     </div>`
  }

  const generateTableHtml = () => {
    const {
      rows,
      columns,
      showBorders,
      borderColor,
      borderWidth,
      headerBackgroundColor,
      headerTextColor,
      cellBackgroundColor,
      cellTextColor,
      cellPadding,
      fontSize,
      fontFamily,
    } = defaultTableSettings
    const borderStyle = showBorders ? `${borderWidth}px solid ${borderColor}` : "none"
    const tableData = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: columns }, (_, c) => ({
        content: r === 0 ? `Header ${c + 1}` : `Cell ${r}-${c + 1}`,
        isHeader: r === 0,
        backgroundColor: r === 0 ? headerBackgroundColor : cellBackgroundColor,
        textColor: r === 0 ? headerTextColor : cellTextColor,
      })),
    )
    return `
   <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
     <div style="position: relative;" draggable="false" data-element-type="table" data-element-id="table-${Date.now()}" data-table-settings='${JSON.stringify({ ...defaultTableSettings, data: tableData.map((row) => row.map((cell) => ({ ...cell, colspan: 1, rowspan: 1, textAlign: "left", merged: false }))) })}' contenteditable="false">
       <div class="drag-handle content-element-drag-handle" style="position: absolute; top: 8px; left: -24px; width: 16px; height: 16px; background: #cbd5e1; border-radius: 50%; cursor: grab; display: flex; align-items: center; justify-content: center; opacity: 0.5; transition: opacity 0.2s;" title="Select Table"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
       <table style="width: 100%; border-collapse: collapse; border: ${borderStyle}; font-family: ${fontFamily}; font-size: ${fontSize}px;">
         ${tableData.map((row, rowIndex) => `<tr>${row.map((cell, colIndex) => `<${cell.isHeader ? "th" : "td"} style="border: ${borderStyle}; padding: ${cellPadding}px; background-color: ${cell.backgroundColor}; color: ${cell.textColor}; text-align: left; font-weight: ${cell.isHeader ? "bold" : "normal"};" data-row="${rowIndex}" data-col="${colIndex}" contenteditable="true">${cell.content}</${cell.isHeader ? "th" : "td"}>`).join("")}</tr>`).join("")}
       </table>
     </div>
   </div>`
  }

  const generateLayoutHtml = () => {
    const layoutId = `layout-${Date.now()}`
    return `
     <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
       <div 
         class="layout-element" 
         data-element-type="layout" 
         data-element-id="${layoutId}" 
         data-settings='{"columns":2,"columnGap":16,"backgroundColor":"#ffffff","borderColor":"#e5e7eb","borderWidth":1,"borderRadius":8,"padding":16,"minHeight":120}' 
         style="width: 100%; min-height: 120px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: flex; gap: 16px; position: relative;"
         contenteditable="false" 
       >
         <div class="drag-handle content-element-drag-handle" style="position: absolute; top: 8px; left: -24px; width: 16px; height: 16px; background: #cbd5e1; border-radius: 50%; cursor: grab; display: flex; align-items: center; justify-content: center; opacity: 0.5; transition: opacity 0.2s;" title="Select Layout"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
         <div class="layout-column" style="flex: 1; min-height: 80px; border: 2px dashed #d1d5db; border-radius: 4px; padding: 12px; position: relative; display: flex; flex-direction: column;">
           <div style="position: absolute; top: 4px; right: 4px; font-size: 10px; color: #9ca3af; pointer-events: none; display: flex; align-items: center; gap: 2px;">
             <svg style="width:12px; height:12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
           </div>
           <div class="layout-column-content" contenteditable="true" style="flex: 1; outline: none; font-size: ${effectiveTheme.typography.bodyFontSize}px; color: ${effectiveTheme.colors.text}; line-height: 1.5; min-height: 60px; padding-top: 20px; cursor: text; font-family: ${effectiveTheme.typography.bodyFont};">
             <p style="color: #9ca3af; font-style: italic; margin: 0;">Click to add content...</p>
           </div>
         </div>
         <div class="layout-column" style="flex: 1; min-height: 80px; border: 2px dashed #d1d5db; border-radius: 4px; padding: 12px; position: relative; display: flex; flex-direction: column;">
           <div style="position: absolute; top: 4px; right: 4px; font-size: 10px; color: #9ca3af; pointer-events: none; display: flex; align-items: center; gap: 2px;">
             <svg style="width:12px; height:12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
           </div>
           <div class="layout-column-content" contenteditable="true" style="flex: 1; outline: none; font-size: ${effectiveTheme.typography.bodyFontSize}px; color: ${effectiveTheme.colors.text}; line-height: 1.5; min-height: 60px; padding-top: 20px; cursor: text; font-family: ${effectiveTheme.typography.bodyFont};">
             <p style="color: #9ca3af; font-style: italic; margin: 0;">Click to add content...</p>
           </div>
         </div>
       </div>
     </div>
   `
  }

  const generateImagePlaceholderHtml = () => {
    return `
    <div class="element-container" style="display: flex; width: 100%; margin: 16px 0; justify-content: flex-start;" contenteditable="false">
      <div style="width: 300px; height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #f3f4f6; border: 2px dashed #d1d5db; color: #6b7280; border-radius: 8px; cursor: default; position: relative;" 
           data-element-type="image" data-element-id="image-${Date.now()}" 
           data-settings='${JSON.stringify({ src: "", alt: "Image", width: 300, height: 200, maintainAspectRatio: true, alignment: "left", borderWidth: 0, borderColor: "#e5e7eb", borderStyle: "solid", borderRadius: 0, opacity: 100, rotation: 0, shadow: false, shadowColor: "#000000", shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 4 })}' 
           draggable="false" contenteditable="false">
        <div class="drag-handle content-element-drag-handle" style="position: absolute; top: 8px; left: -24px; width: 16px; height: 16px; background: #cbd5e1; border-radius: 50%; cursor: grab; display: flex; align-items: center; justify-content: center; opacity: 0.5; transition: opacity 0.2s;" title="Select Image"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
        <div style="font-size: 48px; margin-bottom: 8px;">🖼️</div>
        <div style="font-weight: 600; margin-bottom: 4px; color: ${effectiveTheme.colors.text};">Click to add image</div>
        <div style="font-size: 12px; color: ${effectiveTheme.colors.text};">or drag and drop</div>
      </div>
    </div>`
  }

  const insertElement = (type: string) => {
    const editor = document.querySelector(
      '.template-builder-editor-content-area [contenteditable="true"]',
    ) as HTMLElement
    if (!editor) {
      console.warn("Main content editor not found for inserting element.")
      return
    }

    let html = ""
    switch (type) {
      case "table":
        html = generateTableHtml()
        break
      case "chart":
        html = generateChartHtml()
        break
      case "image":
        html = generateImagePlaceholderHtml()
        break
      case "toc":
        html = generateTocHtml()
        break
      case "layout":
        html = generateLayoutHtml()
        break
    }

    if (html) {
      editor.focus()

      // Get current selection or create one at the end
      const selection = window.getSelection()
      let range: Range

      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
        // Check if selection is within the main editor
        if (!editor.contains(range.commonAncestorContainer)) {
          // Selection is outside, move to end of editor
          range = document.createRange()
          range.selectNodeContents(editor)
          range.collapse(false)
        }
      } else {
        // No selection, create one at the end of the editor
        range = document.createRange()
        range.selectNodeContents(editor)
        range.collapse(false)
      }

      // Clear selection and set new range
      selection?.removeAllRanges()
      selection?.addRange(range)

      // Insert the HTML
      document.execCommand("insertHTML", false, html)

      // Immediately save the content to prevent disappearing
      setTimeout(() => {
        if (selectedPage && onUpdatePage) {
          onUpdatePage(selectedPage.id, { content: editor.innerHTML })
        }
      }, 50) // Reduced timeout for faster saving

      // Add a trailing paragraph for better cursor placement
      setTimeout(() => {
        const trailingP = document.createElement("p")
        trailingP.innerHTML = "&nbsp;"
        trailingP.style.color = effectiveTheme.colors.text
        editor.appendChild(trailingP)

        // Place cursor after the inserted element
        const newRange = document.createRange()
        newRange.setStartAfter(trailingP)
        newRange.collapse(true)
        selection?.removeAllRanges()
        selection?.addRange(newRange)
      }, 100)
    }
  }

  const insertLink = () => {
    const url = prompt("Enter URL:")
    if (url) {
      const selection = window.getSelection()
      const selectedText = selection?.toString() || "Link"
      execCommand(
        "insertHTML",
        `<a href="${url}" style="color: #0066cc; text-decoration: underline;">${selectedText}</a>`,
      )
    }
  }

  return (
    <div className="bg-background border-b border-border p-2 sticky top-0 z-10 template-builder-toolbar">
      <div className="flex items-center gap-1 flex-wrap">
        <Select value={currentFont} onValueChange={handleFontChange}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-foreground">
            {fontFamilies.map((font) => (
              <SelectItem key={font} value={font}>
                <span style={{ fontFamily: font }}>{font}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currentSize} onValueChange={handleSizeChange}>
          <SelectTrigger className="w-16 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-foreground">
            {fontSizes.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-foreground">
              <Heading className="h-4 w-4" />
              {currentHeadingLevel && (
                <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {currentHeadingLevel.toUpperCase()}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="space-y-1">
              {headingLevels.map((h) => (
                <Button
                  key={h.value}
                  variant={currentHeadingLevel === h.value ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start h-8 text-foreground"
                  onClick={() => insertHeading(h.value)}
                >
                  <span style={{ fontSize: h.size, fontWeight: "bold" }}>{h.label}</span>
                  {currentHeadingLevel === h.value && <span className="ml-auto text-xs">Current</span>}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant={isBold ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => execCommand("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={isItalic ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => execCommand("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={isUnderline ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => execCommand("underline")}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-foreground">
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <ColorPicker color="#000000" onChange={(color) => execCommand("foreColor", color)} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-foreground">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <ColorPicker color="#ffffff" onChange={(color) => execCommand("backColor", color)} />
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => handleAlignment("left")}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => handleAlignment("center")}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => handleAlignment("right")}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => handleAlignment("justify")}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => execCommand("insertUnorderedList")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground"
          onClick={() => execCommand("insertOrderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button variant="ghost" size="sm" className="h-8 text-foreground" onClick={() => insertElement("table")}>
          <Table className="h-4 w-4 mr-1" />
          Table
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-foreground" onClick={() => insertElement("chart")}>
          <BarChart3 className="h-4 w-4 mr-1" />
          Chart
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-foreground" onClick={() => insertElement("image")}>
          <ImageIcon className="h-4 w-4 mr-1" />
          Image
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-foreground" onClick={() => insertElement("toc")}>
          <ListOrdered className="h-4 w-4 mr-1" />
          TOC
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-foreground" onClick={() => insertElement("layout")}>
          <Columns className="h-4 w-4 mr-1" />
          Layout
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-foreground" onClick={insertLink}>
          <Link className="h-4 w-4 mr-1" />
          Link
        </Button>
      </div>
    </div>
  )
}
