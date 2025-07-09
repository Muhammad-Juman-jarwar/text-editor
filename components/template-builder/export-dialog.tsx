"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Code, Printer, Share } from "lucide-react"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: any
}

export function ExportDialog({ open, onOpenChange, template }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<"pdf" | "json" | "html">("pdf")
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeStyles, setIncludeStyles] = useState(true)
  const [pageNumbers, setPageNumbers] = useState(true)

  const handleExport = () => {
    switch (exportFormat) {
      case "pdf":
        exportToPDF()
        break
      case "json":
        exportToJSON()
        break
      case "html":
        exportToHTML()
        break
    }
    onOpenChange(false)
  }

  const exportToPDF = () => {
    // This would integrate with a PDF generation library like jsPDF or Puppeteer
    const templateData = {
      ...template,
      exportOptions: {
        includeMetadata,
        includeStyles,
        pageNumbers,
      },
    }

    console.log("Exporting to PDF:", templateData)

    // Mock PDF generation
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${template.name.replace(/\s+/g, "_")}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const templateData = {
      ...template,
      exportOptions: {
        includeMetadata,
        includeStyles,
      },
    }

    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${template.name.replace(/\s+/g, "_")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToHTML = () => {
    // Generate HTML representation
    const htmlContent = `
<!DOCTYPE html>
<html lang="${template.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <style>
        body { font-family: ${template.theme.fontFamily}, sans-serif; margin: 0; padding: 20px; }
        .page { max-width: 794px; margin: 0 auto; background: white; padding: 72px; }
        .element { margin-bottom: 16px; }
        .heading { font-weight: bold; }
        .table { border-collapse: collapse; width: 100%; }
        .table th, .table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        .table th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <div class="page">
        ${template.elements
          .map((element: any) => {
            switch (element.type) {
              case "text":
                return `<p class="element" style="font-size: ${element.style?.fontSize || 14}px; color: ${element.style?.color || "#374151"};">${element.content}</p>`
              case "heading":
                return `<h${element.style?.fontSize > 24 ? "1" : element.style?.fontSize > 20 ? "2" : "3"} class="element heading" style="font-size: ${element.style?.fontSize || 24}px; color: ${element.style?.color || "#1f2937"};">${element.content}</h${element.style?.fontSize > 24 ? "1" : element.style?.fontSize > 20 ? "2" : "3"}>`
              default:
                return `<div class="element">${element.content}</div>`
            }
          })
          .join("")}
    </div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${template.name.replace(/\s+/g, "_")}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    // This would implement sharing functionality
    const shareData = {
      title: template.name,
      text: `Check out this template: ${template.name}`,
      url: window.location.href,
    }

    if (navigator.share) {
      navigator.share(shareData)
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      console.log("Link copied to clipboard")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF Document
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      JSON Template
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      HTML Document
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="includeMetadata">Include Metadata</Label>
                <Switch id="includeMetadata" checked={includeMetadata} onCheckedChange={setIncludeMetadata} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="includeStyles">Include Styling</Label>
                <Switch id="includeStyles" checked={includeStyles} onCheckedChange={setIncludeStyles} />
              </div>

              {exportFormat === "pdf" && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="pageNumbers">Page Numbers</Label>
                  <Switch id="pageNumbers" checked={pageNumbers} onCheckedChange={setPageNumbers} />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="ghost" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
