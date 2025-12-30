// import React, { useState, useEffect, useRef } from 'react';
// import { Search, Plus, Edit2, Trash2, Eye, Power, Tag, Filter, X, CheckCircle, XCircle, MessageSquare, Zap, Clock, AlertCircle } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';

// // API Service
// const API_BASE = 'http://localhost:8017/v1/documents';

// const api = {
//   getAll: async (filters = {}) => {
//     const params = new URLSearchParams(filters);
//     const res = await fetch(`${API_BASE}?${params}`);
//     return res.json();
//   },
//   search: async (query, filters = {}, limit = 5) => {
//     const res = await fetch(`${API_BASE}/search`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ query, filters, limit })
//     });
//     return res.json();
//   },
//   getById: async (docId) => {
//     const res = await fetch(`${API_BASE}/${docId}`);
//     return res.json();
//   },
//   create: async (data) => {
//     const res = await fetch(API_BASE, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });
//     return res.json();
//   },
//   update: async (docId, data) => {
//     const res = await fetch(`${API_BASE}/${docId}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });
//     return res.json();
//   },
//   updateMetadata: async (docId, metadata) => {
//     const res = await fetch(`${API_BASE}/${docId}/metadata`, {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(metadata)
//     });
//     return res.json();
//   },
//   delete: async (docId) => {
//     const res = await fetch(`${API_BASE}/${docId}`, { method: 'DELETE' });
//     return res.json();
//   }
// };

// // Main Component
// export default function ChatbotKnowledgeManager() {
//   const [view, setView] = useState('list');
//   const [knowledge, setKnowledge] = useState([]);
//   const [selectedDoc, setSelectedDoc] = useState(null);
//   const [filters, setFilters] = useState({ category: '', active: '' });
//   const [searchQuery, setSearchQuery] = useState('');
//   const [testPanel, setTestPanel] = useState(false);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadKnowledge();
//   }, [filters]);

//   const loadKnowledge = async () => {
//     setLoading(true);
//     try {
//       const result = await api.getAll(filters);
//       if (result.success) {
//         // Group chunks by doc_id
//         const docs = result.points.reduce((acc, point) => {
//           const docId = point.metadata.doc_id;
//           if (!acc[docId]) {
//             acc[docId] = {
//               doc_id: docId,
//               title: point.metadata.title,
//               category: point.metadata.category,
//               active: point.metadata.active,
//               created_at: point.metadata.created_at,
//               updated_at: point.metadata.updated_at,
//               chunks: []
//             };
//           }
//           acc[docId].chunks.push(point);
//           return acc;
//         }, {});

//         console.log('Loaded docs:', docs);
//         setKnowledge(Object.values(docs));
//       }
//     } catch (error) {
//       console.error('Load error:', error);
//     }
//     setLoading(false);
//   };

//   const toggleActive = async (docId, currentStatus) => {
//     try {
//       await api.updateMetadata(docId, { active: !currentStatus });
//       loadKnowledge();
//     } catch (error) {
//       console.error('Toggle error:', error);
//     }
//   };

//   const deleteDoc = async (docId) => {
//     if (!confirm('Xóa tri thức này? Chatbot sẽ không thể truy cập nội dung này nữa.')) return;
//     try {
//       await api.delete(docId);
//       loadKnowledge();
//     } catch (error) {
//       console.error('Delete error:', error);
//     }
//   };

//   if (view === 'form') {
//     return <KnowledgeForm 
//       doc={selectedDoc} 
//       onBack={() => { setView('list'); setSelectedDoc(null); loadKnowledge(); }}
//     />;
//   }

//   if (view === 'detail') {
//     return <KnowledgeDetail 
//       docId={selectedDoc}
//       onBack={() => { setView('list'); setSelectedDoc(null); }}
//     />;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
//                   <MessageSquare className="w-6 h-6 text-white" />
//                 </div>
//                 <h1 className="text-2xl font-bold text-slate-800">Quản lý Tri thức Chatbot</h1>
//               </div>
//               <p className="text-slate-600 text-sm">Quản lý nguồn tri thức cho Rasa Chatbot với RAG + Qdrant Vector Database</p>
//             </div>
//             <button
//               onClick={() => { setSelectedDoc(null); setView('form'); }}
//               className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
//             >
//               <Plus className="w-4 h-4" />
//               Thêm tri thức mới
//             </button>
//           </div>
//         </div>

