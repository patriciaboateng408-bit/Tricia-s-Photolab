/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Album, ImageDoc, SortOption } from '../types';
import { AlbumManager } from './AlbumManager';
import { ImageGrid } from './ImageGrid';
import { ImageUploader } from './ImageUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, FolderPlus, Grid, ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface GalleryProps {
  user: User;
}

export function Gallery({ user }: GalleryProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeAlbumId, setActiveAlbumId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [images, setImages] = useState<ImageDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Albums
  useEffect(() => {
    const q = query(
      collection(db, 'albums'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const albumList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
      setAlbums(albumList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'albums'));

    return () => unsubscribe();
  }, [user.uid]);

  // Fetch Images
  useEffect(() => {
    let q;
    if (activeAlbumId === 'all') {
      q = query(
        collection(db, 'images'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'images'),
        where('userId', '==', user.uid),
        where('albumId', '==', activeAlbumId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imageList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImageDoc));
      setImages(imageList);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'images'));

    return () => unsubscribe();
  }, [user.uid, activeAlbumId]);

  const sortedImages = [...images].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return (b.createdAt as any)?.toMillis?.() - (a.createdAt as any)?.toMillis?.() || 0;
      case 'date-asc':
        return (a.createdAt as any)?.toMillis?.() - (b.createdAt as any)?.toMillis?.() || 0;
      case 'title-asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'title-desc':
        return (b.title || '').localeCompare(a.title || '');
      case 'custom':
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Collection</h2>
          <p className="text-zinc-500">Organize and browse your photos.</p>
        </div>
        <div className="flex items-center gap-2">
          <AlbumManager user={user} />
          <ImageUploader user={user} albums={albums} activeAlbumId={activeAlbumId} />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeAlbumId} onValueChange={setActiveAlbumId} className="w-full">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <TabsList className="bg-transparent h-12 p-0 gap-6">
            <TabsTrigger 
              value="all" 
              className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-zinc-900 rounded-none h-full transition-none font-medium"
            >
              All Photos
            </TabsTrigger>
            {albums.map((album) => (
              <TabsTrigger 
                key={album.id} 
                value={album.id!} 
                className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-zinc-900 rounded-none h-full transition-none font-medium"
              >
                {album.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 hidden sm:block">Sort by:</span>
            <Select value={sortBy} onValueChange={(val: SortOption) => setSortBy(val)}>
              <SelectTrigger className="h-9 w-[140px] rounded-lg border-none bg-zinc-100 hover:bg-zinc-200 transition-colors text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                <SelectItem value="custom">Custom Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={activeAlbumId} className="mt-8 outline-none">
          <ImageGrid images={sortedImages} loading={loading} user={user} sortBy={sortBy} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
