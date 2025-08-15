"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  showValue?: boolean;
}

const presetColors = [
  "#000000",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#800000",
  "#008000",
  "#000080",
  "#808000",
  "#800080",
  "#008080",
  "#c0c0c0",
  "#808080",
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#ffeaa7",
  "#dda0dd",
  "#98d8c8",
  "#f7dc6f",
  "#bb8fce",
  "#85c1e9",
  "#f8c471",
  "#82e0aa",
  "#f1948a",
  "#85929e",
  "#d5a6bd",
  "#aed6f1",
];

export function ColorPicker({
  value,
  onChange,
  disabled = false,
  showValue = true,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "#000000");

  const handleColorChange = (color: string) => {
    setInputValue(color);
    onChange(color);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(newValue) || /^#[0-9A-F]{3}$/i.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    // If invalid color, revert to current value
    if (
      !/^#[0-9A-F]{6}$/i.test(inputValue) &&
      !/^#[0-9A-F]{3}$/i.test(inputValue)
    ) {
      setInputValue(value || "#000000");
    }
  };

  const displayValue = value || "#000000";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-8 p-1 justify-start"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(true)}
        >
          <div className="flex items-center justify-center gap-2 w-full">
            <div
              className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: displayValue }}
            />
            {showValue && (
              <span className="text-xs font-mono flex-1 text-left">
                {displayValue}
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div>
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              placeholder="#000000"
              className="font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-8 gap-1">
            {presetColors.map((color) => (
              <button
                key={color}
                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: color }}
                onClick={() => {
                  handleColorChange(color);
                  setIsOpen(false);
                }}
                title={color}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onChange(inputValue);
                setIsOpen(false);
              }}
              className="flex-1"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
