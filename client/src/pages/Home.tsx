import { useTranslation } from "@/lib/store";
import { useSubjects, useTasks } from "@/hooks/use-local-data";
import { Card, Button } from "@/components/ui/shared";
import { BookOpen, CheckCircle, Clock, Target, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { isBefore, addDays, parseISO } from "date-fns";

export default function Home() {
  const { t } = useTranslation();
  const { data: subjects = [] } = useSubjects();
  const { data: tasks = [] } = useTasks();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  const tasksDueSoon = tasks.filter(t => {
    if (!t.dueDate || t.completed) return false;
    const date = parseISO(t.dueDate);
    return isBefore(date, nextWeek) && !isBefore(date, addDays(today, -1));
  }).length;

  const upcomingExams = subjects.filter(s => {
    if (!s.nextExamDate) return false;
    const date = parseISO(s.nextExamDate);
    return isBefore(date, addDays(today, 30)) && !isBefore(date, addDays(today, -1));
  }).sort((a, b) => new Date(a.nextExamDate!).getTime() - new Date(b.nextExamDate!).getTime());

  const stats = [
    { title: t('subjects'), value: subjects.length, icon: BookOpen, color: "from-blue-400 to-indigo-500" },
    { title: t('totalTasks'), value: totalTasks, icon: CheckCircle, color: "from-emerald-400 to-teal-500" },
    { title: t('dueSoon'), value: tasksDueSoon, icon: Clock, color: "from-amber-400 to-orange-500" },
    { title: "Avg. Progress", value: `${progress}%`, icon: Target, color: "from-pink-400 to-rose-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-display">{t('dashboard')}</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your study overview.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/calendar">
            <Button variant="outline"><Clock className="w-4 h-4" /> {t('calendar')}</Button>
          </Link>
          <Link href="/subjects">
            <Button><BookOpen className="w-4 h-4" /> {t('subjects')}</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold font-display mt-0.5">{stat.value}</h3>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold font-display">{t('upcomingExams')}</h2>
          </div>
          <div className="space-y-4 flex-1">
            {upcomingExams.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8">
                <Target className="w-12 h-12 mb-3 opacity-20" />
                <p>{t('noExams')}</p>
              </div>
            ) : (
              upcomingExams.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center p-4 rounded-2xl bg-secondary/50 border border-border/50 transition-colors hover:bg-secondary">
                  <div className="w-12 h-12 flex items-center justify-center text-2xl bg-white dark:bg-slate-800 rounded-xl shadow-sm mr-4">
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{s.name}</h4>
                    <p className="text-sm text-primary font-medium">{new Date(s.nextExamDate!).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/subjects/${s.id}`}>
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
           <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold font-display">Recent Subjects</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {subjects.slice(0, 4).map(s => (
               <Link key={s.id} href={`/subjects/${s.id}`}>
                <div className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer text-center group">
                  <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{s.icon}</div>
                  <h4 className="font-semibold text-foreground truncate">{s.name}</h4>
                  <div className="mt-3 w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                     <div className="h-full bg-primary" style={{ width: `${s.progress}%` }} />
                  </div>
                </div>
               </Link>
            ))}
            {subjects.length === 0 && (
              <div className="col-span-2 text-center text-muted-foreground py-8">
                No subjects yet. Add one to get started!
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
