import { useState } from "react";
import { useTranslation } from "@/lib/store";
import { useSubjects, useCreateSubject } from "@/hooks/use-local-data";
import { Card, Button, Input, Label, ProgressBar, Modal } from "@/components/ui/shared";
import { Plus, Calendar, Target } from "lucide-react";
import { Link } from "wouter";

export default function Subjects() {
  const { t } = useTranslation();
  const { data: subjects = [] } = useSubjects();
  const createSubject = useCreateSubject();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', icon: '📚', nextExamDate: '', topics: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSubject.mutate({
      ...formData,
      progress: 0,
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({ name: '', icon: '📚', nextExamDate: '', topics: '' });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-display">{t('subjects')}</h1>
          <p className="text-muted-foreground mt-1">Manage your courses and track progress.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5" /> {t('addSubject')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Link key={subject.id} href={`/subjects/${subject.id}`}>
            <Card className="cursor-pointer group hover:-translate-y-1 transition-transform duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-3xl shadow-inner">
                  {subject.icon}
                </div>
                {subject.nextExamDate && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold bg-secondary px-3 py-1.5 rounded-full text-foreground/80">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(subject.nextExamDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold font-display mb-2 text-foreground group-hover:text-primary transition-colors">{subject.name}</h3>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Target className="w-4 h-4"/> {t('progress')}</span>
                  <span>{subject.progress}%</span>
                </div>
                <ProgressBar progress={subject.progress} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center text-4xl mx-auto mb-6 opacity-50">📚</div>
          <h2 className="text-2xl font-display font-bold text-foreground">No subjects yet</h2>
          <p className="text-muted-foreground mt-2 mb-6">Create your first subject to start planning.</p>
          <Button onClick={() => setIsModalOpen(true)}><Plus className="w-5 h-5" /> {t('addSubject')}</Button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('addSubject')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <Label>{t('icon')}</Label>
              <Input 
                value={formData.icon} 
                onChange={e => setFormData({...formData, icon: e.target.value})} 
                maxLength={2}
                className="text-center text-xl"
              />
            </div>
            <div className="col-span-3">
              <Label>{t('name')}</Label>
              <Input 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g., Biology 101"
              />
            </div>
          </div>
          <div>
            <Label>{t('nextExam')}</Label>
            <Input 
              type="date" 
              value={formData.nextExamDate} 
              onChange={e => setFormData({...formData, nextExamDate: e.target.value})} 
            />
          </div>
          <div>
            <Label>{t('topics')}</Label>
            <textarea 
              className="flex w-full rounded-xl border-2 border-border bg-background/50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 min-h-[100px] resize-none"
              placeholder="Comma separated topics..."
              value={formData.topics}
              onChange={e => setFormData({...formData, topics: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit" disabled={createSubject.isPending}>{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
