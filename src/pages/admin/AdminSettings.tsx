import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, AlertCircle, CheckCircle2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

interface AppSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
}

/**
 * Admin Settings Page
 * Allows admins to configure app-wide settings including maintenance mode
 */
export default function AdminSettings() {
  const { logActivity } = useAdminAuth();

  const [settings, setSettings] = useState<AppSettings>({
    maintenance_mode: false,
    maintenance_message: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch app settings
      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['maintenance_mode', 'maintenance_message']);

      if (fetchError) {
        console.error('Error fetching settings:', fetchError);
        setError('Failed to load settings');
        return;
      }

      // Parse settings into state
      const settingsMap: AppSettings = {
        maintenance_mode: false,
        maintenance_message: '',
      };

      data?.forEach((setting) => {
        if (setting.setting_key === 'maintenance_mode') {
          settingsMap.maintenance_mode = setting.setting_value === 'true';
        } else if (setting.setting_key === 'maintenance_message') {
          settingsMap.maintenance_message = setting.setting_value;
        }
      });

      setSettings(settingsMap);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');

      // Update maintenance mode
      const { error: modeError } = await supabase
        .from('app_settings')
        .update({
          setting_value: settings.maintenance_mode ? 'true' : 'false',
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'maintenance_mode');

      if (modeError) {
        console.error('Error updating maintenance mode:', modeError);
        throw new Error('Failed to update maintenance mode');
      }

      // Update maintenance message
      const { error: messageError } = await supabase
        .from('app_settings')
        .update({
          setting_value: settings.maintenance_message,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'maintenance_message');

      if (messageError) {
        console.error('Error updating maintenance message:', messageError);
        throw new Error('Failed to update maintenance message');
      }

      // Log the activity
      await logActivity(
        'settings_update',
        `Updated app settings - Maintenance mode: ${settings.maintenance_mode ? 'enabled' : 'disabled'}`,
        {
          maintenance_mode: settings.maintenance_mode,
          message_length: settings.maintenance_message.length,
        }
      );

      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = (checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      maintenance_mode: checked,
    }));
  };

  const handleMessageChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      maintenance_message: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Settings className="h-8 w-8 mr-3 text-purple-400" />
          Settings
        </h1>
        <p className="text-slate-400">
          Configure application settings and maintenance mode
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Maintenance Mode Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-purple-400" />
            Maintenance Mode
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enable maintenance mode to temporarily block user access while performing updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full bg-slate-800" />
              <Skeleton className="h-24 w-full bg-slate-800" />
            </div>
          ) : (
            <>
              {/* Maintenance Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="maintenance-mode" className="text-white font-medium">
                    Enable Maintenance Mode
                  </Label>
                  <p className="text-sm text-slate-400 mt-1">
                    When enabled, regular users will see the maintenance message
                  </p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={settings.maintenance_mode}
                  onCheckedChange={handleToggleMaintenance}
                  disabled={saving}
                />
              </div>

              {/* Current Status */}
              <Alert
                className={
                  settings.maintenance_mode
                    ? 'bg-orange-900/20 border-orange-800 text-orange-300'
                    : 'bg-green-900/20 border-green-800 text-green-300'
                }
              >
                {settings.maintenance_mode ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <AlertDescription>
                  {settings.maintenance_mode
                    ? 'Maintenance mode is currently ENABLED. Users cannot access the app.'
                    : 'Maintenance mode is currently DISABLED. App is accessible to users.'}
                </AlertDescription>
              </Alert>

              {/* Maintenance Message */}
              <div className="space-y-2">
                <Label htmlFor="maintenance-message" className="text-white">
                  Maintenance Message (✨ HTML/CSS Supported)
                </Label>
                <p className="text-sm text-slate-400">
                  You can use HTML and inline CSS for custom styling, colors, and animations!
                </p>
                <Textarea
                  id="maintenance-message"
                  value={settings.maintenance_message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  disabled={saving}
                  rows={6}
                  className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                  placeholder='<div style="text-align:center;animation:pulse 2s infinite">🔧 Maintenance in progress...</div>'
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {settings.maintenance_message.length} characters
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const examples = [
                        '<div style="text-align:center;color:#f59e0b;font-size:20px;animation:fadeInOut 2s infinite">⚠️ We are upgrading our systems. Please check back soon!</div><style>@keyframes fadeInOut{0%,100%{opacity:0.5}50%{opacity:1}}</style>',
                        '<div style="text-align:center;background:linear-gradient(45deg,#667eea,#764ba2);padding:20px;border-radius:10px;color:white;font-weight:bold;box-shadow:0 10px 30px rgba(0,0,0,0.3)">🚀 Exciting updates coming! Be right back.</div>',
                        '<div style="text-align:center;font-size:18px"><span style="display:inline-block;animation:bounce 1s infinite">🔧</span> Maintenance Mode <span style="display:inline-block;animation:bounce 1s infinite;animation-delay:0.3s">⚙️</span></div><style>@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}</style>',
                      ];
                      const random = examples[Math.floor(Math.random() * examples.length)];
                      handleMessageChange(random);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 underline"
                  >
                    Use Example Template
                  </button>
                </div>

                {/* Live Preview */}
                {settings.maintenance_message && (
                  <div className="mt-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2 font-semibold">Live Preview:</p>
                    <div
                      className="min-h-[60px] flex items-center justify-center"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(settings.maintenance_message, {
                          ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'style'],
                          ALLOWED_ATTR: ['style', 'class'],
                        })
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm">Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-slate-400 space-y-2">
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Admin users can always bypass maintenance mode and access the admin dashboard
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Regular users will see the maintenance message and cannot log in
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              All setting changes are logged in the activity logs
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Make sure to disable maintenance mode after completing updates
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
