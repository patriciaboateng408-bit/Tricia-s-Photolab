/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FolderPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AlbumManagerProps {
  user: User;
}

export function AlbumManager({ user }: AlbumManagerProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAlbum = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const albumData = {
        title: title.trim(),
        description: description.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'albums'), albumData);
      toast.success('Album created successfully!');
      setTitle('');
      setDescription('');
      setOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'albums');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="rounded-xl border-zinc-200 hover:bg-zinc-50">
            <FolderPlus className="w-4 h-4 mr-2" />
            New Album
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <form onSubmit={handleCreateAlbum}>
          <DialogHeader>
            <DialogTitle>Create New Album</DialogTitle>
            <DialogDescription>
              Group your photos into a new collection.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Album Title</Label>
              <Input
                id="title"
                placeholder="e.g. Summer Vacation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border-zinc-200"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="A few words about this album..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-zinc-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading || !title.trim()}
              className="w-full bg-zinc-900 rounded-xl py-6"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Album
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
