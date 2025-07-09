"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Plus, Search, Variable, User, FileText, AlertTriangle, Calendar } from "lucide-react"

interface VariableManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: any
  onUpdateTemplate: (updates: any) => void
}

const predefinedVariables = {
  client: [
    { key: "client.name", description: "Client company name", example: "Acme Corporation" },
    { key: "client.email", description: "Client contact email", example: "contact@acme.com" },
    { key: "client.address", description: "Client address", example: "123 Business St, City, State" },
    { key: "client.phone", description: "Client phone number", example: "+1 (555) 123-4567" },
    { key: "client.contact", description: "Primary contact person", example: "John Smith" },
  ],
  report: [
    { key: "report.title", description: "Report title", example: "Penetration Test Report" },
    { key: "report.date", description: "Report date", example: "January 15, 2024" },
    { key: "report.version", description: "Report version", example: "1.0" },
    { key: "report.author", description: "Report author", example: "Security Team" },
    { key: "report.id", description: "Report ID", example: "RPT-2024-001" },
  ],
  findings: [
    { key: "findings.critical", description: "Number of critical findings", example: "3" },
    { key: "findings.high", description: "Number of high findings", example: "7" },
    { key: "findings.medium", description: "Number of medium findings", example: "12" },
    { key: "findings.low", description: "Number of low findings", example: "5" },
    { key: "findings.total", description: "Total number of findings", example: "27" },
  ],
  dates: [
    { key: "dates.start", description: "Test start date", example: "January 10, 2024" },
    { key: "dates.end", description: "Test end date", example: "January 12, 2024" },
    { key: "dates.report", description: "Report delivery date", example: "January 15, 2024" },
    { key: "dates.current", description: "Current date", example: "January 15, 2024" },
  ],
}

const categoryIcons = {
  client: User,
  report: FileText,
  findings: AlertTriangle,
  dates: Calendar,
}

export function VariableManager({ open, onOpenChange, template, onUpdateTemplate }: VariableManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [customVariables, setCustomVariables] = useState<Array<{ key: string; description: string; example: string }>>(
    [],
  )
  const [newVariable, setNewVariable] = useState({ key: "", description: "", example: "" })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`{{${text}}}`)
    // You could show a toast here
    console.log(`Copied {{${text}}} to clipboard`)
  }

  const addCustomVariable = () => {
    if (newVariable.key && newVariable.description) {
      setCustomVariables([...customVariables, { ...newVariable }])
      setNewVariable({ key: "", description: "", example: "" })
    }
  }

  const filteredVariables = Object.entries(predefinedVariables).reduce(
    (acc, [category, variables]) => {
      const filtered = variables.filter(
        (variable) =>
          variable.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          variable.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      if (filtered.length > 0) {
        acc[category] = filtered
      }
      return acc
    },
    {} as Record<string, typeof predefinedVariables.client>,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5" />
            Variable Manager
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="predefined" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predefined">Predefined Variables</TabsTrigger>
            <TabsTrigger value="custom">Custom Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="predefined" className="flex-1 flex flex-col">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search variables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-6">
                {Object.entries(filteredVariables).map(([category, variables]) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons]

                  return (
                    <Card key={category}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2 capitalize">
                          <Icon className="h-4 w-4" />
                          {category}
                          <Badge variant="secondary">{variables.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          {variables.map((variable) => (
                            <div
                              key={variable.key}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                    {`{{${variable.key}}}`}
                                  </code>
                                </div>
                                <p className="text-sm text-gray-600">{variable.description}</p>
                                <p className="text-xs text-gray-400 mt-1">Example: {variable.example}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(variable.key)}
                                className="ml-2"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {Object.keys(filteredVariables).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Variable className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No variables found</p>
                    <p className="text-xs">Try adjusting your search query</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom" className="flex-1 flex flex-col">
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Add Custom Variable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="variableKey">Variable Key</Label>
                    <Input
                      id="variableKey"
                      placeholder="e.g., custom.field"
                      value={newVariable.key}
                      onChange={(e) => setNewVariable({ ...newVariable, key: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="variableDescription">Description</Label>
                    <Input
                      id="variableDescription"
                      placeholder="What this variable represents"
                      value={newVariable.description}
                      onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="variableExample">Example Value</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="variableExample"
                        placeholder="Sample value"
                        value={newVariable.example}
                        onChange={(e) => setNewVariable({ ...newVariable, example: e.target.value })}
                      />
                      <Button onClick={addCustomVariable} disabled={!newVariable.key || !newVariable.description}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {customVariables.map((variable, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{`{{${variable.key}}}`}</code>
                      </div>
                      <p className="text-sm text-gray-600">{variable.description}</p>
                      {variable.example && <p className="text-xs text-gray-400 mt-1">Example: {variable.example}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(variable.key)} className="ml-2">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {customVariables.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Variable className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No custom variables yet</p>
                    <p className="text-xs">Add your first custom variable above</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
