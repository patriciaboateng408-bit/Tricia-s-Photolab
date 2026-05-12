/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from 'react';
import { User } from 'firebase/auth';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ImageDoc, SortOption } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Trash2, Edit3, MoreVertical, Loader2, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Lightbox } from './Lightbox';

interface ImageGridProps {
  images: ImageDoc[];
  loading: boolean;
  user: User;
  sortBy: SortOption;
}

export function ImageGrid({ images, loading, user, sortBy }: ImageGridProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<ImageDoc | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'images', id));
      toast.success('Image deleted.');
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'images');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingImage?.id) return;
    
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'images', editingImage.id), {
        title: editTitle,
        description: editDesc,
      });
      toast.success('Metadata updated.');
      setEditingImage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'images');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = async (currentIndex: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const currentImage = images[currentIndex];
    const targetImage = images[targetIndex];

    if (!currentImage.id || !targetImage.id) return;

    setActionLoading(true);
    try {
      // Simple swap of sort orders
      const currentOrder = currentImage.sortOrder || 0;
      const targetOrder = targetImage.sortOrder || 0;

      // To ensure they are different if they were same
      const newCurrentOrder = targetOrder;
      const newTargetOrder = currentOrder === targetOrder ? currentOrder + 1 : currentOrder;

      await Promise.all([
        updateDoc(doc(db, 'images', currentImage.id), { sortOrder: newCurrentOrder }),
        updateDoc(doc(db, 'images', targetImage.id), { sortOrder: newTargetOrder }),
      ]);

      toast.success('Order updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'images');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-zinc-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <Maximize2 className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-lg font-medium">No photos found</p>
        <p className="text-sm">Start by uploading some photos to this album.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {images.map((img, idx) => (
            <motion.div
              layout
              key={img.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div 
                className="aspect-square overflow-hidden cursor-zoom-in"
                onClick={() => setSelectedImageIdx(idx)}
              >
                <img 
                  src={img.url} 
                  alt={img.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h3 className="font-medium text-sm truncate">{img.title || 'Untitled'}</h3>
                  {img.description && (
                    <p className="text-xs text-zinc-500 truncate">{img.description}</p>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0">
                      <MoreVertical className="w-4 h-4 text-zinc-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl w-40">
                    <DropdownMenuItem 
                      onClick={() => {
                        setEditingImage(img);
                        setEditTitle(img.title || '');
                        setEditDesc(img.description || '');
                      }}
                      className="cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer focus:text-red-600"
                      onClick={() => setDeletingId(img.id!)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>

                    {sortBy === 'custom' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'prev')}
                          className="cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Move Backward
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          disabled={idx === images.length - 1}
                          onClick={() => handleMove(idx, 'next')}
                          className="cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 mr-2" />
                          Move Forward
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Overlay actions on hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="bg-white/90 backdrop-blur shadow-sm h-8 w-8 rounded-lg"
                  onClick={() => setSelectedImageIdx(idx)}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      {selectedImageIdx !== null && (
        <Lightbox 
          images={images} 
          initialIndex={selectedImageIdx} 
          onClose={() => setSelectedImageIdx(null)} 
        />
      )}

      {/* Edit Metadata Dialog */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent className="rounded-3xl">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Image Info</DialogTitle>
              <DialogDescription>
                Update the title and description for this photo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="rounded-xl border-zinc-200"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <textarea
                  id="desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full min-h-[100px] p-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
                  placeholder="Tell a story..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={actionLoading}
                className="w-full bg-zinc-900 rounded-xl py-6"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="rounded-3xl max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Permanent Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setDeletingId(null)} className="rounded-xl">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={actionLoading}
              className="rounded-xl"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
