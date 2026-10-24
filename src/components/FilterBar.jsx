/**
 * Jasoos — FilterBar Component
 * Phase 4: Status filter pills, risk filter, and live search input.
 */

import React from 'react';
import { useInbox } from '../context/InboxContext.jsx';
import { Search, X } from 'lucide-react';

const FILTER_OPTIONS = [
  { key: 'all',          label: 'All',         emoji: null },
  { key: 'applied',      label: 'Applied',     emoji: null },
  { key: 'interview',    label: 'Interview',   emoji: null },
  { key: 'offer',        label: 'Offer',       emoji: null },
  { key: 'rejected',     label: 'Rejected',    emoji: null },
  { key: 'needs_review', label: 'Needs Review',emoji: null },
  { key: 'high_risk',    label: 'High Risk',   emoji: '⚠' },
  { key: 'follow_up',    label: 'Follow-Up',   emoji: '⏰' },
];

export default function FilterBar() {
  const {
    stats,
    activeFilter,
    searchQuery,
    setActiveFilter,
    setSearchQuery,
  } = useInbox();

  const getCount = (key) => {
    switch (key) {
      case 'all':          return stats.total;
      case 'applied':      return stats.applied;
      case 'interview':    return stats.interview;
      case 'offer':        return stats.offer;
      case 'rejected':     return stats.rejected;
      case 'needs_review': return stats.needs_review;
      case 'high_risk':    return stats.high_risk;
      case 'follow_up':    return stats.follow_ups_due;
      default:             return 0;
    }
  };

  return (
    <div id="filter-bar" className="filter-bar">
      {/* Filter Pills */}
      <div className="filter-pills">
        {FILTER_OPTIONS.map(({ key, label, emoji }) => {
          const count = getCount(key);
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              id={`filter-${key}`}
              className={`filter-pill ${isActive ? 'filter-pill-active' : ''}`}
              onClick={() => setActiveFilter(key)}
            >
              {emoji && <span>{emoji}</span>}
              {label}
              <span className={`filter-pill-count ${isActive ? 'filter-pill-count-active' : ''}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="search-bar-wrap">
        <Search size={15} className="search-bar-icon" />
        <input
          id="search-input"
          type="text"
          placeholder="Search company, role, subject…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="search-bar-input"
        />
        {searchQuery && (
          <button
            className="btn btn-ghost search-clear-btn"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