//         <div className="flex gap-6">
//           {/* Main Content */}
//           <div className={`flex-1 transition-all ${testPanel ? 'mr-96' : ''}`}>
//             {/* Filters */}
//             <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-slate-200">
//               <div className="flex items-center gap-4">
//                 <div className="flex-1 relative">
//                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                   <input
//                     type="text"
//                     placeholder="Tìm kiếm trong tri thức..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//                 <select
//                   value={filters.category}
//                   onChange={(e) => setFilters({ ...filters, category: e.target.value })}
//                   className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">Tất cả danh mục</option>
//                   <option value="guide">Hướng dẫn</option>
//                   <option value="faq">FAQ</option>
//                   <option value="service">Gói dịch vụ</option>
//                   <option value="rule">Chính sách</option>
//                 </select>
//                 <select
//                   value={filters.active}
//                   onChange={(e) => setFilters({ ...filters, active: e.target.value })}
//                   className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">Tất cả trạng thái</option>
//                   <option value="true">Đang kích hoạt</option>
//                   <option value="false">Đã tắt</option>
//                 </select>
//                 <button
//                   onClick={() => setTestPanel(!testPanel)}
//                   className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
//                     testPanel ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
//                   }`}
//                 >
//                   <Zap className="w-4 h-4" />
//                   Test Chatbot
//                 </button>
//               </div>
//             </div>

//             {/* Knowledge Table */}
//             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//               {loading ? (
//                 <div className="p-12 text-center text-slate-500">Đang tải...</div>
//               ) : knowledge.length === 0 ? (
//                 <div className="p-12 text-center">
//                   <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
//                   <p className="text-slate-500">Chưa có tri thức nào. Hãy thêm tri thức đầu tiên!</p>
//                 </div>
//               ) : (
//                 <table className="w-full">
//                   <thead className="bg-slate-50 border-b border-slate-200">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tiêu đề</th>
//                       <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Danh mục</th>
//                       <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Chunks</th>
//                       <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
//                       <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cập nhật</th>
//                       <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Hành động</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100">
//                     {knowledge
//                       .filter(doc => 
//                         !searchQuery || 
//                         doc.title.toLowerCase().includes(searchQuery.toLowerCase())
//                       )
//                       .map((doc) => (
//                       <tr key={doc.doc_id} className="hover:bg-slate-50 transition-colors">
//                         <td className="px-6 py-4">
//                           <div className="font-medium text-slate-900">{doc.title}</div>
//                           <div className="text-xs text-slate-500 mt-1">{doc.chunks.length} chunks được vector hóa</div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
//                             doc.category === 'guide' ? 'bg-purple-100 text-purple-700' :
//                             doc.category === 'faq' ? 'bg-green-100 text-green-700' :
//                             doc.category === 'service' ? 'bg-blue-100 text-blue-700' :
//                             'bg-amber-100 text-amber-700'
//                           }`}>
//                             {doc.category === 'guide' ? 'Hướng dẫn' :
//                              doc.category === 'faq' ? 'FAQ' :
//                              doc.category === 'service' ? 'Dịch vụ' : 'Chính sách'}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="text-sm text-slate-600">{doc.chunks.length}</span>
//                         </td>
//                         <td className="px-6 py-4">
//                           <button
//                             onClick={() => toggleActive(doc.doc_id, doc.active)}
//                             className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
//                               doc.active 
//                                 ? 'bg-green-100 text-green-700 hover:bg-green-200' 
//                                 : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//                             }`}
//                           >
//                             {doc.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
//                             {doc.active ? 'Đang dùng' : 'Đã tắt'}
//                           </button>
//                         </td>
//                         <td className="px-6 py-4 text-sm text-slate-600">
//                           <Clock className="w-3 h-3 inline mr-1" />
//                           {doc.updated_at || doc.created_at ? new Date(doc.updated_at || doc.created_at).toLocaleDateString('vi-VN') : 'N/A'}
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center justify-end gap-2">
//                             <button
//                               onClick={() => { setSelectedDoc(doc.doc_id); setView('detail'); }}
//                               className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
//                               title="Xem chi tiết"
//                             >
//                               <Eye className="w-4 h-4" />
//                             </button>
//                             <button
//                               onClick={() => { setSelectedDoc(doc); setView('form'); }}
//                               className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
//                               title="Chỉnh sửa"
//                             >
//                               <Edit2 className="w-4 h-4" />
//                             </button>
//                             <button
//                               onClick={() => deleteDoc(doc.doc_id)}
//                               className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
//                               title="Xóa"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </div>

