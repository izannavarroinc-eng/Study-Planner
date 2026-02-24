import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'es';
type Theme = 'light' | 'dark';

interface AppState {
  lang: Language;
  theme: Theme;
  setLang: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lang: 'en',
      theme: 'light',
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'study-planner-settings',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      }
    }
  )
);

// Basic i18n dictionary
export const dict = {
  en: {
    dashboard: "Dashboard",
    subjects: "Subjects",
    calendar: "Calendar",
    settings: "Settings",
    addSubject: "Add Subject",
    totalTasks: "Total Tasks",
    dueSoon: "Due in 7 Days",
    upcomingExams: "Upcoming Exams",
    progress: "Progress",
    nextExam: "Next Exam",
    noExams: "No exams scheduled",
    topics: "Topics",
    checklist: "Checklist",
    tasks: "Tasks",
    resources: "Resources",
    quizzes: "Quizzes",
    createTask: "Create Task",
    addResource: "Add Resource",
    generateQuiz: "Generate Quiz",
    quizHistory: "Quiz History",
    language: "Language",
    theme: "Theme",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    title: "Title",
    name: "Name",
    icon: "Emoji Icon",
    date: "Date",
    link: "URL Link",
    difficulty: "Difficulty",
    questionCount: "Number of Questions",
    type: "Question Type",
    multipleChoice: "Multiple Choice",
    trueFalse: "True/False",
    startQuiz: "Start Quiz",
    submitQuiz: "Submit Answers",
    score: "Score",
    backToSubject: "Back to Subject",
    noTasks: "No tasks yet.",
    noResources: "No resources added.",
    offlineMode: "Offline Fallback Mode Active",
  },
  es: {
    dashboard: "Inicio",
    subjects: "Asignaturas",
    calendar: "Calendario",
    settings: "Ajustes",
    addSubject: "Añadir Asignatura",
    totalTasks: "Tareas Totales",
    dueSoon: "Para los próximos 7 días",
    upcomingExams: "Próximos Exámenes",
    progress: "Progreso",
    nextExam: "Próximo Examen",
    noExams: "Sin exámenes programados",
    topics: "Temas",
    checklist: "Lista de Verificación",
    tasks: "Tareas",
    resources: "Recursos",
    quizzes: "Cuestionarios",
    createTask: "Crear Tarea",
    addResource: "Añadir Recurso",
    generateQuiz: "Generar Cuestionario",
    quizHistory: "Historial de Cuestionarios",
    language: "Idioma",
    theme: "Tema",
    lightMode: "Modo Claro",
    darkMode: "Modo Oscuro",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    title: "Título",
    name: "Nombre",
    icon: "Icono (Emoji)",
    date: "Fecha",
    link: "Enlace URL",
    difficulty: "Dificultad",
    questionCount: "Número de Preguntas",
    type: "Tipo de Pregunta",
    multipleChoice: "Opción Múltiple",
    trueFalse: "Verdadero/Falso",
    startQuiz: "Empezar Cuestionario",
    submitQuiz: "Enviar Respuestas",
    score: "Puntuación",
    backToSubject: "Volver a la Asignatura",
    noTasks: "No hay tareas todavía.",
    noResources: "No se han añadido recursos.",
    offlineMode: "Modo de respaldo sin conexión activo",
  }
};

export const useTranslation = () => {
  const lang = useAppStore((s) => s.lang);
  return {
    t: (key: keyof typeof dict['en']) => dict[lang][key] || key,
    lang
  };
};
