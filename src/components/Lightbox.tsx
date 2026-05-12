/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { ImageDoc } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, Info, Calendar } from 'lucide-react';
import { Button } from './ui/button';

interface LightboxProps {
  images: ImageDoc[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [showMeta, setShowMeta] = useState(true);

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, next, prev]);

  const currentImage = images[index];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm overflow-hidden select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="relative w-full h-full flex items-center justify-center p-4 md:p-12 lg:p-20"
        >
          <img
            src={currentImage.url}
            alt={currentImage.title}
            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
          />
        </motion.div>
      </AnimatePresence>

      {/* Top Controls */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowMeta(!showMeta)}
            className="text-white hover:bg-white/10 rounded-full"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-white hover:bg-white/10 rounded-full pointer-events-auto"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          className="h-16 w-16 text-white/50 hover:text-white hover:bg-white/5 rounded-full pointer-events-auto"
        >
          <ChevronLeft className="w-10 h-10" />
        </Button>
      </div>
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          className="h-16 w-16 text-white/50 hover:text-white hover:bg-white/5 rounded-full pointer-events-auto"
        >
          <ChevronRight className="w-10 h-10" />
        </Button>
      </div>

      {/* Metadata Overlay */}
      <AnimatePresence>
        {showMeta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent pointer-none"
          >
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="text-white/40 text-xs font-medium tracking-widest uppercase mb-2 block">
                  Image {index + 1} of {images.length}
                </span>
                <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                  {currentImage.title || 'Untitled Image'}
                </h2>
                {currentImage.description && (
                  <p className="text-white/70 max-w-2xl text-lg">
                    {currentImage.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Uploaded on {(currentImage.createdAt as any)?.toDate?.().toLocaleDateString() || new Date(currentImage.createdAt as any).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