//           {/* Test Panel */}
//           {testPanel && <TestChatbotPanel onClose={() => setTestPanel(false)} />}
//         </div>
//       </div>
//     </div>
//   );
// }

// // Knowledge Form Component
// function KnowledgeForm({ doc, onBack }) {
//   const [formData, setFormData] = useState({
//     page_content: '',
//     metadata: {
//       title: '',
//       category: 'guide',
//       active: true
//     }
//   });
//   const [saving, setSaving] = useState(false);
//   const [alert, setAlert] = useState(null);

//   useEffect(() => {
//     if (doc) {
//       // Load document details
//       loadDocDetails();
//     }
//   }, [doc]);

//   const loadDocDetails = async () => {
//     try {
//       const result = await api.getById(doc.doc_id);
//       if (result.success && result.chunks.length > 0) {
//         // Combine all chunks back into original content
//         const content = result.chunks.map(c => c.page_content).join('\n');
//         setFormData({
//           page_content: content,
//           metadata: result.chunks[0].metadata
//         });
//       }
//     } catch (error) {
//       console.error('Load doc error:', error);
//     }
//   };

//   const handleSave = async () => {
//     if (!formData.page_content.trim() || !formData.metadata.title.trim()) {
//       setAlert({ type: 'error', message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung!' });
//       return;
//     }

//     setSaving(true);
//     setAlert(null);

//     try {
//       let result;
//       if (doc) {
//         result = await api.update(doc.doc_id, formData);
//       } else {
//         result = await api.create(formData);
//       }

//       if (result.success) {
//         setAlert({ 
//           type: 'success', 
//           message: `${doc ? 'Cập nhật' : 'Tạo'} thành công! Đã vector hóa ${result.chunks_created || result.chunks_updated} chunks.` 
//         });
//         setTimeout(() => onBack(), 2000);
//       }
//     } catch (error) {
//       setAlert({ type: 'error', message: error.message });
//     }
//     setSaving(false);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
//       <div className="max-w-4xl mx-auto">
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//           {/* Header */}
//           <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
//             <div className="flex items-center justify-between">
//               <h2 className="text-xl font-bold text-slate-800">
//                 {doc ? 'Chỉnh sửa tri thức' : 'Thêm tri thức mới'}
//               </h2>
//               <button onClick={onBack} className="text-slate-600 hover:text-slate-800">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           {/* Alert */}
//           {alert && (
//             <div className="px-6 pt-4">
//               <Alert className={alert.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
//                 <AlertCircle className={`w-4 h-4 ${alert.type === 'error' ? 'text-red-600' : 'text-green-600'}`} />
//                 <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 'text-green-800'}>
//                   {alert.message}
//                 </AlertDescription>
//               </Alert>
//             </div>
//           )}

//           {/* Form */}
//           <div className="p-6 space-y-6">
//             <div>
//               <label className="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề tri thức</label>
//               <input
//                 type="text"
//                 value={formData.metadata.title}
//                 onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, title: e.target.value }})}
//                 className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="VD: Hướng dẫn đăng ký gói cước"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-slate-700 mb-2">Danh mục</label>
//               <select
//                 value={formData.metadata.category}
//                 onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, category: e.target.value }})}
//                 className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="guide">Hướng dẫn</option>
//                 <option value="faq">FAQ</option>
//                 <option value="service">Gói dịch vụ</option>
//                 <option value="rule">Chính sách</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-slate-700 mb-2">
//                 Nội dung tri thức
//                 <span className="text-xs font-normal text-slate-500 ml-2">(Sẽ được tự động chia nhỏ và vector hóa)</span>
//               </label>
//               <CreateDocument />
//               <textarea
//                 value={formData.page_content}
//                 onChange={(e) => setFormData({ ...formData, page_content: e.target.value })}
//                 rows={16}
//                 className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
//                 placeholder="Nhập nội dung tri thức mà chatbot sẽ sử dụng để trả lời người dùng..."
//               />
//               <p className="text-xs text-slate-500 mt-2">
//                 💡 Nội dung sẽ được chia thành các chunks (1000 ký tự/chunk) và vector hóa bằng Gemini Embedding
//               </p>
//             </div>

