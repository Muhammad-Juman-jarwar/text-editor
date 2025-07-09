"use client"

import * as React from "react"
import { Check, Globe, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "./badge"
import { Label } from "./label"

// Full list of languages with ISO 639-1 codes
const allLanguages = [
  { code: "EN", name: "English" },
  { code: "ZH", name: "Chinese (Mandarin)" },
  { code: "HI", name: "Hindi" },
  { code: "ES", name: "Spanish" },
  { code: "FR", name: "French" },
  { code: "AR", name: "Arabic" },
  { code: "BN", name: "Bengali" },
  { code: "RU", name: "Russian" },
  { code: "PT", name: "Portuguese" },
  { code: "ID", name: "Indonesian" },
  { code: "UR", name: "Urdu" },
  { code: "DE", name: "German" },
  { code: "JA", name: "Japanese" },
  { code: "SW", name: "Swahili" },
  { code: "TR", name: "Turkish" },
  { code: "KO", name: "Korean" },
  { code: "IT", name: "Italian" },
  { code: "VI", name: "Vietnamese" },
  { code: "TA", name: "Tamil" },
  { code: "PL", name: "Polish" },
  { code: "UK", name: "Ukrainian" },
  { code: "NL", name: "Dutch" },
  { code: "RO", name: "Romanian" },
  { code: "FA", name: "Persian" },
  { code: "TH", name: "Thai" },
  { code: "CS", name: "Czech" },
  { code: "SV", name: "Swedish" },
  { code: "HU", name: "Hungarian" },
  { code: "EL", name: "Greek" },
  { code: "HE", name: "Hebrew" },
  { code: "DA", name: "Danish" },
  { code: "FI", name: "Finnish" },
  { code: "SK", name: "Slovak" },
  { code: "NO", name: "Norwegian" },
  { code: "BG", name: "Bulgarian" },
  { code: "HR", name: "Croatian" },
  { code: "LT", name: "Lithuanian" },
  { code: "SL", name: "Slovenian" },
  { code: "SR", name: "Serbian" },
  { code: "ET", name: "Estonian" },
  { code: "LV", name: "Latvian" },
  { code: "IS", name: "Icelandic" },
  { code: "GA", name: "Irish" },
  { code: "MT", name: "Maltese" },
  { code: "SQ", name: "Albanian" },
  { code: "MK", name: "Macedonian" },
  { code: "BS", name: "Bosnian" },
  { code: "CA", name: "Catalan" },
  { code: "EU", name: "Basque" },
  { code: "GL", name: "Galician" },
  { code: "CY", name: "Welsh" },
  { code: "AF", name: "Afrikaans" },
  { code: "AM", name: "Amharic" },
  { code: "HY", name: "Armenian" },
  { code: "AZ", name: "Azerbaijani" },
]

// Common European languages and other important ones to show by default
const commonLanguages = [
  allLanguages.find(l => l.code === "EN"), // English
  allLanguages.find(l => l.code === "DE"), // German
  allLanguages.find(l => l.code === "FR"), // French
  allLanguages.find(l => l.code === "ES"), // Spanish
  allLanguages.find(l => l.code === "IT"), // Italian
  allLanguages.find(l => l.code === "ZH"), // Chinese
].filter(Boolean) as typeof allLanguages

interface LanguageSelectorProps {
  selectedLanguages: string[]
  onSelectionChange: (selected: string[]) => void
  showLabel?: boolean
  required?: boolean
}

export function LanguageSelector({ selectedLanguages, onSelectionChange, showLabel = false, required = false }: LanguageSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const handleSelect = (languageCode: string) => {
    const newSelection = selectedLanguages.includes(languageCode)
      ? selectedLanguages.filter((lang) => lang !== languageCode)
      : [...selectedLanguages, languageCode]
    onSelectionChange(newSelection)
  }

  // Filter languages based on search query
  const filteredLanguages = React.useMemo(() => {
    if (!searchQuery) {
      // Show common European languages and other important ones when no search query
      return commonLanguages
    }
    
    // Show all languages that match the search query
    return allLanguages.filter(lang => 
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  return (
    <div className="space-y-2">
        {showLabel && (
          <Label>
            Supported Languages
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start transition-all duration-200 hover:border-accent hover:shadow-sm hover:shadow-accent/20"
            >
            <Globe className="mr-2 h-4 w-4 text-accent animate-pulse-slow" />
            <span>
              {selectedLanguages.length > 0
                ? `${selectedLanguages.length} language${selectedLanguages.length > 1 ? 's' : ''} selected`
                : "Select languages..."}
            </span>
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
            <CommandInput 
              placeholder="Search language..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-b-accent/30 focus:border-b-accent focus:ring-accent/20"
            />
            <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                {filteredLanguages.map((language: {code: string, name: string}) => (
                    <CommandItem
                    key={language.code}
                    value={language.name}
                    onSelect={() => handleSelect(language.code)}
                    className="transition-all duration-200 hover:bg-accent/10"
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        selectedLanguages.includes(language.code) 
                          ? "opacity-100 text-accent animate-scale-in" 
                          : "opacity-0"
                        )}
                    />
                    {language.name} <span className="ml-1 text-xs text-muted-foreground">({language.code})</span>
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
            </Command>
        </PopoverContent>
        </Popover>
        <div className="flex flex-wrap gap-1.5 min-h-[24px] mt-2">
            {selectedLanguages.map(langCode => {
                const lang = allLanguages.find(l => l.code === langCode)
                return (
                    <Badge 
                      key={langCode} 
                      variant="secondary" 
                      className="gap-1.5 py-1 px-2.5 animate-scale-in transition-all duration-200 hover:bg-accent/20 hover:shadow-sm border border-accent/10 group">
                        <span>{lang?.name || langCode}</span>
                        <button 
                          onClick={() => handleSelect(langCode)} 
                          className="focus:outline-none transition-all duration-200 rounded-full hover:bg-accent/20 p-0.5 group-hover:text-accent">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )
            })}
        </div>
    </div>
  )
}
