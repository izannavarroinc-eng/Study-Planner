import { useState } from "react";
import { useTranslation } from "@/lib/store";
import { useTasks, useSubjects } from "@/hooks/use-local-data";
import { Card, Button } from "@/components/ui/shared";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { addDays, startOfWeek, format, isSameDay } from "date-fns";

export default function CalendarView() {
  const { t } = useTranslation();
  const { data: tasks = [] } = useTasks();
  const { data: subjects = [] } = useSubjects();
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const today = () => setCurrentDate(new Date());

  const getSubjectColor = (id: string) => {
    // Generate deterministic colors based on subject ID length or string
    const colors = ['bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', 
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300', 
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
                    'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'];
    const sum = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-display">{t('calendar')}</h1>
          <p className="text-muted-foreground mt-1">Plan your week effectively.</p>
        </div>
        <div className="flex items-center gap-3 bg-secondary/50 p-1.5 rounded-2xl">
          <Button variant="ghost" size="icon" onClick={prevWeek} className="rounded-xl"><ChevronLeft className="w-5 h-5"/></Button>
          <Button variant="ghost" onClick={today} className="font-semibold rounded-xl">Today</Button>
          <Button variant="ghost" size="icon" onClick={nextWeek} className="rounded-xl"><ChevronRight className="w-5 h-5"/></Button>
        </div>
      </div>

      <Card className="flex-1 min-h-[600px] flex flex-col p-4 sm:p-6">
        <h2 className="text-xl font-bold text-center mb-6">{format(startDate, 'MMMM yyyy')}</h2>
        
        <div className="grid grid-cols-7 gap-2 flex-1">
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, new Date());
            const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
            
            return (
              <div key={i} className={`flex flex-col rounded-2xl border ${isToday ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border/50 bg-secondary/10'} p-2 sm:p-3 overflow-hidden transition-colors`}>
                <div className="text-center mb-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{format(day, 'EEE')}</div>
                  <div className={`text-xl sm:text-2xl font-display font-bold w-10 h-10 mx-auto flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white shadow-md' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
                
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {dayTasks.map(task => (
                    <div key={task.id} className={`p-2 rounded-xl text-xs sm:text-sm font-medium leading-tight ${getSubjectColor(task.subjectId)} ${task.completed ? 'opacity-50 line-through' : ''}`}>
                       <div className="font-bold mb-0.5 truncate opacity-70 text-[10px] uppercase tracking-wider">{getSubjectName(task.subjectId)}</div>
                       <div className="line-clamp-2">{task.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
