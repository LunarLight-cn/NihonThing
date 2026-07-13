import React, { useState, useRef, useEffect } from 'react'
import { Search, Plus } from 'lucide-react'

interface Option {
  id: number | string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: number | string
  onChange: (value: number | string) => void
  onAdd?: (search: string) => void
  placeholder?: string
  addLabel?: string
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  onAdd,
  placeholder = 'Select...',
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

  const selectedOption = options.find(opt => opt.id === value)

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className="input-admin flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
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
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 rounded ${value === opt.id ? 'bg-primary/20 text-primary font-medium' : ''}`}
                  onClick={() => {
                    onChange(opt.id)
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  {opt.label}
                </div>
              ))
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
                  setIsOpen(false)
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
