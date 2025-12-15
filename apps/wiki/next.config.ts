import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  env: {
    NEXT_PUBLIC_GITHUB_REPO: 'project-trans/MtF-wiki',
    NEXT_PUBLIC_EDIT_LINK_GITHUB_URL:
      'https://github.com/project-trans/MtF-wiki/tree/master/',
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);

// configure runtime to edge for cloudflare pages
export const runtime = 'edge';
