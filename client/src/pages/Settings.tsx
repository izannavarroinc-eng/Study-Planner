import { useAppStore, useTranslation } from "@/lib/store";
import { Card, Button } from "@/components/ui/shared";
import { Moon, Sun, Languages } from "lucide-react";

export default function Settings() {
  const { t } = useTranslation();
  const { lang, theme, setLang, setTheme } = useAppStore();

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-4xl font-bold font-display">{t('settings')}</h1>
        <p className="text-muted-foreground mt-1">Customize your planner experience.</p>
      </div>

      <Card className="space-y-8">
        <div>
          <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-4">
            <Languages className="w-5 h-5 text-primary" /> {t('language')}
          </h3>
          <div className="flex gap-4">
            <Button 
              variant={lang === 'en' ? 'primary' : 'outline'} 
              onClick={() => setLang('en')}
              className="w-32"
            >
              English
            </Button>
            <Button 
              variant={lang === 'es' ? 'primary' : 'outline'} 
              onClick={() => setLang('es')}
              className="w-32"
            >
              Español
            </Button>
          </div>
        </div>

        <div className="h-px bg-border w-full" />

        <div>
          <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-4">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />} 
            {t('theme')}
          </h3>
          <div className="flex gap-4">
            <Button 
              variant={theme === 'light' ? 'primary' : 'outline'} 
              onClick={() => setTheme('light')}
              className="w-40"
            >
              <Sun className="w-4 h-4 mr-1" /> {t('lightMode')}
            </Button>
            <Button 
              variant={theme === 'dark' ? 'primary' : 'outline'} 
              onClick={() => setTheme('dark')}
              className="w-40"
            >
              <Moon className="w-4 h-4 mr-1" /> {t('darkMode')}
            </Button>
          </div>
        </div>
        
        <div className="h-px bg-border w-full" />
        
        <div>
           <h3 className="text-lg font-bold font-display mb-4 text-destructive">Danger Zone</h3>
           <p className="text-sm text-muted-foreground mb-4">This will clear all your local storage data. This action cannot be undone.</p>
           <Button variant="destructive" onClick={() => {
             if(confirm("Are you sure? All data will be lost.")) {
               localStorage.clear();
               window.location.reload();
             }
           }}>Clear All Data</Button>
        </div>

      </Card>
    </div>
  );
}
