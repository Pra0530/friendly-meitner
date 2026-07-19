import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Replace, ChevronDown, ChevronUp } from 'lucide-react';

const FindReplace = ({ isOpen, onClose, code, onCodeChange }) => {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const inputRef = useRef(null);

  // Focus find input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Compute matches count
  useEffect(() => {
    if (!findText) {
      setMatchCount(0);
      setCurrentMatchIndex(-1);
      return;
    }
    try {
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapeRegExp(findText), 'gi');
      const matches = code.match(regex);
      setMatchCount(matches ? matches.length : 0);
      setCurrentMatchIndex(matches && matches.length > 0 ? 0 : -1);
    } catch (e) {
      setMatchCount(0);
      setCurrentMatchIndex(-1);
    }
  }, [findText, code]);

  const handleFindNext = () => {
    if (matchCount > 0) {
      setCurrentMatchIndex(prev => (prev + 1) % matchCount);
    }
  };

  const handleFindPrev = () => {
    if (matchCount > 0) {
      setCurrentMatchIndex(prev => (prev - 1 + matchCount) % matchCount);
    }
  };

  const handleReplace = () => {
    if (!findText) return;
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegExp(findText), 'i'); // replace first match
    const newCode = code.replace(regex, replaceText);
    onCodeChange(newCode);
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegExp(findText), 'gi');
    const newCode = code.replace(regex, replaceText);
    onCodeChange(newCode);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '56px',
      right: '16px',
      background: '#18181b',
      border: '1px solid var(--border-glass)',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      padding: '10px 12px',
      zIndex: 10,
      width: '280px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Search Input Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border-glass)',
          borderRadius: '4px',
          padding: '4px 8px',
          gap: '6px'
        }}>
          <Search size={14} color="var(--text-secondary)" />
          <input
            ref={inputRef}
            type="text"
            value={findText}
            onChange={e => setFindText(e.target.value)}
            placeholder="Find text..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '13px'
            }}
          />
        </div>
        
        {/* Count Indicator */}
        {findText && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {matchCount > 0 ? `${currentMatchIndex + 1}/${matchCount}` : '0/0'}
          </span>
        )}

        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px' }}>
          <X size={14} color="var(--text-secondary)" />
        </button>
      </div>

      {/* Replace Input Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border-glass)',
          borderRadius: '4px',
          padding: '4px 8px',
          gap: '6px'
        }}>
          <Replace size={14} color="var(--text-secondary)" />
          <input
            type="text"
            value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            placeholder="Replace with..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      {/* Actions Gutter */}
      {findText && (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
          <button 
            onClick={handleReplace}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: '4px',
              padding: '3px 8px',
              color: '#fff',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Replace
          </button>
          <button 
            onClick={handleReplaceAll}
            style={{
              background: 'var(--accent-color)',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              color: '#fff',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            All
          </button>
        </div>
      )}
    </div>
  );
};

export default FindReplace;
