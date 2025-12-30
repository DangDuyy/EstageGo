import { useState, useEffect } from "react";
import {
    ChevronRight,
    FileText,
    Search,
    Menu,
    X,
    Home,
    Book,
    Layers,
    Settings,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ReadOnlyEditor from "@/components/tiptap-templates/simple/read-only-editor";
import { getDocuments } from "@/apis";

export default function DocumentViewer() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Fetch documents from backend
    const fetchDocuments = async (query) => {
        setLoading(true);
        try {
            const data = await getDocuments({ ...query, status: "published" });
            setDocuments(data.documents);
            // Select first document by default
            if (data.documents.length > 0 && !selectedDoc) {
                setSelectedDoc(data.documents[0]);
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    // Group documents by category
    const groupedDocs = documents.reduce((acc, doc) => {
        const category = doc.metadata.category || "general";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(doc);
        return acc;
    }, {});

    // Filter documents based on search
    const filteredGroupedDocs = Object.entries(groupedDocs).reduce((acc, [category, docs]) => {
        const filtered = docs.filter((doc) =>
            doc.metadata.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
            acc[category] = filtered;
        }
        return acc;
    }, {});

    // Category icons mapping
    const categoryIcons = {
        faq: FileText,
        guide: Book,
        policy: FileText,
        tutorial: Book,
        service: Layers,
        general: Home,
        support: FileText,
        other: FileText,
    };

    const getCategoryIcon = (category) => {
        return categoryIcons[category] || FileText;
    };

    // Get category display name
    const getCategoryLabel = (category) => {
        const labels = {
            faq: "FAQ",
            guide: "Guides",
            policy: "Policies",
            tutorial: "Tutorials",
            service: "Services",
            general: "General",
            support: "Support",
            other: "Other",
        };
        return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">No Documents Found</h2>
                    <p className="text-slate-500">Start by creating your first document.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? "w-72" : "w-0"
                    } transition-all duration-300 border-r border-slate-200 bg-slate-50 overflow-hidden flex flex-col`}
            >
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Documentation</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search docs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white border-slate-200"
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-6">
                        {Object.entries(filteredGroupedDocs).map(([category, docs]) => {
                            const Icon = getCategoryIcon(category);
                            return (
                                <div key={category}>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                                        <Icon className="w-4 h-4" />
                                        {getCategoryLabel(category)}
                                    </div>
                                    <ul className="space-y-1 ml-6">
                                        {docs.map((doc) => (
                                            <li key={doc.id}>
                                                <button
                                                    onClick={() => setSelectedDoc(doc)}
                                                    className={`text-sm hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-colors w-full text-left ${selectedDoc?.id === doc.id
                                                            ? "text-blue-600 bg-blue-50 font-medium"
                                                            : "text-slate-600"
                                                        }`}
                                                >
                                                    {doc.metadata.title}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={fetchDocuments}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {selectedDoc ? (
                    <>
                        {/* Header */}
                        <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {!sidebarOpen && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSidebarOpen(true)}
                                    >
                                        <Menu className="w-5 h-5" />
                                    </Button>
                                )}
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="capitalize">{getCategoryLabel(selectedDoc.metadata.category || "general")}</span>
                                    <ChevronRight className="w-4 h-4" />
                                    <span className="text-slate-900 font-medium">{selectedDoc.metadata.title}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {selectedDoc.metadata.category && (
                                    <Badge variant="secondary" className="capitalize">
                                        {selectedDoc.metadata.category}
                                    </Badge>
                                )}
                                <Badge variant={selectedDoc.status === "published" ? "default" : "secondary"}>
                                    {selectedDoc.status}
                                </Badge>
                            </div>
                        </header>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-4xl mx-auto px-6 py-12">
                                {/* Document Header */}
                                <div className="mb-8">
                                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                                        {selectedDoc.metadata.title}
                                    </h1>

                                    {selectedDoc.metadata.tags && selectedDoc.metadata.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {selectedDoc.metadata.tags.map((tag, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-slate-500 pb-6 border-b border-slate-200">
                                        <span>Last updated: {new Date(selectedDoc.updated_at).toLocaleDateString()}</span>
                                        {/* {selectedDoc.vector_refs?.chunk_count && (
                                            <span>• {selectedDoc.vector_refs.chunk_count} chunks</span>
                                        )} */}
                                    </div>
                                </div>

                                {/* Document Content */}
                                <div className="prose prose-slate max-w-none">
                                    {/* <style>{`
                    .prose {
                      color: #334155;
                      line-height: 1.75;
                    }
                    .prose h1 {
                      color: #0f172a;
                      font-weight: 700;
                      font-size: 2.25rem;
                      margin-top: 2rem;
                      margin-bottom: 1rem;
                      line-height: 1.2;
                    }
                    .prose h2 {
                      color: #0f172a;
                      font-weight: 600;
                      font-size: 1.875rem;
                      margin-top: 2rem;
                      margin-bottom: 1rem;
                      line-height: 1.3;
                      padding-bottom: 0.5rem;
                      border-bottom: 1px solid #e2e8f0;
                    }
                    .prose h3 {
                      color: #0f172a;
                      font-weight: 600;
                      font-size: 1.5rem;
                      margin-top: 1.5rem;
                      margin-bottom: 0.75rem;
                      line-height: 1.4;
                    }
                    .prose h4 {
                      color: #1e293b;
                      font-weight: 600;
                      font-size: 1.25rem;
                      margin-top: 1.5rem;
                      margin-bottom: 0.5rem;
                    }
                    .prose p {
                      margin-top: 1rem;
                      margin-bottom: 1rem;
                    }
                    .prose code {
                      background-color: #f1f5f9;
                      color: #e11d48;
                      padding: 0.125rem 0.375rem;
                      border-radius: 0.25rem;
                      font-size: 0.875em;
                      font-weight: 500;
                      font-family: 'Monaco', 'Courier New', monospace;
                    }
                    .prose pre {
                      background-color: #1e293b;
                      color: #e2e8f0;
                      padding: 1.5rem;
                      border-radius: 0.5rem;
                      overflow-x: auto;
                      margin-top: 1.5rem;
                      margin-bottom: 1.5rem;
                      line-height: 1.6;
                    }
                    .prose pre code {
                      background-color: transparent;
                      color: inherit;
                      padding: 0;
                      font-size: 0.875rem;
                      font-weight: 400;
                    }
                    .prose ul {
                      list-style-type: disc;
                      padding-left: 1.5rem;
                      margin-top: 1rem;
                      margin-bottom: 1rem;
                    }
                    .prose ol {
                      list-style-type: decimal;
                      padding-left: 1.5rem;
                      margin-top: 1rem;
                      margin-bottom: 1rem;
                    }
                    .prose li {
                      margin-top: 0.5rem;
                      margin-bottom: 0.5rem;
                      padding-left: 0.375rem;
                    }
                    .prose li::marker {
                      color: #64748b;
                    }
                    .prose a {
                      color: #3b82f6;
                      text-decoration: none;
                      font-weight: 500;
                      transition: color 0.2s;
                    }
                    .prose a:hover {
                      color: #2563eb;
                      text-decoration: underline;
                    }
                    .prose blockquote {
                      border-left: 4px solid #e2e8f0;
                      padding-left: 1rem;
                      color: #64748b;
                      font-style: italic;
                      margin-top: 1.5rem;
                      margin-bottom: 1.5rem;
                    }
                    .prose strong {
                      color: #0f172a;
                      font-weight: 600;
                    }
                    .prose table {
                      width: 100%;
                      margin-top: 1.5rem;
                      margin-bottom: 1.5rem;
                      border-collapse: collapse;
                    }
                    .prose th {
                      background-color: #f8fafc;
                      padding: 0.75rem;
                      text-align: left;
                      font-weight: 600;
                      border: 1px solid #e2e8f0;
                    }
                    .prose td {
                      padding: 0.75rem;
                      border: 1px solid #e2e8f0;
                    }
                    .prose img {
                      max-width: 100%;
                      height: auto;
                      border-radius: 0.5rem;
                      margin-top: 1.5rem;
                      margin-bottom: 1.5rem;
                    }
                  `}</style> */}

                                    {selectedDoc.content.html ? (
                                        <ReadOnlyEditor key={selectedDoc.id} content={selectedDoc.content.html} />
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <FileText className="w-12 h-12 mx-auto mb-4" />
                                            <p>No content available</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Navigation */}
                                <div className="mt-12 pt-8 border-t border-slate-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            variant="outline"
                                            className="justify-start"
                                            onClick={() => {
                                                const currentIndex = documents.findIndex(d => d.id === selectedDoc.id);
                                                if (currentIndex > 0) {
                                                    setSelectedDoc(documents[currentIndex - 1]);
                                                }
                                            }}
                                            disabled={documents.findIndex(d => d.id === selectedDoc.id) === 0}
                                        >
                                            <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="justify-end"
                                            onClick={() => {
                                                const currentIndex = documents.findIndex(d => d.id === selectedDoc.id);
                                                if (currentIndex < documents.length - 1) {
                                                    setSelectedDoc(documents[currentIndex + 1]);
                                                }
                                            }}
                                            disabled={documents.findIndex(d => d.id === selectedDoc.id) === documents.length - 1}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                            <p className="text-slate-500">Select a document to view</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}