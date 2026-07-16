import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Star, Crown, Sparkles } from 'lucide-react';

/**
 * Admin Login Page
 * Provides authentication for admin users
 * Completely separate from regular user authentication
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const { signIn, loading: authLoading } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Success - redirect to admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-gradient-to-b from-sky-400 to-green-400">
        <div className="relative">
          <Star className="h-12 w-12 animate-spin text-yellow-300" />
          <Sparkles className="h-6 w-6 absolute -top-2 -right-2 text-white animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 p-4 overflow-hidden">
      {/* Floating Stars Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <Star className="absolute top-20 left-20 h-8 w-8 text-yellow-300 animate-pulse opacity-70" />
        <Star className="absolute top-40 right-32 h-6 w-6 text-yellow-200 animate-pulse opacity-60" style={{ animationDelay: '0.5s' }} />
        <Star className="absolute bottom-32 left-40 h-7 w-7 text-yellow-300 animate-pulse opacity-50" style={{ animationDelay: '1s' }} />
        <Star className="absolute bottom-20 right-20 h-9 w-9 text-yellow-400 animate-pulse opacity-80" style={{ animationDelay: '1.5s' }} />
        <Sparkles className="absolute top-60 left-60 h-8 w-8 text-white animate-pulse opacity-40" style={{ animationDelay: '0.7s' }} />
        <Sparkles className="absolute bottom-60 right-60 h-6 w-6 text-white animate-pulse opacity-30" style={{ animationDelay: '1.2s' }} />

        {/* Clouds */}
        <div className="absolute top-10 left-10 w-20 h-10 bg-white rounded-full opacity-60"></div>
        <div className="absolute top-10 left-16 w-24 h-12 bg-white rounded-full opacity-60"></div>
        <div className="absolute top-32 right-24 w-28 h-12 bg-white rounded-full opacity-50"></div>
        <div className="absolute top-32 right-28 w-20 h-10 bg-white rounded-full opacity-50"></div>
        <div className="absolute bottom-40 left-32 w-24 h-10 bg-white rounded-full opacity-40"></div>
        <div className="absolute bottom-40 left-36 w-28 h-12 bg-white rounded-full opacity-40"></div>
      </div>

      <Card className="w-full max-w-md border-4 border-red-500 bg-white shadow-2xl relative z-10 rounded-3xl overflow-hidden">
        {/* Mario-style header stripe */}
        <div className="h-4 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500"></div>

        <CardHeader className="space-y-4 text-center pb-6 pt-8 bg-white">
          <div className="flex justify-center relative">
            {/* Crown with stars */}
            <div className="relative">
              <div className="p-5 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full shadow-xl transform hover:scale-110 transition-transform duration-300 border-4 border-yellow-500">
                <Crown className="h-12 w-12 text-red-600" />
              </div>
              <Star className="absolute -top-2 -right-2 h-7 w-7 text-yellow-300 animate-bounce" style={{ filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))' }} />
              <Sparkles className="absolute -bottom-1 -left-1 h-6 w-6 text-blue-400 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-4xl font-black text-red-600" style={{ textShadow: '3px 3px 0px #FDE047, 6px 6px 0px #DC2626' }}>
            ADMIN ACCESS
          </CardTitle>
          <CardDescription className="text-blue-600 font-bold text-base">
            ⭐ Power Up Your Dashboard! ⭐
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-2 border-red-500 bg-red-50 rounded-xl">
                <AlertDescription className="text-red-600 font-semibold">❌ {error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-red-600 font-bold text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Admin Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter Your Super Admin Email Id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
                autoFocus
                className="border-3 border-red-300 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-200 rounded-xl h-12 text-gray-800 font-medium placeholder:text-gray-400 bg-white shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-red-600 font-bold text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-500" />
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-red-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your super password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="current-password"
                  className="pl-12 border-3 border-red-300 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-200 rounded-xl h-12 text-gray-800 font-medium placeholder:text-gray-400 bg-white shadow-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 hover:from-red-600 hover:via-red-700 hover:to-red-600 text-white font-black text-lg py-6 rounded-xl shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-200 mt-6 border-4 border-yellow-400"
              disabled={loading}
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Star className="mr-2 h-5 w-5 animate-spin" />
                  LOADING...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5" />
                  LET'S-A GO!
                  <Star className="h-5 w-5 animate-pulse" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>

        {/* Mario-style footer stripe */}
        <div className="h-4 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500"></div>
      </Card>
    </div>
  );
}
