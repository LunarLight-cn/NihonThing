import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface Option {
  value: number
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: number
  onChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, disabled, required }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className={"input-customer bg-background flex items-center justify-between cursor-pointer"}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? '' : 'text-muted-foreground'}>
          {selectedOption ? selectedOption.label : placeholder || '-- Select --'}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border flex items-center">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input 
              type="text"
              className="w-full bg-transparent outline-none text-sm"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div 
                  key={opt.value}
                  className={"px-4 py-2 text-sm cursor-pointer hover:bg-secondary"}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
