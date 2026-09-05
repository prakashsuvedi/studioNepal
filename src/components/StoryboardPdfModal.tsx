import React from 'react';
import { X, FileText, Download, Printer, CheckCircle2, Film, Clock, Sparkles, Tag, MessageSquare } from 'lucide-react';
import { Scene } from '../types';

interface StoryboardPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  scenes: Scene[];
  aspectRatio: string;
}

export const StoryboardPdfModal: React.FC<StoryboardPdfModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  scenes,
  aspectRatio,
}) => {
  if (!isOpen) return null;

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${projectTitle} - Storyboard</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Mukta:wght@500;700&display=swap');
            
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            body {
              font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
            }
            .header {
              border-bottom: 2px solid #334155;
              padding-bottom: 12px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
            }
            .subtitle {
              font-size: 11px;
              color: #64748b;
              margin-top: 4px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              background: #f8fafc;
              padding: 10px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              margin-bottom: 20px;
              font-size: 11px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-size: 9px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 700;
            }
            .meta-val {
              font-weight: 700;
              color: #1e293b;
              margin-top: 2px;
            }
            .scene-card {
              page-break-inside: avoid;
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 12px;
              margin-bottom: 16px;
              display: grid;
              grid-template-columns: 200px 1fr;
              gap: 16px;
              background: #ffffff;
            }
            .thumb-box {
              width: 100%;
              height: 120px;
              background: #0f172a;
              border-radius: 6px;
              overflow: hidden;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .thumb-box img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .scene-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            .scene-num {
              font-size: 13px;
              font-weight: 800;
              color: #2563eb;
            }
            .scene-title {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
              background: #e2e8f0;
              color: #334155;
            }
            .prompt-box {
              font-size: 10px;
              background: #f8fafc;
              padding: 6px 8px;
              border-radius: 6px;
              border: 1px solid #f1f5f9;
              color: #334155;
              margin-bottom: 6px;
            }
            .overlay-box {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
              font-family: 'Mukta', 'Plus Jakarta Sans', sans-serif;
              margin-bottom: 6px;
            }
            .notes-box {
              font-size: 10px;
              background: #fefce8;
              border: 1px solid #fef08a;
              color: #854d0e;
              padding: 6px 8px;
              border-radius: 6px;
            }
            .tags-list {
              display: flex;
              gap: 4px;
              margin-top: 4px;
            }
            .tag-item {
              font-size: 9px;
              font-weight: 700;
              padding: 1px 6px;
              border-radius: 4px;
              background: #eff6ff;
              color: #1d4ed8;
              border: 1px solid #bfdbfe;
            }
            .footer {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
              font-size: 9px;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${projectTitle}</h1>
              <div class="subtitle">Official Video Production Storyboard & Client Review Spec sheet</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
              <strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}<br/>
              <strong>Platform:</strong> NepalAI Studio Engine
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Total Scenes</span>
              <span class="meta-val">${scenes.length} Clips</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Duration</span>
              <span class="meta-val">${totalDuration} Seconds</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Target Aspect Ratio</span>
              <span class="meta-val">${aspectRatio}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Export Version</span>
              <span class="meta-val">1.0 Final Draft</span>
            </div>
          </div>

          <div>
            ${scenes.map((s, idx) => `
              <div class="scene-card">
                <div>
                  <div class="thumb-box">
                    ${s.mediaUrl ? `<img src="${s.mediaUrl}" />` : `<div style="color:#64748b; font-size:10px;">No Media</div>`}
                  </div>
                  <div style="font-size: 9px; color: #64748b; margin-top: 6px; display: flex; justify-content: space-between;">
                    <span>Motion: <strong>${s.motion}</strong></span>
                    <span>Trans: <strong>${s.transition || 'cut'}</strong></span>
                  </div>
                </div>
                <div>
                  <div class="scene-header">
                    <div>
                      <span class="scene-num">Scene ${idx + 1}</span> &nbsp;
                      <span class="scene-title">${s.title}</span>
                    </div>
                    <span class="badge">${s.duration}s</span>
                  </div>

                  ${s.prompt ? `
                    <div class="prompt-box">
                      <strong>AI Prompt:</strong> ${s.prompt}
                    </div>
                  ` : ''}

                  ${s.textOverlay ? `
                    <div class="overlay-box">
                      💬 "${s.textOverlay}" ${s.textNepali ? `(${s.textNepali})` : ''}
                    </div>
                  ` : ''}

                  ${s.tags && s.tags.length > 0 ? `
                    <div class="tags-list">
                      ${s.tags.map(t => `<span class="tag-item">🏷️ ${t}</span>`).join('')}
                    </div>
                  ` : ''}

                  ${s.notes ? `
                    <div class="notes-box" style="margin-top: 6px;">
                      📝 <strong>Production Note:</strong> ${s.notes}
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            NepalAI Studio Video Production Engine — Confidential Client Review Document & Scene Metadata Summary
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Generate Client Storyboard PDF</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                  {scenes.length} Scenes
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Export printable PDF or document summary with thumbnails, prompts, overlay texts, and production notes.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Storyboard Preview Box */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-950">
          <div className="bg-white text-slate-900 rounded-xl p-5 border border-slate-300 shadow-md space-y-4 font-['Plus_Jakarta_Sans']">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">{projectTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Video Production Storyboard Summary & Client Approval Sheet</p>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <span className="font-semibold block text-slate-700">NepalAI Studio</span>
                <span>{scenes.length} Scenes • {totalDuration}s Total</span>
              </div>
            </div>

            {/* Scene List Preview */}
            <div className="space-y-3">
              {scenes.map((scene, idx) => (
                <div key={scene.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex gap-4 items-start">
                  <div className="w-28 h-18 bg-slate-900 rounded-md overflow-hidden shrink-0 relative flex items-center justify-center">
                    {scene.mediaUrl ? (
                      <img src={scene.mediaUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-6 h-6 text-slate-600" />
                    )}
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-white text-[9px] font-mono">
                      {scene.duration}s
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-700">
                        Scene {idx + 1}: {scene.title}
                      </span>
                      <div className="flex gap-1">
                        {scene.tags?.map((tag, tIdx) => (
                          <span key={tIdx} className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {scene.prompt && (
                      <p className="text-[10px] text-slate-600 line-clamp-2">
                        <strong>AI Prompt:</strong> {scene.prompt}
                      </p>
                    )}

                    {scene.textOverlay && (
                      <p className="text-[11px] font-bold text-slate-900 font-['Mukta']">
                        💬 "{scene.textOverlay}"
                      </p>
                    )}

                    {scene.notes && (
                      <p className="text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200">
                        📝 <strong>Note:</strong> {scene.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Click <strong>Print / Download PDF</strong> to save via system PDF printer.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePrintPdf}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition shadow-md flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF Storyboard</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