//             <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
//               <input
//                 type="checkbox"
//                 id="active"
//                 checked={formData.metadata.active}
//                 onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, active: e.target.checked }})}
//                 className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
//               />
//               <label htmlFor="active" className="text-sm font-medium text-slate-700">
//                 ✅ Cho phép chatbot sử dụng tri thức này
//                 <span className="block text-xs text-slate-600 mt-1">
//                   Khi tắt, chatbot sẽ KHÔNG tìm thấy và sử dụng nội dung này khi trả lời
//                 </span>
//               </label>
//             </div>

//             {doc && (
//               <Alert className="border-amber-200 bg-amber-50">
//                 <AlertCircle className="w-4 h-4 text-amber-600" />
//                 <AlertDescription className="text-amber-800">
//                   ⚠️ Lưu ý: Cập nhật sẽ XÓA tất cả vector cũ và tạo lại hoàn toàn từ nội dung mới
//                 </AlertDescription>
//               </Alert>
//             )}
//           </div>

//           {/* Actions */}
//           <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
//             <button
//               onClick={onBack}
//               className="px-5 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
//             >
//               Hủy
//             </button>
//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
//             >
//               {saving ? 'Đang xử lý...' : '💾 Lưu & Vector hóa'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Knowledge Detail Component
// function KnowledgeDetail({ docId, onBack }) {
//   const [doc, setDoc] = useState(null);
//   const [tab, setTab] = useState('content');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadDoc();
//   }, [docId]);

//   const loadDoc = async () => {
//     setLoading(true);
//     try {
//       const result = await api.getById(docId);
//       if (result.success) {
//         setDoc(result);
//       }
//     } catch (error) {
//       console.error('Load error:', error);
//     }
//     setLoading(false);
//   };

//   if (loading) {
//     return <div className="p-12 text-center">Đang tải...</div>;
//   }

//   if (!doc) {
//     return <div className="p-12 text-center text-red-600">Không tìm thấy tài liệu</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
//       <div className="max-w-5xl mx-auto">
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//           {/* Header */}
//           <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-xl font-bold text-slate-800">{doc.chunks[0]?.metadata?.title}</h2>
//                 <p className="text-sm text-slate-600 mt-1">Chi tiết tri thức chatbot</p>
//               </div>
//               <button onClick={onBack} className="text-slate-600 hover:text-slate-800">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           {/* Tabs */}
//           <div className="border-b border-slate-200">
//             <div className="flex gap-1 px-6">
//               {['content', 'metadata', 'chunks'].map(t => (
//                 <button
//                   key={t}
//                   onClick={() => setTab(t)}
//                   className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
//                     tab === t 
//                       ? 'border-blue-600 text-blue-600' 
//                       : 'border-transparent text-slate-600 hover:text-slate-800'
//                   }`}
//                 >
//                   {t === 'content' ? 'Nội dung' : t === 'metadata' ? 'Metadata' : 'Chunks'}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Content */}
//           <div className="p-6">
//             {tab === 'content' && (
//               <div className="prose max-w-none">
//                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-sm whitespace-pre-wrap">
//                   {doc.chunks.map(c => c.page_content).join('\n\n---\n\n')}
//                 </div>
//               </div>
//             )}

//             {tab === 'metadata' && (
//               <div className="space-y-3">
//                 {Object.entries(doc.chunks[0]?.metadata || {}).map(([key, value]) => (
//                   <div key={key} className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
//                     <span className="font-semibold text-slate-700 min-w-32">{key}:</span>
//                     <span className="text-slate-600">{JSON.stringify(value)}</span>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {tab === 'chunks' && (
//               <div className="space-y-4">
//                 <p className="text-sm text-slate-600">
//                   Tài liệu này được chia thành <strong>{doc.chunks.length} chunks</strong> để vector hóa
//                 </p>
//                 {doc.chunks.map((chunk, idx) => (
//                   <div key={chunk.id} className="border border-slate-200 rounded-lg p-4">
//                     <div className="flex items-center justify-between mb-2">
//                       <span className="text-xs font-semibold text-slate-500">CHUNK #{idx + 1}</span>
//                       <span className="text-xs text-slate-400">ID: {chunk.id}</span>
//                     </div>
//                     <div className="bg-slate-50 p-3 rounded text-sm font-mono text-slate-700 whitespace-pre-wrap">
//                       {chunk.page_content}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Test Chatbot Panel
// function TestChatbotPanel({ onClose }) {
//   const [query, setQuery] = useState('');
//   const [results, setResults] = useState(null);
//   const [testing, setTesting] = useState(false);

