import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { useSearch } from '../hooks/useSearch';
import { SearchResults } from './SearchResults';

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading, hasQuery } = useSearch(query, {
    limit: 5,
    enabled: isOpen,
  });

  const totalResults =
    (results?.tasks.length ?? 0) +
    (results?.projects.length ?? 0) +
    (results?.comments.length ?? 0);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Global '/' shortcut to focus search
  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (
        event.key === '/' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        const target = event.target as HTMLElement;
        const isInputFocused =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;

        if (!isInputFocused) {
          event.preventDefault();
          inputRef.current?.focus();
          setIsOpen(true);
        }
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSelect = useCallback(
    (type: 'task' | 'project' | 'comment', id: string, extra?: string) => {
      setIsOpen(false);
      setQuery('');

      switch (type) {
        case 'task':
          navigate(`/tasks?taskId=${id}`);
          break;
        case 'project':
          navigate(`/projects/${id}`);
          break;
        case 'comment':
          navigate(`/tasks?taskId=${extra || id}`);
          break;
      }
    },
    [navigate]
  );

  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }, [navigate, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < totalResults - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : totalResults - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results) {
          const allItems = [
            ...results.tasks.map((t) => ({ type: 'task' as const, id: t._id })),
            ...results.projects.map((p) => ({ type: 'project' as const, id: p._id })),
            ...results.comments.map((c) => ({
              type: 'comment' as const,
              id: c._id,
              extra: c.taskId,
            })),
          ];
          const selected = allItems[selectedIndex];
          if (selected) {
            handleSelect(
              selected.type,
              selected.id,
              'extra' in selected ? selected.extra : undefined
            );
          }
        } else if (hasQuery) {
          handleViewAll();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search tasks, projects..."
          className={cn(
            'h-9 w-full rounded-lg pl-9 pr-8 text-sm',
            'border border-border/50 bg-muted/50',
            'placeholder:text-muted-foreground/60',
            'focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30',
            'transition-all duration-200'
          )}
          aria-label="Search"
          aria-expanded={isOpen && hasQuery}
          aria-controls="search-results"
          role="combobox"
          aria-autocomplete="list"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!query && (
          <kbd className="absolute right-2 top-1/2 hidden h-5 -translate-y-1/2 items-center rounded border border-border/50 bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
            /
          </kbd>
        )}
      </div>

      <AnimatePresence>
        {isOpen && hasQuery && (
          <SearchResults
            results={results}
            isLoading={isLoading}
            query={query}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            onViewAll={handleViewAll}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
