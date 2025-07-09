"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  AlertTriangle, 
  Variable, 
  Settings, 
  Copy, 
  FileText, 
  HelpCircle, 
  ExternalLink,
  Info,
  Pencil,
  Check,
  X
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VariablesTabProps {
  template: any
  onUpdateTemplate: (updates: any) => void
}

export function VariablesTab({ template, onUpdateTemplate }: VariablesTabProps) {
  // Track which variable is being edited
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // Function to copy variable syntax to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here if desired
  }

  return (
    <div className="space-y-3 mt-0 max-w-full overflow-hidden">
      {/* Custom Variables Section */}
      <Card>
        <CardHeader className="mb-1">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Custom Variables
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 text-xs" 
              onClick={() => {
                // Create a new empty custom variable
                onUpdateTemplate({
                  variables: [
                    ...(template.variables || []),
                    { key: `custom.var${(template.variables || []).length + 1}`, description: "Custom variable", value: "" }
                  ]
                })
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {template.variables && template.variables.length > 0 ? (
            <div className="space-y-1">
              {template.variables.map((variable: any, index: number) => (
                <div key={index}>
                  {editingIndex === index ? (
                    // Edit mode
                    <div className="border rounded-md p-2 space-y-2 bg-muted/30">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <Label className="text-xs mb-1">Name</Label>
                          <Input 
                            value={variable.key}
                            onChange={(e) => {
                              const newVariables = [...template.variables];
                              newVariables[index] = { ...variable, key: e.target.value };
                              onUpdateTemplate({ variables: newVariables });
                            }}
                            placeholder="custom.name"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs mb-1">Description</Label>
                          <Input 
                            value={variable.description}
                            onChange={(e) => {
                              const newVariables = [...template.variables];
                              newVariables[index] = { ...variable, description: e.target.value };
                              onUpdateTemplate({ variables: newVariables });
                            }}
                            placeholder="What this represents"
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1">Default Value</Label>
                        <Input 
                          value={variable.value}
                          onChange={(e) => {
                            const newVariables = [...template.variables];
                            newVariables[index] = { ...variable, value: e.target.value };
                            onUpdateTemplate({ variables: newVariables });
                          }}
                          placeholder="Default value"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-1 mt-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => setEditingIndex(null)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Done
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode - compact
                    <div className="border rounded-md p-2 hover:bg-accent/10 group">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 overflow-hidden">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] font-medium">{variable.key}</span>
                            {variable.description && (
                              <span title={variable.description}>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground text-[10px] truncate">
                            Value: <span className="font-mono">{variable.value || '""'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => setEditingIndex(index)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(`{{${variable.key}}}`)}                            
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              const newVariables = template.variables.filter((_: any, i: number) => i !== index);
                              onUpdateTemplate({ variables: newVariables });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No custom variables defined. Click "Add" to create one.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Predefined Variables Section */}
      <Card>
        <CardHeader className="mb-1">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Variable className="h-4 w-4" />
              Predefined Variables
            </div>
            <Badge variant="secondary" className="text-xs">LiquidJS</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-xs text-muted-foreground">
            Click to copy. Use syntax: <code className="bg-muted px-1 py-0.5 rounded">&#123;&#123; var &#125;&#125;</code>
          </div>
          
          <div className="space-y-1">
            {/* Client Variables */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <User className="h-3 w-3" />
                <span className="font-medium text-[10px]">Client</span>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                {[
                  { key: "client.name", desc: "Client name", example: "Acme Corporation" },
                  { key: "client.email", desc: "Client email", example: "contact@acme.com" },
                  { key: "client.address", desc: "Client address", example: "123 Business Ave, Suite 100" },
                  { key: "client.phone", desc: "Client phone", example: "+1 (555) 123-4567" },
                ].map((variable) => (
                  <Button 
                    key={variable.key} 
                    variant="ghost" 
                    className="h-auto py-1 px-1.5 text-[10px] w-full"
                    onClick={() => copyToClipboard(`{{${variable.key}}}`)}
                    title={`Example: ${variable.example}`}
                  >
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="font-mono">{variable.key}</span>
                      <div className="flex items-center gap-1">
                        <span title={`Example: ${variable.example}`}>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </span>
                        <Copy className="h-3 w-3 flex-shrink-0" />
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Report Variables */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FileText className="h-3 w-3" />
                <span className="font-medium text-[10px]">Report</span>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                {[
                  { key: "report.title", desc: "Report title", example: "Web Application Security Assessment" },
                  { key: "report.date", desc: "Report date", example: "July 2, 2025" },
                  { key: "report.version", desc: "Report version", example: "1.0" },
                  { key: "report.author", desc: "Report author", example: "John Smith" },
                  { key: "report.id", desc: "Report ID", example: "VLN-2025-001" }
                ].map((variable) => (
                  <Button 
                    key={variable.key} 
                    variant="ghost" 
                    className="h-auto py-1 px-1.5 text-[10px] w-full"
                    onClick={() => copyToClipboard(`{{${variable.key}}}`)}
                    title={`Example: ${variable.example}`}
                  >
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="font-mono">{variable.key}</span>
                      <div className="flex items-center gap-1">
                        <span title={`Example: ${variable.example}`}>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </span>
                        <Copy className="h-3 w-3 flex-shrink-0" />
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Findings Variables */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium text-[10px]">Findings</span>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                {[
                  { key: "findings.critical", desc: "Number of critical", example: "2" },
                  { key: "findings.high", desc: "Number of high", example: "5" },
                  { key: "findings.medium", desc: "Number of medium", example: "8" },
                  { key: "findings.low", desc: "Number of low", example: "3" },
                  { key: "findings.total", desc: "Total findings", example: "18" }
                ].map((variable) => (
                  <Button 
                    key={variable.key} 
                    variant="ghost" 
                    className="h-auto py-1 px-1.5 text-[10px] w-full"
                    onClick={() => copyToClipboard(`{{${variable.key}}}`)}
                    title={`Example: ${variable.example}`}
                  >
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="font-mono">{variable.key}</span>
                      <div className="flex items-center gap-1">
                        <span title={`Example: ${variable.example}`}>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </span>
                        <Copy className="h-3 w-3 flex-shrink-0" />
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Dates Variables */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" />
                <span className="font-medium text-[10px]">Dates</span>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                {[
                  { key: "dates.start", desc: "Test start date", example: "June 20, 2025" },
                  { key: "dates.end", desc: "Test end date", example: "June 30, 2025" },
                  { key: "dates.report", desc: "Report delivery date", example: "July 2, 2025" },
                  { key: "dates.current", desc: "Current date", example: "Today's date" }
                ].map((variable) => (
                  <Button 
                    key={variable.key} 
                    variant="ghost" 
                    className="h-auto py-1 px-1.5 text-[10px] w-full"
                    onClick={() => copyToClipboard(`{{${variable.key}}}`)}
                    title={`Example: ${variable.example}`}
                  >
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="font-mono">{variable.key}</span>
                      <div className="flex items-center gap-1">
                        <span title={`Example: ${variable.example}`}>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </span>
                        <Copy className="h-3 w-3 flex-shrink-0" />
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LiquidJS Help Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            LiquidJS Syntax Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <h4 className="font-medium mb-1">Basic Output</h4>
            <code className="block bg-muted p-2 rounded">&#123;&#123; variable.name &#125;&#125;</code>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Conditionals</h4>
            <code className="block bg-muted p-2 rounded whitespace-pre-wrap">
              &#123;&#37; if findings.critical > 0 &#37;&#125;<br/>
              &nbsp;&nbsp;Critical findings.<br/>
              &#123;&#37; elsif findings.high > 0 &#37;&#125;<br/>
              &nbsp;&nbsp;High severity findings.<br/>
              &#123;&#37; else &#37;&#125;<br/>
              &nbsp;&nbsp;No critical findings.<br/>
              &#123;&#37; endif &#37;&#125;
            </code>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Filters</h4>
            <code className="block bg-muted p-2 rounded">&#123;&#123; client.name | upcase &#125;&#125;</code>
            <code className="block bg-muted p-2 rounded mt-1">&#123;&#123; report.date | date: "%B %d, %Y" &#125;&#125;</code>
          </div>

          <div>
            <h4 className="font-medium mb-1">Loops</h4>
            <code className="block bg-muted p-2 rounded whitespace-pre-wrap">
              &#123;&#37; for item in collection &#37;<br/>
              &nbsp;&nbsp;&#123;&#123; item.name &#125;&#125;<br/>
              &#123;&#37; endfor &#37;&#125;
            </code>
          </div>
          <Button 
            variant="link" 
            className="text-xs h-auto p-0"
            onClick={() => window.open('https://liquidjs.com/tutorials/intro-to-liquid.html', '_blank')}
          >
            Read full LiquidJS documentation
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
