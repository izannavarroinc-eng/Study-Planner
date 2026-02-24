import { useState } from "react";
import { useRoute } from "wouter";
import { useTranslation } from "@/lib/store";
import { useSubject, useTasks, useResources, useCreateTask, useUpdateTask, useDeleteTask, useCreateResource, useDeleteResource, useUpdateSubject } from "@/hooks/use-local-data";
import { useGenerateQuiz } from "@/hooks/use-quiz-api";
import { Card, Button, Input, Label, ProgressBar, Modal, cn } from "@/components/ui/shared";
import { ArrowLeft, Trash2, CheckCircle2, Circle, Link as LinkIcon, Plus, BrainCircuit, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { GenerateQuizRequest } from "@shared/schema";

export default function SubjectDetails() {
  const [, params] = useRoute("/subjects/:id");
  const id = params?.id || '';
  const { t } = useTranslation();
  
  const { data: subject } = useSubject(id);
  const { data: tasks = [] } = useTasks(id);
  const { data: resources = [] } = useResources(id);
  
  const updateSubject = useUpdateSubject();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createResource = useCreateResource();
  const deleteResource = useDeleteResource();
  const generateQuiz = useGenerateQuiz();

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'resources' | 'quizzes'>('overview');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '' });
  const [resForm, setResForm] = useState({ title: '', link: '', notes: '' });
  
  const [quizSettings, setQuizSettings] = useState<Partial<GenerateQuizRequest>>({
    topic: '', difficulty: 'medium', type: 'multiple_choice', count: 5
  });
  const [activeQuiz, setActiveQuiz] = useState<any>(null);

  if (!subject) return <div className="p-10 text-center animate-pulse">Loading...</div>;

  // Derive topics list
  const topicsList = subject.topics ? subject.topics.split(',').map(t => t.trim()).filter(Boolean) : [];

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask.mutate({ subjectId: id, title: taskForm.title, dueDate: taskForm.dueDate || undefined, completed: false }, {
      onSuccess: () => {
        setIsTaskModalOpen(false);
        setTaskForm({ title: '', dueDate: '' });
        updateProgress();
      }
    });
  };

  const handleTaskToggle = (taskId: string, currentStatus: boolean) => {
    updateTask.mutate({ id: taskId, completed: !currentStatus }, {
      onSuccess: () => updateProgress()
    });
  };

  const handleResSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createResource.mutate({ subjectId: id, ...resForm }, {
      onSuccess: () => {
        setIsResModalOpen(false);
        setResForm({ title: '', link: '', notes: '' });
      }
    });
  };

  const updateProgress = () => {
    // Need to wait slightly for query cache to update, or compute manually
    setTimeout(() => {
      const allT = tasks; // In real app, re-fetch or use state
      // For simplicity, progress is just a manual setting here, but let's derive it.
    }, 100);
  };

  const handleGenerateQuiz = () => {
    if (!quizSettings.topic) return;
    generateQuiz.mutate({
      subject: subject.name,
      topic: quizSettings.topic,
      difficulty: quizSettings.difficulty as any,
      type: quizSettings.type as any,
      count: quizSettings.count || 5,
      resources: resources.map(r => r.title)
    }, {
      onSuccess: (data) => {
        setActiveQuiz(data);
      }
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: t('tasks') },
    { id: 'resources', label: t('resources') },
    { id: 'quizzes', label: t('quizzes') },
  ] as const;

  return (
    <div className="space-y-8 pb-20">
      <Link href="/subjects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium mb-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t('backToSubject')}
      </Link>

      <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-border">
              {subject.icon}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold font-display">{subject.name}</h1>
              {subject.nextExamDate && (
                <p className="text-primary font-semibold mt-2 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Exam: {new Date(subject.nextExamDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span>{t('progress')}</span>
              <span>{subject.progress}%</span>
            </div>
            <ProgressBar progress={subject.progress} className="h-4" />
            <input 
              type="range" min="0" max="100" value={subject.progress}
              onChange={(e) => updateSubject.mutate({ id, progress: parseInt(e.target.value) })}
              className="w-full mt-2 opacity-50 hover:opacity-100 transition-opacity accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-secondary/50 rounded-2xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap",
              activeTab === tab.id ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-xl font-bold font-display mb-4">{t('topics')}</h2>
              {topicsList.length > 0 ? (
                <ul className="space-y-3">
                  {topicsList.map((topic, i) => (
                    <li key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-medium">{topic}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No topics defined. Edit subject to add topics.</p>
              )}
            </Card>
            
            <Card>
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold font-display">Recent Tasks</h2>
                 <Button variant="ghost" size="icon" onClick={() => setActiveTab('tasks')}><ArrowRight className="w-5 h-5"/></Button>
              </div>
              <div className="space-y-3">
                {tasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                    <button onClick={() => handleTaskToggle(task.id, task.completed)}>
                      {task.completed ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Circle className="w-6 h-6 text-muted-foreground" />}
                    </button>
                    <span className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>{task.title}</span>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-muted-foreground text-sm">No tasks added yet.</p>}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'tasks' && (
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-display">{t('tasks')}</h2>
              <Button onClick={() => setIsTaskModalOpen(true)}><Plus className="w-4 h-4"/> Add</Button>
            </div>
            
            <div className="space-y-3">
              {tasks.length === 0 && <p className="text-muted-foreground text-center py-8">{t('noTasks')}</p>}
              {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/60 transition-colors">
                  <div className="flex items-center gap-4">
                     <button onClick={() => handleTaskToggle(task.id, task.completed)} className="transition-transform active:scale-90">
                      {task.completed ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <Circle className="w-6 h-6 text-muted-foreground" />}
                    </button>
                    <div>
                      <p className={cn("font-semibold text-lg", task.completed && "line-through text-muted-foreground")}>{task.title}</p>
                      {task.dueDate && <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {new Date(task.dueDate).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <button onClick={() => deleteTask.mutate(task.id)} className="p-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'resources' && (
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-display">{t('resources')}</h2>
              <Button onClick={() => setIsResModalOpen(true)}><Plus className="w-4 h-4"/> Add</Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {resources.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">{t('noResources')}</p>}
               {resources.map(res => (
                 <div key={res.id} className="p-5 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col h-full hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg leading-tight flex-1 pr-4">{res.title}</h4>
                      <button onClick={() => deleteResource.mutate(res.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    {res.notes && <p className="text-sm text-muted-foreground mb-4 flex-1">{res.notes}</p>}
                    <a href={res.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mt-auto">
                      <LinkIcon className="w-4 h-4" /> Open Link
                    </a>
                 </div>
               ))}
            </div>
          </Card>
        )}

        {activeTab === 'quizzes' && (
          <Card>
            {!activeQuiz ? (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                    <BrainCircuit className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold font-display">{t('generateQuiz')}</h2>
                  <p className="text-muted-foreground mt-2">Test your knowledge automatically.</p>
                  
                  {generateQuiz.isSuccess && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-sm flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4"/> {t('offlineMode')}
                    </div>
                  )}
                </div>

                <div className="space-y-5 bg-secondary/30 p-6 rounded-3xl border border-border/50">
                  <div>
                    <Label>Topic Focus</Label>
                    <select 
                      className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 font-medium"
                      value={quizSettings.topic} onChange={e => setQuizSettings({...quizSettings, topic: e.target.value})}
                    >
                      <option value="">Select a topic...</option>
                      {topicsList.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('difficulty')}</Label>
                      <select 
                        className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 font-medium"
                        value={quizSettings.difficulty} onChange={e => setQuizSettings({...quizSettings, difficulty: e.target.value as any})}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <Label>{t('type')}</Label>
                      <select 
                        className="flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 font-medium"
                        value={quizSettings.type} onChange={e => setQuizSettings({...quizSettings, type: e.target.value as any})}
                      >
                        <option value="multiple_choice">{t('multipleChoice')}</option>
                        <option value="true_false">{t('trueFalse')}</option>
                      </select>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 text-lg mt-4" 
                    onClick={handleGenerateQuiz}
                    disabled={!quizSettings.topic || generateQuiz.isPending}
                  >
                    {generateQuiz.isPending ? "Generating..." : t('startQuiz')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold font-display">Quiz Time!</h3>
                  <Button variant="outline" onClick={() => setActiveQuiz(null)}>Cancel</Button>
                </div>
                
                <div className="space-y-8">
                  {activeQuiz.questions.map((q: any, i: number) => (
                    <div key={q.id} className="p-6 rounded-3xl bg-secondary/30 border border-border/50">
                      <h4 className="text-lg font-bold mb-4">{i + 1}. {q.question}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt: string) => (
                           <button key={opt} className="p-4 rounded-xl border-2 border-border bg-card text-left font-medium hover:border-primary hover:bg-primary/5 transition-all focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none">
                             {opt}
                           </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button className="w-full h-14 text-lg">{t('submitQuiz')}</Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={t('createTask')}>
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div><Label>{t('title')}</Label><Input required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} /></div>
          <div><Label>{t('date')}</Label><Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isResModalOpen} onClose={() => setIsResModalOpen(false)} title={t('addResource')}>
        <form onSubmit={handleResSubmit} className="space-y-4">
          <div><Label>{t('title')}</Label><Input required value={resForm.title} onChange={e => setResForm({...resForm, title: e.target.value})} /></div>
          <div><Label>{t('link')}</Label><Input required type="url" value={resForm.link} onChange={e => setResForm({...resForm, link: e.target.value})} /></div>
          <div><Label>Notes (Optional)</Label><Input value={resForm.notes} onChange={e => setResForm({...resForm, notes: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsResModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
