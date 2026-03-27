import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Subject, Task, Resource, QuizHistory } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

// ---------------------------------------------------------------------------
// Auth helper — gets the current user's ID from the live session
// ---------------------------------------------------------------------------
async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}

// ---------------------------------------------------------------------------
// Row mappers — Supabase snake_case → app camelCase types
// Fields absent from Supabase (topics, progress, nextExamDate, syncedToCalendar)
// receive safe defaults so the UI never crashes.
// ---------------------------------------------------------------------------
function mapSubject(row: any): Subject {
  return {
    id: row.id,
    name: row.name,
    icon: row.color ?? "📚",   // Supabase stores as `color`
    nextExamDate: undefined,
    topics: "",
    progress: 0,
  };
}

function mapTask(row: any): Task {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    dueDate: row.due_date ?? undefined,
    completed: row.completed ?? false,
    syncedToCalendar: false,
  };
}

// ---------------------------------------------------------------------------
// localStorage helpers — used ONLY for Resources and QuizHistory
// (no Supabase tables exist for them yet)
// ---------------------------------------------------------------------------
const getStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(`sp_${key}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setStorage = <T>(key: string, data: T[]) => {
  localStorage.setItem(`sp_${key}`, JSON.stringify(data));
};

// ===========================================================================
// SUBJECTS — backed by Supabase
// ===========================================================================

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const uid = await getUserId();
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapSubject);
    },
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: ["subjects", id],
    queryFn: async () => {
      const uid = await getUserId();
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", id)
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSubject(data) : null;
    },
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Subject, "id">) => {
      const uid = await getUserId();
      const { data: created, error } = await supabase
        .from("subjects")
        .insert({ user_id: uid, name: data.name, color: data.icon })
        .select()
        .single();
      if (error) throw error;
      return mapSubject(created);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Subject> & { id: string }) => {
      const uid = await getUserId();

      // Only send columns that exist in Supabase
      const patch: Record<string, unknown> = {};
      if (data.name !== undefined) patch.name = data.name;
      if (data.icon !== undefined) patch.color = data.icon;

      if (Object.keys(patch).length > 0) {
        const { error } = await supabase
          .from("subjects")
          .update(patch)
          .eq("id", data.id)
          .eq("user_id", uid);
        if (error) throw error;
      }

      return data;
    },
    onSuccess: (returned) => {
      // Patch the cache immediately for ALL fields (including topics/progress
      // that aren't in Supabase — they live in-session in the cache only)
      const patch = returned;
      qc.setQueryData(["subjects", patch.id], (old: Subject | null | undefined) =>
        old ? { ...old, ...patch } : old
      );
      qc.setQueryData(["subjects"], (old: Subject[] | undefined) =>
        old ? old.map((s) => (s.id === patch.id ? { ...s, ...patch } : s)) : old
      );
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const uid = await getUserId();

      // Delete tasks belonging to this subject first
      const { error: taskErr } = await supabase
        .from("tasks")
        .delete()
        .eq("subject_id", id)
        .eq("user_id", uid);
      if (taskErr) throw taskErr;

      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", id)
        .eq("user_id", uid);
      if (error) throw error;

      // Also clean up localStorage-backed resources for this subject
      setStorage(
        "resources",
        getStorage<Resource>("resources").filter((r) => r.subjectId !== id)
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ===========================================================================
// TASKS — backed by Supabase
// ===========================================================================

export function useTasks(subjectId?: string) {
  return useQuery({
    queryKey: ["tasks", subjectId],
    queryFn: async () => {
      const uid = await getUserId();
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true });

      if (subjectId) query = query.eq("subject_id", subjectId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapTask);
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Task, "id">) => {
      const uid = await getUserId();
      const { data: created, error } = await supabase
        .from("tasks")
        .insert({
          user_id: uid,
          subject_id: data.subjectId,
          title: data.title,
          due_date: data.dueDate ?? null,
          completed: data.completed ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return mapTask(created);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Task> & { id: string }) => {
      const uid = await getUserId();

      // Only send columns that exist in Supabase
      const patch: Record<string, unknown> = {};
      if (data.title !== undefined) patch.title = data.title;
      if (data.completed !== undefined) patch.completed = data.completed;
      if (data.dueDate !== undefined) patch.due_date = data.dueDate;

      if (Object.keys(patch).length > 0) {
        const { error } = await supabase
          .from("tasks")
          .update(patch)
          .eq("id", data.id)
          .eq("user_id", uid);
        if (error) throw error;
      }

      return data;
    },
    onSuccess: (returned) => {
      // Patch cache for ALL fields (syncedToCalendar lives in-session only)
      qc.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) =>
        old
          ? old.map((t) => (t.id === returned.id ? { ...t, ...returned } : t))
          : old
      );

      // Only re-fetch from Supabase when a persisted field changed
      const hasPersistedChange =
        returned.title !== undefined ||
        returned.completed !== undefined ||
        returned.dueDate !== undefined;

      if (hasPersistedChange) {
        qc.invalidateQueries({ queryKey: ["tasks"] });
      }
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const uid = await getUserId();
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", uid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

// ===========================================================================
// RESOURCES — localStorage only (no Supabase table)
// ===========================================================================

export function useResources(subjectId: string) {
  return useQuery({
    queryKey: ["resources", subjectId],
    queryFn: () =>
      getStorage<Resource>("resources").filter((r) => r.subjectId === subjectId),
    enabled: !!subjectId,
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Resource, "id">) => {
      const resources = getStorage<Resource>("resources");
      const newResource = { ...data, id: nanoid() };
      setStorage("resources", [...resources, newResource]);
      return newResource;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      setStorage(
        "resources",
        getStorage<Resource>("resources").filter((r) => r.id !== id)
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
}

// ===========================================================================
// QUIZ HISTORY — localStorage only (no Supabase table)
// ===========================================================================

export function useQuizHistory(subjectId?: string) {
  return useQuery({
    queryKey: ["quizHistory", subjectId],
    queryFn: () => {
      const history = getStorage<QuizHistory>("quizHistory");
      return subjectId ? history.filter((h) => h.subjectId === subjectId) : history;
    },
  });
}

export function useSaveQuizResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<QuizHistory, "id">) => {
      const history = getStorage<QuizHistory>("quizHistory");
      const newEntry = { ...data, id: nanoid() };
      setStorage("quizHistory", [...history, newEntry]);
      return newEntry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quizHistory"] }),
  });
}
