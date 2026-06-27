import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface ExportButtonProps {
  url: string;
  filename: string;
  label?: string;
  className?: string;
}

export default function ExportButton({ url, filename, label = 'Export', className = '' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handleExport}
        disabled={loading}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-indigo hover:bg-brand-indigo/90 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {loading ? 'Exporting...' : label}
      </button>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
