import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploaderProps {
  onDataLoaded: (data: any[]) => void;
}

export function FileUploader({ onDataLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = (file: File) => {
    setLoading(true);
    setError(null);
    
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      setError('Please upload a CSV or JSON file.');
      setLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        if (file.name.endsWith('.csv')) {
          Papa.parse(content, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
              onDataLoaded(results.data);
              setFile(file);
              setLoading(false);
            },
            error: (err) => {
              setError(`CSV Parsing Error: ${err.message}`);
              setLoading(false);
            }
          });
        } else {
          const jsonData = JSON.parse(content);
          const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
          onDataLoaded(dataArray);
          setFile(file);
          setLoading(false);
        }
      } catch (err) {
        setError('Error parsing file. Ensure it is a valid format.');
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer",
          isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/50",
          error ? "border-red-200" : ""
        )}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept=".csv,.json"
          onChange={onFileSelect}
        />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-1">{file.name}</h3>
              <p className="text-slate-500 text-sm mb-6">File uploaded successfully</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setError(null);
                }}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
              >
                <X size={16} />
                Remove file
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors",
                isDragging ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
              )}>
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload your data file</h3>
              <p className="text-slate-500 mb-8 max-w-sm">
                Drag and drop your <span className="text-slate-900 font-medium">CSV</span> or <span className="text-slate-900 font-medium">JSON</span> data file here to start the analysis.
              </p>
              <div className="flex flex-col gap-4 w-full px-8">
                <div className="flex items-center gap-2 text-sm text-slate-400 justify-center">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span>Sales reports</span>
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span>Financial statements</span>
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span>User activity</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-600 font-medium tracking-tight">Processing dataset...</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700"
        >
          <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
          <div className="text-sm">
            <p className="font-semibold mb-0.5">Invalid file format</p>
            <p className="opacity-90">{error}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
