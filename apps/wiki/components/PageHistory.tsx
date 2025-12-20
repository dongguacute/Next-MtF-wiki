'use client';

import { ChevronDown, ChevronUp, GitMerge, History } from 'lucide-react';
import { useState } from 'react';
import { t } from '../lib/i18n/client';

function CommitIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
      width="1em"
      height="1em"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        minWidth: '1.2rem',
      }}
    >
      <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

interface HistoryRecord {
  pageAddress: string;
  type: 'commit' | 'pr';
  time: string;
  commitId: string;
}

interface PageHistoryProps {
  filePath: string;
  language: string;
}

export default function PageHistory({ filePath, language }: PageHistoryProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (history.length > 0) return; // Already loaded

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/history.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`);
      }

      const data: HistoryRecord[] = await response.json();

      console.log('PageHistory loaded data:', data.length, 'records');
      console.log('Filtering for filePath:', filePath);

      // Filter by page address and sort by time desc
      const pageHistory = data
        .filter((item) => {
          // Normalize paths for comparison: remove leading/trailing slashes and ensure consistent format
          // The item.pageAddress in JSON is like "zh-cn/docs/psyco/friendly"
          // The filePath prop passed to component might be "zh-cn/docs/psyco/psyco-friendly.md" or similar
          // We need a robust matching strategy.

          // Let's log specific comparison for debugging
          // console.log(`Comparing '${item.pageAddress}' with '${filePath}'`);

          // Exact match
          if (item.pageAddress === filePath) return true;

          // Try matching without extension if filePath has one
          const filePathNoExt = filePath.replace(/\.mdx?$/, '');
          if (item.pageAddress === filePathNoExt) return true;

          // Special case for psyco/friendly which seems to be mapped to psyco-friendly.md
          if (
            filePath.includes('psyco-friendly.md') &&
            item.pageAddress.endsWith('psyco/friendly')
          ) {
            return true;
          }

          // More general loose matching: check if item.pageAddress is contained in filePath
          // This helps if JSON has 'zh-cn/docs/foo' but filePath is 'zh-cn/docs/foo.md'
          // or if JSON uses slug 'zh-cn/docs/foo' and filePath is 'content/zh-cn/docs/foo/index.md'
          if (filePath.includes(item.pageAddress)) return true;

          return false;
        })
        .sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
        );

      setHistory(pageHistory);
    } catch (err) {
      console.error('Error fetching page history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setExpanded(!expanded);
    if (!expanded && history.length === 0) {
      fetchHistory();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const latestRecord = history[0];
  const repoName = process.env.NEXT_PUBLIC_GITHUB_REPO;

  return (
    <div className="mt-4 border-t border-base-300/30 pt-4">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm text-base-content/60 hover:text-primary transition-colors w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4" />
          <span>{t('pageHistory', language)}</span>
          {latestRecord && (
            <span className="text-xs text-base-content/40">
              {t('lastEditedOn', language)} {formatDate(latestRecord.time)}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {loading && (
            <div className="text-sm text-base-content/50">
              {t('loading', language)}
            </div>
          )}

          {error && (
            <div className="text-sm text-error">
              {t('failedToLoadHistory', language)} {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-sm text-base-content/50">
              {t('noHistoryRecords', language)}
            </div>
          )}

          {history.map((record) => (
            <div
              key={record.commitId}
              className="p-4 bg-base-200/30 rounded-lg border border-base-300/20 hover:bg-base-200/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {record.type === 'pr' ? (
                    <GitMerge className="w-4 h-4 text-secondary" />
                  ) : (
                    <CommitIcon className="w-4 h-4 text-base-content/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-base-content/90 font-medium mb-2">
                    <span>{record.type === 'pr' ? 'PR Merge' : 'Commit'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-base-content/60">
                    {repoName ? (
                      <a
                        href={`https://github.com/${repoName}/commit/${record.commitId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-primary hover:text-primary-focus hover:underline transition-colors"
                      >
                        {record.commitId.substring(0, 7)}
                      </a>
                    ) : (
                      <span className="font-mono text-base-content/50">
                        {record.commitId.substring(0, 7)}
                      </span>
                    )}
                    <span>•</span>
                    <span className="text-base-content/50">
                      {formatDate(record.time)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
