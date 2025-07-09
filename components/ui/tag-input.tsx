"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  existingTags?: string[]
}

// Default existing tags if none provided
const defaultExistingTags = [
  "sql-injection",
  "xss",
  "csrf",
  "authentication",
  "authorization",
  "encryption",
  "session-management",
  "input-validation",
  "buffer-overflow",
  "privilege-escalation",
  "information-disclosure",
  "denial-of-service",
  "code-injection",
  "path-traversal",
  "weak-cryptography",
  "insecure-storage",
  "network-security",
  "api-security",
  "mobile-security",
  "web-application",
  "database",
  "server-misconfiguration",
  "ssl-tls",
  "certificate",
  "password-policy",
  "multi-factor-auth",
  "oauth",
  "jwt",
  "cors",
  "csp",
  "clickjacking",
  "social-engineering",
  "phishing",
  "malware",
  "ransomware",
  "backdoor",
  "trojan",
  "virus",
  "spyware",
  "critical",
  "high",
  "medium",
  "low",
  "confirmed",
  "potential",
  "false-positive",
]

export function TagInput({
  tags,
  onTagsChange,
  placeholder = "Add tags...",
  className,
  existingTags = defaultExistingTags,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = existingTags
        .filter((tag) => tag.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(tag))
        .slice(0, 8) // Limit to 8 suggestions
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
      setSelectedSuggestionIndex(-1)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [inputValue, tags, existingTags])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag])
    }
    setInputValue("")
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        addTag(suggestions[selectedSuggestionIndex])
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion)
  }

  // Get popular tags that aren't already selected
  const popularTags = existingTags.filter((tag) => !tags.includes(tag)).slice(0, 6)

  return (
    <div className={cn("space-y-3", className)}>
      {/* Input and Tags Container */}
      <div className="relative">
        <div className="min-h-[42px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <div className="flex flex-wrap gap-1 items-center">
            {/* Existing Tags */}
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                <Tag className="h-3 w-3" />
                {tag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {/* Input */}
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onFocus={() => inputValue && setShowSuggestions(suggestions.length > 0)}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking
                setTimeout(() => setShowSuggestions(false), 200)
              }}
              placeholder={tags.length === 0 ? placeholder : ""}
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[120px]"
            />
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors",
                    selectedSuggestionIndex === index && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {suggestion}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Popular Tags */}
      {tags.length === 0 && popularTags.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">Popular tags:</div>
          <div className="flex flex-wrap gap-1">
            {popularTags.map((tag) => (
              <Button key={tag} variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => addTag(tag)}>
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Tag Count */}
      {tags.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {tags.length} tag{tags.length !== 1 ? "s" : ""} added
        </div>
      )}
    </div>
  )
}
