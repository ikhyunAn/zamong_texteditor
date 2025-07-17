import { useState, useEffect } from 'react';
import { UnsplashImage } from '@/types';
import { useToast } from '@/hooks/useToast';

interface UseUnsplashProps {
  query?: string;
  autoFetch?: boolean;
}

interface UseUnsplashReturn {
  images: UnsplashImage[];
  loading: boolean;
  error: string | null;
  searchImages: (searchQuery: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useUnsplash({ 
  query = 'abstract backgrounds', 
  autoFetch = true 
}: UseUnsplashProps = {}): UseUnsplashReturn {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentQuery, setCurrentQuery] = useState(query);
  const { showError } = useToast();

  const fetchImages = async (searchQuery: string, page: number = 1, append: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/unsplash?query=${encodeURIComponent(searchQuery)}&page=${page}&per_page=12`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (append) {
        setImages(prev => [...prev, ...data.results]);
      } else {
        setImages(data.results);
      }
      
      setTotalPages(data.total_pages);
      setCurrentPage(page);
      setCurrentQuery(searchQuery);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch images';
      setError(errorMessage);
      showError('Image Search Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const searchImages = async (searchQuery: string) => {
    await fetchImages(searchQuery, 1, false);
  };

  const loadMore = async () => {
    if (currentPage < totalPages && !loading) {
      await fetchImages(currentQuery, currentPage + 1, true);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchImages(query);
    }
  }, [autoFetch, query]);

  return {
    images,
    loading,
    error,
    searchImages,
    loadMore,
    hasMore: currentPage < totalPages,
  };
}
