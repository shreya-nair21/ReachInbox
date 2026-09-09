import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  X,
  UploadCloud,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Mail,
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

  const extractEmails = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const matches = text.match(emailRegex) || [];
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#000000] border border-white/20 rounded-[2px] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#ffed00] flex items-center justify-center text-black">
              <Mail className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Compose Email Campaign
              </h2>
              <p className="text-[10px] text-[#8a8a8a] uppercase tracking-wide">
                Distributed BullMQ Dispatch with Rate-Limit Resilience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-[2px] bg-rose-950/50 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sender & Manual Add */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">
                From (Sender Email)
              </label>
              <select
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full bg-[#111111] border border-white/15 rounded-[2px] px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#ffed00] transition uppercase font-sans"
              >
                <option value="outreach@reachinbox.ai">outreach@reachinbox.ai</option>
                <option value="growth@outboxlabs.com">growth@outboxlabs.com</option>
                <option value="sales@reachinbox.io">sales@reachinbox.io</option>
                <option value="founders@outboxlabs.ai">founders@outboxlabs.ai</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">
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
                  className="flex-1 bg-[#111111] border border-white/15 rounded-[2px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffed00] placeholder:text-[#666666]"
                />
                <button
                  type="button"
                  onClick={handleManualAdd}
                  className="px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-xs font-bold uppercase text-white rounded-[2px] border border-white/15 transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Lead CSV/Text Dropzone */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">
              Upload Lead List (CSV / TXT)
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-[#ffed00] bg-[#0a0a0a] rounded-[2px] p-5 text-center cursor-pointer transition group"
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
              <UploadCloud className="w-8 h-8 text-[#8a8a8a] group-hover:text-[#ffed00] mx-auto transition mb-1.5" />
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                Click or Drop Leads File Here
              </p>
              <p className="text-[10px] text-[#8a8a8a] uppercase tracking-wide mt-0.5">
                Automatically extracts and deduplicates all email addresses
              </p>
            </div>

            {isParsing && (
              <p className="text-xs text-[#ffed00] mt-2 animate-pulse uppercase font-semibold">
                Parsing lead file for email addresses...
              </p>
            )}

            {recipients.length > 0 && (
              <div className="mt-3 p-3 rounded-[2px] bg-[#111111] border border-white/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ffed00]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">
                    {recipients.length} valid lead{recipients.length > 1 ? 's' : ''} detected
                  </span>
                  {fileName && (
                    <span className="text-[10px] text-[#8a8a8a] truncate max-w-[160px]">
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
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider transition"
                >
                  Clear
                </button>
              </div>
            )}

            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-h-20 overflow-y-auto">
                {recipients.slice(0, 6).map((rec, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#1a1a1a] text-white border border-white/15 truncate max-w-[200px]"
                  >
                    {rec}
                  </span>
                ))}
                {recipients.length > 6 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#1a1a1a] text-[#ffed00]">
                    +{recipients.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Subject & Body */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">
                Subject
              </label>
              <input
                type="text"
                placeholder="High-impact partnership proposal"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#111111] border border-white/15 rounded-[2px] px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ffed00] placeholder:text-[#666666]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-1.5">
                Email Body
              </label>
              <textarea
                rows={4}
                placeholder="Hi there,&#10;&#10;I wanted to connect regarding our high-scale AI workflows..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-[#111111] border border-white/15 rounded-[2px] p-3 text-xs text-white focus:outline-none focus:border-[#ffed00] placeholder:text-[#666666] resize-none"
              />
            </div>
          </div>

          {/* Throttling & Scheduling Controls */}
          <div className="p-4 rounded-[2px] bg-[#111111] border border-white/15 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-[#ffed00]" />
              <span>Throughput & Scheduling Controls</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[10px] text-[#8a8a8a] uppercase font-bold mb-1">
                  Dispatch Timing
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="timing"
                      checked={startImmediately}
                      onChange={() => setStartImmediately(true)}
                      className="accent-[#ffed00]"
                    />
                    <span>Immediately</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer font-bold">
                    <input
                      type="radio"
                      name="timing"
                      checked={!startImmediately}
                      onChange={() => setStartImmediately(false)}
                      className="accent-[#ffed00]"
                    />
                    <span>Specific Date & Time</span>
                  </label>
                </div>
              </div>

              {!startImmediately ? (
                <div>
                  <label className="block text-[10px] text-[#8a8a8a] uppercase font-bold mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full bg-[#000000] border border-white/20 rounded-[2px] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ffed00]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] text-[#8a8a8a] uppercase font-bold mb-1">
                    Delay Between Sends
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 0)}
                      className="w-20 bg-[#000000] border border-white/20 rounded-[2px] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ffed00] font-bold"
                    />
                    <span className="text-[10px] text-[#8a8a8a] uppercase font-semibold">sec (anti-throttle)</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-[#8a8a8a] uppercase font-bold mb-1">
                  Hourly Limit / Sender
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(parseInt(e.target.value, 10) || 1)}
                    className="w-20 bg-[#000000] border border-white/20 rounded-[2px] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ffed00] font-bold"
                  />
                  <span className="text-[10px] text-[#8a8a8a] uppercase font-semibold">emails / hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#8a8a8a] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-renault-primary flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-black" />
              <span>
                {isSubmitting
                  ? 'Queueing in BullMQ...'
                  : `Schedule Campaign (${recipients.length || 0} leads)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
