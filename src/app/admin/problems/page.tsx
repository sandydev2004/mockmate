"use client";

import { useEffect, useState } from "react";
import {
  Code2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Trash2,
  Edit2,
  Power,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DSAProblem } from "@/types";

export default function AdminProblemsPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Edit / Create Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<any>(null);

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importError, setImportError] = useState("");

  // Delete confirm state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/problems");
      if (!res.ok) throw new Error("Failed to load problems");
      const data = await res.json();
      setProblems(data.problems || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleToggleActive = async (problem: any) => {
    try {
      const res = await fetch("/api/admin/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_active",
          id: problem.id,
          is_active: !problem.is_active,
        }),
      });

      if (!res.ok) throw new Error("Failed to toggle status");
      setProblems((prev) =>
        prev.map((p) => (p.id === problem.id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteProblem = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/admin/problems?id=${deleteTargetId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete problem");
      setDeleteTargetId(null);
      setNotice(`Problem deleted successfully.`);
      fetchProblems();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProblem) return;

    try {
      const res = await fetch("/api/admin/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_problem",
          problem: editingProblem,
        }),
      });

      if (!res.ok) throw new Error("Failed to save problem");
      setIsEditModalOpen(false);
      setEditingProblem(null);
      setNotice("Problem saved successfully.");
      fetchProblems();
    } catch (err: any) {
      alert("Error saving: " + err.message);
    }
  };

  const handleBatchImport = async () => {
    setImportError("");
    try {
      const parsed = JSON.parse(importJsonText);
      const problemsArray = Array.isArray(parsed) ? parsed : [parsed];

      const res = await fetch("/api/admin/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import",
          problems: problemsArray,
        }),
      });

      if (!res.ok) throw new Error("Import failed on server");
      setIsImportModalOpen(false);
      setImportJsonText("");
      setNotice(`Imported ${problemsArray.length} problem(s) successfully.`);
      fetchProblems();
    } catch (err: any) {
      setImportError("Invalid JSON or import error: " + err.message);
    }
  };

  const filteredProblems = problems.filter((p) => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(lower) ||
      p.category?.toLowerCase().includes(lower) ||
      p.id?.toLowerCase().includes(lower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">DSA Problem Bank</h1>
          <p className="text-sm text-slate-400">
            Manage coding interview questions, test cases, starter code snippets, and active pool.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
          <button
            onClick={() => {
              setEditingProblem({
                id: `problem-${Date.now().toString(36)}`,
                title: "",
                slug: "",
                difficulty: "medium",
                category: "Arrays",
                description: "",
                starter_code: {
                  python: "def solution():\n    pass",
                  javascript: "function solution() {\n}",
                  cpp: "class Solution {\npublic:\n};",
                  java: "class Solution {\n}",
                },
                test_cases: [
                  { input: "[]", expected_output: "[]", is_sample: true },
                ],
                is_active: true,
              });
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Problem</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Search */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems by title, slug, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Problem Cards Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Title & Slug</th>
                <th className="p-4">Category</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Test Cases</th>
                <th className="p-4">Active</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading problem bank...
                  </td>
                </tr>
              ) : filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No problems match your query.
                  </td>
                </tr>
              ) : (
                filteredProblems.map((prob) => (
                  <tr key={prob.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">{prob.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{prob.slug || prob.id}</div>
                    </td>
                    <td className="p-4 text-slate-300">{prob.category}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          prob.difficulty === "hard"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : prob.difficulty === "medium"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {Array.isArray(prob.test_cases) ? prob.test_cases.length : 0} test cases
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(prob)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          prob.is_active !== false
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                        }`}
                      >
                        {prob.is_active !== false ? "Active Pool" : "Disabled"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingProblem({ ...prob });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Problem"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(prob.id)}
                          className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Delete Problem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Problem Modal */}
      {isEditModalOpen && editingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {editingProblem.title ? `Edit Problem: ${editingProblem.title}` : "Create New DSA Problem"}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Problem Title</label>
                  <input
                    type="text"
                    required
                    value={editingProblem.title}
                    onChange={(e) =>
                      setEditingProblem((prev: any) => ({
                        ...prev,
                        title: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Slug (Unique ID)</label>
                  <input
                    type="text"
                    required
                    value={editingProblem.slug}
                    onChange={(e) =>
                      setEditingProblem((prev: any) => ({ ...prev, slug: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Difficulty</label>
                  <select
                    value={editingProblem.difficulty}
                    onChange={(e) =>
                      setEditingProblem((prev: any) => ({ ...prev, difficulty: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category / Topic</label>
                  <input
                    type="text"
                    required
                    value={editingProblem.category}
                    onChange={(e) =>
                      setEditingProblem((prev: any) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Problem Description</label>
                <textarea
                  rows={4}
                  required
                  value={editingProblem.description}
                  onChange={(e) =>
                    setEditingProblem((prev: any) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white placeholder-slate-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  Save Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white">Batch Import DSA Problems (JSON)</h3>
            <p className="text-xs text-slate-400">
              Paste a JSON array of DSAProblem objects with `title`, `slug`, `difficulty`, `category`, `description`, `starter_code`, and `test_cases`.
            </p>

            <textarea
              rows={8}
              placeholder="[ { title: 'Two Sum', ... } ]"
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
            ></textarea>

            {importError && (
              <div className="text-xs text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchImport}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Run Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="Delete DSA Problem"
        message="Are you sure you want to permanently delete this problem from the database? Candidates will no longer receive it in interviews."
        confirmText="Delete Problem"
        isDestructive={true}
        onConfirm={handleDeleteProblem}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

