import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Table,
  ArrowRight,
  FolderOpen,
  Sparkles,
  Layers,
} from 'lucide-react';
import { MappingPreset } from '@/types';

interface CsvUploaderProps {
  onDataLoaded: (data: {
    fileName: string;
    headers: string[];
    rows: Record<string, string>[];
  }) => void;
  currentFileName?: string;
  totalRows?: number;
  onProceedToMapping: () => void;
  presets: MappingPreset[];
  selectedPresetId?: string;
  onSelectPreset: (preset: MappingPreset | null) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  onDataLoaded,
  currentFileName,
  totalRows = 0,
  onProceedToMapping,
  presets,
  selectedPresetId,
  onSelectPreset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a valid .csv file.');
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setError(`CSV Parsing Error: ${results.errors[0].message}`);
          return;
        }

        const cleanRows = results.data.filter((row) =>
          Object.values(row).some((val) => val && String(val).trim() !== '')
        );

        if (cleanRows.length === 0) {
          setError('The uploaded CSV appears to be empty or contains no valid rows.');
          return;
        }

        const headers = results.meta.fields || Object.keys(cleanRows[0] || {});
        setPreviewHeaders(headers);
        setPreviewRows(cleanRows.slice(0, 5));

        onDataLoaded({
          fileName: file.name,
          headers,
          rows: cleanRows,
        });
      },
      error: (err) => {
        setError(`Failed to read file: ${err.message}`);
      },
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handlePresetChange = (presetId: string) => {
    if (!presetId) {
      onSelectPreset(null);
    } else {
      const found = presets.find((p) => p.id === presetId);
      if (found) {
        onSelectPreset(found);
      }
    }
  };

  const downloadSampleCsv = () => {
    const sampleContent =
      `Tracking_Number,Courier,Order_Reference,Customer_Name,Phone,Email,Company,Address_1,Address_2,City,County,Postcode,Country,Collection_Date\n` +
      `1Z9999999999999999,DPD,ORD-8801,John Doe,+447700900001,john.doe@example.com,Acme Co,10 Downing Street,,London,Greater London,SW1A 2AA,GB,2026-09-28T10:00:00Z\n` +
      `JD0146000000000000,DPD,ORD-8802,Sarah Jenkins,+447700900002,sarah@example.com,,24 Baker Street,Apt 3,London,,NW1 6XE,GB,2026-09-28T11:30:00Z\n` +
      `09445839201948,DPD,ORD-8803,Michael Smith,+46701234567,michael@example.se,,Ekeredsvaegen 132,,Lerum,,443 50,SE,2026-09-28T12:00:00Z\n` +
      `123456789;987654321,DPD,ORD-8804,Laura Croft,+12025550199,laura@croftexpeditions.com,Croft Manor,Park Lane,,Manchester,,M1 1AA,GB,2026-09-28T14:15:00Z`;

    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_voila_queue_tracking.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activePreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Upload Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-brand-400 bg-white hover:bg-slate-50/60 shadow-sm'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,text/csv"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-100/80 text-brand-600 flex items-center justify-center shadow-inner">
            <Upload className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {currentFileName ? 'Replace CSV file' : 'Upload Any Courier Shipments CSV'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Drag and drop any spreadsheet here, or click to browse. Any column format is supported.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="inline-flex items-center space-x-1">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Comma-separated (.csv)</span>
            </span>
            <span>•</span>
            <span>Any Column Headers</span>
            <span>•</span>
            <span>Up to 50,000 rows</span>
          </div>
        </div>
      </div>

      {/* CHOOSE TEMPLATE DROPDOWN BOX */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-600 flex items-center justify-center font-bold shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <label htmlFor="choose-template-select" className="text-xs font-bold text-slate-900 flex items-center space-x-2">
              <span>Choose Mapping Template (Optional)</span>
              {activePreset && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Applied
                </span>
              )}
            </label>
            <p className="text-xs text-slate-500">
              Select a saved template to automatically map columns when you upload your file.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            id="choose-template-select"
            value={selectedPresetId || ''}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">-- No Template (Auto-Detect Headers) --</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.fileLevelCourier ? `(${p.fileLevelCourier})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Helper Bar / Sample CSV button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs">
        <div className="flex items-center space-x-2 text-slate-600">
          <FileText className="w-4 h-4 text-brand-500" />
          <span>Need a test file? Download a sample CSV template with test data.</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadSampleCsv();
          }}
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 shadow-sm transition-all flex items-center space-x-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-brand-500" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Upload Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loaded File Summary & Table Preview */}
      {currentFileName && totalRows > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Summary header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <span>{currentFileName}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {totalRows.toLocaleString()} Rows
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  {previewHeaders.length} columns detected • Ready for field mapping
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onProceedToMapping}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center space-x-2"
              >
                <span>Continue to Field Mapping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Raw Preview Table */}
          {previewRows.length > 0 && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <Table className="w-3.5 h-3.5" />
                  <span>Preview Data (First {previewRows.length} rows)</span>
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                      <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-slate-400">
                        #
                      </th>
                      {previewHeaders.map((header) => (
                        <th key={header} className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        {previewHeaders.map((header) => (
                          <td
                            key={header}
                            className="py-2 px-3 border-r border-slate-200 whitespace-nowrap text-slate-700 font-mono text-[11px]"
                          >
                            {row[header] || <span className="text-slate-300 italic">empty</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
