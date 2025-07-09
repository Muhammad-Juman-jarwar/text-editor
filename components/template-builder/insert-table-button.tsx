"use client"

import { Button } from "@/components/ui/button"
import { Grid } from "lucide-react"

interface InsertTableButtonProps {
  onInsertTable: () => void
}

export function InsertTableButton({ onInsertTable }: InsertTableButtonProps) {
  return (
    <Button 
      onClick={onInsertTable} 
      variant="ghost" 
      size="sm"
      className="flex items-center gap-2"
    >
      <Grid className="h-4 w-4" />
      <span>Table</span>
    </Button>
  )
}
