import { createFileRoute, Link } from "@tanstack/react-router";
import { Github, Mail, ArrowRight, User } from "lucide-react";
import { Btn, Card } from "@/components/growth-ui";
import { Logo } from "@/components/logo";
import { useToast } from "@/components/toast-context";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign Up — GrowthOS" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { showToast } = useToast();

  return (
    <div className="min-h-screen bg-[#000] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 bg-[#111] border border-[#222] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
          <Logo size={28} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#f0f0f0]">Create your account</h2>
        <p className="mt-2 text-lg text-[#fff]">
          Start building your developer portfolio today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10">
          <div className="space-y-4">
            <Btn variant="outline" className="w-full justify-center h-11 bg-[#111] hover:bg-[#161616]">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Sign up with Google
            </Btn>
            
            <Btn variant="outline" className="w-full justify-center h-11 bg-[#111] hover:bg-[#161616]">
              <Github className="w-5 h-5 mr-2" />
              Sign up with GitHub
            </Btn>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#222]" />
              </div>
              <div className="relative flex justify-center text-lg">
                <span className="px-2 bg-[#111] text-[#eee]">Or register with email</span>
              </div>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={async (e) => { 
            e.preventDefault(); 
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;
            try {
              const res = await fetch("http://127.0.0.1:8000/api/auth/register/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // We use the full email as a unique username
                body: JSON.stringify({ username: email, email, password })
              });
              if (res.ok || res.status === 201) {
                // Auto-login after register
                const loginRes = await fetch("http://127.0.0.1:8000/api/auth/login/", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username: email, password })
                });
                if (loginRes.ok) {
                  const data = await loginRes.json();
                  localStorage.setItem("access_token", data.access);
                  localStorage.setItem("refresh_token", data.refresh);
                  showToast("Account created successfully!", "success");
                  window.location.href = '/dashboard';
                }
              } else {
                const errData = await res.json().catch(() => ({}));
                const errMsg = errData.detail || errData.username?.[0] || errData.email?.[0] || "Failed to register. Username/email may already exist.";
                showToast(errMsg, "error");
              }
            } catch (err) {
              console.error(err);
              showToast("Error connecting to server.", "error");
            }
          }}>
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-[#eee]">
                Full name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-[#eee]" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-[#222] rounded-md bg-[#000] text-[#f0f0f0] placeholder-[#eee] focus:outline-none focus:ring-1 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors sm:text-lg"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-lg font-medium text-[#eee]">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#eee]" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-[#222] rounded-md bg-[#000] text-[#f0f0f0] placeholder-[#eee] focus:outline-none focus:ring-1 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors sm:text-lg"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-lg font-medium text-[#eee]">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2.5 border border-[#222] rounded-md bg-[#000] text-[#f0f0f0] placeholder-[#eee] focus:outline-none focus:ring-1 focus:ring-[#22c55e] focus:border-[#22c55e] transition-colors sm:text-lg"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Btn type="submit" className="w-full justify-center h-10 mt-4">
              Create account <ArrowRight size={16} />
            </Btn>
          </form>
          
          <p className="mt-6 text-center text-lg text-[#eee]">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-[#22c55e] hover:text-[#16a34a] transition-colors">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
