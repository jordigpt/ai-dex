import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  StickyNote, 
  LogOut, 
  Menu,
  X,
  Book,
  Target,
  Zap,
  Settings,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check admin table
      const { data: adminData } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      // Also allow if email matches hardcoded admin (fallback)
      const isEmailAdmin = session.user.email === "jordithecreative@gmail.com";

      if (adminData || isEmailAdmin) {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Misiones", href: "/missions", icon: Target },
    { label: "Skills", href: "/skills", icon: Zap },
    { label: "Notas", href: "/notes", icon: StickyNote },
    { label: "DEX", href: "/dex", icon: Book },
  ];

  if (isAdmin) {
    navItems.push({ label: "Admin", href: "/admin", icon: Shield });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo & Desktop Nav */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link 
                  to="/" 
                  className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  AI-DEX
                </Link>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? "border-primary text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Menu / Mobile Toggle */}
            <div className="flex items-center">
              <div className="hidden sm:flex sm:items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} title="Configuración">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Salir
                </Button>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white border-b shadow-lg">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                 const Icon = item.icon;
                 return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                      isActive(item.href)
                        ? "bg-blue-50 border-primary text-primary"
                        : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </div>
                  </Link>
                 )
              })}
              <div className="border-t border-gray-200 pt-4 pb-1">
                 <Button 
                    variant="ghost" 
                    className="w-full justify-start hover:bg-gray-50"
                    onClick={() => { navigate("/settings"); setIsMobileMenuOpen(false); }}
                 >
                    <Settings className="w-5 h-5 mr-3" />
                    Configuración
                 </Button>
                 <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                 >
                    <LogOut className="w-5 h-5 mr-3" />
                    Cerrar Sesión
                 </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      {/* Footer minimalista sin branding */}
      <footer className="border-t py-6 bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-400">
           AI-DEX &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}