import { homedir } from 'os';
import { join } from 'path';

export const CLUTCH_DIR = process.env.CLUTCH_DIR || join(homedir(), '.clutch');
export const PROJECTS_DIR = join(CLUTCH_DIR, 'projects');
export const REPOS_DIR = join(CLUTCH_DIR, 'repos');

export interface ProjectMetadata {
  repo_name: string;
  repo_url: string;
  total_files: number;
  total_loc: number;
  init_date: string;
}

export interface ProjectStatus {
  name: string;
  metadata: ProjectMetadata;
  completed: number;
  total: number;
  percentage: number;
}