//   const handleTest = async () => {
//     if (!query.trim()) return;

//     setTesting(true);
//     try {
//       const result = await api.search(query, { active: true }, 5);
//       setResults(result);
//     } catch (error) {
//       console.error('Test error:', error);
//     }
//     setTesting(false);
//   };

//   return (
//     <div className="fixed right-6 top-6 bottom-6 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col">
//       {/* Header */}
//       <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Zap className="w-5 h-5" />
//             <h3 className="font-bold">Test Chatbot</h3>
//           </div>
//           <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
//             <X className="w-4 h-4" />
//           </button>
//         </div>
//       </div>

//       {/* Query Input */}
//       <div className="p-4 border-b border-slate-200">
//         <label className="block text-xs font-semibold text-slate-600 mb-2">Câu hỏi người dùng:</label>
//         <textarea
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           rows={3}
//           className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
//           placeholder="VD: Làm sao để đăng ký gói cước?"
//         />
//         <button
//           onClick={handleTest}
//           disabled={testing || !query.trim()}
//           className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
//         >
//           {testing ? '🔍 Đang tìm...' : '🚀 Test Chatbot'}
//         </button>
//       </div>

//       {/* Results */}
//       <div className="flex-1 overflow-y-auto p-4">
//         {!results ? (
//           <div className="text-center text-slate-400 mt-12">
//             <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
//             <p className="text-sm">Nhập câu hỏi và test chatbot</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
//               <div className="text-xs font-semibold text-blue-700 mb-1">📊 KẾT QUẢ RETRIEVE</div>
//               <div className="text-sm text-blue-900">
//                 Tìm thấy <strong>{results.results?.length || 0}</strong> tri thức phù hợp
//               </div>
//             </div>

//             {results.results?.map((r, idx) => (
//               <div key={idx} className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-all">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-xs font-semibold text-slate-700">#{idx + 1}</span>
//                   <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
//                     {(r.score * 100).toFixed(1)}% match
//                   </span>
//                 </div>
//                 <div className="text-xs text-slate-600 mb-2">
//                   <strong>{r.metadata?.title}</strong> • {r.metadata?.category}
//                 </div>
//                 <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
//                   {r.page_content.substring(0, 150)}...
//                 </div>
//               </div>
//             ))}

//             {results.results?.length === 0 && (
//               <div className="text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-4">
//                 <AlertCircle className="w-8 h-8 mx-auto mb-2" />
//                 <p className="text-sm font-medium">Không tìm thấy tri thức phù hợp</p>
//                 <p className="text-xs mt-1">Hãy thêm tri thức mới để chatbot có thể trả lời</p>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


// import { Crepe } from '@milkdown/crepe';
// import '@milkdown/crepe/theme/common.css';

// export function DocumentEditor({ value, onChange }) {
//   const editorRef = useRef(null);

//   useEffect(() => {
//     const crepe = new Crepe({
//       root: editorRef.current,
//       defaultValue: value || '# Tài liệu cho Chatbot',
//     });

//     crepe.create();

//     crepe.on('change', (markdown) => {
//       onChange?.(markdown);
//     });

//     return () => crepe.destroy();
//   }, []);

//   return <div ref={editorRef} className="border rounded-lg" />;
// }


// export function CreateDocument() {
//   const [title, setTitle] = useState('');
//   const [content, setContent] = useState('');

//   const handleSave = async () => {
//     await fetch('/api/documents', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         title,
//         content, // markdown từ Milkdown
//       }),
//     });
//   };

//   return (
//     <div className="max-w-5xl mx-auto space-y-4">
//       <input
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         placeholder="Tiêu đề tài liệu"
//         className="w-full border rounded px-3 py-2"
//       />

//       <DocumentEditor onChange={setContent} />

