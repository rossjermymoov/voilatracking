import React, { useState } from 'react';
import { ApiCredentials, FieldMappingConfig } from '@/types';
import { buildQueueTrackingPayload } from '@/lib/mapper';
import {
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Code2,
  Send,
} from 'lucide-react';

interface PayloadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: Record<string, string>[];
  mappingConfig: FieldMappingConfig;
  credentials: ApiCredentials;
}

export const PayloadPreviewModal: React.FC<PayloadPreviewModalProps> = ({
  isOpen,
  onClose,
  rows,
  mappingConfig,
  credentials,
}) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen || rows.length === 0) return null;

  const currentRow = rows[selectedRowIndex] || {};
  const { payload, courierKey, errors } = buildQueueTrackingPayload(
    currentRow,
    mappingConfig,
    credentials
  );

  const endpointUrl = `https://app.heyvoila.io/api/couriers/v1/${encodeURIComponent(
    courierKey || '{courier_key}'
  )}/queue-tracking`;

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-brand-600 flex items-center justify-center font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live JSON Payload Inspector</h3>
              <p className="text-xs text-slate-500">
                Exact API payload generated for Row {selectedRowIndex + 1} of {rows.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Row Selector & Navigator */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              disabled={selectedRowIndex === 0}
              onClick={() => setSelectedRowIndex((i) => Math.max(0, i - 1))}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Row {selectedRowIndex + 1} / {rows.length}
            </span>
            <button
              disabled={selectedRowIndex >= rows.length - 1}
              onClick={() => setSelectedRowIndex((i) => Math.min(rows.length - 1, i + 1))}
              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick slider or jump input */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Jump to row:</span>
            <input
              type="number"
              min={1}
              max={rows.length}
              value={selectedRowIndex + 1}
              onChange={(e) => {
                const val = Number(e.target.value) - 1;
                if (!isNaN(val) && val >= 0 && val < rows.length) {
                  setSelectedRowIndex(val);
                }
              }}
              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-mono font-semibold"
            />
          </div>
        </div>

        {/* Errors / Warnings */}
        {errors.length > 0 && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">Validation issues for this row:</span>
            <span className="text-rose-700">{errors.join(', ')}</span>
          </div>
        )}

        {/* Endpoint Box */}
        <div className="px-6 py-3 bg-slate-900 text-slate-200 text-xs font-mono flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
              POST
            </span>
            <span className="text-slate-300 whitespace-nowrap">{endpointUrl}</span>
          </div>
          <button
            onClick={handleCopy}
            className="ml-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1 shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>

        {/* JSON Code Viewer */}
        <div className="p-6 overflow-y-auto bg-slate-950 font-mono text-xs text-amber-200 flex-1">
          <pre className="whitespace-pre-wrap selection:bg-slate-700">{jsonString}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Auth: <span className="font-mono text-slate-700 font-semibold">{credentials.apiUser || 'Not set'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
