import React, { useState, useRef, useEffect } from 'react'
import { Search, Plus, Check } from 'lucide-react'

interface Option {
  id: number | string
  label: string
}

interface SearchableMultiSelectProps {
  options: Option[]
  values: (number | string)[]
  onChange: (values: (number | string)[]) => void
  onAdd?: (search: string) => void
  placeholder?: string
  addLabel?: string
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  options,
  values,
  onChange,
  onAdd,
  placeholder = 'Select multiple...',
  addLabel = 'Add New'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOptions = options.filter(opt => values.includes(opt.id))

  const toggleOption = (id: number | string) => {
    if (values.includes(id)) {
      onChange(values.filter(v => v !== id))
    } else {
      onChange([...values, id])
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className="input-admin min-h-[40px] flex items-center flex-wrap gap-1 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((opt) => (
            <span 
              key={opt.id} 
              className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs flex items-center gap-1 hover:bg-destructive/10 hover:text-destructive transition-colors group"
              onClick={(e) => {
                e.stopPropagation()
                toggleOption(opt.id)
              }}
              title="Click to remove"
            >
              {opt.label}
              <span className="opacity-50 group-hover:opacity-100">&times;</span>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-background p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                className="w-full pl-8 pr-4 py-2 bg-secondary/50 border-none rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.id)
                return (
                  <div
                    key={opt.id}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 rounded flex items-center justify-between ${isSelected ? 'text-primary font-medium' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOption(opt.id)
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                )
              })
            ) : (
              <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                No results found
              </div>
            )}
            
            {onAdd && search && !options.some(o => o.label.toLowerCase() === search.toLowerCase()) && (
              <div
                className="px-3 py-2 text-sm cursor-pointer text-primary hover:bg-primary/10 rounded flex items-center border-t border-border mt-1"
                onClick={() => {
                  onAdd(search)
                  setSearch('')
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {addLabel} "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