//       <button
//         onClick={handleSave}
//         className="px-4 py-2 bg-black text-white rounded"
//       >
//         Lưu tài liệu
//       </button>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Filter,
  FileText,
  Calendar,
  Tag,
  Database,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ReadOnlyEditor from "@/components/tiptap-templates/simple/read-only-editor";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import FieldErrorAlert from "@/components/common/Form/FieldErrorAlert";
import { createDocument, deleteDocument, getDocuments, rebuildDocument, updateDocument } from "@/apis";

export default function DocumentManagementDashboard() {
  const [documents, setDocuments] = useState([]);
  // const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialogs
  const [viewDialog, setViewDialog] = useState({ open: false, doc: null });
  const [editDialog, setEditDialog] = useState({ open: false, doc: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, doc: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [rebuildDialog, setRebuildDialog] = useState(false);

  const API_BASE = 'http://localhost:8017/v1/documents';

  // Form states
  const [editor, setEditor] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    tags: "",
    active: true,
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    archived: 0,
    totalChunks: 0,
  });

  // Fetch documents
  const fetchDocuments = async (query) => {
    setLoading(true)
    try {
      const data = await getDocuments(query)
      setDocuments(data.documents)
      calculateStats(data.documents)
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoading(false)
    }
  }


  // Calculate statistics
  const calculateStats = (docs) => {
    setStats({
      total: docs.length,
      published: docs.filter((d) => d.status === "published").length,
      archived: docs.filter((d) => d.status === "archived").length,
      totalChunks: docs.reduce((sum, d) => sum + (d.vector_refs?.chunk_count || 0), 0),
    });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDocuments({
        title: searchQuery,
        status: statusFilter === "all" ? null : statusFilter,
        category: categoryFilter === "all" ? null : categoryFilter,
      });
    }, 500); // debounce 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, statusFilter, categoryFilter]);

  // Get unique categories
  // const categories = [...new Set(documents.map((d) => d.metadata.category).filter(Boolean))];
  const categories = [
    { label: "FAQ", value: "faq" },
    { label: "Guide", value: "guide" },
    { label: "Policy", value: "policy" },
    { label: "Tutorial", value: "tutorial" },
    { label: "Service", value: "service" },
    { label: "General", value: "general" },
    { label: "Support", value: "support" },
    { label: "Other", value: "other" },
  ];


  // Create document
  const handleCreate = async () => {
    if (!formData.title.trim() || !editor) {
      alert("Please fill in title and content")
      return
    }

    try {
      const payload = {
        plaintext: editor.getText(),
        html: editor.getHTML(),
        tiptap_json: editor.getJSON(),
        metadata: {
          title: formData.title,
          category: formData.category || "general",
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          active: formData.active,
          status: "published",
        },
      }

      await createDocument(payload)

      setCreateDialog(false)
      resetForm()
      fetchDocuments()
      alert("Document created successfully!")
    } catch (error) {
      alert("Failed to create document")
    }
  }


  // Update document
  const handleUpdate = async () => {
    if (!editDialog.doc || !formData.title.trim() || !editor) {
      alert("Please fill in required fields")
      return
    }

    try {
      const payload = {
        plaintext: editor.getText(),
        html: editor.getHTML(),
        tiptap_json: editor.getJSON(),
        metadata: {
          title: formData.title,
          category: formData.category,
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          active: formData.active,
        },
      }

      await updateDocument(editDialog.doc.id, payload)

      setEditDialog({ open: false, doc: null })
      resetForm()
      fetchDocuments()
      alert("Document updated successfully!")
    } catch (error) {
      alert("Failed to update document")
    }
  }


  // Delete document
  const handleDelete = async (hardDelete = false) => {
    if (!deleteDialog.doc) return

    try {
      await deleteDocument(deleteDialog.doc.id, hardDelete)

      setDeleteDialog({ open: false, doc: null })
      fetchDocuments()
      alert(
        `Document ${hardDelete ? "deleted" : "archived"} successfully!`
      )
    } catch (error) {
      alert("Failed to delete document")
    }
  }


  // Rebuild index
  const handleRebuild = async () => {
    try {
      const data = await rebuildDocument()

      setRebuildDialog(false)
      alert(
        `Rebuild complete! Indexed: ${data.indexed}, Failed: ${data.failed}`
      )
      fetchDocuments()
    } catch (error) {
      alert("Failed to rebuild index")
    }
  }


  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      tags: "",
      active: true,
    });
    setEditor(null);
  };

  // Open edit dialog
  const openEditDialog = (doc) => {
    setFormData({
      title: doc.metadata.title,
      category: doc.metadata.category || "",
      tags: doc.metadata.tags?.join(", ") || "",
      active: doc.metadata.active,
    });
    setEditDialog({ open: true, doc });
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-slate-500">Manage your RAG knowledge base</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRebuildDialog(true)}>
            <Database className="w-4 h-4 mr-2" />
            Rebuild Index
          </Button>
          <Button onClick={() => setCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <FileText className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <FileText className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vector Chunks</CardTitle>
            <Database className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChunks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.metadata.title}</TableCell>
                    <TableCell>
                      {doc.metadata.category && (
                        <Badge variant="secondary">{doc.metadata.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          doc.status === "published"
                            ? "default"
                            : doc.status === "archived"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.vector_refs?.chunk_count || 0}</TableCell>
                    <TableCell>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewDialog({ open: true, doc })}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(doc)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, doc })}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, doc: null })}>
        <DialogContent className="
    min-w-[60vw]
    max-w-[90vw]
    max-h-[90vh]
    overflow-y-auto
  ">
          <DialogHeader>
            <DialogTitle>{viewDialog.doc?.metadata.title}</DialogTitle>
            <DialogDescription>
              <div className="flex gap-2 mt-2">
                {viewDialog.doc?.metadata.category && (
                  <Badge variant="secondary">{viewDialog.doc.metadata.category}</Badge>
                )}
                <Badge variant={viewDialog.doc?.status === "published" ? "default" : "destructive"}>
                  {viewDialog.doc?.status}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          {viewDialog.doc && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <ReadOnlyEditor content={viewDialog.doc.content.html} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Chunks:</span> {viewDialog.doc.vector_refs?.chunk_count || 0}
                </div>
                <div>
                  <span className="font-medium">Version:</span> {viewDialog.doc.version}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(viewDialog.doc.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{" "}
                  {new Date(viewDialog.doc.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={(open) => { setCreateDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="
    min-w-[60vw]
    max-w-[90vw]
    max-h-[90vh]
    overflow-y-auto
  ">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document title"
              />
            </div> */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm">
                  Title <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Document title"
                    className="text-base"
                  />
                </div>
              </div>
              {/* <div className="space-y-1.5">
                <Label htmlFor="category" className="text-sm">
                  Category <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., FAQ, Guide"
                    className="text-base"
                  />
                </div>
              </div> */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-sm">
                  Category <span className="text-red-500">*</span>
                </Label>

                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>

                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div> */}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content" className="text-sm">
                Content <span className="text-red-500">*</span>
              </Label>
              <div className="border border-gray-500 rounded-lg mt-2">
                <SimpleEditor onEditorReady={setEditor} />
              </div>
            </div>
            {/* <div>
              <Label>Content *</Label>
              <div className="border rounded-lg mt-2">
                <SimpleEditor onEditorReady={setEditor} />
              </div>
            </div> */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => { setEditDialog({ open, doc: null }); if (!open) resetForm(); }}>
        <DialogContent className="
    min-w-[60vw]
    max-w-[90vw]
    max-h-[90vh]
    overflow-y-auto
  ">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div> */}
            <div className="grid grid-cols-2 gap-4">
              {/* <div>
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div> */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm">
                  Title <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Document title"
                    className="text-base"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-sm">
                  Category <span className="text-red-500">*</span>
                </Label>

                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue value={formData.category} />
                  </SelectTrigger>

                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Content *</Label>
              <div className="border rounded-lg mt-2">
                <SimpleEditor
                  onEditorReady={setEditor}
                  initialContent={editDialog.doc?.content.html}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialog({ open: false, doc: null }); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, doc: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.doc?.metadata.title}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Choose how to delete this document:
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleDelete(false)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Soft Delete (Archive)
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => handleDelete(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hard Delete (Permanent)
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, doc: null })}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rebuild Index Dialog */}
      <Dialog open={rebuildDialog} onOpenChange={setRebuildDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rebuild Vector Index</DialogTitle>
            <DialogDescription>
              This will re-index all published documents in Qdrant. This may take a while.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              All existing vectors will be deleted and recreated from MongoDB source data.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRebuildDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRebuild}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Rebuild Index
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
