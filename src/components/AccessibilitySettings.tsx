import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Type, Eye, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const AccessibilitySettings = () => {
  const [fontSize, setFontSize] = useState(100);
  const [theme, setTheme] = useState<'default' | 'light' | 'high-contrast'>('default');

  const applyFontSize = (size: number) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${16 * (size / 100)}px`;
    localStorage.setItem('accessibility-font-size', size.toString());
  };

  const applyTheme = (newTheme: 'default' | 'light' | 'high-contrast') => {
    setTheme(newTheme);
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('dark', 'high-contrast');
    
    // Apply new theme
    if (newTheme === 'high-contrast') {
      root.classList.add('high-contrast');
    } else if (newTheme === 'default') {
      root.classList.add('dark');
    }
    
    localStorage.setItem('accessibility-theme', newTheme);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="fixed top-4 right-4 z-50 bg-card/80 backdrop-blur-sm border-border hover:bg-card"
        >
          <Settings className="w-5 h-5 mr-2" />
          Accessibility
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl-elderly font-medium flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Accessibility Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Font Size Control */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5" />
              <span className="font-medium text-lg-elderly">Text Size</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Normal', value: 100 },
                { label: 'Large', value: 125 },
                { label: 'Extra Large', value: 150 },
                { label: 'Maximum', value: 200 }
              ].map(({ label, value }) => (
                <Button
                  key={value}
                  variant={fontSize === value ? "default" : "outline"}
                  onClick={() => applyFontSize(value)}
                  className="h-12 text-base font-medium"
                >
                  {label} ({value}%)
                </Button>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground mt-3">
              Choose the text size that's most comfortable for you to read.
            </p>
          </Card>

          {/* Theme Control */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5" />
              <span className="font-medium text-lg-elderly">Display Theme</span>
            </div>
            
            <div className="space-y-3">
              {[
                { label: 'Dark (Default)', value: 'default', desc: 'Easy on the eyes in low light' },
                { label: 'Light', value: 'light', desc: 'Bright background for daylight use' },
                { label: 'High Contrast', value: 'high-contrast', desc: 'Maximum contrast for better readability' }
              ].map(({ label, value, desc }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "outline"}
                  onClick={() => applyTheme(value as any)}
                  className="w-full h-auto p-3 text-left justify-start"
                >
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={() => {
              applyFontSize(100);
              applyTheme('default');
            }}
            className="w-full h-12 text-base"
          >
            Reset to Default Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};