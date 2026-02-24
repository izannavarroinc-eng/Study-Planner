import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Subject, Task, Resource, QuizHistory } from "@shared/schema";
import { nanoid } from "nanoid";

// --- Helper Functions ---
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

// --- Subjects ---
export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => getStorage<Subject>('subjects'),
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: ['subjects', id],
    queryFn: () => getStorage<Subject>('subjects').find(s => s.id === id) || null,
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Subject, 'id'>) => {
      const subjects = getStorage<Subject>('subjects');
      const newSubject = { ...data, id: nanoid() };
      setStorage('subjects', [...subjects, newSubject]);
      return newSubject;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Subject> & { id: string }) => {
      const subjects = getStorage<Subject>('subjects');
      const updated = subjects.map(s => s.id === data.id ? { ...s, ...data } : s);
      setStorage('subjects', updated);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['subjects', variables.id] });
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      setStorage('subjects', getStorage<Subject>('subjects').filter(s => s.id !== id));
      // Cleanup orphaned data
      setStorage('tasks', getStorage<Task>('tasks').filter(t => t.subjectId !== id));
      setStorage('resources', getStorage<Resource>('resources').filter(r => r.subjectId !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

// --- Tasks ---
export function useTasks(subjectId?: string) {
  return useQuery({
    queryKey: ['tasks', subjectId],
    queryFn: () => {
      const tasks = getStorage<Task>('tasks');
      return subjectId ? tasks.filter(t => t.subjectId === subjectId) : tasks;
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Task, 'id'>) => {
      const tasks = getStorage<Task>('tasks');
      const newTask = { ...data, id: nanoid() };
      setStorage('tasks', [...tasks, newTask]);
      return newTask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Task> & { id: string }) => {
      const tasks = getStorage<Task>('tasks');
      const updated = tasks.map(t => t.id === data.id ? { ...t, ...data } : t);
      setStorage('tasks', updated);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      setStorage('tasks', getStorage<Task>('tasks').filter(t => t.id !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

// --- Resources ---
export function useResources(subjectId: string) {
  return useQuery({
    queryKey: ['resources', subjectId],
    queryFn: () => getStorage<Resource>('resources').filter(r => r.subjectId === subjectId),
    enabled: !!subjectId,
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Resource, 'id'>) => {
      const resources = getStorage<Resource>('resources');
      const newResource = { ...data, id: nanoid() };
      setStorage('resources', [...resources, newResource]);
      return newResource;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      setStorage('resources', getStorage<Resource>('resources').filter(r => r.id !== id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });
}

// --- Quiz History ---
export function useQuizHistory(subjectId?: string) {
  return useQuery({
    queryKey: ['quizHistory', subjectId],
    queryFn: () => {
      const history = getStorage<QuizHistory>('quizHistory');
      return subjectId ? history.filter(h => h.subjectId === subjectId) : history;
    },
  });
}

export function useSaveQuizResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<QuizHistory, 'id'>) => {
      const history = getStorage<QuizHistory>('quizHistory');
      const newEntry = { ...data, id: nanoid() };
      setStorage('quizHistory', [...history, newEntry]);
      return newEntry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizHistory'] }),
  });
}
