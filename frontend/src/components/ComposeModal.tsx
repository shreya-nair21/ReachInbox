import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  X,
  UploadCloud,
  FileText,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Mail,
  Users,
} from 'lucide-react';
import { ComposeEmailPayload } from '../types';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (payload: ComposeEmailPayload) => Promise<void>;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSchedule }) => {
  const [senderEmail, setSenderEmail] = useState('outreach@reachinbox.ai');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');

  // Scheduling Parameters
  const [startImmediately, setStartImmediately] = useState(true);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(100);

  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Extract all valid email addresses using regex from any text/CSV content
  const extractEmails = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const matches = text.match(emailRegex) || [];
    // Deduplicate and lowercase
    return Array.from(new Set(matches.map((e) => e.toLowerCase().trim())));
  };

  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    setIsParsing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setIsParsing(false);
        setErrorMsg('Uploaded file is empty.');
        return;
      }

      // Parse with PapaParse or regex directly
      const detected = extractEmails(content);
      if (detected.length === 0) {
        setErrorMsg('No valid email addresses detected in this file.');
      } else {
        setRecipients(detected);
      }
      setIsParsing(false);
    };

    reader.onerror = () => {
      setIsParsing(false);
      setErrorMsg('Failed to read file.');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleManualAdd = () => {
    if (!manualInput.trim()) return;
    const extracted = extractEmails(manualInput);
    if (extracted.length > 0) {
      const combined = Array.from(new Set([...recipients, ...extracted]));
      setRecipients(combined);
      setManualInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // If manual input has text, parse it before submitting
    let finalRecipients = [...recipients];
    if (manualInput.trim()) {
      const extracted = extractEmails(manualInput);
      finalRecipients = Array.from(new Set([...finalRecipients, ...extracted]));
    }

    if (finalRecipients.length === 0) {
      setErrorMsg('Please upload a CSV/text file of leads or enter recipient email addresses.');
      return;
    }

    if (!subject.trim()) {
      setErrorMsg('Please enter an email subject.');
      return;
    }

    if (!body.trim()) {
      setErrorMsg('Please enter email body content.');
      return;
    }

    let startTimeISO: string | undefined = undefined;
    if (!startImmediately) {
      if (!scheduledDateTime) {
        setErrorMsg('Please choose a start date & time.');
        return;
      }
      startTimeISO = new Date(scheduledDateTime).toISOString();
    }

    try {
      setIsSubmitting(true);
      await onSchedule({
        senderEmail,
        recipients: finalRecipients,
        subject,
        body,
        startTime: startTimeISO,
        delayBetweenSeconds: Number(delaySeconds),
        hourlyLimit: Number(hourlyLimit),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to schedule emails.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Compose New Email Campaign</h2>
              <p className="text-xs text-slate-400">
                Upload leads, configure throttles, and dispatch via BullMQ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sender & Leads Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                From (Sender Email)
              </label>
              <select
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition"
              >
                <option value="outreach@reachinbox.ai">outreach@reachinbox.ai</option>
                <option value="growth@outboxlabs.com">growth@outboxlabs.com</option>
                <option value="sales@reachinbox.io">sales@reachinbox.io</option>
                <option value="founders@outboxlabs.ai">founders@outboxlabs.ai</option>
              </select>
            </div>

            {/* Quick Manual Recipient Entry */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Add Single Recipient
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="lead@company.com"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualAdd();
                    }
                  }}
                  className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleManualAdd}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-xl border border-slate-700 transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Lead CSV/Text Dropzone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Upload Lead List (CSV / TXT)
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-brand-500/70 bg-slate-900/40 rounded-xl p-4 text-center cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-brand-400 mx-auto transition mb-1" />
              <p className="text-xs font-medium text-slate-200">
                Click to browse or drop your CSV / Leads file here
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically extracts and validates all email addresses
              </p>
            </div>

            {/* Parsing State & Detected Count Badge */}
            {isParsing && (
              <p className="text-xs text-brand-400 mt-2 animate-pulse">
                Parsing lead file for email addresses...
              </p>
            )}

            {recipients.length > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    {recipients.length} valid email address{recipients.length > 1 ? 'es' : ''}{' '}
                    detected
                  </span>
                  {fileName && (
                    <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                      ({fileName})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRecipients([]);
                    setFileName(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 transition"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Preview Chips (First 4) */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-h-20 overflow-y-auto">
                {recipients.slice(0, 6).map((rec, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[11px] rounded-md bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[200px]"
                  >
                    {rec}
                  </span>
                ))}
                {recipients.length > 6 && (
                  <span className="px-2 py-0.5 text-[11px] rounded-md bg-slate-800/60 text-slate-400">
                    +{recipients.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Subject & Body */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                placeholder="Exciting partnership opportunity with ReachInbox"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Body
              </label>
              <textarea
                rows={4}
                placeholder="Hi there,&#10;&#10;I came across your profile and wanted to reach out regarding our new AI outreach workflows..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500 placeholder:text-slate-500 resize-none font-sans"
              />
            </div>
          </div>

          {/* Throttling & Scheduling Controls */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Sliders className="w-3.5 h-3.5 text-brand-400" />
              <span>Throughput & Scheduling Controls</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Timing */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Schedule Timing</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="timing"
                      checked={startImmediately}
                      onChange={() => setStartImmediately(true)}
                      className="text-brand-500 focus:ring-brand-500"
                    />
                    <span>Immediately</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="timing"
                      checked={!startImmediately}
                      onChange={() => setStartImmediately(false)}
                      className="text-brand-500 focus:ring-brand-500"
                    />
                    <span>Specific Date & Time</span>
                  </label>
                </div>
              </div>

              {/* Date Picker if not immediate */}
              {!startImmediately ? (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Delay Between Sends</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 0)}
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                    <span className="text-xs text-slate-400">sec (anti-throttle)</span>
                  </div>
                </div>
              )}

              {/* Hourly Limit */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Hourly Limit / Sender</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(parseInt(e.target.value, 10) || 1)}
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                  <span className="text-xs text-slate-400">emails / hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? 'Scheduling in BullMQ...'
                  : `Schedule Campaign (${recipients.length || 0} leads)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
