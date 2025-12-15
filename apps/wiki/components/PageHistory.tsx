'use client';

import {
  ChevronDown,
  ChevronUp,
  GitCommit,
  GitMerge,
  History,
} from 'lucide-react';
import { useState } from 'react';
import { t } from '../lib/i18n/client';

interface CommitInfo {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
  pull_request?: {
    html_url: string;
    number: number;
  } | null;
}

interface PRInfo {
  number: number;
  html_url: string;
}

interface PageHistoryProps {
  filePath: string;
  language: string;
}

export default function PageHistory({ filePath, language }: PageHistoryProps) {
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (commits.length > 0) return; // Already loaded

    setLoading(true);
    setError(null);

    try {
      // GitHub API to get commits for a specific file
      const repoName = process.env.NEXT_PUBLIC_GITHUB_REPO;
      if (!repoName) {
        throw new Error('GitHub repository not configured');
      }

      const apiUrl = `https://api.github.com/repos/${repoName}/commits?path=content/${filePath}&per_page=10&follow=1`;
      console.log('Fetching commits from:', apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch commit history: ${response.status}`);
      }

      const data: CommitInfo[] = await response.json();

      // For each commit, check if it has an associated PR
      const commitsWithPRs = await Promise.all(
        data.map(async (commit) => {
          if (!commit.pull_request) {
            // Try to find PR by checking commit message for PR reference
            const prMatch = commit.commit.message.match(/#(\d+)/);
            if (prMatch) {
              const prNumber = Number.parseInt(prMatch[1]);
              try {
                const prResponse = await fetch(
                  `https://api.github.com/repos/${repoName}/pulls/${prNumber}`,
                );
                if (prResponse.ok) {
                  const prData = await prResponse.json();
                  return {
                    ...commit,
                    pull_request: {
                      number: prData.number,
                      html_url: prData.html_url,
                    },
                  };
                }
              } catch (err) {
                console.warn(`Failed to fetch PR ${prNumber}:`, err);
              }
            }
          }
          return commit;
        }),
      );

      setCommits(commitsWithPRs);
    } catch (err) {
      console.error('Error fetching page history:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setExpanded(!expanded);
    if (!expanded && commits.length === 0) {
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

  const getCommitTitle = (message: string) => {
    return message.split('\n')[0];
  };

  const latestCommit = commits[0];

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
          {latestCommit && (
            <span className="text-xs text-base-content/40">
              {t('lastEditedOn', language)}{' '}
              {formatDate(latestCommit.commit.author.date)}
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

          {!loading && !error && commits.length === 0 && (
            <div className="text-sm text-base-content/50">
              {t('noHistoryRecords', language)}
            </div>
          )}

          {commits.map((commit) => (
            <div
              key={commit.sha}
              className="p-4 bg-base-200/30 rounded-lg border border-base-300/20 hover:bg-base-200/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {commit.pull_request ? (
                    <GitMerge className="w-4 h-4 text-secondary" />
                  ) : (
                    <GitCommit className="w-4 h-4 text-base-content/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-base-content/90 font-medium mb-2">
                    <span>{getCommitTitle(commit.commit.message)}</span>
                    {commit.pull_request && (
                      <a
                        href={commit.pull_request.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs bg-secondary/20 text-secondary hover:bg-secondary/30 hover:text-secondary-focus px-2 py-1 rounded transition-colors"
                      >
                        #{commit.pull_request.number}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-base-content/60">
                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary hover:text-primary-focus hover:underline transition-colors"
                    >
                      {commit.sha.substring(0, 7)}
                    </a>
                    <span>•</span>
                    <span className="text-base-content/50">
                      {formatDate(commit.commit.author.date)}
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
