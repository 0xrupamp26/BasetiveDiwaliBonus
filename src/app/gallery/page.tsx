'use client';

import { MainLayout } from '~/components/layout/MainLayout';
import { Gallery } from '~/components/gallery/Gallery';

export default function GalleryPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <Gallery />
      </div>
    </MainLayout>
  );
}
