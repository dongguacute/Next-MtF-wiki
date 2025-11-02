'use client';

import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { useState } from 'react';

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

      const apiUrl = `https://api.github.com/repos/${repoName}/commits?path=content/${filePath}&per_page=10`;
      console.log('Fetching commits from:', apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch commit history: ${response.status}`);
      }

      const data: CommitInfo[] = await response.json();
      setCommits(data);
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
          <span>页面历史</span>
          {latestCommit && (
            <span className="text-xs text-base-content/40">
              最后编辑于 {formatDate(latestCommit.commit.author.date)}
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
            <div className="text-sm text-base-content/50">加载中...</div>
          )}

          {error && (
            <div className="text-sm text-error">加载历史记录失败: {error}</div>
          )}

          {!loading && !error && commits.length === 0 && (
            <div className="text-sm text-base-content/50">暂无历史记录</div>
          )}

          {commits.map((commit) => (
            <div
              key={commit.sha}
              className="p-4 bg-base-200/30 rounded-lg border border-base-300/20 hover:bg-base-200/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-base-content/90 font-medium mb-2">
                    {getCommitTitle(commit.commit.message)}
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
                    {commit.pull_request && (
                      <>
                        <span>•</span>
                        <a
                          href={commit.pull_request.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-secondary hover:text-secondary-focus hover:underline transition-colors"
                        >
                          #{commit.pull_request.number}
                        </a>
                      </>
                    )}
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
