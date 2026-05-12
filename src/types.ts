/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Timestamp } from 'firebase/firestore';

export interface Album {
  id?: string;
  title: string;
  description?: string;
  userId: string;
  createdAt: Timestamp | Date;
}

export interface ImageDoc {
  id?: string;
  title?: string;
  description?: string;
  url: string; // Base64 or URL
  albumId: string;
  userId: string;
  createdAt: Timestamp | Date;
  sortOrder?: number;
}

export const MAX_IMAGE_SIZE_BYTES = 1048576; // 1MB

export type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'custom';
