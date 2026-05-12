/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, ChangeEvent } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Album, MAX_IMAGE_SIZE_BYTES } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  user: User;
  albums: Album[];
  activeAlbumId: string;
}

export function ImageUploader({ user, albums, activeAlbumId }: ImageUploaderProps) {
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetAlbumId, setTargetAlbumId] = useState<string>(activeAlbumId === 'all' ? '' : activeAlbumId);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Basic image compression helper using canvas
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension 1200px
        const MAX_DIM = 1200;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Return compressed JPEG
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    if (!targetAlbumId) {
      toast.error('Please select an album or create one first.');
      return;
    }

    setUploading(true);
    let successCount = 0;

    try {
      for (const file of selectedFiles) {
        try {
          const rawBase64 = await fileToBase64(file);
          const compressed = await compressImage(rawBase64);
          
          // Check if still too large for Firestore (1MB limit)
          if (compressed.length > MAX_IMAGE_SIZE_BYTES) {
            toast.warning(`File "${file.name}" is too large even after compression. Skipping.`);
            continue;
          }

          const imageData = {
            url: compressed,
            albumId: targetAlbumId,
            userId: user.uid,
            title: file.name.split('.')[0],
            description: '',
            createdAt: serverTimestamp(),
            sortOrder: Date.now(),
          };

          await addDoc(collection(db, 'images'), imageData);
          successCount++;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} images!`);
        setSelectedFiles([]);
        setOpen(false);
      } else {
        toast.error('No images were uploaded.');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'images');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-900 text-zinc-50 rounded-xl hover:bg-zinc-800 transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" />
          Add Photos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
          <DialogDescription>
            Select or drag photos to add to your collection.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>Target Album</Label>
            <Select value={targetAlbumId} onValueChange={setTargetAlbumId}>
              <SelectTrigger className="rounded-xl border-zinc-200">
                <SelectValue placeholder="Select an album" />
              </SelectTrigger>
              <SelectContent>
                {albums.map((album) => (
                  <SelectItem key={album.id} value={album.id!}>
                    {album.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div 
            className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-zinc-50 transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) {
                const files = Array.from(e.dataTransfer.files);
                setSelectedFiles(prev => [...prev, ...files]);
              }
            }}
          >
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="p-3 bg-zinc-100 rounded-full group-hover:bg-zinc-200 transition-colors">
              <Upload className="w-6 h-6 text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-zinc-500">SVG, PNG, JPG or GIF (max. 1MB each)</p>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-600">Selected files ({selectedFiles.length})</p>
              <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-zinc-100 rounded-lg text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ImageIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            onClick={handleUpload} 
            disabled={uploading || selectedFiles.length === 0 || !targetAlbumId}
            className="w-full bg-zinc-900 rounded-xl py-6"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Upload {selectedFiles.length} Photos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
