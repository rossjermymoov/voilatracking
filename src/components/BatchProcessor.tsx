import React, { useState, useEffect, useRef } from 'react';
import {
  ApiCredentials,
  FieldMappingConfig,
  ProcessedRowResult,
} from '@/types';
import { buildQueueTrackingPayload } from '@/lib/mapper';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowLeft,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
} from 'lucide-react';
import Papa from 'papaparse';

interface BatchProcessorProps {
  rows: Record<string, string>[];
  csvHeaders: string[];
  mappingConfig: FieldMappingConfig;
  credentials: ApiCredentials;
  onBackToMapping: () => void;
  onOpenSettings: () => void;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  rows,
  csvHeaders,
  mappingConfig,
  credentials,
  onBackToMapping,
  onOpenSettings,
}) => {
  const [results, setResults] = useState<ProcessedRowResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [concurrency, setConcurrency] = useState<number>(3);
  const [delayMs, setDelayMs] = useState<number>(100);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Reference to abort or pause
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);

  // Initialize row items on mount or when rows/mapping changes
  useEffect(() => {
    const initial: ProcessedRowResult[] = rows.map((row, idx) => {
      const { payload, courierKey, errors } = buildQueueTrackingPayload(
        row,
        mappingConfig,
        credentials
      );

      return {
        rowIndex: idx,
        originalRow: row,
        courierKey,
        payload,
        status: errors.length > 0 ? 'error' : 'pending',
        errorMessage: errors.length > 0 ? errors.join(', ') : undefined,
      };
    });

    setResults(initial);
  }, [rows, mappingConfig, credentials]);

  const hasCredentials = Boolean(credentials.apiUser && credentials.apiToken);

  // Process a single row against the HeyVoila proxy
  const processSingleRow = async (item: ProcessedRowResult): Promise<ProcessedRowResult> => {
    if (item.errorMessage && item.status === 'error') {
      // already pre-flight invalid
      return item;
    }

    try {
      const res = await fetch('/api/queue-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierKey: item.courierKey,
          payload: item.payload,
          apiUser: credentials.apiUser,
          apiToken: credentials.apiToken,
        }),
      });

      const data = await res.json();
      const timestamp = new Date().toLocaleTimeString();

      if (res.ok) {
        return {
          ...item,
          status: 'success',
          httpStatus: res.status,
          response: data,
          timestamp,
        };
      } else {
        return {
          ...item,
          status: 'error',
          httpStatus: res.status,
          errorMessage: data.error || `HTTP ${res.status} Error`,
          response: data,
          timestamp,
        };
      }
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        errorMessage: err.message || 'Network error',
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  };

  // Main Batch Runner
  const runBatch = async (itemsToRun: ProcessedRowResult[]) => {
    if (!hasCredentials) {
      onOpenSettings();
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;

    const queue = [...itemsToRun];
    const inFlight = new Set<Promise<void>>();

    // Helper to process queue with concurrency pool
    const processQueue = async () => {
      while (queue.length > 0 && !isCancelledRef.current) {
        while (isPausedRef.current && !isCancelledRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        if (isCancelledRef.current) break;

        const currentItem = queue.shift();
        if (!currentItem) break;

        // Mark as processing
        setResults((prev) =>
          prev.map((r) =>
            r.rowIndex === currentItem.rowIndex ? { ...r, status: 'processing' } : r
          )
        );

        const taskPromise = (async () => {
          if (delayMs > 0) {
            await new Promise((r) => setTimeout(r, delayMs));
          }
          const updatedItem = await processSingleRow(currentItem);
          setResults((prev) =>
            prev.map((r) => (r.rowIndex === updatedItem.rowIndex ? updatedItem : r))
          );
        })();

        inFlight.add(taskPromise);
        taskPromise.finally(() => inFlight.delete(taskPromise));

        if (inFlight.size >= concurrency) {
          await Promise.race(inFlight);
        }
      }

      await Promise.all(inFlight);
    };

    await processQueue();
    setIsProcessing(false);
    setIsPaused(false);
  };

  const handleStartAll = () => {
    const pendingItems = results.filter((r) => r.status === 'pending' || r.status === 'error');
    runBatch(pendingItems);
  };

  const handleRetryFailed = () => {
    const failedItems = results.filter((r) => r.status === 'error');
    runBatch(failedItems);
  };

  const handleTogglePause = () => {
    if (isPaused) {
      isPausedRef.current = false;
      setIsPaused(false);
    } else {
      isPausedRef.current = true;
      setIsPaused(true);
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    setIsPaused(false);
  };

  // Export Results to CSV
  const handleExportCsv = () => {
    const exportData = results.map((r) => {
      const resp = r.response || {};
      return {
        ...r.originalRow,
        _Voila_Courier: r.courierKey,
        _Voila_Status: r.status,
        _Voila_Shipment_ID: resp.shipment_id || '',
        _Voila_Tracking_Request_ID: resp.tracking_request_id || '',
        _Voila_Tracking_Request_Hash: resp.tracking_request_hash || '',
        _Voila_Error_Message: r.errorMessage || '',
        _Voila_Processed_At: r.timestamp || '',
      };
    });

    const csvString = Papa.unparse(exportData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `heyvoila_queued_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Progress calculations
  const totalCount = results.length;
  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const pendingCount = results.filter((r) => r.status === 'pending' || r.status === 'processing').length;
  const processedCount = successCount + errorCount;
  const progressPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  // Filter & search
  const filteredResults = results.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const ref = (r.payload.shipment.reference || '').toLowerCase();
    const tracking = r.payload.shipment.tracking_codes.join(' ').toLowerCase();
    const courier = (r.courierKey || '').toLowerCase();
    const err = (r.errorMessage || '').toLowerCase();
    return ref.includes(s) || tracking.includes(s) || courier.includes(s) || err.includes(s);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Credentials Alert if Missing */}
      {!hasCredentials && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-sm block">HeyVoila API Credentials Missing</span>
              <span>Please configure your API User and Token before starting the queue runner.</span>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-sm shrink-0"
          >
            Enter API Keys
          </button>
        </div>
      )}

      {/* Control Dashboard Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Header and Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Batch Queue Tracking Execution</span>
              {credentials.isTesting && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  SANDBOX / TESTING MODE
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Auth Account: <span className="font-semibold text-slate-700 font-mono">{credentials.apiUser || 'Not Configured'}</span>
              {credentials.authCompany && ` • Company: ${credentials.authCompany}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isProcessing ? (
              <button
                onClick={handleStartAll}
                disabled={!hasCredentials || pendingCount === 0}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {processedCount > 0 && pendingCount > 0
                    ? `Resume Remaining (${pendingCount})`
                    : `Start Queueing (${totalCount} Shipments)`}
                </span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTogglePause}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            )}

            {errorCount > 0 && !isProcessing && (
              <button
                onClick={handleRetryFailed}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-all flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Failed ({errorCount})</span>
              </button>
            )}

            <button
              onClick={handleExportCsv}
              disabled={processedCount === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-xs transition-all flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Results CSV</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar & Stats Grid */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">
              Overall Progress: {progressPercent}% ({processedCount} of {totalCount} completed)
            </span>
            {isProcessing && (
              <span className="text-brand-600 flex items-center space-x-1 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isPaused ? 'Paused' : 'Queueing events to HeyVoila...'}</span>
              </span>
            )}
          </div>

          <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200 flex">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(successCount / (totalCount || 1)) * 100}%` }}
            />
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(errorCount / (totalCount || 1)) * 100}%` }}
            />
          </div>

          {/* Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Shipments</span>
              <span className="text-lg font-bold text-slate-900">{totalCount.toLocaleString()}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
              <span className="text-[11px] font-semibold text-emerald-700 block flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Queued (Success)</span>
              </span>
              <span className="text-lg font-bold text-emerald-800">{successCount.toLocaleString()}</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80">
              <span className="text-[11px] font-semibold text-rose-700 block flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Errors / Failed</span>
              </span>
              <span className="text-lg font-bold text-rose-800">{errorCount.toLocaleString()}</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80">
              <span className="text-[11px] font-semibold text-amber-700 block flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending</span>
              </span>
              <span className="text-lg font-bold text-amber-800">{pendingCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Speed & Concurrency Settings Accordion */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-slate-600 font-semibold">Concurrency:</span>
              <select
                disabled={isProcessing}
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value={1}>1 worker (Strict sequential)</option>
                <option value={2}>2 concurrent</option>
                <option value={3}>3 concurrent (Recommended)</option>
                <option value={5}>5 concurrent</option>
                <option value={10}>10 concurrent (Fast)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-600 font-semibold">Rate Delay:</span>
              <select
                disabled={isProcessing}
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value={0}>0ms (Immediate)</option>
                <option value={50}>50ms</option>
                <option value={100}>100ms (Safe)</option>
                <option value={250}>250ms</option>
                <option value={500}>500ms</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            Endpoint: /api/couriers/v1/[courier_key]/queue-tracking
          </div>
        </div>
      </div>

      {/* Real-time Results Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        {/* Table Filter & Search Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setFilterStatus('success')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              Success ({successCount})
            </button>
            <button
              onClick={() => setFilterStatus('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'error'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white hover:bg-slate-100 text-rose-700 border border-rose-200'
              }`}
            >
              Errors ({errorCount})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white hover:bg-slate-100 text-amber-700 border border-amber-200'
              }`}
            >
              Pending ({pendingCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference or tracking..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Tracking Code(s)</th>
                <th className="py-2.5 px-3">Courier</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Voila Response / IDs</th>
                <th className="py-2.5 px-3 w-12 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No matching rows found.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => {
                  const isExpanded = expandedRow === r.rowIndex;
                  const resp = r.response || {};
                  return (
                    <React.Fragment key={r.rowIndex}>
                      <tr
                        onClick={() => setExpandedRow(isExpanded ? null : r.rowIndex)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-orange-50/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                          {r.rowIndex + 1}
                        </td>

                        {/* Status badge */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {r.status === 'success' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>QUEUED</span>
                            </span>
                          )}
                          {r.status === 'error' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>FAILED</span>
                            </span>
                          )}
                          {r.status === 'processing' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                              <span>SENDING</span>
                            </span>
                          )}
                          {r.status === 'pending' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>PENDING</span>
                            </span>
                          )}
                        </td>

                        {/* Tracking Code */}
                        <td className="py-2.5 px-3 font-mono text-slate-900 font-semibold whitespace-nowrap">
                          {r.payload.shipment.tracking_codes.join(', ') || (
                            <span className="text-rose-400 italic">Missing</span>
                          )}
                        </td>

                        {/* Courier */}
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {r.courierKey}
                        </td>

                        {/* Reference */}
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {r.payload.shipment.reference || '-'}
                        </td>

                        {/* Recipient */}
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {r.payload.shipment.ship_to?.name ||
                            r.payload.shipment.ship_to?.city ||
                            '-'}
                        </td>

                        {/* Response / IDs */}
                        <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">
                          {r.status === 'success' ? (
                            <div className="space-y-0.5">
                              {resp.shipment_id && (
                                <span className="block text-emerald-700">
                                  Shipment ID: <strong>{resp.shipment_id}</strong>
                                </span>
                              )}
                              {resp.tracking_request_id && (
                                <span className="block text-slate-500 text-[10px]">
                                  Request ID: {resp.tracking_request_id}
                                </span>
                              )}
                            </div>
                          ) : r.status === 'error' ? (
                            <span className="text-rose-600 line-clamp-1 font-sans">
                              {r.errorMessage}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-sans">-</span>
                          )}
                        </td>

                        {/* Expand trigger */}
                        <td className="py-2.5 px-3 text-center text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                      </tr>

                      {/* Expanded details row */}
                      {isExpanded && (
                        <tr className="bg-slate-950 text-slate-200">
                          <td colSpan={8} className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              {/* Request Payload */}
                              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-amber-400 font-bold block">
                                  Sent Payload (POST to /api/couriers/v1/{r.courierKey}/queue-tracking)
                                </span>
                                <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap text-slate-300">
                                  {JSON.stringify(r.payload, null, 2)}
                                </pre>
                              </div>

                              {/* API Response */}
                              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                                <span className="text-emerald-400 font-bold block">
                                  HeyVoila API Response ({r.httpStatus ? `HTTP ${r.httpStatus}` : 'N/A'})
                                </span>
                                <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap text-slate-300">
                                  {r.response
                                    ? JSON.stringify(r.response, null, 2)
                                    : r.errorMessage || 'No response recorded yet'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Step Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBackToMapping}
          disabled={isProcessing}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center space-x-2 disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Field Mapping</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={processedCount === 0}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Download Queued Results CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
